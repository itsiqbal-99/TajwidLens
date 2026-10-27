import { MigrationInterface, QueryRunner } from 'typeorm';

export class LearningProgress1792886400000 implements MigrationInterface {
  async up(q:QueryRunner) {
    await q.query(`CREATE TABLE user_lesson_progress (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "userId" uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      "lessonId" varchar(80) NOT NULL, status varchar(20) NOT NULL,
      "startedAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "completedAt" timestamptz,
      "lastAccessedAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "createdAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT progress_user_lesson_unique UNIQUE ("userId","lessonId"),
      CONSTRAINT progress_status_valid CHECK (status IN ('IN_PROGRESS','COMPLETED')),
      CONSTRAINT progress_completion_valid CHECK ((status = 'COMPLETED' AND "completedAt" IS NOT NULL) OR (status = 'IN_PROGRESS' AND "completedAt" IS NULL))
    )`);
    await q.query(`CREATE INDEX progress_user_last_accessed ON user_lesson_progress ("userId","lastAccessedAt" DESC)`);
  }
  async down(q:QueryRunner) {
    // TypeORM runs migrations in a transaction; block writes between count and DROP.
    await q.query('LOCK TABLE user_lesson_progress IN ACCESS EXCLUSIVE MODE');
    const [row] = await q.query('SELECT COUNT(*) AS count FROM user_lesson_progress');
    if (Number(row.count)>0) throw new Error('Rollback refused: learning progress exists. Use a reviewed forward migration.');
    await q.query('DROP TABLE user_lesson_progress');
  }
}
