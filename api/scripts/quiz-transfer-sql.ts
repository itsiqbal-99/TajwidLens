import type {QuizQuestion} from '../src/modules/quiz/quiz.entity';

export const questionColumns = ['id','stableId','contentVersion','lessonId','conceptId','conceptLabel','type','prompt','options','correctAnswer','explanation','sources','quran','reviewStatus','review','generation','sourceApprovalId','suspended','moderation','createdAt','updatedAt'] as const;
const mutable = new Set(['reviewStatus','review','sourceApprovalId','suspended','moderation','createdAt','updatedAt']);

/** Data only: conflicting immutable versions abort; existing approvals and holds survive. */
export function quizTransferSql(rows: readonly QuizQuestion[]): string {
  if (!rows.length || new Set(rows.map(row=>row.id)).size !== rows.length) throw new Error('Empty or duplicate question export');
  const payload = JSON.stringify([...rows].sort((a,b)=>a.id.localeCompare(b.id)).map(row=>Object.fromEntries(questionColumns.map(key=>[key,row[key]]))));
  let tag = '$quiz_data$';
  while (payload.includes(tag)) tag = tag.replace('$quiz_', '$quiz_x');
  const columns = questionColumns.map(key=>'"'+key+'"').join(', ');
  const immutable = questionColumns.filter(key=>!mutable.has(key)).map(key=>`existing."${key}" IS DISTINCT FROM incoming."${key}"`).join(' OR ');
  return `-- TajwidLens development bank snapshot: ${rows.length} immutable question versions.
-- Exported at ${new Date().toISOString()}.
-- Private answer keys included. Run TypeORM migrations first. See docs/QUIZ_DATA_TRANSFER.md.
-- Use only with the matching trusted registries/corpus from the same repository revision.
BEGIN;
SET LOCAL lock_timeout = '10s';
LOCK TABLE quiz_questions IN SHARE ROW EXCLUSIVE MODE;
CREATE TEMP TABLE quiz_transfer (LIKE quiz_questions INCLUDING DEFAULTS) ON COMMIT DROP;
INSERT INTO quiz_transfer (${columns})
SELECT ${columns} FROM jsonb_populate_recordset(NULL::quiz_questions, ${tag}${payload}${tag}::jsonb);
DO $quiz_check$
BEGIN
  IF EXISTS (
    SELECT 1 FROM quiz_transfer incoming JOIN quiz_questions existing
    ON existing.id = incoming.id OR (existing."stableId" = incoming."stableId" AND existing."contentVersion" = incoming."contentVersion")
    WHERE ${immutable}
  ) THEN
    RAISE EXCEPTION 'Immutable quiz version conflict; nothing imported. Use the matching repository/database snapshot.';
  END IF;
END $quiz_check$;
INSERT INTO quiz_questions (${columns}) SELECT ${columns} FROM quiz_transfer ON CONFLICT (id) DO NOTHING;
-- A source hold may propagate; this transfer can never release a target hold.
UPDATE quiz_questions existing SET suspended = true, moderation = incoming.moderation, "updatedAt" = incoming."updatedAt"
FROM quiz_transfer incoming WHERE existing.id = incoming.id AND incoming.suspended AND NOT existing.suspended;
SELECT count(*) AS imported_versions_present FROM quiz_questions WHERE id IN (SELECT id FROM quiz_transfer);
COMMIT;
`;
}
