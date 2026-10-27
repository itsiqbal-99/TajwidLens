import {test} from 'node:test';
import assert from 'node:assert/strict';
import {quizTransferSql,questionColumns} from '../scripts/quiz-transfer-sql';
import type {QuizQuestion} from '../src/modules/quiz/quiz.entity';

test('quiz SQL exports only explicit bank fields and safely quotes SQL-like text',()=>{
  const row = Object.fromEntries(questionColumns.map(key=>[key,null])) as unknown as QuizQuestion;
  Object.assign(row,{id:'a',prompt:"quote ' ; DROP TABLE users; $quiz_data$",userId:'must-not-export'});
  const sql=quizTransferSql([row]);
  assert.ok(sql.includes('$quiz_xdata$'));
  assert.ok(!sql.includes('must-not-export'));
  assert.ok(sql.includes('ON CONFLICT (id) DO NOTHING'));
  assert.ok(sql.includes('RAISE EXCEPTION'));
  assert.ok(sql.includes('incoming.suspended AND NOT existing.suspended'));
  assert.throws(()=>quizTransferSql([]));
  assert.throws(()=>quizTransferSql([row,row]));
});
