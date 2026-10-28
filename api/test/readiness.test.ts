import assert from 'node:assert/strict';
import test from 'node:test';
import {DataSource} from 'typeorm';
import {ReadinessService} from '../src/common/readiness.service';
import {lessonCatalog} from '../src/modules/learning/catalog';
import {QuestionBankService} from '../src/modules/quiz/question-bank.service';
import {QuizCorpus} from '../src/modules/quiz/corpus';

const questions=lessonCatalog.flatMap(lesson=>Array.from({length:7},(_,index)=>({lessonId:lesson.id,type:index===0?'TAJWID_IDENTIFICATION':'MULTIPLE_CHOICE'})));

test('readiness requires current migrations, corpus and complete public question coverage',async()=>{
  const db={query:async()=>[{ok:1}],showMigrations:async()=>false} as unknown as DataSource;
  const corpus={verse:()=>({number:1})} as unknown as QuizCorpus;
  const ready=new ReadinessService(db,{eligible:async()=>questions} as unknown as QuestionBankService,corpus);
  assert.deepEqual(await ready.check(),{status:'ready',lessonsReady:24,detectiveReady:true});

  const pending=new ReadinessService({...db,showMigrations:async()=>true} as DataSource,{eligible:async()=>questions} as unknown as QuestionBankService,corpus);
  await assert.rejects(()=>pending.check(),/Deployment belum siap/);
});
