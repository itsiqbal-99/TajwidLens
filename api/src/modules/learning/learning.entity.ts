import { Check, Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { User } from '../users/user.entity';

@Entity('user_lesson_progress')
@Unique('progress_user_lesson_unique',['userId','lessonId'])
@Index('progress_user_last_accessed',['userId','lastAccessedAt'])
@Check('progress_status_valid',`status IN ('IN_PROGRESS','COMPLETED')`)
@Check('progress_completion_valid',`(status = 'COMPLETED' AND "completedAt" IS NOT NULL) OR (status = 'IN_PROGRESS' AND "completedAt" IS NULL)`)
export class UserLessonProgress {
  @PrimaryGeneratedColumn('uuid') id!:string;
  @Column('uuid') userId!:string;
  @ManyToOne(()=>User,{onDelete:'CASCADE'}) @JoinColumn({name:'userId'}) user!:User;
  @Column('varchar',{length:80}) lessonId!:string;
  @Column('varchar',{length:20}) status!:'IN_PROGRESS'|'COMPLETED';
  @Column('timestamptz',{default:()=> 'CURRENT_TIMESTAMP'}) startedAt!:Date;
  @Column('timestamptz',{nullable:true}) completedAt!:Date|null;
  @Column('timestamptz',{default:()=> 'CURRENT_TIMESTAMP'}) lastAccessedAt!:Date;
  @Column('timestamptz',{default:()=> 'CURRENT_TIMESTAMP'}) createdAt!:Date;
  @Column('timestamptz',{default:()=> 'CURRENT_TIMESTAMP'}) updatedAt!:Date;
}
