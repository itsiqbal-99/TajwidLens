import { Controller, Get, Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { SkipThrottle, ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import dataSource from "./database/data-source";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { LearningModule } from "./modules/learning/learning.module";
import {QuizModule} from './modules/quiz/quiz.module';
import {PostgresThrottlerStorage} from './common/postgres-throttler.storage';
import {ReadinessService} from './common/readiness.service';

@Controller("health")
class HealthController {
  constructor(private readiness:ReadinessService) {}
  @Get() @SkipThrottle() health() {
    return { status: "ok" };
  }
  @Get('readiness') ready() {return this.readiness.check();}
}

@Module({
  imports: [
    TypeOrmModule.forRoot(dataSource.options),
    AuthModule,
    UsersModule,
    LearningModule,
    QuizModule,
    ThrottlerModule.forRootAsync({
      inject:[DataSource],
      useFactory:(db:DataSource)=>({
        throttlers:[{ttl:60000,limit:20}],
        storage:new PostgresThrottlerStorage(db),
        getTracker:(req:Record<string,any>)=>String(req.headers['x-tajwidlens-client-ip'] || req.ip),
      }),
    }),
  ],
  controllers: [HealthController],
  providers: [ReadinessService,{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
