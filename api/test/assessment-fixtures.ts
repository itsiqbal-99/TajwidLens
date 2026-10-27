import 'reflect-metadata';
import {randomBytes,randomUUID} from 'node:crypto';
import {DataSource} from 'typeorm';
import {newDb,DataType} from 'pg-mem';
import {Test} from '@nestjs/testing';
import {ThrottlerModule,ThrottlerGuard} from '@nestjs/throttler';
import {APP_GUARD} from '@nestjs/core';
import {appEntities,appMigrations} from '../src/database/schema';
import {QuizCorpus,sha256} from '../src/modules/quiz/corpus';
import {QuizQuestion} from '../src/modules/quiz/quiz.entity';
import {QUESTION_REVIEWERS,SOURCE_APPROVALS,QuestionContent,SourceApproval} from '../src/modules/quiz/question.types';
import {QuestionBankService} from '../src/modules/quiz/question-bank.service';
import {QuizService} from '../src/modules/quiz/quiz.service';
import {DetectiveService,DETECTIVE_KEY} from '../src/modules/quiz/detective.service';
import {ReviewService} from '../src/modules/quiz/review.service';
import {OptionalSessionGuard} from '../src/modules/quiz/optional-session.guard';
import {QuizController,DetectiveController,ReviewController} from '../src/modules/quiz/quiz.controller';
import {AuthController} from '../src/modules/auth/auth.controller';
import {AuthService} from '../src/modules/auth/auth.service';
import {GoogleService} from '../src/modules/auth/google.service';
import {Mailer} from '../src/modules/auth/mailer.service';
import {SessionGuard} from '../src/modules/auth/session.guard';
import {UsersController} from '../src/modules/users/users.controller';
import {UsersService} from '../src/modules/users/users.service';
import {LearningController} from '../src/modules/learning/learning.controller';
import {LearningService} from '../src/modules/learning/learning.service';
import {CONFIG,AppConfig} from '../src/config/config';
import {setup} from '../src/common/setup';
import {FeedbackService} from '../src/modules/quiz/feedback.service';
import {FeedbackController} from '../src/modules/quiz/feedback.controller';

// Synthetic test authority only. This registry is never imported by the application module.
export const fixtureReviewers=[{id:'test-only-reviewer',name:'Synthetic reviewer fixture',qualification:'Test double; not a scientific tajwid review',evidence:'Isolated automated test only'}];

export async function assessmentDatabase(migrations=appMigrations) {
  const memory=newDb();
  memory.public.registerFunction({name:'current_database',returns:DataType.text,implementation:()=> 'assessment_test'});
  memory.public.registerFunction({name:'version',returns:DataType.text,implementation:()=> 'PostgreSQL 16'});
  memory.public.registerFunction({name:'gen_random_uuid',returns:DataType.uuid,impure:true,implementation:randomUUID});
  memory.public.registerFunction({name:'clock_timestamp',returns:DataType.timestamptz,impure:true,implementation:()=>new Date()});
  memory.public.registerFunction({name:'greatest',args:[DataType.timestamptz,DataType.timestamptz],returns:DataType.timestamptz,implementation:(a:Date,b:Date)=>a>b?a:b});
  memory.public.registerFunction({name:'jsonb_typeof',args:[DataType.jsonb],returns:DataType.text,implementation:(value:unknown)=>value===null?'null':Array.isArray(value)?'array':typeof value});
  memory.public.registerFunction({name:'jsonb_array_length',args:[DataType.jsonb],returns:DataType.integer,implementation:(value:unknown[])=>value.length});
  memory.public.registerFunction({name:'char_length',args:[DataType.text],returns:DataType.integer,implementation:(value:string)=>[...value].length});
  const db:DataSource=memory.adapters.createTypeormDataSource({type:'postgres',entities:appEntities,migrations,synchronize:false});
  await db.initialize();await db.runMigrations();return db;
}
export function fixtureQuestions(lessonId='pengantar',count=14):QuestionContent[] {
  const corpus=new QuizCorpus(),index=corpus.metadata(),verse=corpus.verse(113,2),annotation=verse.annotations.find(item=>item.id==='113:2:1')!;
  return Array.from({length:count},(_,i)=>({id:randomUUID(),stableId:'fixture-'+lessonId+'-'+i,contentVersion:1,lessonId,
    conceptId:'fixture-concept-'+(i%3),conceptLabel:'Konsep fixture '+(i%3),type:i%2?'TAJWID_IDENTIFICATION':'MULTIPLE_CHOICE',
    prompt:'[DATA UJI — BUKAN SOAL TERVALIDASI] Pilih opsi fixture untuk pertanyaan '+(i+1)+'.',
    options:['a','b','c','d'].map(id=>({id,label:'Pilihan fixture '+id.toUpperCase()})),correctAnswer:['a','b','c','d'][i%4],
    explanation:'Pembahasan fixture pengujian. Ini bukan penjelasan tajwid untuk publikasi.',
    sources:[{title:'Synthetic test source',location:'Isolated automated testing only',url:'https://example.test/fixture'}],
    quran:i%2?{surah:113,ayah:2,start:annotation.start,end:annotation.end,offsetUnit:'utf16',corpusVersion:index.source.corpusVersion,
      editionSha256:index.source.displayEditionSha256,verseSha256:sha256(verse.text),annotationId:annotation.id,ruleId:annotation.ruleId}:null,
    reviewStatus:'PUBLISHED',review:{reviewerId:fixtureReviewers[0].id,reviewedAt:new Date(Date.now()-86400000).toISOString(),evidence:'Test fixture only — no human scientific review claimed'},
  }));
}
export async function seedFixtureBank(db:DataSource,lessonId='pengantar',count=14) {
  const questions=fixtureQuestions(lessonId,count);await db.getRepository(QuizQuestion).save(questions);return questions;
}
export async function assessmentApp(db:DataSource,config:AppConfig,approvals:readonly SourceApproval[]=[]) {
  const module=await Test.createTestingModule({imports:[ThrottlerModule.forRoot([{ttl:60000,limit:500}])],
    controllers:[AuthController,UsersController,LearningController,QuizController,DetectiveController,ReviewController,FeedbackController],
    providers:[AuthService,GoogleService,UsersService,SessionGuard,OptionalSessionGuard,LearningService,QuizCorpus,QuestionBankService,QuizService,DetectiveService,ReviewService,FeedbackService,
      {provide:APP_GUARD,useClass:ThrottlerGuard},{provide:DataSource,useValue:db},{provide:CONFIG,useValue:config},
      {provide:QUESTION_REVIEWERS,useValue:fixtureReviewers},{provide:SOURCE_APPROVALS,useValue:approvals},{provide:DETECTIVE_KEY,useValue:randomBytes(32)}, {provide:Mailer,useValue:{}}]}).compile();
  const app=module.createNestApplication();setup(app,config);await app.init();return {app,module};
}
