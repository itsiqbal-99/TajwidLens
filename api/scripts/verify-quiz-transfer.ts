import 'reflect-metadata';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

async function main() {
  const {readConfig}=await import('../src/config/config');
  if(readConfig().production) throw new Error('Development only');
  const {default:db}=await import('../src/database/data-source');
  await db.initialize();
  const runner=db.createQueryRunner();
  try {
    await runner.connect();
    await runner.startTransaction();
    // Shadow only the bank table on this connection; all test writes roll back.
    await runner.query('CREATE TEMP TABLE quiz_questions (LIKE public.quiz_questions INCLUDING ALL) ON COMMIT DROP');
    const sql=readFileSync(resolve(__dirname,'../exports/quiz-development.sql'),'utf8').replace(/^BEGIN;$/m,'').replace(/^COMMIT;$/m,'');
    await runner.query(sql);
    const [{count}]=await runner.query('SELECT count(*)::int AS count FROM quiz_questions');
    assert.ok(count>0);
    const [row]=await runner.query('SELECT id FROM quiz_questions ORDER BY id LIMIT 1');
    await runner.query('UPDATE quiz_questions SET suspended=true, moderation=$2::jsonb, "reviewStatus"=\'DRAFT\' WHERE id=$1',[row.id,JSON.stringify({at:new Date().toISOString(),by:'temporary-transfer-verifier',reason:'isolated hold preservation test'})]);
    await runner.query('DROP TABLE quiz_transfer');
    await runner.query(sql);
    const [after]=await runner.query('SELECT suspended,"reviewStatus" FROM quiz_questions WHERE id=$1',[row.id]);
    assert.equal(after.suspended,true);
    assert.equal(after.reviewStatus,'DRAFT');
    assert.equal((await runner.query('SELECT count(*)::int AS count FROM quiz_questions'))[0].count,count);
    await runner.query('DROP TABLE quiz_transfer');
    await runner.query('UPDATE quiz_questions SET prompt=prompt || \' conflict\' WHERE id=$1',[row.id]);
    await runner.query('SAVEPOINT conflicting_import');
    await assert.rejects(runner.query(sql),/Immutable quiz version conflict/);
    await runner.query('ROLLBACK TO SAVEPOINT conflicting_import');
    console.log(JSON.stringify({versions:count,firstImport:'PASS',idempotency:'PASS',targetHoldAndStatusPreserved:'PASS',immutableConflictRollback:'PASS',writes:'temporary tables only; rolled back'}));
  } finally {
    if(runner.isTransactionActive) await runner.rollbackTransaction();
    await runner.release();
    await db.destroy();
  }
}
main().catch((error)=>{console.error(error instanceof Error ? error.message.slice(0,300) : 'Unknown verification error');console.error('Quiz transfer verification failed; no persistent test writes are committed.');process.exitCode=1;});
