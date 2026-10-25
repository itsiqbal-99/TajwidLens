import 'reflect-metadata';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {DataSource} from 'typeorm';
import {Test} from '@nestjs/testing';
import {ThrottlerModule,ThrottlerGuard} from '@nestjs/throttler';
import {APP_GUARD} from '@nestjs/core';
import type {INestApplication} from '@nestjs/common';
import db from '../src/database/data-source';
import {CONFIG,readConfig} from '../src/config/config';
import {AuthService} from '../src/modules/auth/auth.service';
import {AuthController} from '../src/modules/auth/auth.controller';
import {GoogleService} from '../src/modules/auth/google.service';
import {SessionGuard} from '../src/modules/auth/session.guard';
import {Mailer} from '../src/modules/auth/mailer.service';
import {UsersController} from '../src/modules/users/users.controller';
import {UsersService} from '../src/modules/users/users.service';
import {User} from '../src/modules/users/user.entity';
import {LearningController} from '../src/modules/learning/learning.controller';
import {LearningService} from '../src/modules/learning/learning.service';
import {UserLessonProgress} from '../src/modules/learning/learning.entity';
import {setup} from '../src/common/setup';
import {learningBrowserAcceptance} from '../test/learning-browser';
import {LearningProgress1792886400000} from '../src/database/1792886400000-LearningProgress';

async function main() {
  if(!process.argv.includes('--approved-development')) throw new Error('Explicit approved-development flag required');
  const config=readConfig();
  if(config.production) throw new Error('Production verification not authorized');
  let second:DataSource|undefined,app:INestApplication|undefined,user:User|undefined;
  try {
    await db.initialize();
    assert.equal(await db.showMigrations(),false,'Apply the approved development migration before verification');
    const runner=db.createQueryRunner(),schema='phase02_verify_'+randomUUID().replaceAll('-','');
    await runner.connect();await runner.startTransaction();
    try {
      await runner.query(`CREATE SCHEMA "${schema}"`);
      await runner.query(`SET LOCAL search_path TO "${schema}", public`);
      const [current]=await runner.query('SELECT current_schema() AS schema');assert.equal(current.schema,schema);
      await runner.query('CREATE TABLE users (id uuid PRIMARY KEY DEFAULT gen_random_uuid())');
      await runner.query('INSERT INTO users DEFAULT VALUES');
      const migration=new LearningProgress1792886400000();
      await migration.up(runner);
      await runner.query(`INSERT INTO user_lesson_progress ("userId","lessonId",status) SELECT id,'pengantar','IN_PROGRESS' FROM users`);
      await assert.rejects(()=>migration.down(runner),/Rollback refused/);
      await runner.query('DELETE FROM user_lesson_progress'); // Entire schema belongs only to this transaction.
      await migration.down(runner);await migration.up(runner);await migration.down(runner);
    } finally {await runner.rollbackTransaction();await runner.release();}
    console.log('Neon migration up/down/reapply, exclusive lock and nonempty rollback refusal in temporary schema PASS');
    if(process.argv.includes('--migration-only')) return;
    second=new DataSource({...db.options,synchronize:false,migrationsRun:false});await second.initialize();
    user=await db.getRepository(User).save({email:`phase02-concurrency-${randomUUID()}@example.com`,nickname:'Concurrency fixture',emailVerifiedAt:new Date()});
    const firstService=new LearningService(db),secondService=new LearningService(second);
    await Promise.all(Array.from({length:12},(_,index)=>(index%2?firstService:secondService).update(user!.id,'pengantar',index%3?'COMPLETED':'IN_PROGRESS')));
    const progress=await secondService.detail(user.id,'pengantar');assert.equal(progress.status,'COMPLETED');assert.ok(progress.completedAt);
    assert.equal(await db.getRepository(UserLessonProgress).countBy({userId:user.id,lessonId:'pengantar'}),1);
    await firstService.update(user.id,'pengantar','IN_PROGRESS');await secondService.update(user.id,'pengantar','COMPLETED');
    assert.equal((await firstService.detail(user.id,'pengantar')).completedAt,progress.completedAt);
    console.log('Neon two-connection concurrency, persistence and completion timestamp PASS');
    const testConfig={...config,frontend:'http://localhost:3102',origin:'http://localhost:3102',api:'http://localhost:4102'};
    const module=await Test.createTestingModule({imports:[ThrottlerModule.forRoot([{ttl:60000,limit:200}])],controllers:[LearningController,AuthController,UsersController],providers:[AuthService,GoogleService,UsersService,SessionGuard,LearningService,{provide:APP_GUARD,useClass:ThrottlerGuard},{provide:DataSource,useValue:db},{provide:CONFIG,useValue:testConfig},{provide:Mailer,useValue:{}}]}).compile();
    app=module.createNestApplication();setup(app,testConfig);await app.init();
    await learningBrowserAcceptance(app,db,module.get(LearningService),'neon-development');
    console.log('Neon browser learning, cross-device login, ownership, guest, retry/session expiry and all-complete PASS');
  } finally {
    if(app) await app.close();
    if(user && db.isInitialized) {
      const found=await db.getRepository(User).findOneBy({id:user.id});
      assert.equal(found?.email,user.email,'Cleanup target must be the exact run-owned fixture');
      await db.getRepository(User).delete({id:user.id,email:user.email});
      assert.equal(await db.getRepository(UserLessonProgress).countBy({userId:user.id}),0);
    }
    if(second?.isInitialized) await second.destroy();if(db.isInitialized)await db.destroy();
  }
}
main().catch(error=>{console.error(`Development learning verification failed (${error.name}; ${error.code || error.driverError?.code || 'check_failed'}). Credentials are not logged.`);process.exitCode=1;});
