import 'reflect-metadata';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {DataSource} from 'typeorm';
import db from '../src/database/data-source';
import {readConfig} from '../src/config/config';
import {appEntities} from '../src/database/schema';
import {InitialAuth1760000000000} from '../src/database/1760000000000-InitialAuth';
import {LearningProgress1792886400000} from '../src/database/1792886400000-LearningProgress';
import {QuizAssessment1792900800000} from '../src/database/1792900800000-QuizAssessment';
import {assessmentApp,seedFixtureBank} from '../test/assessment-fixtures';
import {User} from '../src/modules/users/user.entity';
import {UserLessonProgress} from '../src/modules/learning/learning.entity';
import {LearningService} from '../src/modules/learning/learning.service';
import {QuizService} from '../src/modules/quiz/quiz.service';
import {QuizCorpus} from '../src/modules/quiz/corpus';
import {QuestionBankService} from '../src/modules/quiz/question-bank.service';
import {QuizQuestion,QuizAttempt,QuizAttemptQuestion,MistakeReview} from '../src/modules/quiz/quiz.entity';
import {fixtureReviewers} from '../test/assessment-fixtures';
import {QuestionFeedback1792915200000} from '../src/database/1792915200000-QuestionFeedback';
import {verifyQuestionFeedback} from '../test/feedback-postgres';

async function browserCheck(database:DataSource,config:ReturnType<typeof readConfig>){
  // Establish the small test pool before timing UI assertions on the remote development DB.
  await Promise.all(Array.from({length:3},()=>database.query('SELECT 1')));
  const {assessmentBrowserAcceptance}=await import('../test/assessment-browser');
  const testConfig={...config,frontend:'http://localhost:3103',origin:'http://localhost:3103',api:'http://localhost:4103'};
  const {app,module}=await assessmentApp(database,testConfig);
  try{await assessmentBrowserAcceptance(app,database,module.get(QuizService),module.get(LearningService));}finally{await app.close();}
}

