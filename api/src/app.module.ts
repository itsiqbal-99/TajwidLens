import { Controller, Get, Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import dataSource from "./database/data-source";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { LearningModule } from "./modules/learning/learning.module";
import {QuizModule} from './modules/quiz/quiz.module';

@Controller("health")
class HealthController {
  @Get() health() {
    return { status: "ok" };
  }
}

// shortcut: rate limits are per process; use shared storage before running multiple replicas.
@Module({
  imports: [
    TypeOrmModule.forRoot(dataSource.options),
    AuthModule,
    UsersModule,
    LearningModule,
    QuizModule,
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 20 }]),
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
