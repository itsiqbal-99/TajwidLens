import {expect,it} from 'vitest';
import {readLearningDashboard,readLessonProgress,readLessonProgressList} from './learning';
import {lessonCatalog} from '@/data/lesson-catalog';
import {lessons} from '@/data/lessons';

const initial={summary:{totalLessons:lessonCatalog.length,completedLessons:0,inProgressLessons:0,legacyLessons:0,progressPercentage:0},
  continueLearning:{lessonId:lessonCatalog[0].id,title:lessonCatalog[0].title,category:lessonCatalog[0].category,summary:lessonCatalog[0].summary,href:`/learn/${lessonCatalog[0].slug}/`},
  legacyLessons:[],reviewConcepts:0,completedLessons:[],lastAccessedLessonId:null,allCompleted:false,
  lessonStates:lessonCatalog.map(l=>({lessonId:l.id,status:'NOT_STARTED'}))};
it('frontend lesson content uses the same stable catalogue and order as the API',()=>{
  expect(lessons.map(l=>({id:l.id,slug:l.slug,title:l.title,category:l.category,summary:l.summary,order:l.order}))).toEqual(lessonCatalog);
  expect(lessons).toHaveLength(24);
});
it('accepts a real empty learner response, not missing/partial/error payloads',()=>{
  expect(readLearningDashboard(initial)).toEqual(initial);
  for(const data of [null,{}, {summary:initial.summary}, {...initial,summary:{...initial.summary,progressPercentage:NaN}}, {...initial,summary:{...initial.summary,totalLessons:0}}, {...initial,continueLearning:null}, {...initial,lastAccessedLessonId:'missing'}, {...initial,continueLearning:{...initial.continueLearning,href:'https://evil.test/'}}]) expect(()=>readLearningDashboard(data)).toThrow();
});
it('validates counts and completion state without inventing zero on errors',()=>{
  const completed=lessonCatalog.map(l=>({lessonId:l.id,title:l.title,href:`/learn/${l.slug}/`,completedAt:'2026-10-25T00:00:00Z'}));
  expect(readLearningDashboard({...initial,summary:{totalLessons:24,completedLessons:24,inProgressLessons:0,legacyLessons:0,progressPercentage:100},completedLessons:completed,continueLearning:null,allCompleted:true,lessonStates:lessonCatalog.map(l=>({lessonId:l.id,status:'COMPLETED'}))}).allCompleted).toBe(true);
  expect(()=>readLearningDashboard({...initial,summary:{totalLessons:24,completedLessons:24,inProgressLessons:0,legacyLessons:0,progressPercentage:100},completedLessons:completed.map(row=>({...row,title:undefined})),continueLearning:null,allCompleted:true})).toThrow();
  expect(()=>readLearningDashboard({...initial,summary:{...initial.summary,completedLessons:1}})).toThrow();
  expect(()=>readLearningDashboard({...initial,summary:{...initial.summary,inProgressLessons:25}})).toThrow();
});
it('rejects missing, duplicate or inconsistent lesson map statuses',()=>{
  for(const lessonStates of [[],initial.lessonStates.slice(1),[...initial.lessonStates.slice(1),initial.lessonStates[1]],initial.lessonStates.map(l=>({...l,status:'COMPLETED'})),initial.lessonStates.map(l=>({...l,status:'INVALID'}))])expect(()=>readLearningDashboard({...initial,lessonStates})).toThrow();
});
it('validates library progress without turning unavailable data into not-started',()=>{
  const lessons=lessonCatalog.map(l=>({lessonId:l.id,status:'NOT_STARTED',completionSource:null,legacyCompletedAt:null,startedAt:null,completedAt:null,lastAccessedAt:null,updatedAt:null}));
  expect(readLessonProgressList({lessons})).toHaveLength(24);
  for(const value of [null,{}, {lessons:[]},{lessons:[...lessons.slice(1),lessons[1]]},{lessons:lessons.map(l=>({...l,status:'COMPLETED'}))}])expect(()=>readLessonProgressList(value)).toThrow();
});
it('accepts completion only after a consistent server response',()=>{
  const row={lessonId:'pengantar',status:'COMPLETED',completionSource:'QUIZ_VERIFIED',legacyCompletedAt:null,startedAt:'2026-10-25T00:00:00Z',completedAt:'2026-10-25T01:00:00Z',lastAccessedAt:'2026-10-25T01:00:00Z',updatedAt:'2026-10-25T01:00:00Z'};
  expect(readLessonProgress(row,'pengantar').status).toBe('COMPLETED');
  for(const data of [null,{}, {...row,lessonId:'different'}, {...row,completedAt:null}, {...row,status:'IN_PROGRESS'}]) expect(()=>readLessonProgress(data,'pengantar')).toThrow();
});
it('keeps legacy dates separate and rejects legacy progress presented as verified',()=>{
  const row={lessonId:'pengantar',status:'AWAITING_QUIZ',completionSource:'LEGACY_SELF_REPORTED',legacyCompletedAt:'2026-01-01T00:00:00Z',startedAt:'2026-01-01T00:00:00Z',completedAt:null,lastAccessedAt:'2026-10-25T00:00:00Z',updatedAt:'2026-10-25T00:00:00Z'};
  expect(readLessonProgress(row,'pengantar').status).toBe('AWAITING_QUIZ');
  expect(()=>readLessonProgress({...row,status:'COMPLETED',completedAt:row.legacyCompletedAt},'pengantar')).toThrow();
  expect(()=>readLearningDashboard({...initial,summary:{...initial.summary,legacyLessons:1}})).toThrow();
  const lesson=lessonCatalog[2];
  expect(readLearningDashboard({...initial,summary:{...initial.summary,legacyLessons:1},legacyLessons:[{lessonId:lesson.id,title:lesson.title,href:`/learn/${lesson.slug}/`,studiedAt:row.legacyCompletedAt}],lessonStates:initial.lessonStates.map(l=>l.lessonId===lesson.id?{...l,status:'AWAITING_QUIZ'}:l)}).summary.completedLessons).toBe(0);
});