async function main(){
  assert.ok(process.argv.includes('--approved-development'),'Explicit approved-development flag required');
  const config=readConfig();assert.equal(config.production,false,'Production verification is not authorized');
  const schema='phase03_verify_'+randomUUID().replaceAll('-','');
  assert.match(schema,/^phase03_verify_[a-f0-9]{32}$/);
  let oid:string|undefined,first:DataSource|undefined,second:DataSource|undefined;
  await db.initialize();
  try{
    const runner=db.createQueryRunner();await runner.connect();await runner.startTransaction();
    const migration=new QuizAssessment1792900800000(),legacyUser=randomUUID(),legacyDate='2026-01-02T03:04:05.000Z';
    try{
      await runner.query(`CREATE SCHEMA "${schema}"`);
      [ {oid} ]=await runner.query('SELECT oid::text AS oid FROM pg_namespace WHERE nspname=$1',[schema]);
      await runner.query(`SET LOCAL search_path TO "${schema}"`);
      assert.equal((await runner.query('SELECT current_schema() AS schema'))[0].schema,schema);
      await new InitialAuth1760000000000().up(runner);await new LearningProgress1792886400000().up(runner);
      await runner.query('INSERT INTO users (id,email,nickname) VALUES ($1,$2,$3)',[legacyUser,'legacy@example.test','Legacy fixture']);
      await runner.query(`INSERT INTO user_lesson_progress ("userId","lessonId",status,"completedAt") VALUES ($1,'pengantar','COMPLETED',$2)`,[legacyUser,legacyDate]);
      await migration.up(runner);
      const row=(await runner.query('SELECT * FROM user_lesson_progress'))[0];
      assert.equal(row.status,'COMPLETED');assert.equal(row.completedAt.toISOString(),legacyDate);assert.equal(row.legacyCompletedAt.toISOString(),legacyDate);assert.equal(row.completionSource,'LEGACY_SELF_REPORTED');
      await migration.down(runner);assert.equal((await runner.query('SELECT "completedAt" FROM user_lesson_progress'))[0].completedAt.toISOString(),legacyDate);
      await migration.up(runner);
      const feedbackMigration=new QuestionFeedback1792915200000();await feedbackMigration.up(runner);await feedbackMigration.down(runner);await feedbackMigration.up(runner);
      await runner.commitTransaction();
    }catch(error){await runner.rollbackTransaction();throw error;}finally{await runner.release();}
    console.log('PASS real PostgreSQL migration, legacy preservation and empty assessment rollback/reapply');
    const options={type:'postgres' as const,url:config.databaseUrl,ssl:config.ssl,schema,entities:appEntities,synchronize:false,migrationsRun:false,logging:false};
    first=new DataSource(options);second=new DataSource(options);await first.initialize();await second.initialize();
    if(process.argv.includes('--generated')){
      const {verifyGeneratedAssessments}=await import('../test/generated-assessment');
      await verifyGeneratedAssessments(first,config,process.argv.includes('--browser'));return;
    }
    const firstQuiz=new QuizService(first,new QuestionBankService(first,new QuizCorpus(),fixtureReviewers));
    const secondQuiz=new QuizService(second,new QuestionBankService(second,new QuizCorpus(),fixtureReviewers));
    await seedFixtureBank(first);const learning=new LearningService(first);
    if(process.argv.includes('--browser-only')){await browserCheck(first,config);return;}
    assert.equal((await learning.dashboard(legacyUser)).summary.completedLessons,0);
    const [attempt,concurrentCreate]=await Promise.all([firstQuiz.create(legacyUser,'pengantar'),secondQuiz.create(legacyUser,'pengantar')]);
    assert.equal(attempt.id,concurrentCreate.id,'Concurrent creation must resume one active attempt');
    const answer=async(id:string,count:number)=>(await first!.getRepository(QuizAttemptQuestion).find({where:{attemptId:id},order:{ordinal:'ASC'}})).map((item,i)=>({questionId:item.id,optionId:i<count?item.snapshot.correctAnswer:item.snapshot.options.find(o=>o.id!==item.snapshot.correctAnswer)!.id}));
    const six=await answer(attempt.id,6),zero=await answer(attempt.id,0);
    const results=await Promise.all([firstQuiz.submit(legacyUser,attempt.id,six),secondQuiz.submit(legacyUser,attempt.id,zero)]);
    assert.deepEqual(results[0],results[1],'Concurrent submissions must return the first committed result');
    const accepted=results[0].result!,saved=await second.getRepository(QuizAttempt).findOneByOrFail({id:attempt.id});assert.equal(saved.correctCount,accepted.correctCount);
    if(!accepted.passed){const retry=await firstQuiz.create(legacyUser,'pengantar');await firstQuiz.submit(legacyUser,retry.id,await answer(retry.id,7));}
    const verified=await learning.detail(legacyUser,'pengantar');assert.equal(verified.status,'COMPLETED');assert.equal(verified.legacyCompletedAt,legacyDate);assert.equal(verified.completionSource,'QUIZ_VERIFIED');
    const again=await secondQuiz.create(legacyUser,'pengantar');await secondQuiz.submit(legacyUser,again.id,await answer(again.id,7));
    assert.equal((await learning.start(legacyUser,'pengantar')).completedAt,verified.completedAt);
    assert.equal(await first.getRepository(UserLessonProgress).countBy({userId:legacyUser,lessonId:'pengantar'}),1);
    console.log('PASS two independent connections: concurrent idempotent submission, verified provenance, first completion timestamp');
    const failure=await firstQuiz.create(legacyUser,'pengantar'),items=await first.getRepository(QuizAttemptQuestion).findBy({attemptId:failure.id});
    // Inject a database failure AFTER grading/completion to prove the whole transaction rolls back.
    const failureRunner=first.createQueryRunner();await failureRunner.connect();await failureRunner.startTransaction();
    try{
      await failureRunner.query(`SET LOCAL search_path TO "${schema}"`);
      await failureRunner.query(`ALTER TABLE mistake_reviews ADD CONSTRAINT fixture_reject_review CHECK ("conceptId"<>'${items[0].snapshot.conceptId}') NOT VALID`);
      await failureRunner.commitTransaction();
    }finally{await failureRunner.release();}
    const allWrong=await answer(failure.id,0);
    await assert.rejects(()=>firstQuiz.submit(legacyUser,failure.id,allWrong));
    assert.equal((await first.getRepository(QuizAttempt).findOneByOrFail({id:failure.id})).status,'IN_PROGRESS');
    assert.ok((await first.getRepository(QuizAttemptQuestion).findBy({attemptId:failure.id})).every(q=>q.selectedOptionId===null));
    assert.equal((await learning.detail(legacyUser,'pengantar')).completedAt,verified.completedAt);
    await first.query(`ALTER TABLE "${schema}".mistake_reviews DROP CONSTRAINT fixture_reject_review`);
    // A passing submission must also roll back its new completion if review persistence fails.
    const learner=await first.getRepository(User).save({email:'atomic@example.test',nickname:'Atomic fixture'}),atomic=await firstQuiz.create(learner.id,'pengantar');
    await first.query(`ALTER TABLE "${schema}".mistake_reviews ADD CONSTRAINT fixture_reject_all CHECK (false) NOT VALID`);
    const atomicAnswers=await answer(atomic.id,6);await assert.rejects(()=>firstQuiz.submit(learner.id,atomic.id,atomicAnswers));
    assert.equal(await first.getRepository(UserLessonProgress).countBy({userId:learner.id}),0);assert.equal((await first.getRepository(QuizAttempt).findOneByOrFail({id:atomic.id})).status,'IN_PROGRESS');
    await first.query(`ALTER TABLE "${schema}".mistake_reviews DROP CONSTRAINT fixture_reject_all`);
    console.log('PASS real PostgreSQL atomic rollback of answers, result, reviews and new completion');
    await assert.rejects(()=>first!.getRepository(QuizAttempt).insert({id:randomUUID(),userId:learner.id,lessonId:'pengantar',mode:'LESSON_QUIZ',status:'SUBMITTED',questionCount:7,expiresAt:new Date(Date.now()+10000),submittedAt:new Date(),passed:null,correctCount:null}));
    await assert.rejects(()=>first!.getRepository(QuizAttemptQuestion).insert({...items[0],id:randomUUID()}));
    await assert.rejects(()=>first!.getRepository(QuizAttempt).insert({id:randomUUID(),userId:randomUUID(),lessonId:'pengantar',mode:'LESSON_QUIZ',status:'IN_PROGRESS',questionCount:7,expiresAt:new Date(Date.now()+10000)}));
    await assert.rejects(()=>first!.getRepository(MistakeReview).insert({userId:learner.id,lessonId:'pengantar',conceptId:'constraint-fixture',conceptLabel:'Fixture',status:'IMPROVED',lastMistakeAt:new Date(),improvedAt:null}));
    const rollback=first.createQueryRunner();await rollback.connect();await rollback.startTransaction();
    try{await rollback.query(`SET LOCAL search_path TO "${schema}"`);await assert.rejects(()=>migration.down(rollback),/Rollback refused/);}finally{await rollback.rollbackTransaction();await rollback.release();}
    console.log('PASS database constraints and populated rollback refusal');
    await verifyQuestionFeedback(first,second,legacyUser,attempt.id);
    if(process.argv.includes('--browser')){
      await browserCheck(first,config);
    }
    if(process.argv.includes('--apply-development')){
      const pending=(await db.query('SELECT name FROM migrations')).map((r:{name:string})=>r.name);
      assert.ok(pending.includes('LearningProgress1792886400000'));
      assert.ok(!pending.some((name:string)=>!['InitialAuth1760000000000','LearningProgress1792886400000','QuizAssessment1792900800000','QuestionFeedback1792915200000'].includes(name)));
      const [before]=await db.query(`SELECT COUNT(*)::int AS count FROM user_lesson_progress WHERE status='COMPLETED'`);
      const applied=await db.runMigrations();assert.ok(applied.every(m=>['QuizAssessment1792900800000','QuestionFeedback1792915200000'].includes(m.name)));
      const [after]=await db.query(`SELECT COUNT(*)::int AS count FROM user_lesson_progress WHERE status='COMPLETED' AND "completionSource"='LEGACY_SELF_REPORTED' AND "legacyCompletedAt"="completedAt"`);
      assert.equal(after.count,before.count);assert.equal(await db.getRepository(QuizQuestion).countBy({reviewStatus:'PUBLISHED'}),0);assert.equal(await db.getRepository(QuizAttempt).count(),0);assert.equal(await db.getRepository(MistakeReview).count(),0);
      console.log('PASS approved development migration only; original completion timestamps preserved, no actual question was published');
    }
  }finally{
    if(second?.isInitialized)await second.destroy();if(first?.isInitialized)await first.destroy();
    if(oid){const [current]=await db.query('SELECT oid::text AS oid FROM pg_namespace WHERE nspname=$1',[schema]);assert.equal(current?.oid,oid,'Cleanup only the exact schema created by this run');await db.query(`DROP SCHEMA "${schema}" CASCADE`);console.log('PASS isolated synthetic fixture schema removed');}
    await db.destroy();
  }
}
main().catch(error=>{console.error(`Assessment verification failed: ${error.name} (${error.code || error.driverError?.code || 'assertion'}). ${error instanceof assert.AssertionError?error.message:''} Credentials are not logged.`);process.exitCode=1;});
