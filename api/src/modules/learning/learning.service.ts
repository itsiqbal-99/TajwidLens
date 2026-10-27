import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { LessonProgress } from '../../../../shared/learning';
import { lessonCatalog } from './catalog';
import { UserLessonProgress } from './learning.entity';
import { buildLearningDashboard,learningStatus } from './learning-summary';
import {MistakeReview} from '../quiz/quiz.entity';
import {sqlTable} from '../../database/sql-table';

function response(lessonId:string,row?:UserLessonProgress):LessonProgress {
  return {lessonId,status:learningStatus(row),startedAt:row?.startedAt.toISOString() ?? null,
    completedAt:row?.completionSource==='QUIZ_VERIFIED'?row.completedAt?.toISOString() ?? null:null,
    completionSource:row?.completionSource ?? null,legacyCompletedAt:row?.legacyCompletedAt?.toISOString() ?? null,
    lastAccessedAt:row?.lastAccessedAt.toISOString() ?? null,updatedAt:row?.updatedAt.toISOString() ?? null};
}

@Injectable()
export class LearningService {
  constructor(private db:DataSource) {}
  private lesson(id:string) {
    const lesson = lessonCatalog.find(item=>item.id===id);
    if (!lesson) throw new NotFoundException('Materi tidak ditemukan.');
    return lesson;
  }
  async dashboard(userId:string) {
    const [rows,reviews]=await Promise.all([this.db.getRepository(UserLessonProgress).find({where:{userId}}),this.db.getRepository(MistakeReview).countBy({userId,status:'NEEDS_REVIEW'})]);
    return buildLearningDashboard(lessonCatalog,rows,reviews);
  }
  async progress(userId:string) {
    const rows = await this.db.getRepository(UserLessonProgress).find({where:{userId}});
    const byId = new Map(rows.map(row=>[row.lessonId,row]));
    return {lessons:lessonCatalog.map(lesson=>response(lesson.id,byId.get(lesson.id)))};
  }
  async detail(userId:string,lessonId:string) {
    this.lesson(lessonId);
    const row = await this.db.getRepository(UserLessonProgress).findOneBy({userId,lessonId});
    return response(lessonId,row ?? undefined);
  }
  rejectManualCompletion(lessonId:string):never {
    this.lesson(lessonId);
    throw new ForbiddenException('Kelulusan materi hanya dapat diberikan setelah lulus quiz.');
  }
  async start(userId:string,lessonId:string) {
    this.lesson(lessonId);
    // Starting never changes completion/provenance, including legacy history.
    const [row]:UserLessonProgress[] = await this.db.getRepository(UserLessonProgress).query(`
      INSERT INTO ${sqlTable(this.db.manager,UserLessonProgress)} ("userId","lessonId",status,"lastAccessedAt")
      VALUES ($1,$2,'IN_PROGRESS',clock_timestamp())
      ON CONFLICT ("userId","lessonId") DO UPDATE SET
        "lastAccessedAt" = GREATEST(user_lesson_progress."lastAccessedAt",EXCLUDED."lastAccessedAt"),
        "updatedAt" = clock_timestamp()
      RETURNING *`,[userId,lessonId]);
    return response(lessonId,row);
  }
}
