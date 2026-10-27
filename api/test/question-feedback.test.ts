import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import request from 'supertest';
import {assessmentDatabase,assessmentApp,seedFixtureBank} from './assessment-fixtures';
import {readConfig} from '../src/config/config';
import {User} from '../src/modules/users/user.entity';
import {Session} from '../src/modules/auth/auth.entity';
import {digest,secret} from '../src/modules/auth/auth.service';
import {FeedbackService} from '../src/modules/quiz/feedback.service';
import {DetectiveService} from '../src/modules/quiz/detective.service';
import {QuizService} from '../src/modules/quiz/quiz.service';
import {QuizQuestion,QuizAttemptQuestion} from '../src/modules/quiz/quiz.entity';
import {QuestionReport} from '../src/modules/quiz/feedback.entity';

test('owned and guest reports, spam resistance, internal review and quarantine',async t=>{
  const db=await assessmentDatabase(),config=readConfig({DATABASE_URL:'postgres://localhost/feedback_test',FRONTEND_URL:'http://localhost:3103'}),{app,module}=await assessmentApp(db,config);
  const reports=module.get(FeedbackService),quiz=module.get(QuizService),detective=module.get(DetectiveService),http=request(app.getHttpServer());
  const user=await db.getRepository(User).save({email:'reports@example.test',nickname:'Fixture',emailVerifiedAt:new Date()}),other=await db.getRepository(User).save({email:'other-reports@example.test',nickname:'Other'});
  const token=secret();await db.getRepository(Session).save({hash:digest(token),userId:user.id,expiresAt:new Date(Date.now()+600000)});
  await seedFixtureBank(db);const attempt=await quiz.create(user.id,'pengantar'),items=await db.getRepository(QuizAttemptQuestion).findBy({attemptId:attempt.id});
  const selected=items.map(q=>({questionId:q.id,optionId:q.snapshot.correctAnswer}));await quiz.submit(user.id,attempt.id,selected);
  const questionId=items[0].questionId,payload={requestId:randomUUID(),questionVersion:1,category:'QURAN_TEXT_REFERENCE' as const,description:'Fixture report',attemptId:attempt.id};
  try{
    await t.test('owned submitted context only; duplicate retry stores one and no score/key mutation',async()=>{
      const before=await quiz.get(user.id,attempt.id),original=await db.getRepository(QuizQuestion).findOneByOrFail({id:questionId});
      await reports.report(user.id,questionId,payload);await reports.report(user.id,questionId,payload);
      assert.equal(await db.getRepository(QuestionReport).count(),1);const saved=await db.getRepository(QuestionReport).findOneByOrFail({id:payload.requestId});assert.equal(saved.priority,'HIGH');assert.equal(saved.reporterUserId,user.id);assert.equal(saved.snapshot.contentVersion,1);
      assert.deepEqual(await quiz.get(user.id,attempt.id),before);assert.deepEqual(await db.getRepository(QuizQuestion).findOneByOrFail({id:questionId}),original);
      await assert.rejects(()=>reports.report(other.id,questionId,{...payload,requestId:randomUUID()}));
      await assert.rejects(()=>reports.report(user.id,questionId,{...payload,questionVersion:2,requestId:randomUUID()}));
      await assert.rejects(()=>reports.report(user.id,questionId,{...payload,description:'Changed'}),/digunakan/);
      await assert.rejects(()=>reports.report(user.id,questionId,{...payload,requestId:randomUUID(),description:'x'.repeat(2001)}));
      const active=await quiz.create(user.id,'pengantar');await assert.rejects(()=>reports.report(user.id,active.questions[0].id,{...payload,requestId:randomUUID(),attemptId:active.id}));
    });
    await t.test('post-answer guest receipt permits report, never creates an account; tampering and substitution fail',async()=>{
      const count=await db.getRepository(User).count(),challenge=(await detective.next(null)).challenge!,answer=await detective.answer(null,challenge.token,challenge.question.options[0].id),proof=answer.reporting as {token:string};
      const guest={requestId:randomUUID(),questionVersion:1,category:'CONFUSING_QUESTION' as const,token:proof.token};
      await reports.report(null,answer.feedback.questionId,guest);assert.equal((await db.getRepository(QuestionReport).findOneByOrFail({id:guest.requestId})).reporterUserId,null);assert.equal(await db.getRepository(User).count(),count);
      await assert.rejects(()=>reports.report(null,answer.feedback.questionId,{...guest,requestId:randomUUID(),token:proof.token+'x'}));
      await assert.rejects(()=>reports.report(user.id,answer.feedback.questionId,{...guest,requestId:randomUUID()}));
      await assert.rejects(()=>reports.report(null,randomUUID(),{...guest,requestId:randomUUID()}));
      await reports.quarantine(answer.feedback.questionId,true,'fixture operator','Investigate');
      await reports.report(null,answer.feedback.questionId,{...guest,requestId:randomUUID()});
    });
    await t.test('internal status review and suspension preserve snapshots and exclude new selections',async()=>{
      const before=await quiz.get(user.id,attempt.id);await reports.review(payload.requestId,'IN_REVIEW','fixture DB operator','Review started');await reports.review(payload.requestId,'RESOLVED','fixture DB operator','Checked against fixture source');
      const row=await db.getRepository(QuestionReport).findOneByOrFail({id:payload.requestId});assert.equal(row.status,'RESOLVED');assert.ok(row.reviewedAt);assert.equal(row.reviewedBy,'fixture DB operator');
      await assert.rejects(()=>reports.review(payload.requestId,'REJECTED','', ''));
      await reports.quarantine(questionId,true,'fixture DB operator','Investigate content');
      const next=await quiz.create(other.id,'pengantar'),nextItems=await db.getRepository(QuizAttemptQuestion).findBy({attemptId:next.id});assert.ok(nextItems.every(q=>q.questionId!==questionId));assert.deepEqual(await quiz.get(user.id,attempt.id),before);
      await reports.quarantine(questionId,false,'fixture DB operator','Source checked');assert.equal((await db.getRepository(QuizQuestion).findOneByOrFail({id:questionId})).suspended,false);
    });
    await t.test('public reads/review forbidden; DTO ownership/status rejected; report rate limiting',async()=>{
      await http.get('/api/v1/questions/feedback').expect(404);await http.patch('/api/v1/questions/'+questionId+'/feedback').set('Origin',config.origin).set('X-TajwidLens-CSRF','1').send({status:'RESOLVED'}).expect(404);
      const post=(body:object)=>http.post('/api/v1/questions/'+questionId+'/feedback').set('Origin',config.origin).set('X-TajwidLens-CSRF','1').set('Cookie','tajwidlens='+token).send(body);
      await post({...payload,reporterUserId:other.id,status:'RESOLVED'}).expect(400);
      await http.post('/api/v1/questions/'+questionId+'/feedback').send(payload).expect(403);
      for(let i=0;i<4;i++)await post({...payload,requestId:randomUUID()}).expect(202);
      await post({...payload,requestId:randomUUID()}).expect(429);
    });
  }finally{await app.close();await db.destroy();}
});
