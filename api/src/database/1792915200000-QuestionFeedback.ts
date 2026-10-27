import {MigrationInterface,QueryRunner} from 'typeorm';
export class QuestionFeedback1792915200000 implements MigrationInterface {
  async up(q:QueryRunner){
    await q.query(`ALTER TABLE quiz_questions ADD COLUMN generation jsonb, ADD COLUMN "sourceApprovalId" varchar(100), ADD COLUMN suspended boolean NOT NULL DEFAULT false, ADD COLUMN moderation jsonb`);
    await q.query(`ALTER TABLE quiz_questions DROP CONSTRAINT quiz_question_review`);
    await q.query(`ALTER TABLE quiz_questions ADD CONSTRAINT quiz_question_review CHECK ("reviewStatus"='DRAFT' OR review IS NOT NULL OR ("reviewStatus"='PUBLISHED' AND "sourceApprovalId" IS NOT NULL AND generation IS NOT NULL))`);
    await q.query(`ALTER TABLE quiz_questions ADD CONSTRAINT question_quarantine_valid CHECK (NOT suspended OR moderation IS NOT NULL)`);
    await q.query(`CREATE TABLE question_feedback (
      id uuid PRIMARY KEY,"questionId" uuid NOT NULL REFERENCES quiz_questions(id),"questionVersion" int NOT NULL CHECK ("questionVersion">0),
      "attemptId" uuid REFERENCES quiz_attempts(id) ON DELETE SET NULL,"reporterUserId" uuid REFERENCES users(id) ON DELETE SET NULL,
      category varchar(30) NOT NULL CHECK (category IN ('INCORRECT_ANSWER','INACCURATE_EXPLANATION','HIGHLIGHT_MISMATCH','CONFUSING_QUESTION','PROBLEMATIC_OPTIONS','QURAN_TEXT_REFERENCE','OTHER')),
      description text NOT NULL CHECK (char_length(description)<=2000),status varchar(12) NOT NULL CHECK (status IN ('OPEN','IN_REVIEW','RESOLVED','REJECTED')),
      priority varchar(10) NOT NULL CHECK (priority IN ('HIGH','NORMAL')),"requestHash" varchar(64) NOT NULL,
      snapshot jsonb NOT NULL CHECK (jsonb_typeof(snapshot)='object'),
      "createdAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "reviewedAt" timestamptz,"reviewedBy" varchar(200),"resolutionNote" text,
      CONSTRAINT feedback_review_valid CHECK ((status='OPEN' AND "reviewedAt" IS NULL AND "reviewedBy" IS NULL) OR (status<>'OPEN' AND "reviewedAt" IS NOT NULL AND "reviewedBy" IS NOT NULL)),
      CONSTRAINT feedback_resolution_valid CHECK (status NOT IN ('RESOLVED','REJECTED') OR ("resolutionNote" IS NOT NULL AND char_length("resolutionNote")>0))
    )`);
    await q.query(`CREATE INDEX feedback_review_queue ON question_feedback (status,priority,"createdAt")`);
    await q.query(`CREATE INDEX feedback_question ON question_feedback ("questionId","questionVersion")`);
  }
  async down(q:QueryRunner){
    await q.query('LOCK TABLE question_feedback,quiz_questions IN ACCESS EXCLUSIVE MODE');
    const [reports]=await q.query('SELECT COUNT(*) AS count FROM question_feedback');
    const [generated]=await q.query('SELECT COUNT(*) AS count FROM quiz_questions WHERE generation IS NOT NULL OR "sourceApprovalId" IS NOT NULL OR moderation IS NOT NULL OR suspended');
    if(Number(reports.count)||Number(generated.count))throw new Error('Rollback refused: generated content or feedback/moderation history exists. Use a reviewed forward migration.');
    await q.query('DROP TABLE question_feedback');
    await q.query('ALTER TABLE quiz_questions DROP CONSTRAINT question_quarantine_valid, DROP CONSTRAINT quiz_question_review');
    await q.query(`ALTER TABLE quiz_questions ADD CONSTRAINT quiz_question_review CHECK ("reviewStatus"='DRAFT' OR review IS NOT NULL)`);
    await q.query('ALTER TABLE quiz_questions DROP COLUMN generation, DROP COLUMN "sourceApprovalId", DROP COLUMN suspended, DROP COLUMN moderation');
  }
}
