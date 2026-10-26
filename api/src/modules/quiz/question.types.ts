import type {QuestionType,QuestionOption,QuestionVerse,SourceReference} from '../../../../shared/quiz';

export interface Reviewer {id:string;name:string;qualification:string;evidence:string}
export interface ReviewProvenance {reviewerId:string;reviewedAt:string;evidence:string}
export interface GenerationProvenance {
  method:'LESSON_FIELD_V1'|'ANNOTATION_V1';templateVersion:1;sourceVersion:string;
  sourcePath:string;sourceSha256:string;sourceField:string;sourceValueSha256:string;
  mappingSha256:string;annotationSource?:{provider:string;commit:string;payloadSha256:string;confidence:'NOT_PROVIDED'};
  validation:{status:'VALIDATION_PASSED';checks:string[]};
}
export interface ExpertSourceApproval {
  id:string;sourceVersion:string;questionHashes:string[];reviewerId:string;reviewedAt:string;evidence:string;
}
export interface RepositorySourceApproval {
  kind:'REPOSITORY_DETERMINISTIC';environment:'development';id:string;sourceVersion:string;questionHashes:string[];
  authorizedAt:string;authorization:string;files:Record<string,string>;evidence:string;
}
export type SourceApproval=ExpertSourceApproval|RepositorySourceApproval;
export interface QuranReference {
  surah:number;ayah:number;start:number;end:number;offsetUnit:'utf16';
  corpusVersion:string;editionSha256:string;verseSha256:string;annotationId:string;ruleId:string;
}
export interface QuestionContent {
  id:string;stableId:string;contentVersion:number;lessonId:string;conceptId:string;conceptLabel:string;
  type:QuestionType;prompt:string;options:QuestionOption[];correctAnswer:string;explanation:string;
  sources:SourceReference[];quran:QuranReference|null;
  reviewStatus:'DRAFT'|'REVIEWED'|'PUBLISHED';review:ReviewProvenance|null;
  generation?:GenerationProvenance|null;sourceApprovalId?:string|null;
}
export interface QuestionSnapshot {
  questionId:string;stableId:string;contentVersion:number;contentHash:string;lessonId:string;
  conceptId:string;conceptLabel:string;type:QuestionType;prompt:string;options:QuestionOption[];
  correctAnswer:string;explanation:string;sources:SourceReference[];verse:QuestionVerse|null;
  review:ReviewProvenance|null;generation?:GenerationProvenance|null;sourceApprovalId?:string|null;
}
export const QUESTION_REVIEWERS=Symbol('QUESTION_REVIEWERS');
export const SOURCE_APPROVALS=Symbol('SOURCE_APPROVALS');
export const DETECTIVE_KEY=Symbol('DETECTIVE_KEY');
