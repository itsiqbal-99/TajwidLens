import { ArgumentsHost, Catch, ExceptionFilter, HttpException, INestApplication, ValidationPipe } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppConfig } from '../config/config';

@Catch()
class SafeErrors implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const status = error instanceof HttpException ? error.getStatus() : 500;
    response.status(status).json(error instanceof HttpException ? error.getResponse() : {statusCode:500,message:'Terjadi gangguan. Silakan coba lagi.'});
  }
}
export function setup(app: INestApplication, config: AppConfig) {
  app.setGlobalPrefix('api/v1');
  app.use(helmet()); app.use(cookieParser());
  app.enableCors({origin:config.origin,credentials:true,methods:['GET','POST','PATCH'],allowedHeaders:['Content-Type','X-TajwidLens-CSRF']});
  app.use((req: Request,res: Response,next: NextFunction) => {
    res.setHeader('Cache-Control','no-store');
    if (!['GET','HEAD','OPTIONS'].includes(req.method) &&
        (req.headers.origin !== config.origin || req.headers['x-tajwidlens-csrf'] !== '1' || !req.is('application/json'))) {
      res.status(403).json({message:'Permintaan tidak diizinkan.'}); return;
    }
    next();
  });
  app.useGlobalPipes(new ValidationPipe({whitelist:true,forbidNonWhitelisted:true,transform:true}));
  app.useGlobalFilters(new SafeErrors());
  const document = SwaggerModule.createDocument(app,new DocumentBuilder().setTitle('TajwidLens API').setVersion('1')
    .setDescription('Writes require allowed Origin, application/json, and X-TajwidLens-CSRF: 1. Session cookie expires after 7 days.').addCookieAuth(config.cookieName).build());
  SwaggerModule.setup('api/docs',app,document);
  return document;
}
