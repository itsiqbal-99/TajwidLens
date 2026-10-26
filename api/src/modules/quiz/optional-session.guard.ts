import {CanActivate,ExecutionContext,Inject,Injectable,UnauthorizedException} from '@nestjs/common';
import {Request} from 'express';
import {CONFIG,AppConfig} from '../../config/config';
import {AuthService} from '../auth/auth.service';
import {User} from '../users/user.entity';

export type PracticeRequest=Request & {user?:User};
@Injectable()
export class OptionalSessionGuard implements CanActivate {
  constructor(private auth:AuthService,@Inject(CONFIG) private config:AppConfig) {}
  async canActivate(context:ExecutionContext) {
    const request=context.switchToHttp().getRequest<PracticeRequest>();
    const token=request.cookies?.[this.config.cookieName];
    if(token){try{request.user=await this.auth.authenticate(token);}catch(error){if(!(error instanceof UnauthorizedException))throw error;}}
    return true;
  }
}
