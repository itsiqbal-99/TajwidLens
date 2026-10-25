import {test} from 'node:test';
import assert from 'node:assert/strict';
import {lessonCatalog} from '../src/modules/learning/catalog';
import {buildLearningDashboard} from '../src/modules/learning/learning-summary';
import {UserLessonProgress} from '../src/modules/learning/learning.entity';
import {LearningProgress1792886400000} from '../src/database/1792886400000-LearningProgress';
import type {QueryRunner} from 'typeorm';

const record=(lessonId:string,status:'IN_PROGRESS'|'COMPLETED',time:number):UserLessonProgress=>({id:lessonId,userId:'test',lessonId,status,
  startedAt:new Date(time),lastAccessedAt:new Date(time),completedAt:status==='COMPLETED'?new Date(time):null,createdAt:new Date(time),updatedAt:new Date(time)} as UserLessonProgress);
test('catalogue keeps 24 stable, unique identifiers and current lesson routes',()=>{
  assert.equal(lessonCatalog.length,24);assert.equal(new Set(lessonCatalog.map(l=>l.id)).size,24);
  assert.equal(lessonCatalog[0].id,'pengantar');assert.equal(lessonCatalog.at(-1)!.id,'tafkhim-tarqiq');
});
test('new learner has real zero progress, first lesson and no seeded records',()=>{
  const result=buildLearningDashboard(lessonCatalog,[]);
  assert.deepEqual(result.summary,{totalLessons:24,completedLessons:0,inProgressLessons:0,progressPercentage:0});
  assert.equal(result.continueLearning?.lessonId,'pengantar');assert.equal(result.allCompleted,false);
  assert.equal(result.lessonStates.length,24);assert.ok(result.lessonStates.every(row=>row.status==='NOT_STARTED'));
});
test('only completed lessons count; six of twenty-four is 25 percent',()=>{
  const rows=lessonCatalog.slice(0,6).map((l,i)=>record(l.id,'COMPLETED',i));rows.push(record('ikhfa-haqiqi','IN_PROGRESS',10));
  const result=buildLearningDashboard(lessonCatalog,rows);
  assert.equal(result.summary.progressPercentage,25);assert.equal(result.summary.completedLessons,6);assert.equal(result.summary.inProgressLessons,1);
  assert.equal(result.continueLearning?.lessonId,'ikhfa-haqiqi');
  assert.equal(result.lessonStates.filter(row=>row.status==='COMPLETED').length,6);
  assert.equal(result.lessonStates.find(row=>row.lessonId==='ikhfa-haqiqi')?.status,'IN_PROGRESS');
});
test('resume latest incomplete lesson even when the learner skips ahead',()=>{
  const result=buildLearningDashboard(lessonCatalog,[record('pengantar','IN_PROGRESS',1),record('mad-lazim','IN_PROGRESS',2)]);
  assert.equal(result.continueLearning?.lessonId,'mad-lazim');
});
test('completed last lesson advances in catalogue order then wraps to skipped lessons',()=>{
  assert.equal(buildLearningDashboard(lessonCatalog,[record('ikhfa-haqiqi','COMPLETED',1)]).continueLearning?.lessonId,'izhar-halqi');
  assert.equal(buildLearningDashboard(lessonCatalog,[record('tafkhim-tarqiq','COMPLETED',1)]).continueLearning?.lessonId,'pengantar');
});
test('all complete is exactly 100 percent with no invalid next lesson',()=>{
  const result=buildLearningDashboard(lessonCatalog,lessonCatalog.map((l,i)=>record(l.id,'COMPLETED',i)));
  assert.equal(result.summary.progressPercentage,100);assert.equal(result.continueLearning,null);assert.equal(result.allCompleted,true);
});
test('metadata reordering preserves stable references; removed metadata never counts',()=>{
  const result=buildLearningDashboard([...lessonCatalog].reverse(),[record('removed-lesson','COMPLETED',5)]);
  assert.equal(result.summary.completedLessons,0);assert.equal(result.lastAccessedLessonId,null);assert.equal(result.continueLearning?.lessonId,'pengantar');
  assert.throws(()=>buildLearningDashboard([],[]),/catalogue is missing/);
});
test('empty rollback only drops the phase-owned progress table',async()=>{
  const calls:string[]=[];
  const runner={query:async(sql:string)=>{calls.push(sql);return [{count:0}];}} as unknown as QueryRunner;
  await new LearningProgress1792886400000().down(runner);
  assert.deepEqual(calls,['LOCK TABLE user_lesson_progress IN ACCESS EXCLUSIVE MODE','SELECT COUNT(*) AS count FROM user_lesson_progress','DROP TABLE user_lesson_progress']);
  const nonempty:string[]=[];
  const populated={query:async(sql:string)=>{nonempty.push(sql);return [{count:1}];}} as unknown as QueryRunner;
  await assert.rejects(()=>new LearningProgress1792886400000().down(populated),/Rollback refused/);
  assert.equal(nonempty.some(sql=>sql.startsWith('DROP')),false);
});
