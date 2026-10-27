import assert from 'node:assert/strict';
import {randomBytes,randomUUID} from 'node:crypto';
import {DataSource} from 'typeorm';
import {QuizCorpus} from '../src/modules/quiz/corpus';
import {QuestionBankService} from '../src/modules/quiz/question-bank.service';
import {FeedbackService} from '../src/modules/quiz/feedback.service';
import {QuestionReport} from '../src/modules/quiz/feedback.entity';
import {QuizQuestion,QuizAttemptQuestion} from '../src/modules/quiz/quiz.entity';
import {QuizService} from '../src/modules/quiz/quiz.service';
import {fixtureReviewers} from './assessment-fixtures';
import {loadQuestionSources} from '../scripts/question-sources';
import {generateCandidates,validateGenerated} from '../src/modules/quiz/generation';
import {QuestionFeedback1792915200000} from '../src/database/1792915200000-QuestionFeedback';

export async function verifyQuestionFeedback(first:DataSource,second:DataSource,userId:string,attemptId:string){
  assert.match(('schema' in first.options?first.options.schema:'') || '',/^phase03_verify_[a-f0-9]{32}$/);
  const corpus=new QuizCorpus(),bank=new QuestionBankService(first,corpus,fixtureReviewers),key=randomBytes(32);
  const reports=new FeedbackService(first,bank,key,corpus),parallel=new FeedbackService(second,new QuestionBankService(second,corpus,fixtureReviewers),key,corpus);
  const item=await first.getRepository(QuizAttemptQuestion).findOneByOrFail({attemptId}),input={requestId:randomUUID(),questionVersion:item.snapshot.contentVersion,category:'QURAN_TEXT_REFERENCE' as const,description:'Isolated PostgreSQL fixture report',attemptId};
  const quiz=new QuizService(first,bank),before=await quiz.get(userId,attemptId);
  await Promise.all([reports.report(userId,item.questionId,input),parallel.report(userId,item.questionId,input)]);
  assert.equal(await first.getRepository(QuestionReport).countBy({id:input.requestId}),1);
  await parallel.review(input.requestId,'RESOLVED','isolated-fixture-reviewer','Checked synthetic fixture; no scientific claim');
  assert.equal((await reports.list({status:'RESOLVED',questionId:item.questionId}))[0].priority,'HIGH');
  await reports.quarantine(item.questionId,true,'isolated-fixture-operator','Fixture test hold');
  assert.ok(!(await bank.eligible()).some(q=>q.id===item.questionId));assert.deepEqual(await quiz.get(userId,attemptId),before);
  await reports.quarantine(item.questionId,false,'isolated-fixture-operator','Fixture test release');
  const arabic=(await bank.eligible()).find(q=>q.type==='TAJWID_IDENTIFICATION')!,snapshot=bank.snapshot(arabic),guest={requestId:randomUUID(),questionVersion:arabic.contentVersion,category:'CONFUSING_QUESTION' as const,token:reports.guestReceipt(snapshot)};
  await reports.report(null,arabic.id,guest);assert.equal((await first.getRepository(QuestionReport).findOneByOrFail({id:guest.requestId})).reporterUserId,null);
  const source=loadQuestionSources(),candidates=generateCandidates(source).questions.filter(q=>q.lessonId==='ikhfa-haqiqi');assert.ok(validateGenerated(candidates,source,bank).every(v=>v.passed));
  await bank.import(candidates);await bank.import(candidates);assert.equal(await first.getRepository(QuizQuestion).countBy({lessonId:'ikhfa-haqiqi'}),candidates.length);assert.equal(await first.getRepository(QuizQuestion).countBy({lessonId:'ikhfa-haqiqi',reviewStatus:'PUBLISHED'}),0);
  const runner=first.createQueryRunner();await runner.connect();await runner.startTransaction();
  try{await runner.query(`SET LOCAL search_path TO "${('schema' in first.options?first.options.schema:'')}"`);await assert.rejects(()=>new QuestionFeedback1792915200000().down(runner),/Rollback refused/);}finally{await runner.rollbackTransaction();await runner.release();}
  console.log('PASS real PostgreSQL feedback persistence/concurrent retry, guest report, review, quarantine, snapshots, generated DRAFT idempotent import and rollback refusal');
}
