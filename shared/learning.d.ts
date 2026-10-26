export interface LessonMetadata { id:string; slug:string; title:string; category:string; summary:string; order:number }
export type LessonStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'AWAITING_QUIZ' | 'COMPLETED';
export type CompletionSource = 'LEGACY_SELF_REPORTED'|'QUIZ_VERIFIED'|null;
export interface LessonProgress {
  lessonId:string; status:LessonStatus; startedAt:string|null; completedAt:string|null;
  lastAccessedAt:string|null; updatedAt:string|null;
  completionSource:CompletionSource;legacyCompletedAt:string|null;
}
export interface LearningSummary { totalLessons:number; completedLessons:number; inProgressLessons:number; legacyLessons:number; progressPercentage:number }
export interface ContinueLesson { lessonId:string; title:string; category:string; summary:string; href:string }
export interface CompletedLesson { lessonId:string; title:string; href:string; completedAt:string }
export interface LegacyLesson {lessonId:string;title:string;href:string;studiedAt:string}
export interface LearningDashboard {
  summary:LearningSummary; continueLearning:ContinueLesson|null; lastAccessedLessonId:string|null;
  completedLessons:CompletedLesson[]; allCompleted:boolean;
  lessonStates:{lessonId:string;status:LessonStatus}[];
  legacyLessons:LegacyLesson[];reviewConcepts:number;
}
