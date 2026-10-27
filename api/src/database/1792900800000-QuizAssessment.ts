import {MigrationInterface,QueryRunner} from 'typeorm';

export class QuizAssessment1792900800000 implements MigrationInterface {
  async up(q:QueryRunner) {
    await q.query(`ALTER TABLE user_lesson_progress ADD COLUMN "completionSource" varchar(24), ADD COLUMN "legacyCompletedAt" timestamptz`);
    // Keep the original status/timestamp as history; the API counts only QUIZ_VERIFIED.
    await q.query(`UPDATE user_lesson_progress SET "completionSource"='LEGACY_SELF_REPORTED',"legacyCompletedAt"="completedAt" WHERE status='COMPLETED'`);
    await q.query(`ALTER TABLE user_lesson_progress ADD CONSTRAINT progress_source_valid CHECK (
      (status='IN_PROGRESS' AND "completionSource" IS NULL AND "legacyCompletedAt" IS NULL) OR
      (status='COMPLETED' AND "completionSource" IS NOT NULL AND (
        ("completionSource"='LEGACY_SELF_REPORTED' AND "legacyCompletedAt" IS NOT NULL AND "legacyCompletedAt"="completedAt") OR
        "completionSource"='QUIZ_VERIFIED')))`);
    await q.query(`CREATE TABLE quiz_questions (
      id uuid PRIMARY KEY,"stableId" varchar(100) NOT NULL,"contentVersion" int NOT NULL CHECK ("contentVersion">0),
      "lessonId" varchar(80) NOT NULL,"conceptId" varchar(100) NOT NULL,"conceptLabel" varchar(200) NOT NULL,
      type varchar(30) NOT NULL CHECK (type IN ('MULTIPLE_CHOICE','TAJWID_IDENTIFICATION')),prompt text NOT NULL,
      options jsonb NOT NULL,"correctAnswer" varchar(50) NOT NULL,explanation text NOT NULL,sources jsonb NOT NULL,quran jsonb,
      "reviewStatus" varchar(12) NOT NULL CHECK ("reviewStatus" IN ('DRAFT','REVIEWED','PUBLISHED')),review jsonb,
      "createdAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT quiz_question_stable_version UNIQUE ("stableId","contentVersion"),
      CONSTRAINT quiz_question_review CHECK ("reviewStatus"='DRAFT' OR review IS NOT NULL),
      CONSTRAINT quiz_question_options CHECK (jsonb_typeof(options)='array' AND jsonb_array_length(options) BETWEEN 2 AND 6)
    )`);
    await q.query(`CREATE INDEX quiz_question_lesson_status ON quiz_questions ("lessonId","reviewStatus")`);
    await q.query(`CREATE TABLE quiz_attempts (
      id uuid PRIMARY KEY,"userId" uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,"lessonId" varchar(80) NOT NULL,
      mode varchar(16) NOT NULL CHECK (mode IN ('LESSON_QUIZ','DETECTIVE','REPLAY')),
      "conceptId" varchar(100),status varchar(16) NOT NULL CHECK (status IN ('IN_PROGRESS','SUBMITTED','EXPIRED')),
      "questionCount" smallint NOT NULL,"correctCount" smallint,passed boolean,
      "createdAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,"expiresAt" timestamptz NOT NULL,"submittedAt" timestamptz,
      CONSTRAINT quiz_attempt_count CHECK ((mode='LESSON_QUIZ' AND "questionCount"=7 AND "conceptId" IS NULL) OR (mode IN ('DETECTIVE','REPLAY') AND "questionCount"=1 AND "conceptId" IS NOT NULL)),
      CONSTRAINT quiz_attempt_result CHECK (
        (status IN ('IN_PROGRESS','EXPIRED') AND "correctCount" IS NULL AND passed IS NULL AND "submittedAt" IS NULL) OR
        (status='SUBMITTED' AND "submittedAt" IS NOT NULL AND "correctCount" IS NOT NULL AND passed IS NOT NULL AND "correctCount" BETWEEN 0 AND "questionCount"
          AND passed=("correctCount">=CASE WHEN mode='LESSON_QUIZ' THEN 6 ELSE 1 END))),
      CONSTRAINT quiz_attempt_expiry CHECK ("expiresAt">"createdAt")
    )`);
    await q.query(`CREATE INDEX quiz_attempt_owner_lesson ON quiz_attempts ("userId","lessonId","createdAt" DESC)`);
    await q.query(`CREATE TABLE quiz_attempt_questions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),"attemptId" uuid NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
      "questionId" uuid NOT NULL REFERENCES quiz_questions(id),ordinal smallint NOT NULL CHECK (ordinal BETWEEN 0 AND 6),
      snapshot jsonb NOT NULL CHECK (jsonb_typeof(snapshot)='object'),"selectedOptionId" varchar(50),
      CONSTRAINT quiz_item_order UNIQUE ("attemptId",ordinal),CONSTRAINT quiz_item_question UNIQUE ("attemptId","questionId")
    )`);
    await q.query(`CREATE TABLE mistake_reviews (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),"userId" uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      "lessonId" varchar(80) NOT NULL,"conceptId" varchar(100) NOT NULL,"conceptLabel" varchar(200) NOT NULL,
      status varchar(16) NOT NULL CHECK (status IN ('NEEDS_REVIEW','IMPROVED')),
      "lastQuestionId" uuid REFERENCES quiz_questions(id) ON DELETE SET NULL,
      "createdAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,"lastMistakeAt" timestamptz NOT NULL,"improvedAt" timestamptz,
      CONSTRAINT mistake_owner_concept UNIQUE ("userId","lessonId","conceptId"),
      CONSTRAINT mistake_review_result CHECK ((status='NEEDS_REVIEW' AND "improvedAt" IS NULL) OR (status='IMPROVED' AND "improvedAt" IS NOT NULL))
    )`);
    await q.query(`CREATE INDEX mistake_owner_status ON mistake_reviews ("userId",status,"lastMistakeAt" DESC)`);
  }
  async down(q:QueryRunner) {
    await q.query('LOCK TABLE user_lesson_progress,quiz_questions,quiz_attempts,quiz_attempt_questions,mistake_reviews IN ACCESS EXCLUSIVE MODE');
    for(const table of ['quiz_questions','quiz_attempts','quiz_attempt_questions','mistake_reviews']){
      const [row]=await q.query(`SELECT COUNT(*) AS count FROM ${table}`);
      if(Number(row.count))throw new Error('Rollback refused: assessment records exist. Use a reviewed forward migration.');
    }
    const [verified]=await q.query(`SELECT COUNT(*) AS count FROM user_lesson_progress WHERE "completionSource"='QUIZ_VERIFIED'`);
    if(Number(verified.count))throw new Error('Rollback refused: verified progress exists.');
    await q.query('DROP TABLE quiz_attempt_questions');await q.query('DROP TABLE quiz_attempts');
    await q.query('DROP TABLE mistake_reviews');await q.query('DROP TABLE quiz_questions');
    await q.query('ALTER TABLE user_lesson_progress DROP CONSTRAINT progress_source_valid');
    await q.query('ALTER TABLE user_lesson_progress DROP COLUMN "completionSource", DROP COLUMN "legacyCompletedAt"');
  }
}
