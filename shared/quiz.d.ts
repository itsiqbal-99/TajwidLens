export type QuestionType = 'MULTIPLE_CHOICE'|'TAJWID_IDENTIFICATION';
export type AttemptMode = 'LESSON_QUIZ'|'DETECTIVE'|'REPLAY';
export type QuestionOption = {id:string;label:string};
export type SourceReference = {title:string;location:string;url?:string};
export interface QuestionVerse {
  surah:number;ayah:number;text:string;start:number;end:number;offsetUnit:'utf16';edition:string;
}
export interface PublicQuestion {
  id:string;type:QuestionType;prompt:string;options:QuestionOption[];verse:QuestionVerse|null;
}
export interface QuestionFeedback extends PublicQuestion {
  questionId:string;
  selectedOptionId:string;correctOptionId:string;correct:boolean;explanation:string;sources:SourceReference[];contentVersion:number;
  validation?:'AUTOMATED_SOURCE';
}
export interface QuizResult {
  correctCount:number;totalQuestions:number;percentage:number;passed:boolean;
  completionVerified:boolean;feedback:QuestionFeedback[];
}
export interface QuizAttemptView {
  id:string;lessonId:string;mode:AttemptMode;status:'IN_PROGRESS'|'SUBMITTED'|'EXPIRED';
  createdAt:string;expiresAt:string;submittedAt:string|null;
  questions:(PublicQuestion & {selectedOptionId:string|null})[];result:QuizResult|null;
}
export interface QuizAvailability {
  lessonId:string;available:boolean;eligibleCount:number;requiredQuestions:7;
  reason:'AVAILABLE'|'INSUFFICIENT_PUBLISHED'|'MISSING_QUESTION_TYPES';message:string;
  resumeAttemptId:string|null;
}
export interface DetectiveView {
  available:boolean;storage:'guest'|'account';message:string;
  challenge:{token:string;question:PublicQuestion}|null;
}
export interface DetectiveAnswer {feedback:QuestionFeedback;saved:boolean;needsReview:boolean;reporting:{attemptId:string}|{token:string}|null}
export interface MistakeItem {
  id:string;lessonId:string;conceptId:string;conceptLabel:string;
  status:'NEEDS_REVIEW'|'IMPROVED';lastMistakeAt:string;improvedAt:string|null;practiceAvailable:boolean;
}
export interface MistakeList {needsReviewCount:number;items:MistakeItem[];nextCursor:string|null}
