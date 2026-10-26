import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import request from 'supertest';
import {assessmentDatabase,assessmentApp} from './assessment-fixtures';
import {User} from '../src/modules/users/user.entity';
import {Session} from '../src/modules/auth/auth.entity';
import {UserLessonProgress} from '../src/modules/learning/learning.entity';
import {LearningService} from '../src/modules/learning/learning.service';
import {readConfig} from '../src/config/config';
import {digest,secret} from '../src/modules/auth/auth.service';

test('learning API preserves reading progress and rejects self-reported completion',async()=>{
  const db=await assessmentDatabase(),config=readConfig({DATABASE_URL:'postgres://localhost/learning_test',FRONTEND_URL:'http://localhost:3102',API_URL:'http://localhost:4102'});
  const {app,module}=await assessmentApp(db,config),http=request(app.getHttpServer()),service=module.get(LearningService);
  const user=await db.getRepository(User).save({email:'learning@example.test',nickname:'Learner',emailVerifiedAt:new Date()}),other=await db.getRepository(User).save({email:'other@example.test',nickname:'Other',emailVerifiedAt:new Date()});
  const token=secret();await db.getRepository(Session).save({hash:digest(token),userId:user.id,expiresAt:new Date(Date.now()+600000)});
  const cookie='tajwidlens='+token;
  const put=(id:string,action:string,body:object={})=>http.put('/api/v1/learning/progress/'+id+'/'+action).set('Origin',config.origin).set('X-TajwidLens-CSRF','1').set('Cookie',cookie).send(body);
  try{
    await http.get('/api/v1/learning/dashboard').expect(401);
    assert.equal((await service.dashboard(user.id)).summary.totalLessons,24);assert.equal(await db.getRepository(UserLessonProgress).count(),0);
    await put('pengantar','start',{userId:other.id}).expect(400);
    await http.get('/api/v1/learning/progress').query({userId:other.id}).set('Cookie',cookie).expect(400);
    await put('not-a-lesson','start').expect(404);
    await http.put('/api/v1/learning/progress/pengantar/start').set('Cookie',cookie).send({}).expect(403);
    const started=await put('pengantar','start').expect(200);assert.equal(started.body.status,'IN_PROGRESS');
    await put('pengantar','complete').expect(403);
    await Promise.all(Array.from({length:8},()=>service.start(user.id,'pengantar')));
    assert.equal(await db.getRepository(UserLessonProgress).countBy({userId:user.id,lessonId:'pengantar'}),1);
    assert.equal((await service.detail(user.id,'pengantar')).startedAt,started.body.startedAt);
    assert.equal((await service.dashboard(user.id)).summary.completedLessons,0);
    assert.equal((await service.detail(other.id,'pengantar')).status,'NOT_STARTED');
    await assert.rejects(()=>service.start(randomUUID(),'pengantar'));
    const oldDate=new Date('2026-01-01T00:00:00Z');
    await db.getRepository(UserLessonProgress).save({userId:user.id,lessonId:'harakat',status:'COMPLETED',completedAt:oldDate,completionSource:'LEGACY_SELF_REPORTED',legacyCompletedAt:oldDate});
    const legacy=await service.start(user.id,'harakat');assert.equal(legacy.status,'AWAITING_QUIZ');assert.equal(legacy.completedAt,null);assert.equal(legacy.legacyCompletedAt,oldDate.toISOString());
    const dashboard=await service.dashboard(user.id);assert.equal(dashboard.summary.legacyLessons,1);assert.equal(dashboard.summary.completedLessons,0);assert.equal(dashboard.continueLearning?.lessonId,'harakat');
    await assert.rejects(()=>db.query(`INSERT INTO user_lesson_progress ("userId","lessonId",status,"completedAt") VALUES ($1,'invalid','COMPLETED',CURRENT_TIMESTAMP)`,[user.id]));
  }finally{await app.close();await db.destroy();}
});
