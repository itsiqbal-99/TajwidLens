import 'reflect-metadata';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {newDb,DataType} from 'pg-mem';
import {DataSource} from 'typeorm';
import {Test} from '@nestjs/testing';
import {APP_GUARD} from '@nestjs/core';
import {ThrottlerModule,ThrottlerGuard} from '@nestjs/throttler';
import request from 'supertest';
import {User} from '../src/modules/users/user.entity';
import {Session,AuthToken,OAuthAttempt} from '../src/modules/auth/auth.entity';
import {AuthService} from '../src/modules/auth/auth.service';
import {SessionGuard} from '../src/modules/auth/session.guard';
import {Mailer} from '../src/modules/auth/mailer.service';
import {LearningController} from '../src/modules/learning/learning.controller';
import {AuthController} from '../src/modules/auth/auth.controller';
import {GoogleService} from '../src/modules/auth/google.service';
import {UsersController} from '../src/modules/users/users.controller';
import {UsersService} from '../src/modules/users/users.service';
import {learningBrowserAcceptance} from './learning-browser';
import {InitialAuth1760000000000} from '../src/database/1760000000000-InitialAuth';
import {LearningProgress1792886400000} from '../src/database/1792886400000-LearningProgress';
import {UserLessonProgress} from '../src/modules/learning/learning.entity';
import {LearningService} from '../src/modules/learning/learning.service';
import {lessonCatalog} from '../src/modules/learning/catalog';
import {CONFIG,readConfig} from '../src/config/config';
import {digest,secret} from '../src/modules/auth/auth.service';
import {setup} from '../src/common/setup';

