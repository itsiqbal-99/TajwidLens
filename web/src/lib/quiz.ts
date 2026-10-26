import type {PublicQuestion,QuestionFeedback,QuizAttemptView,QuizAvailability,DetectiveView,DetectiveAnswer,MistakeList} from '../../../shared/quiz';
import {lessonCatalog} from '@/data/lesson-catalog';
export type {PublicQuestion,QuestionFeedback,QuizAttemptView,QuizResult,QuizAvailability,DetectiveView,DetectiveAnswer,MistakeList} from '../../../shared/quiz';
const invalid=()=>new Error('Data evaluasi belum lengkap. Muat ulang atau coba lagi.');
const date=(value:unknown)=>typeof value==='string' && Number.isFinite(Date.parse(value));
const id=(value:unknown)=>typeof value==='string' && /^[0-9a-f-]{36}$/i.test(value);
export function validQuestion(q:PublicQuestion):boolean {
  if(!q || !id(q.id) || !['MULTIPLE_CHOICE','TAJWID_IDENTIFICATION'].includes(q.type) || typeof q.prompt!=='string' || !q.prompt.trim()
    || !Array.isArray(q.options) || q.options.length<2 || q.options.length>6 || q.options.some(o=>!o || typeof o.id!=='string' || typeof o.label!=='string')
    || new Set(q.options.map(o=>o.id)).size!==q.options.length) return false;
  if(q.verse===null)return q.type==='MULTIPLE_CHOICE';
  const v=q.verse;
  return !!v && typeof v.text==='string' && v.offsetUnit==='utf16' && typeof v.edition==='string' && Number.isInteger(v.surah) && v.surah>=1 && v.surah<=114
    && Number.isInteger(v.ayah) && v.ayah>0 && Number.isInteger(v.start) && Number.isInteger(v.end) && v.start>=0 && v.end>v.start && v.end<=v.text.length;
}
function validFeedback(q:QuestionFeedback) {
  return validQuestion(q) && id(q.questionId) && q.options.some(o=>o.id===q.correctOptionId) && q.options.some(o=>o.id===q.selectedOptionId)
    && q.correct===(q.correctOptionId===q.selectedOptionId) && typeof q.explanation==='string' && !!q.explanation.trim()
    && (q.validation===undefined || q.validation==='AUTOMATED_SOURCE')
    && Number.isInteger(q.contentVersion) && q.contentVersion>0 && Array.isArray(q.sources) && q.sources.length>0
    && q.sources.every(s=>s && typeof s.title==='string' && typeof s.location==='string' && (s.url===undefined || /^https:\/\//.test(s.url)));
}
export function readAvailability(value:unknown):QuizAvailability {
  const d=value as QuizAvailability;
  if(!d || !lessonCatalog.some(l=>l.id===d.lessonId) || d.requiredQuestions!==7 || !Number.isInteger(d.eligibleCount) || d.eligibleCount<0
    || typeof d.message!=='string' || !['AVAILABLE','INSUFFICIENT_PUBLISHED','MISSING_QUESTION_TYPES'].includes(d.reason)
    || d.available!==(d.reason==='AVAILABLE') || (d.available && d.eligibleCount<7) || (d.resumeAttemptId!==null && !id(d.resumeAttemptId)))throw invalid();
  return d;
}
export function readAttempt(value:unknown):QuizAttemptView {
  const d=value as QuizAttemptView;
  if(!d || !id(d.id) || !lessonCatalog.some(l=>l.id===d.lessonId) || !['LESSON_QUIZ','DETECTIVE','REPLAY'].includes(d.mode)
    || !['IN_PROGRESS','SUBMITTED','EXPIRED'].includes(d.status) || !date(d.createdAt) || !date(d.expiresAt)
    || !Array.isArray(d.questions) || d.questions.length!==(d.mode==='LESSON_QUIZ'?7:1) || new Set(d.questions.map(q=>q.id)).size!==d.questions.length
    || d.questions.some(q=>!validQuestion(q) || (q.selectedOptionId!==null && !q.options.some(o=>o.id===q.selectedOptionId))))throw invalid();
  const r=d.result;
  if(d.status!=='SUBMITTED'){if(r!==null || d.submittedAt!==null)throw invalid();}
  else if(!r || !date(d.submittedAt) || r.totalQuestions!==d.questions.length || !Number.isInteger(r.correctCount) || r.correctCount<0 || r.correctCount>r.totalQuestions
    || r.percentage!==Math.round(r.correctCount/r.totalQuestions*10000)/100 || r.passed!==(r.correctCount>=(d.mode==='LESSON_QUIZ'?6:1))
    || r.completionVerified!==(d.mode==='LESSON_QUIZ' && r.passed) || !Array.isArray(r.feedback) || r.feedback.length!==r.totalQuestions
    || r.feedback.some((q,i)=>!validFeedback(q) || q.id!==d.questions[i].id) || r.feedback.filter(q=>q.correct).length!==r.correctCount)throw invalid();
  return d;
}
export function readDetective(value:unknown):DetectiveView {
  const d=value as DetectiveView;
  if(!d || typeof d.available!=='boolean' || !['guest','account'].includes(d.storage) || typeof d.message!=='string'
    || (d.available ? !d.challenge || !validQuestion(d.challenge.question) || d.challenge.question.type!=='TAJWID_IDENTIFICATION' || typeof d.challenge.token!=='string' : d.challenge!==null))throw invalid();
  return d;
}
export function readDetectiveAnswer(value:unknown):DetectiveAnswer {
  const d=value as DetectiveAnswer;
  if(!d || !validFeedback(d.feedback) || typeof d.saved!=='boolean' || typeof d.needsReview!=='boolean' || (!d.saved && d.needsReview))throw invalid();
  return d;
}
export function readMistakes(value:unknown):MistakeList {
  const d=value as MistakeList;
  if(!d || !Number.isInteger(d.needsReviewCount) || d.needsReviewCount<0 || !Array.isArray(d.items) || d.items.length>20
    || (d.nextCursor!==null && typeof d.nextCursor!=='string') || d.items.some(i=>!id(i.id) || !lessonCatalog.some(l=>l.id===i.lessonId)
      || typeof i.conceptId!=='string' || typeof i.conceptLabel!=='string' || !['NEEDS_REVIEW','IMPROVED'].includes(i.status)
      || !date(i.lastMistakeAt) || (i.status==='IMPROVED' ? !date(i.improvedAt) : i.improvedAt!==null) || typeof i.practiceAvailable!=='boolean'))throw invalid();
  return d;
}
