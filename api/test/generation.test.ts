import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {DataSource} from 'typeorm';
import {loadQuestionSources,validateQuestionManifest} from '../scripts/question-sources';
import {generateCandidates,validateGenerated,generationFingerprint} from '../src/modules/quiz/generation';
import {QuestionBankService,questionHash} from '../src/modules/quiz/question-bank.service';
import {sha256} from '../src/modules/quiz/corpus';
import {assessmentDatabase,fixtureReviewers} from './assessment-fixtures';
import {QuizQuestion} from '../src/modules/quiz/quiz.entity';
import {QuizService} from '../src/modules/quiz/quiz.service';
import {lessonCatalog} from '../src/modules/learning/catalog';
import {selectQuestions} from '../src/modules/quiz/engine';
import {RepositorySourceApproval} from '../src/modules/quiz/question.types';
import {feedback} from '../src/modules/quiz/engine';

test('deterministic generation, validation, idempotent import and approval gates',async t=>{
  const source=loadQuestionSources(),first=generateCandidates(source),second=generateCandidates(source,first.questions),bank=new QuestionBankService({} as DataSource,source.corpus,[]);
  await t.test('stable IDs/versions, distinct source facts, DRAFT only and all lesson coverage',()=>{
    assert.deepEqual(second.questions,first.questions);assert.equal(first.questions.length,316);
    assert.equal(new Set(first.questions.map(q=>q.id)).size,316);assert.equal(new Set(first.questions.map(generationFingerprint)).size,316);
    assert.ok(first.questions.every(q=>q.reviewStatus==='DRAFT'&&q.review===null));
    assert.ok(first.questions.every(q=>q.options.every(o=>!/^option-\d+$/.test(o.id))));
    const detective=first.questions.filter(q=>q.type==='TAJWID_IDENTIFICATION');
    assert.ok(detective.every(q=>q.options.every(o=>!/[\u0600-\u06ff]/u.test(o.label))));
    assert.ok(detective.some(q=>q.options.some(o=>o.label==="Mad thabi'i (mad asli)")));
    assert.ok(detective.some(q=>q.options.some(o=>o.label==='Ra tafkhim (dibaca tebal)')));
    assert.equal(first.questions.filter(q=>q.lessonId==='qalqalah').length,8);assert.equal(first.questions.filter(q=>q.lessonId==='mad-arid'&&q.quran).length,0);
    for(const lesson of lessonCatalog){const pool=first.questions.filter(q=>q.lessonId===lesson.id),selection=selectQuestions(pool);assert.ok(pool.length>=8);assert.equal(selection.length,7);
      assert.equal(new Set(selection.map(q=>q.id)).size,7);if(pool.some(q=>q.quran))assert.equal(new Set(selection.map(q=>q.type)).size,2);}
    assert.equal(first.questions.filter(q=>q.quran).length,154);
    assert.ok(!first.questions.some(q=>q.quran?.ruleId==='iqlab-noon.1'));assert.ok(first.excluded.sourceConflict>0);
    assert.ok(first.excluded.ambiguous>0);assert.equal(source.corpus.verse(1,1).number,1);assert.equal(source.corpus.verse(99,1).number,1);
    assert.ok(validateGenerated(first.questions,source,bank).every(v=>v.passed&&v.readiness==='EXPERT_REVIEW_REQUIRED'));
    const manifest={sourceVersion:source.sourceVersion,questionHashes:first.questions.map(questionHash).sort()};
    validateQuestionManifest(manifest,first.questions,source.sourceVersion);
    for(const invalid of [null,{}, {...manifest,sourceVersion:'changed'},{...manifest,questionHashes:manifest.questionHashes.slice(1)}])assert.throws(()=>validateQuestionManifest(invalid,first.questions,source.sourceVersion),/manifest mismatch/);
  });
  await t.test('every MCQ tests a sourced concept, never a verbatim section-recall template',()=>{
    const mcq=first.questions.filter(q=>q.type==='MULTIPLE_CHOICE');assert.equal(mcq.length,162);
    const prompts=new Set<string>();
    for(const q of mcq){assert.equal(q.generation!.method,'CONCEPT_APPLICATION_V1');assert.doesNotMatch(q.prompt,/menurut bagian|tercantum pada bagian/i);
      assert.ok(q.sources.some(s=>s.url?.startsWith('https://')));assert.ok(q.explanation.length>=80);
      const key=q.lessonId+':'+q.prompt.toLowerCase().replace(/\s+/g,' ');assert.ok(!prompts.has(key));prompts.add(key);}
    for(const lesson of lessonCatalog){assert.ok(new Set(source.cases[lesson.id].map(q=>q[6])).size>=2);}
    const cases=structuredClone(source.cases);cases.pengantar[0][1]='missing-objective';
    assert.throws(()=>generateCandidates({...source,cases}),/objective/);
    const recall=structuredClone(source.cases);recall.pengantar[0][2]='Menurut bagian ini, pernyataan mana yang tercantum pada bagian tersebut?';
    assert.throws(()=>generateCandidates({...source,cases:recall}),/scenario/);
    const refs=structuredClone(source.studies);refs[0].references[0].id='missing-reference';
    assert.throws(()=>generateCandidates({...source,studies:refs}),/reference/);
  });
  await t.test('source, key, distractor, explanation, provenance and Quran corruption fail closed',()=>{
    const q=first.questions[0],arabic=first.questions.find(q=>q.quran)!;
    const bad=[{...q,correctAnswer:'unknown'},{...q,explanation:''},{...q,generation:null},{...q,options:[q.options[0],q.options[0]]},
      {...q,generation:{...q.generation!,sourceVersion:'0'.repeat(64)}},{...arabic,quran:{...arabic.quran!,verseSha256:'0'.repeat(64)}},
      {...arabic,quran:{...arabic.quran!,start:-1}},{...q,lessonId:'missing'}];
    const results=validateGenerated(bad,source,bank);assert.ok(results.every(v=>!v.passed));
    assert.throws(()=>generateCandidates({...source,lessons:[{...source.lessons[0],id:'missing'}]}),/lesson/);
    assert.throws(()=>generateCandidates({...source,mapping:[{...source.mapping[0],lessonId:'missing'}]}),/mapping/);
    const changed=generateCandidates({...source,sourceVersion:sha256('changed source')},first.questions);
    assert.ok(changed.questions.every(q=>q.contentVersion===2));assert.ok(changed.questions.every(q=>!first.questions.some(old=>old.id===q.id)));
  });
  await t.test('DRAFT imports are repeatable and never overwrite review or quarantine',async()=>{
    const db=await assessmentDatabase();try{
      const local=new QuestionBankService(db,source.corpus,fixtureReviewers),lesson=first.questions.filter(q=>q.lessonId==='ikhfa-haqiqi');
      await local.import(lesson);await local.import(lesson);assert.equal(await db.getRepository(QuizQuestion).count(),lesson.length);assert.equal((await new QuizService(db,local).availability('ikhfa-haqiqi')).available,false);
      await assert.rejects(()=>local.publish(lesson[0].id,'missing'));
      const review={reviewerId:fixtureReviewers[0].id,reviewedAt:'2026-01-01T00:00:00Z',evidence:'Synthetic test only; not human review'};
      await local.publish(lesson[0].id,null,review);await local.import(lesson);assert.equal((await db.getRepository(QuizQuestion).findOneByOrFail({id:lesson[0].id})).reviewStatus,'PUBLISHED');
      const approved={...lesson[1],sourceApprovalId:'fixture-source-approval'},approval={id:'fixture-source-approval',sourceVersion:source.sourceVersion,questionHashes:[questionHash(approved)],reviewerId:fixtureReviewers[0].id,reviewedAt:'2026-01-01T00:00:00Z',evidence:'Synthetic isolated source approval fixture only'};
      const trusted=new QuestionBankService(db,source.corpus,fixtureReviewers,[approval]);await trusted.publish(approved.id,approval.id);
      const row=await db.getRepository(QuizQuestion).findOneByOrFail({id:approved.id});assert.equal(row.review,null);assert.equal(row.reviewStatus,'PUBLISHED');
      assert.equal(trusted.sourceVerified({...row,correctAnswer:'unknown'}),false);assert.equal(trusted.sourceVerified({...row,generation:{...row.generation!,sourceVersion:'0'.repeat(64)}}),false);
      await db.getRepository(QuizQuestion).update(approved.id,{suspended:true,moderation:{at:new Date().toISOString(),by:'fixture',reason:'Test'}});await local.import(lesson);
      assert.equal((await db.getRepository(QuizQuestion).findOneByOrFail({id:approved.id})).suspended,true);assert.ok(!(await trusted.eligible()).some(q=>q.id===approved.id));
    }finally{await db.destroy();}
  });
  await t.test('dry-run with --apply never writes candidates or connects to a database',()=>{
    const path=resolve('content/generated-candidates.json'),before=existsSync(path)?readFileSync(path,'utf8'):null;
    const output=execFileSync(process.execPath,['-r','ts-node/register','scripts/questions.ts','generate','--apply','--dry-run'],{cwd:process.cwd(),env:{...process.env,DATABASE_URL:'deliberately-invalid-no-connection'},encoding:'utf8',timeout:120000});
    assert.match(output,/Preview only/);assert.equal(existsSync(path)?readFileSync(path,'utf8'):null,before);
  });
  await t.test('explicit repository authorization pins exact versions and production scope without inventing expert review',async()=>{
    const db=await assessmentDatabase();try{
      const approval:RepositorySourceApproval={kind:'REPOSITORY_DETERMINISTIC',environment:'development',id:'test-repository-authorization',
        sourceVersion:source.sourceVersion,files:source.files,questionHashes:first.questions.map(questionHash),authorizedAt:'2026-01-01T00:00:00Z',
        authorization:'Isolated test only: simulate project-owner authorization',evidence:'Deterministic source generation test; not scientific approval'};
      const local=new QuestionBankService(db,source.corpus,[],[approval]),questions=first.questions.filter(q=>q.lessonId==='ikhfa-haqiqi');
      await local.import(questions);
      await local.publish(questions.map(q=>q.id),approval.id);
      assert.equal((await new QuizService(db,local).availability('ikhfa-haqiqi')).available,true);
      const row=await db.getRepository(QuizQuestion).findOneByOrFail({id:questions[0].id});assert.equal(row.review,null);
      assert.equal(local.sourceVerified(row),false);assert.equal(local.repositoryVerified(row),true);
      assert.equal(feedback(local.snapshot(row),row.id,row.correctAnswer).validation,'AUTOMATED_SOURCE');
      for(const changed of [{...row,explanation:'changed'}, {...row,sourceApprovalId:'unknown'}, {...row,contentVersion:row.contentVersion+1}])assert.ok(local.validate(changed).length);
      const damaged=new QuestionBankService(db,source.corpus,[],[{...approval,files:{...approval.files,'web/src/data/lessons.ts':'0'.repeat(64)}}]);assert.ok(damaged.validate(row).length);
      const oldEnvironment=process.env.NODE_ENV;try{
        process.env.NODE_ENV='production';
        assert.ok(local.validate(row).length);
        const production=new QuestionBankService(db,source.corpus,[],[{...approval,environment:'production'}]);
        assert.equal(production.repositoryVerified(row),true);
        assert.deepEqual(production.validate(row),[]);
      }finally{if(oldEnvironment===undefined)delete process.env.NODE_ENV;else process.env.NODE_ENV=oldEnvironment;}
      await db.getRepository(QuizQuestion).update(row.id,{suspended:true,moderation:{at:new Date().toISOString(),by:'test',reason:'Preserve strict quarantine'}});
      await assert.rejects(()=>local.publish(row.id,approval.id),/karantina/);await local.import(questions);
      assert.ok(!(await local.eligible()).some(q=>q.id===row.id));
      const draft=first.questions.find(q=>q.lessonId==='pengantar')!;await local.import([draft]);
      await assert.rejects(()=>local.publish([draft.id,row.id],approval.id),/karantina/);
      assert.equal((await db.getRepository(QuizQuestion).findOneByOrFail({id:draft.id})).reviewStatus,'DRAFT');
    }finally{await db.destroy();}
  });
});
