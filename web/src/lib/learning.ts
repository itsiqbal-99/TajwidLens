import type { LearningDashboard, LessonProgress } from '../../../shared/learning';
import { lessonCatalog } from '@/data/lesson-catalog';

export type { LearningDashboard, LessonProgress, LessonStatus } from '../../../shared/learning';
export const lessonStatusLabel={NOT_STARTED:'Belum mulai',IN_PROGRESS:'Sedang dipelajari',AWAITING_QUIZ:'Menunggu quiz',COMPLETED:'Lulus evaluasi'} as const;
const date = (value:unknown)=>typeof value==='string' && Number.isFinite(Date.parse(value));
const invalid = ()=>new Error('Data progres belum lengkap atau berbeda versi. Muat ulang lalu coba lagi.');

export function readLearningDashboard(value:unknown):LearningDashboard {
  const data=value as LearningDashboard|null;
  const summary=data?.summary;
  if (!summary || summary.totalLessons<1 || summary.totalLessons!==lessonCatalog.length || !Number.isInteger(summary.completedLessons)
    || !Number.isInteger(summary.inProgressLessons) || !Number.isInteger(summary.legacyLessons) || summary.legacyLessons<0 || summary.completedLessons<0 || summary.inProgressLessons<0
    || summary.completedLessons+summary.inProgressLessons+summary.legacyLessons>summary.totalLessons || !Number.isFinite(summary.progressPercentage)
    || Math.abs(summary.progressPercentage-Math.round(summary.completedLessons/summary.totalLessons*10000)/100)>.001
    || !Array.isArray(data.completedLessons) || data.completedLessons.length!==summary.completedLessons
    || data.allCompleted!==(summary.completedLessons===summary.totalLessons)) throw invalid();
  const completed=new Set<string>();
  for(const row of data.completedLessons) {
    const lesson=lessonCatalog.find(item=>item.id===row.lessonId);
    if(!lesson || typeof row.title!=='string' || !row.title.trim() || row.href!==`/learn/${lesson.slug}/` || !date(row.completedAt) || completed.has(row.lessonId)) throw invalid();
    completed.add(row.lessonId);
  }
  const next=data.continueLearning;
  const lesson=next && lessonCatalog.find(item=>item.id===next.lessonId);
  if (data.allCompleted ? next!==null : !lesson || next!.href!==`/learn/${lesson.slug}/` || completed.has(next!.lessonId)
    || typeof next!.title!=='string' || typeof next!.summary!=='string' || typeof next!.category!=='string') throw invalid();
  if(data.lastAccessedLessonId!==null && !lessonCatalog.some(item=>item.id===data.lastAccessedLessonId)) throw invalid();
  if(!Array.isArray(data.lessonStates) || data.lessonStates.length!==lessonCatalog.length)throw invalid();
  if(!Array.isArray(data.legacyLessons) || data.legacyLessons.length!==summary.legacyLessons || !Number.isInteger(data.reviewConcepts) || data.reviewConcepts<0)throw invalid();
  const legacy=new Set<string>();
  for(const row of data.legacyLessons){
    const lesson=lessonCatalog.find(item=>item.id===row.lessonId);
    if(!lesson || row.title!==lesson.title || row.href!==`/learn/${lesson.slug}/` || !date(row.studiedAt) || legacy.has(row.lessonId) || completed.has(row.lessonId))throw invalid();
    legacy.add(row.lessonId);
  }
  const seen=new Set<string>();let inProgress=0;
  for(const row of data.lessonStates){
    if(!row || !lessonCatalog.some(item=>item.id===row.lessonId) || seen.has(row.lessonId) || !Object.hasOwn(lessonStatusLabel,row.status)
      || (row.status==='COMPLETED')!==completed.has(row.lessonId) || (row.status==='AWAITING_QUIZ')!==legacy.has(row.lessonId))throw invalid();
    seen.add(row.lessonId);if(row.status==='IN_PROGRESS')inProgress++;
  }
  if(inProgress!==summary.inProgressLessons)throw invalid();
  return data;
}

export function readLessonProgressList(value:unknown):LessonProgress[] {
  const data=value as {lessons?:LessonProgress[]}|null;
  if(!Array.isArray(data?.lessons) || data.lessons.length!==lessonCatalog.length)throw invalid();
  const seen=new Set<string>();
  for(const row of data.lessons){
    if(!row || !lessonCatalog.some(item=>item.id===row.lessonId) || seen.has(row.lessonId))throw invalid();
    seen.add(row.lessonId);
    if(row.status==='NOT_STARTED'){
      if([row.startedAt,row.completedAt,row.lastAccessedAt,row.updatedAt,row.completionSource,row.legacyCompletedAt].some(value=>value!==null))throw invalid();
    } else readLessonProgress(row,row.lessonId);
  }
  return data.lessons;
}

export function readLessonProgress(value:unknown,lessonId:string):LessonProgress {
  const data=value as LessonProgress|null;
  if(!data || data.lessonId!==lessonId || !['IN_PROGRESS','AWAITING_QUIZ','COMPLETED'].includes(data.status)
    || !date(data.startedAt) || !date(data.lastAccessedAt) || !date(data.updatedAt)
    || (data.legacyCompletedAt!==null && !date(data.legacyCompletedAt))
    || (data.status==='COMPLETED' ? !date(data.completedAt) || data.completionSource!=='QUIZ_VERIFIED' : data.completedAt!==null)
    || (data.status==='AWAITING_QUIZ' && (data.completionSource!=='LEGACY_SELF_REPORTED' || !date(data.legacyCompletedAt)))
    || (data.status==='IN_PROGRESS' && (data.completionSource!==null || data.legacyCompletedAt!==null))) throw invalid();
  return data;
}