test('learning migration and user-scoped API preserve progress atomically',async t=>{
  const memory=newDb();
  memory.public.registerFunction({name:'current_database',returns:DataType.text,implementation:()=> 'test'});
  memory.public.registerFunction({name:'version',returns:DataType.text,implementation:()=> 'PostgreSQL 16'});
  memory.public.registerFunction({name:'gen_random_uuid',returns:DataType.uuid,impure:true,implementation:randomUUID});
  memory.public.registerFunction({name:'clock_timestamp',returns:DataType.timestamptz,impure:true,implementation:()=>new Date()});
  memory.public.registerFunction({name:'greatest',args:[DataType.timestamptz,DataType.timestamptz],returns:DataType.timestamptz,implementation:(a:Date,b:Date)=>a>b?a:b});
  const db:DataSource=memory.adapters.createTypeormDataSource({type:'postgres',entities:[User,Session,AuthToken,OAuthAttempt,UserLessonProgress],migrations:[InitialAuth1760000000000,LearningProgress1792886400000],synchronize:false});
  await db.initialize();await db.runMigrations();
  const config=readConfig({DATABASE_URL:'postgres://localhost/learning_test',FRONTEND_URL:'http://localhost:3102',API_URL:'http://localhost:4102'});
  const module=await Test.createTestingModule({imports:[ThrottlerModule.forRoot([{ttl:60000,limit:200}])],controllers:[LearningController,AuthController,UsersController],providers:[AuthService,GoogleService,UsersService,SessionGuard,LearningService,{provide:APP_GUARD,useClass:ThrottlerGuard},{provide:DataSource,useValue:db},{provide:CONFIG,useValue:config},{provide:Mailer,useValue:{}}]}).compile();
  const app=module.createNestApplication();setup(app,config);await app.init();
  const http=request(app.getHttpServer()),service=module.get(LearningService);
  const user=await db.getRepository(User).save({email:'learning-a@example.com',nickname:'Learner A',emailVerifiedAt:new Date()});
  const other=await db.getRepository(User).save({email:'learning-b@example.com',nickname:'Learner B',emailVerifiedAt:new Date()});
  const token=secret(),otherToken=secret();
  await db.getRepository(Session).save([{hash:digest(token),userId:user.id,expiresAt:new Date(Date.now()+600000)},{hash:digest(otherToken),userId:other.id,expiresAt:new Date(Date.now()+600000)}]);
  const cookie=`tajwidlens=${token}`,otherCookie=`tajwidlens=${otherToken}`;
  const put=(id:string,action:string,body:object={},session=cookie)=>http.put(`/api/v1/learning/progress/${id}/${action}`).set('Origin',config.origin).set('X-TajwidLens-CSRF','1').set('Cookie',session).send(body);
  try {
    await t.test('authenticated reads show NOT_STARTED without allocating records; guest/forged ownership blocked',async()=>{
      await http.get('/api/v1/learning/dashboard').expect(401);
      await http.put('/api/v1/learning/progress/pengantar/complete').set('Origin',config.origin).set('X-TajwidLens-CSRF','1').send({}).expect(401);
      const dashboard=await http.get('/api/v1/learning/dashboard').set('Cookie',cookie).expect(200);
      assert.equal(dashboard.body.summary.totalLessons,24);assert.equal(dashboard.body.summary.completedLessons,0);
      const list=await http.get('/api/v1/learning/progress').set('Cookie',cookie).expect(200);assert.equal(list.body.lessons.length,24);
      assert.equal(await db.getRepository(UserLessonProgress).count(),0);
      await http.get('/api/v1/learning/progress/pengantar').set('Cookie',cookie).expect(200).expect(r=>assert.equal(r.body.status,'NOT_STARTED'));
      await put('pengantar','start',{userId:other.id}).expect(400);
      await http.get('/api/v1/learning/progress').query({userId:other.id}).set('Cookie',cookie).expect(400);
      await put('not-a-lesson','start').expect(404);
      await http.put('/api/v1/learning/progress/pengantar/start').set('Cookie',cookie).send({}).expect(403);
      await http.options('/api/v1/learning/progress/pengantar/start').set('Origin',config.origin).set('Access-Control-Request-Method','PUT').expect(204).expect('Access-Control-Allow-Methods',/PUT/);
    });
    await t.test('start, completion, repeated completion and reopening keep one record and first completion time',async()=>{
      const started=await put('pengantar','start').expect(200);assert.equal(started.body.status,'IN_PROGRESS');
      const completed=await put('pengantar','complete').expect(200);assert.equal(completed.body.status,'COMPLETED');
      const again=await put('pengantar','complete').expect(200),opened=await put('pengantar','start').expect(200);
      assert.equal(again.body.completedAt,completed.body.completedAt);assert.equal(opened.body.completedAt,completed.body.completedAt);
      assert.equal(opened.body.startedAt,started.body.startedAt);assert.equal(opened.body.status,'COMPLETED');
      assert.equal(await db.getRepository(UserLessonProgress).countBy({userId:user.id,lessonId:'pengantar'}),1);
      const read=await http.get('/api/v1/learning/progress/pengantar').set('Cookie',cookie).expect(200);assert.equal(read.body.status,'COMPLETED');
    });
    await t.test('a second account cannot read or mutate the first account progress',async()=>{
      const read=await http.get('/api/v1/learning/progress/pengantar').set('Cookie',otherCookie).expect(200);assert.equal(read.body.status,'NOT_STARTED');
      await put('huruf-hijaiyah','complete',{},otherCookie).expect(200);
      assert.equal((await service.detail(user.id,'huruf-hijaiyah')).status,'NOT_STARTED');
      assert.equal((await service.dashboard(other.id)).summary.completedLessons,1);
    });
    await t.test('concurrent starts and completions neither duplicate nor regress status',async()=>{
      await Promise.all(Array.from({length:8},(_,i)=>service.update(user.id,'mad-tabii',i%2?'COMPLETED':'IN_PROGRESS')));
      const progress=await service.detail(user.id,'mad-tabii');assert.equal(progress.status,'COMPLETED');assert.ok(progress.completedAt);
      assert.equal(await db.getRepository(UserLessonProgress).countBy({userId:user.id,lessonId:'mad-tabii'}),1);
    });
    await t.test('database rejects invalid state, duplicates and missing user; rollback refuses existing progress',async()=>{
      await assert.rejects(()=>db.query(`INSERT INTO user_lesson_progress ("userId","lessonId",status) VALUES ($1,'bad','COMPLETED')`,[user.id]));
      await assert.rejects(()=>db.getRepository(UserLessonProgress).insert({userId:user.id,lessonId:'pengantar',status:'IN_PROGRESS'}));
      await assert.rejects(()=>service.update(randomUUID(),'pengantar','IN_PROGRESS'));
      const runner=db.createQueryRunner();
      // pg-mem has no LOCK support. Real lock + rollback behavior is verified on Neon.
      const rollbackRunner={query:(sql:string)=>sql.startsWith('LOCK TABLE ')?Promise.resolve():runner.query(sql)} as typeof runner;
      try {await assert.rejects(()=>new LearningProgress1792886400000().down(rollbackRunner),/Rollback refused/);} finally {await runner.release();}
    });
    await t.test('all current lessons can be completed without an invalid next lesson',async()=>{
      for(const lesson of lessonCatalog) await service.update(user.id,lesson.id,'COMPLETED');
      const dashboard=await service.dashboard(user.id);assert.equal(dashboard.summary.completedLessons,24);assert.equal(dashboard.summary.progressPercentage,100);assert.equal(dashboard.continueLearning,null);
    });
    await t.test('learning journey, cross-device persistence, guest, errors, session expiry and all-complete UI',{skip:process.env.E2E!=='true'},async()=>{
      await learningBrowserAcceptance(app,db,service,'isolated');
    });
  } finally {await app.close();await db.destroy();}
});
