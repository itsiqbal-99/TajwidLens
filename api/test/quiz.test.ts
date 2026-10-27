import {mock,test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import request from 'supertest';
import {assessmentApp,assessmentDatabase,seedFixtureBank} from './assessment-fixtures';
import {readConfig} from '../src/config/config';
import {User} from '../src/modules/users/user.entity';
import {Session} from '../src/modules/auth/auth.entity';
import {digest,secret} from '../src/modules/auth/auth.service';
import {QuizQuestion,QuizAttempt,QuizAttemptQuestion,MistakeReview} from '../src/modules/quiz/quiz.entity';
import {QuizService} from '../src/modules/quiz/quiz.service';
import {QuestionBankService} from '../src/modules/quiz/question-bank.service';
import {DetectiveService} from '../src/modules/quiz/detective.service';
import {ReviewService} from '../src/modules/quiz/review.service';
import {UserLessonProgress} from '../src/modules/learning/learning.entity';
import {LearningService} from '../src/modules/learning/learning.service';

test('assessment API: ownership, server grading, snapshots, guest and replay',async t=>{
  const db=await assessmentDatabase(),config=readConfig({DATABASE_URL:'postgres://localhost/assessment_test',FRONTEND_URL:'http://localhost:3103',API_URL:'http://localhost:4103'});
  const {app,module}=await assessmentApp(db,config),http=request(app.getHttpServer());
  const quiz=module.get(QuizService),learning=module.get(LearningService),bank=module.get(QuestionBankService);
  const detective=module.get(DetectiveService),reviews=module.get(ReviewService);
  const user=await db.getRepository(User).save({email:'quiz@example.test',nickname:'Fixture',emailVerifiedAt:new Date()});
  const other=await db.getRepository(User).save({email:'other@example.test',nickname:'Other'}),token=secret();
  await db.getRepository(Session).save({hash:digest(token),userId:user.id,expiresAt:new Date(Date.now()+600000)});
  const cookie=`tajwidlens=${token}`;
  const post=(path:string,body:object)=>http.post('/api/v1'+path).set('Cookie',cookie).set('Origin',config.origin).set('X-TajwidLens-CSRF','1').send(body);
  const answers=async(id:string,correct:number)=>(await db.getRepository(QuizAttemptQuestion).find({where:{attemptId:id},order:{ordinal:'ASC'}})).map((item,i)=>({questionId:item.id,optionId:i<correct?item.snapshot.correctAnswer:item.snapshot.options.find(o=>o.id!==item.snapshot.correctAnswer)!.id}));
  try{
    await t.test('empty bank unavailable, no writes, manual bypass rejected and payload scoring rejected',async()=>{
      assert.equal((await quiz.availability('pengantar')).available,false);
      await post('/quiz/lessons/pengantar/attempts',{}).expect(409);
      await http.get('/api/v1/quiz/attempts/'+randomUUID()).expect(401);
      await post('/quiz/lessons/pengantar/attempts',{score:100,passed:true}).expect(400);
      await http.put('/api/v1/learning/progress/pengantar/complete').set('Cookie',cookie).set('Origin',config.origin).set('X-TajwidLens-CSRF','1').send({}).expect(403);
      assert.equal(await db.getRepository(QuizAttempt).count(),0);
      assert.equal((await detective.next(null)).available,false);
      await assert.rejects(()=>quiz.availability('invalid'));
    });
    await seedFixtureBank(db);
    await t.test('published-only gate, insufficient pool, theory lessons, duplicate and conflicting versions excluded',async()=>{
      const rows=await seedFixtureBank(db,'harakat',7);
      await db.getRepository(QuizQuestion).update(rows[0].id,{reviewStatus:'DRAFT',review:null});
      assert.equal((await quiz.availability('harakat')).eligibleCount,6);
      const mixed=await seedFixtureBank(db,'huruf-hijaiyah',7);
      await db.getRepository(QuizQuestion).update(mixed.map(q=>q.id),{type:'MULTIPLE_CHOICE',quran:null});
      assert.equal((await quiz.availability('huruf-hijaiyah')).reason,'AVAILABLE');
      const theory=await quiz.create(user.id,'huruf-hijaiyah');assert.equal(theory.questions.length,7);assert.ok(theory.questions.every(q=>q.type==='MULTIPLE_CHOICE'));
      const original=rows[1];await db.getRepository(QuizQuestion).save({...original,id:randomUUID(),stableId:'duplicate-fixture'});
      assert.equal((await bank.eligible('harakat')).length,6);
      await db.getRepository(QuizQuestion).save({...original,id:randomUUID(),stableId:'conflicting-fixture',correctAnswer:original.correctAnswer==='a'?'b':'a'});
      assert.equal((await bank.eligible('harakat')).length,5);
    });
    const created=await post('/quiz/lessons/pengantar/attempts',{}).expect(201),attempt=created.body;
    await t.test('refresh persists order and selections without keys; access is account-owned',async()=>{
      assert.equal(attempt.questions.length,7);assert.equal(attempt.result,null);
      assert.doesNotMatch(JSON.stringify(attempt),/correctAnswer|correctOptionId|explanation|contentHash|reviewerId|ruleId/);
      const correct=await answers(attempt.id,7);
      await http.put(`/api/v1/quiz/attempts/${attempt.id}/answers`).set('Cookie',cookie).set('Origin',config.origin).set('X-TajwidLens-CSRF','1').send({answers:correct.slice(0,1)}).expect(200);
      const resumed=await quiz.create(user.id,'pengantar');assert.equal(resumed.id,attempt.id);assert.equal(resumed.questions[0].selectedOptionId,correct[0].optionId);
      assert.deepEqual(resumed.questions.map(q=>q.options),attempt.questions.map((q:{options:unknown})=>q.options));
      await assert.rejects(()=>quiz.get(other.id,attempt.id),/tidak ditemukan/);
      await assert.rejects(()=>quiz.submit(other.id,attempt.id,correct),/tidak ditemukan/);
      await post(`/quiz/attempts/${attempt.id}/submit`,{answers:correct.slice(0,6)}).expect(400);
      await post(`/quiz/attempts/${attempt.id}/submit`,{answers:[correct[0],correct[0]]}).expect(400);
      await post(`/quiz/attempts/${attempt.id}/submit`,{answers:correct,score:100}).expect(400);
    });
    await t.test('five fails, retry varies, six passes, repeated submission freezes grade and completion time',async()=>{
      const failed=await quiz.submit(user.id,attempt.id,await answers(attempt.id,5));
      assert.equal(failed.result!.passed,false);assert.equal(failed.result!.correctCount,5);assert.equal(failed.result!.feedback.length,7);
      assert.equal((await learning.dashboard(user.id)).summary.completedLessons,0);
      const retry=await quiz.create(user.id,'pengantar');assert.notEqual(retry.id,attempt.id);
      const old=await db.getRepository(QuizAttemptQuestion).findBy({attemptId:attempt.id}),fresh=await db.getRepository(QuizAttemptQuestion).findBy({attemptId:retry.id});
      assert.ok(fresh.every(q=>!old.some(o=>o.questionId===q.questionId)));
      const passed=await quiz.submit(user.id,retry.id,await answers(retry.id,6));
      assert.equal(passed.result!.completionVerified,true);assert.equal(passed.result!.percentage,85.71);
      const detail=await learning.detail(user.id,'pengantar');assert.equal(detail.completionSource,'QUIZ_VERIFIED');assert.equal(detail.status,'COMPLETED');
      const duplicate=await quiz.submit(user.id,retry.id,await answers(retry.id,0));assert.deepEqual(duplicate,passed);
      await learning.start(user.id,'pengantar');assert.equal((await learning.detail(user.id,'pengantar')).completedAt,detail.completedAt);
      const seven=await quiz.create(user.id,'pengantar');assert.equal((await quiz.submit(user.id,seven.id,await answers(seven.id,7))).result!.correctCount,7);
      assert.equal((await learning.detail(user.id,'pengantar')).completedAt,detail.completedAt);
      assert.equal((await learning.dashboard(user.id)).summary.completedLessons,1);
    });
    await t.test('withdrawn or expired attempts cannot grade; historical snapshot unchanged',async()=>{
      const historical=await quiz.get(user.id,attempt.id),active=await quiz.create(user.id,'pengantar');
      const item=await db.getRepository(QuizAttemptQuestion).findOneByOrFail({attemptId:active.id});
      await db.getRepository(QuizQuestion).update(item.questionId,{reviewStatus:'DRAFT',review:null});
      const selected=await answers(active.id,7);
      await assert.rejects(()=>quiz.submit(user.id,active.id,[]));
      await assert.rejects(()=>quiz.submit(user.id,active.id,selected),/diperbarui/);
      assert.equal((await quiz.get(user.id,active.id)).status,'EXPIRED');
      await db.getRepository(QuizQuestion).update(item.questionId,{reviewStatus:'PUBLISHED',review:item.snapshot.review});
      assert.deepEqual(await quiz.get(user.id,attempt.id),historical);
      await db.query(`UPDATE quiz_attempts SET "createdAt"=$1,"expiresAt"=$2 WHERE id=$3`,[new Date(Date.now()-172800000),new Date(Date.now()-86400000),active.id]);
      await assert.rejects(()=>quiz.submit(user.id,active.id,selected),/berakhir/);
    });
    await t.test('guest Detective is stateless; tampered and cross-account challenges rejected',async()=>{
      const counts=await Promise.all([QuizAttempt,QuizAttemptQuestion,MistakeReview,UserLessonProgress,User,Session].map(entity=>db.getRepository(entity).count()));
      const eligible=mock.method(bank,'eligible',bank.eligible.bind(bank));
      const next=await detective.next(null),challenge=next.challenge!;
      assert.ok(eligible.mock.calls.length>0);
      assert.ok(eligible.mock.calls.every(call=>typeof call.arguments[0]==='string'));
      eligible.mock.restore();
      assert.equal(next.storage,'guest');assert.ok(challenge.question.verse);
      assert.doesNotMatch(JSON.stringify(challenge),/correctAnswer|explanation|ruleId/);
      const row=await db.getRepository(QuizQuestion).findOneByOrFail({id:challenge.question.id});
      const feedback=await detective.answer(null,challenge.token,row.correctAnswer);assert.equal(feedback.saved,false);assert.equal(feedback.feedback.correct,true);
      await assert.rejects(()=>detective.answer(null,challenge.token+'x',row.correctAnswer));
      await assert.rejects(()=>detective.answer(user.id,challenge.token,row.correctAnswer));
      const later=Date.now()+600001,clock=mock.method(Date,'now',()=>later);
      try{await assert.rejects(()=>detective.answer(null,challenge.token,row.correctAnswer),/berakhir/);}finally{clock.mock.restore();}
      assert.deepEqual(await Promise.all([QuizAttempt,QuizAttemptQuestion,MistakeReview,UserLessonProgress,User,Session].map(entity=>db.getRepository(entity).count())),counts);
    });
    await t.test('authenticated mistake, optional Replay, alternate question and unchanged original score',async()=>{
      const next=await detective.next(user.id),challenge=next.challenge!,row=await db.getRepository(QuizQuestion).findOneByOrFail({id:challenge.question.id});
      const wrong=row.options.find(o=>o.id!==row.correctAnswer)!.id;
      const feedback=await detective.answer(user.id,challenge.token,wrong);assert.equal(feedback.saved,true);assert.equal(feedback.needsReview,true);
      const count=await db.getRepository(QuizAttempt).count();await detective.answer(user.id,challenge.token,row.correctAnswer);assert.equal(await db.getRepository(QuizAttempt).count(),count);
      const list=await reviews.list(user.id);assert.ok(list.needsReviewCount>0);assert.ok(list.items[0].status==='NEEDS_REVIEW');
      const review=list.items.find(item=>item.conceptId===row.conceptId && item.lessonId===row.lessonId)!;
      await assert.rejects(()=>reviews.practice(other.id,review.id));
      const practice=await reviews.practice(user.id,review.id);assert.equal(practice.mode,'REPLAY');assert.equal(practice.questions.length,1);
      const item=await db.getRepository(QuizAttemptQuestion).findOneByOrFail({attemptId:practice.id});assert.notEqual(item.questionId,row.id);
      assert.equal((await db.getRepository(MistakeReview).findOneByOrFail({id:review.id})).status,'NEEDS_REVIEW');
      await quiz.submit(user.id,practice.id,await answers(practice.id,1));
      assert.equal((await db.getRepository(MistakeReview).findOneByOrFail({id:review.id})).status,'IMPROVED');
      assert.equal((await quiz.get(user.id,attempt.id)).result!.correctCount,5);assert.equal((await learning.dashboard(user.id)).summary.completedLessons,1);
    });
    await t.test('immutable import rejects editing a used content version',async()=>{
      const row=await db.getRepository(QuizQuestion).findOneByOrFail({lessonId:'pengantar'});
      await assert.rejects(()=>bank.import([{...row,prompt:row.prompt+' changed'}]),/immutable/);
      const historical=await quiz.get(user.id,attempt.id);
      await bank.import([{...row,id:randomUUID(),contentVersion:row.contentVersion+1,prompt:row.prompt+' New immutable fixture version.'}]);
      assert.deepEqual(await quiz.get(user.id,attempt.id),historical);
    });
    await t.test('review pagination prioritizes all unresolved concepts across pages',async()=>{
      await db.getRepository(MistakeReview).save(Array.from({length:32},(_,i)=>({userId:other.id,lessonId:'pengantar',conceptId:'paging-'+i,conceptLabel:'Paging fixture '+i,status:i<25?'NEEDS_REVIEW' as const:'IMPROVED' as const,lastMistakeAt:new Date(),improvedAt:i<25?null:new Date()})));
      const first=await reviews.list(other.id);assert.equal(first.needsReviewCount,25);assert.equal(first.items.length,20);assert.ok(first.items.every(i=>i.status==='NEEDS_REVIEW'));assert.ok(first.nextCursor);
      const second=await reviews.list(other.id,first.nextCursor!);assert.equal(second.items.length,12);assert.equal(second.nextCursor,null);
      assert.equal(new Set([...first.items,...second.items].map(i=>i.id)).size,32);assert.equal(second.items.slice(0,5).every(i=>i.status==='NEEDS_REVIEW'),true);assert.equal(second.items.slice(5).every(i=>i.status==='IMPROVED'),true);
    });
  }finally{await app.close();await db.destroy();}
});
