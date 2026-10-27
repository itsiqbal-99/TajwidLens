import { Module } from '@nestjs/common';
import { CONFIG, readConfig } from '../../config/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleService } from './google.service';
import { Mailer } from './mailer.service';
import { SessionGuard } from './session.guard';
@Module({controllers:[AuthController],providers:[{provide:CONFIG,useFactory:readConfig},AuthService,GoogleService,Mailer,SessionGuard],exports:[AuthService,SessionGuard,CONFIG]})
export class AuthModule {}
