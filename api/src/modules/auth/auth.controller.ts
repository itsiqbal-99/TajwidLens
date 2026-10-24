import { Body, ConflictException, Controller, Get, HttpCode, Inject, Logger, Post, Query, Req, Res, ServiceUnavailableException, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AppConfig, CONFIG } from '../../config/config';
import { AuthService, publicUser } from './auth.service';
import { EmailDto, LinkGoogleDto, LoginDto, RegisterDto, ResetDto, TokenDto } from './auth.dto';
import { GoogleAuthError, GoogleService } from './google.service';
import { AuthRequest, SessionGuard } from './session.guard';
import { AccountResponse, MessageResponse } from '../../common/responses';

@ApiTags('Authentication')
@ApiResponse({status:400,description:'Invalid input or expired/used token'})
@ApiResponse({status:429,description:'Too many requests; retry later'})
@ApiResponse({status:503,description:'Provider unavailable; delivery not confirmed'})
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  constructor(private auth: AuthService,private google: GoogleService,@Inject(CONFIG) private config: AppConfig) {}
  @Get('status') @ApiOperation({summary:'Public authentication capabilities; no credentials'})
  status() {
    return {google:!!this.config.googleClientId && !!this.config.googleClientSecret,
      emailRegistration:!!this.config.smtpHost || this.config.allowUnverifiedEmail,
      emailDelivery:!!this.config.smtpHost, developmentRegistration:this.config.allowUnverifiedEmail};
  }
  private cookie(res: Response, token: string) {
    res.cookie(this.config.cookieName,token,{httpOnly:true,secure:this.config.production,sameSite:this.config.sameSite,path:'/',maxAge:604800000});
  }
  private oauthCookie(state:string) {return `tajwidlens-oauth-${state}`;}
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
    try {
      const {url,browser,state} = await this.google.start();
      res.cookie(this.oauthCookie(state),browser,{httpOnly:true,secure:this.config.production,sameSite:'lax',path:'/api/v1/auth/google',maxAge:600000});
      res.redirect(url);
    } catch { res.redirect(`${this.config.frontend}/login/?error=google`); }
  }
  @Post('google/link') @HttpCode(200) @UseGuards(SessionGuard) @ApiCookieAuth()
  @ApiOperation({summary:'Confirm password and start explicit Google account linking'})
  async linkGoogle(@Body() body: LinkGoogleDto,@Req() req: AuthRequest,@Res({passthrough:true}) res: Response) {
    await this.auth.confirmPassword(req.user.id,body.password);
    const {url,browser,state} = await this.google.start(req.user.id);
    res.cookie(this.oauthCookie(state),browser,{httpOnly:true,secure:this.config.production,sameSite:'lax',path:'/api/v1/auth/google',maxAge:600000});
    return {url};
  }
  @Post('google/start') @HttpCode(200) @ApiOperation({summary:'Start browser-bound OAuth with a recoverable JSON response'})
  async startFromForm(@Res({passthrough:true}) res: Response) {
    const {url,browser,state} = await this.google.start();
    res.cookie(this.oauthCookie(state),browser,{httpOnly:true,secure:this.config.production,sameSite:'lax',path:'/api/v1/auth/google',maxAge:600000});
    return {url};
  }
  @Get('google/callback') @ApiResponse({status:302,description:'Redirect to profile, or login with a safe error'})
  async callback(@Query('state') state: string,@Query('code') code: string,@Req() req: Request,@Res() res: Response,@Query('error') providerError?:string) {
    const cookieName = typeof state === 'string' && /^[A-Za-z0-9_-]{43}$/.test(state) ? this.oauthCookie(state) : undefined;
    if (cookieName) res.clearCookie(cookieName,{httpOnly:true,secure:this.config.production,sameSite:'lax',path:'/api/v1/auth/google'});
    try {
      if (providerError) {res.redirect(`${this.config.frontend}/login/?error=${providerError === 'access_denied' ? 'google_cancelled' : 'google'}`);return;}
      const {token,isNewUser,linked} = await this.google.callback(state,code,cookieName ? req.cookies?.[cookieName] : undefined,req.cookies?.[this.config.cookieName]);
      await this.auth.logout(req.cookies?.[this.config.cookieName]);
      this.cookie(res,token); res.redirect(`${this.config.frontend}${linked ? '/profile/?google=linked' : isNewUser ? '/auth-complete/?welcome=1' : '/auth-complete/'}`);
    } catch (error) {
      const reason = error instanceof GoogleAuthError ? error.reason : error instanceof ConflictException ? 'google_account_exists' : error instanceof ServiceUnavailableException ? 'google_unavailable' : 'google';
      this.logger.warn(`Google callback rejected (${reason})`);
      res.redirect(`${this.config.frontend}/login/?error=${reason}`);
    }
  }
}
