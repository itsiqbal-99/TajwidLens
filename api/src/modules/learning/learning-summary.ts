import type { LearningDashboard, LessonMetadata } from '../../../../shared/learning';
import type { UserLessonProgress } from './learning.entity';
import type {LessonStatus} from '../../../../shared/learning';

export function learningStatus(row?:UserLessonProgress):LessonStatus {
  if(!row)return 'NOT_STARTED';
  if(row.status==='COMPLETED'&&row.completionSource==='QUIZ_VERIFIED')return 'COMPLETED';
  if(row.legacyCompletedAt)return 'AWAITING_QUIZ';
  return 'IN_PROGRESS';
}

export function buildLearningDashboard(catalog:readonly LessonMetadata[], records:readonly UserLessonProgress[],reviewConcepts=0):LearningDashboard {
  if (!catalog.length) throw new Error('Learning catalogue is missing');
  const ordered = [...catalog].sort((a,b)=>a.order-b.order);
  const known = new Set(ordered.map(lesson=>lesson.id));
  const rows = records.filter(row=>known.has(row.lessonId));
  const byId = new Map(rows.map(row=>[row.lessonId,row]));
  const completed = rows.filter(row=>learningStatus(row)==='COMPLETED');
  const legacy=rows.filter(row=>learningStatus(row)==='AWAITING_QUIZ');
  const last = [...rows].sort((a,b)=>b.lastAccessedAt.getTime()-a.lastAccessedAt.getTime() || a.lessonId.localeCompare(b.lessonId))[0];
  const remaining = (lesson:LessonMetadata)=>learningStatus(byId.get(lesson.id))!=='COMPLETED';
  let next = last && learningStatus(last)!=='COMPLETED' ? ordered.find(lesson=>lesson.id===last.lessonId) : undefined;
  if (!next && last) {
    const position = ordered.findIndex(lesson=>lesson.id===last.lessonId);
    next = ordered.slice(position+1).find(remaining);
  }
  next ??= ordered.find(remaining);
  return {
    summary:{totalLessons:ordered.length,completedLessons:completed.length,inProgressLessons:rows.filter(row=>learningStatus(row)==='IN_PROGRESS').length,legacyLessons:legacy.length,
      progressPercentage:Math.round(completed.length/ordered.length*10000)/100},
    continueLearning:next ? {lessonId:next.id,title:next.title,category:next.category,summary:next.summary,href:`/learn/${next.slug}/`} : null,
    lastAccessedLessonId:last?.lessonId ?? null,
    completedLessons:[...completed].sort((a,b)=>b.completedAt!.getTime()-a.completedAt!.getTime()).map(row=>{
      const lesson = ordered.find(item=>item.id===row.lessonId)!;
      return {lessonId:lesson.id,title:lesson.title,href:`/learn/${lesson.slug}/`,completedAt:row.completedAt!.toISOString()};
    }),
    allCompleted:completed.length===ordered.length,
    lessonStates:ordered.map(lesson=>({lessonId:lesson.id,status:learningStatus(byId.get(lesson.id))})),
    legacyLessons:legacy.map(row=>{const lesson=ordered.find(lesson=>lesson.id===row.lessonId)!;return {lessonId:lesson.id,title:lesson.title,href:`/learn/${lesson.slug}/`,studiedAt:row.legacyCompletedAt!.toISOString()};}),
    reviewConcepts,
  };
}
