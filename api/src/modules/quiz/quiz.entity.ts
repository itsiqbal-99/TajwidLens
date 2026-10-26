import {Column,Entity,Index,JoinColumn,ManyToOne,PrimaryColumn,PrimaryGeneratedColumn,Unique} from 'typeorm';
import {User} from '../users/user.entity';
import type {AttemptMode,QuestionType,QuestionOption,SourceReference} from '../../../../shared/quiz';
import type {QuestionContent,QuranReference,ReviewProvenance,QuestionSnapshot,GenerationProvenance} from './question.types';

@Entity('quiz_questions')
@Unique('quiz_question_stable_version',['stableId','contentVersion'])
@Index('quiz_question_lesson_status',['lessonId','reviewStatus'])
export class QuizQuestion implements QuestionContent {
  @PrimaryColumn('uuid') id!:string;
  @Column('varchar',{length:100}) stableId!:string;
  @Column('int') contentVersion!:number;
  @Column('varchar',{length:80}) lessonId!:string;
  @Column('varchar',{length:100}) conceptId!:string;
  @Column('varchar',{length:200}) conceptLabel!:string;
  @Column('varchar',{length:30}) type!:QuestionType;
  @Column('text') prompt!:string;
  @Column('jsonb') options!:QuestionOption[];
  @Column('varchar',{length:50}) correctAnswer!:string;
  @Column('text') explanation!:string;
  @Column('jsonb') sources!:SourceReference[];
  @Column('jsonb',{nullable:true}) quran!:QuranReference|null;
  @Column('varchar',{length:12}) reviewStatus!:'DRAFT'|'REVIEWED'|'PUBLISHED';
  @Column('jsonb',{nullable:true}) review!:ReviewProvenance|null;
  @Column('jsonb',{nullable:true}) generation!:GenerationProvenance|null;
  @Column('varchar',{length:100,nullable:true}) sourceApprovalId!:string|null;
  @Column('boolean',{default:false}) suspended!:boolean;
  @Column('jsonb',{nullable:true}) moderation!:{at:string;by:string;reason:string;releasedAt?:string;releasedBy?:string;releaseNote?:string}|null;
  @Column('timestamptz',{default:()=> 'CURRENT_TIMESTAMP'}) createdAt!:Date;
  @Column('timestamptz',{default:()=> 'CURRENT_TIMESTAMP'}) updatedAt!:Date;
}
@Entity('quiz_attempts')
@Index('quiz_attempt_owner_lesson',['userId','lessonId','createdAt'])
export class QuizAttempt {
  @PrimaryColumn('uuid') id!:string;
  @Column('uuid') userId!:string;
  @ManyToOne(()=>User,{onDelete:'CASCADE'}) @JoinColumn({name:'userId'}) user!:User;
  @Column('varchar',{length:80}) lessonId!:string;
  @Column('varchar',{length:16}) mode!:AttemptMode;
  @Column('varchar',{length:100,nullable:true}) conceptId!:string|null;
  @Column('varchar',{length:16}) status!:'IN_PROGRESS'|'SUBMITTED'|'EXPIRED';
  @Column('smallint') questionCount!:number;
  @Column('smallint',{nullable:true}) correctCount!:number|null;
  @Column('boolean',{nullable:true}) passed!:boolean|null;
  @Column('timestamptz',{default:()=> 'CURRENT_TIMESTAMP'}) createdAt!:Date;
  @Column('timestamptz') expiresAt!:Date;
  @Column('timestamptz',{nullable:true}) submittedAt!:Date|null;
}
@Entity('quiz_attempt_questions')
@Unique('quiz_item_order',['attemptId','ordinal'])
@Unique('quiz_item_question',['attemptId','questionId'])
export class QuizAttemptQuestion {
  @PrimaryGeneratedColumn('uuid') id!:string;
  @Column('uuid') attemptId!:string;
  @ManyToOne(()=>QuizAttempt,{onDelete:'CASCADE'}) @JoinColumn({name:'attemptId'}) attempt!:QuizAttempt;
  @Column('uuid') questionId!:string;
  @ManyToOne(()=>QuizQuestion) @JoinColumn({name:'questionId'}) question!:QuizQuestion;
  @Column('smallint') ordinal!:number;
  @Column('jsonb') snapshot!:QuestionSnapshot;
  @Column('varchar',{length:50,nullable:true}) selectedOptionId!:string|null;
}
@Entity('mistake_reviews')
@Unique('mistake_owner_concept',['userId','lessonId','conceptId'])
@Index('mistake_owner_status',['userId','status','lastMistakeAt'])
export class MistakeReview {
  @PrimaryGeneratedColumn('uuid') id!:string;
  @Column('uuid') userId!:string;
  @ManyToOne(()=>User,{onDelete:'CASCADE'}) @JoinColumn({name:'userId'}) user!:User;
  @Column('varchar',{length:80}) lessonId!:string;
  @Column('varchar',{length:100}) conceptId!:string;
  @Column('varchar',{length:200}) conceptLabel!:string;
  @Column('varchar',{length:16}) status!:'NEEDS_REVIEW'|'IMPROVED';
  @Column('uuid',{nullable:true}) lastQuestionId!:string|null;
  @ManyToOne(()=>QuizQuestion,{onDelete:'SET NULL',nullable:true}) @JoinColumn({name:'lastQuestionId'}) lastQuestion!:QuizQuestion|null;
  @Column('timestamptz',{default:()=> 'CURRENT_TIMESTAMP'}) createdAt!:Date;
  @Column('timestamptz') lastMistakeAt!:Date;
  @Column('timestamptz',{nullable:true}) improvedAt!:Date|null;
}
export const quizEntities=[QuizQuestion,QuizAttempt,QuizAttemptQuestion,MistakeReview];
