import type { LearningDashboard, LessonMetadata } from '../../../../shared/learning';
import type { UserLessonProgress } from './learning.entity';

export function buildLearningDashboard(catalog:readonly LessonMetadata[], records:readonly UserLessonProgress[]):LearningDashboard {
  if (!catalog.length) throw new Error('Learning catalogue is missing');
  const ordered = [...catalog].sort((a,b)=>a.order-b.order);
  const known = new Set(ordered.map(lesson=>lesson.id));
  const rows = records.filter(row=>known.has(row.lessonId));
  const byId = new Map(rows.map(row=>[row.lessonId,row]));
  const completed = rows.filter(row=>row.status==='COMPLETED');
  const last = [...rows].sort((a,b)=>b.lastAccessedAt.getTime()-a.lastAccessedAt.getTime() || a.lessonId.localeCompare(b.lessonId))[0];
  const remaining = (lesson:LessonMetadata)=>byId.get(lesson.id)?.status!=='COMPLETED';
  let next = last && last.status!=='COMPLETED' ? ordered.find(lesson=>lesson.id===last.lessonId) : undefined;
  if (!next && last) {
    const position = ordered.findIndex(lesson=>lesson.id===last.lessonId);
    next = ordered.slice(position+1).find(remaining);
  }
  next ??= ordered.find(remaining);
  return {
    summary:{totalLessons:ordered.length,completedLessons:completed.length,inProgressLessons:rows.filter(row=>row.status==='IN_PROGRESS').length,
      progressPercentage:Math.round(completed.length/ordered.length*10000)/100},
    continueLearning:next ? {lessonId:next.id,title:next.title,category:next.category,summary:next.summary,href:`/learn/${next.slug}/`} : null,
    lastAccessedLessonId:last?.lessonId ?? null,
    completedLessons:[...completed].sort((a,b)=>b.completedAt!.getTime()-a.completedAt!.getTime()).map(row=>{
      const lesson = ordered.find(item=>item.id===row.lessonId)!;
      return {lessonId:lesson.id,title:lesson.title,href:`/learn/${lesson.slug}/`,completedAt:row.completedAt!.toISOString()};
    }),
    allCompleted:completed.length===ordered.length,
    lessonStates:ordered.map(lesson=>({lessonId:lesson.id,status:byId.get(lesson.id)?.status ?? 'NOT_STARTED'})),
  };
}
