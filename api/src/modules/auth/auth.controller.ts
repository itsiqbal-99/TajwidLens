import { Body, Controller, Get, HttpCode, Inject, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AppConfig, CONFIG } from '../../config/config';
import { AuthService, publicUser } from './auth.service';
import { EmailDto, LoginDto, RegisterDto, ResetDto, TokenDto } from './auth.dto';
import { GoogleService } from './google.service';
import { AuthRequest, SessionGuard } from './session.guard';
import { AccountResponse, MessageResponse } from '../../common/responses';

@ApiTags('Authentication')
@ApiResponse({status:400,description:'Invalid input or expired/used token'})
@ApiResponse({status:429,description:'Too many requests; retry later'})
@ApiResponse({status:503,description:'Provider unavailable; delivery not confirmed'})
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService,private google: GoogleService,@Inject(CONFIG) private config: AppConfig) {}
  private cookie(res: Response, token: string) {
    res.cookie(this.config.cookieName,token,{httpOnly:true,secure:this.config.production,sameSite:this.config.sameSite,path:'/',maxAge:604800000});
  }
  @Post('register') @HttpCode(202) @ApiResponse({status:202,type:MessageResponse}) @ApiOperation({summary:'Register and request verification; duplicate email returns the same response'})
  register(@Body() body: RegisterDto) { return this.auth.register(body); }
  @Post('login') @HttpCode(200) @ApiResponse({status:200,type:AccountResponse}) @ApiResponse({status:401,description:'Invalid credentials'})
  async login(@Body() body: LoginDto,@Req() req: Request,@Res({passthrough:true}) res: Response) {
    const result = await this.auth.login(body.email,body.password);
    await this.auth.logout(req.cookies?.[this.config.cookieName]);
    this.cookie(res,result.token); return result.user;
  }
  @Post('logout') @HttpCode(200) @ApiResponse({status:200,type:MessageResponse})
  async logout(@Req() req: Request,@Res({passthrough:true}) res: Response) {
    await this.auth.logout(req.cookies?.[this.config.cookieName]);
    res.clearCookie(this.config.cookieName,{httpOnly:true,secure:this.config.production,sameSite:this.config.sameSite,path:'/'});
    return {message:'Anda telah keluar.'};
  }
  @Get('me') @UseGuards(SessionGuard) @ApiCookieAuth() @ApiResponse({status:200,type:AccountResponse}) @ApiResponse({status:401,description:'Session missing or expired'})
  me(@Req() req: AuthRequest) { return publicUser(req.user); }
  @Post('verify-email') @HttpCode(200) @ApiResponse({status:200,type:MessageResponse})
  verify(@Body() body: TokenDto) { return this.auth.consumeToken(body.token,'verify'); }
  @Post('verification/resend') @HttpCode(202) @ApiResponse({status:202,type:MessageResponse})
  resend(@Body() body: EmailDto) { return this.auth.requestToken(body.email,'verify'); }
  @Post('password/forgot') @HttpCode(202) @ApiResponse({status:202,type:MessageResponse})
  forgot(@Body() body: EmailDto) { return this.auth.requestToken(body.email,'reset'); }
  @Post('password/reset') @HttpCode(200) @ApiResponse({status:200,type:MessageResponse})
  reset(@Body() body: ResetDto) { return this.auth.consumeToken(body.token,'reset',body.password); }
  @Get('google/start') @ApiResponse({status:302,description:'Redirect to Google with PKCE and state'})
  async start(@Res() res: Response) {
    const {url,browser} = await this.google.start();
    res.cookie('tajwidlens-oauth',browser,{httpOnly:true,secure:this.config.production,sameSite:'lax',path:'/api/v1/auth/google',maxAge:600000});
    res.redirect(url);
  }
  @Get('google/callback') @ApiResponse({status:302,description:'Redirect to profile, or login with a safe error'})
  async callback(@Query('state') state: string,@Query('code') code: string,@Req() req: Request,@Res() res: Response) {
    res.clearCookie('tajwidlens-oauth',{httpOnly:true,secure:this.config.production,sameSite:'lax',path:'/api/v1/auth/google'});
    try {
      const token = await this.google.callback(state,code,req.cookies?.['tajwidlens-oauth']);
      await this.auth.logout(req.cookies?.[this.config.cookieName]);
      this.cookie(res,token); res.redirect(`${this.config.frontend}/profile/`);
    } catch { res.redirect(`${this.config.frontend}/login/?error=google`); }
  }
}
