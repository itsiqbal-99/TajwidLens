import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { LessonProgress } from '../../../../shared/learning';
import { lessonCatalog } from './catalog';
import { UserLessonProgress } from './learning.entity';
import { buildLearningDashboard } from './learning-summary';

function response(lessonId:string,row?:UserLessonProgress):LessonProgress {
  return {lessonId,status:row?.status ?? 'NOT_STARTED',startedAt:row?.startedAt.toISOString() ?? null,
    completedAt:row?.completedAt?.toISOString() ?? null,lastAccessedAt:row?.lastAccessedAt.toISOString() ?? null,updatedAt:row?.updatedAt.toISOString() ?? null};
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
    const rows = await this.db.getRepository(UserLessonProgress).find({where:{userId}});
    return buildLearningDashboard(lessonCatalog,rows);
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
  async update(userId:string,lessonId:string,status:'IN_PROGRESS'|'COMPLETED') {
    this.lesson(lessonId);
    // One PostgreSQL upsert prevents duplicate rows and start/complete races without a read-before-write.
    const [row]:UserLessonProgress[] = await this.db.getRepository(UserLessonProgress).query(`
      INSERT INTO user_lesson_progress ("userId","lessonId",status,"completedAt","lastAccessedAt")
      VALUES ($1,$2,$3::varchar,CASE WHEN $3::varchar = 'COMPLETED' THEN CURRENT_TIMESTAMP ELSE NULL END,clock_timestamp())
      ON CONFLICT ("userId","lessonId") DO UPDATE SET
        status = CASE WHEN EXCLUDED.status = 'COMPLETED' THEN 'COMPLETED' ELSE user_lesson_progress.status END,
        "completedAt" = COALESCE(user_lesson_progress."completedAt",EXCLUDED."completedAt"),
        "lastAccessedAt" = GREATEST(user_lesson_progress."lastAccessedAt",EXCLUDED."lastAccessedAt"),
        "updatedAt" = clock_timestamp()
      RETURNING *`,[userId,lessonId,status]);
    return response(lessonId,row);
  }
}
