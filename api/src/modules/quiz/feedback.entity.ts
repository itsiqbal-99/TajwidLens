import {Column,Entity,Index,JoinColumn,ManyToOne,PrimaryColumn} from 'typeorm';
import {User} from '../users/user.entity';
import {QuizQuestion,QuizAttempt} from './quiz.entity';
import type {QuestionSnapshot} from './question.types';
import type {FeedbackCategory,FeedbackStatus} from '../../../../shared/question-feedback';

@Entity('question_feedback')
@Index('feedback_review_queue',['status','priority','createdAt'])
export class QuestionReport {
  @PrimaryColumn('uuid') id!:string;
  @Column('uuid') questionId!:string;
  @ManyToOne(()=>QuizQuestion) @JoinColumn({name:'questionId'}) question!:QuizQuestion;
  @Column('int') questionVersion!:number;
  @Column('uuid',{nullable:true}) attemptId!:string|null;
  @ManyToOne(()=>QuizAttempt,{onDelete:'SET NULL',nullable:true}) @JoinColumn({name:'attemptId'}) attempt!:QuizAttempt|null;
  @Column('uuid',{nullable:true}) reporterUserId!:string|null;
  @ManyToOne(()=>User,{onDelete:'SET NULL',nullable:true}) @JoinColumn({name:'reporterUserId'}) reporter!:User|null;
  @Column('varchar',{length:30}) category!:FeedbackCategory;
  @Column('text') description!:string;
  @Column('varchar',{length:12}) status!:FeedbackStatus;
  @Column('varchar',{length:10}) priority!:'HIGH'|'NORMAL';
  @Column('varchar',{length:64}) requestHash!:string;
  @Column('jsonb') snapshot!:QuestionSnapshot;
  @Column('timestamptz',{default:()=> 'CURRENT_TIMESTAMP'}) createdAt!:Date;
  @Column('timestamptz',{default:()=> 'CURRENT_TIMESTAMP'}) updatedAt!:Date;
  @Column('timestamptz',{nullable:true}) reviewedAt!:Date|null;
  @Column('varchar',{length:200,nullable:true}) reviewedBy!:string|null;
  @Column('text',{nullable:true}) resolutionNote!:string|null;
}
