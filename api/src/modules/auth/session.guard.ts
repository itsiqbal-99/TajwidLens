import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { Inject } from '@nestjs/common';
import { AppConfig, CONFIG } from '../../config/config';
import { AuthService } from './auth.service';
import { User } from '../users/user.entity';
export type AuthRequest = Request & {user:User};
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private auth: AuthService,@Inject(CONFIG) private config: AppConfig) {}
  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<AuthRequest>();
    req.user = await this.auth.authenticate(req.cookies?.[this.config.cookieName]);
    return true;
  }
}
