import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { SessionGuard, AuthRequest } from '../auth/session.guard';
import { publicUser } from '../auth/auth.service';
import { ProfileDto } from '../auth/auth.dto';
import { AccountResponse } from '../../common/responses';

@Controller('users') @UseGuards(SessionGuard) @ApiCookieAuth() @ApiTags('Profile')
@ApiResponse({status:401,description:'Session missing or expired'})
@ApiResponse({status:200,type:AccountResponse})
export class UsersController {
  constructor(private users: UsersService) {}
  @Get('me') me(@Req() req: AuthRequest) { return publicUser(req.user); }
  @Patch('me') async update(@Req() req: AuthRequest,@Body() body: ProfileDto) {
    return this.users.update(req.user,body);
  }
}
