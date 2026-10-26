import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DataSource} from 'typeorm';
import {selectQuestions,scoreAnswers,publicQuestion} from '../src/modules/quiz/engine';
import {QuizCorpus,graphemeRange} from '../src/modules/quiz/corpus';
import {QuestionBankService,questionHash} from '../src/modules/quiz/question-bank.service';
import {QuizQuestion} from '../src/modules/quiz/quiz.entity';
import {fixtureQuestions,fixtureReviewers} from './assessment-fixtures';

test('seven unique mixed questions, option shuffle and retry variation',()=>{
  const bank=fixtureQuestions() as QuizQuestion[];
  const first=selectQuestions(bank,new Set()),second=selectQuestions(bank,new Set(first.map(q=>q.id)));
  assert.equal(first.length,7);assert.equal(new Set(first.map(q=>q.id)).size,7);
  assert.equal(new Set(first.map(q=>q.type)).size,2);
  assert.ok(second.every(q=>!first.some(old=>old.id===q.id)));
  assert.throws(()=>selectQuestions(bank.slice(0,6),new Set()));
  const theory=selectQuestions(bank.filter(q=>q.type==='MULTIPLE_CHOICE'),new Set());
  assert.equal(theory.length,7);assert.ok(theory.every(q=>q.type==='MULTIPLE_CHOICE'));
});
test('only six or seven of seven pass the 80 percent threshold',()=>{
  assert.equal(scoreAnswers(5,7).passed,false);assert.equal(scoreAnswers(6,7).passed,true);assert.equal(scoreAnswers(7,7).percentage,100);
  assert.equal(scoreAnswers(6,7).percentage,85.71);assert.throws(()=>scoreAnswers(8,7));assert.throws(()=>scoreAnswers(4,5));
});
test('content gate checks trusted provenance, corpus integrity and immutable hash',()=>{
  const bank=new QuestionBankService({} as DataSource,new QuizCorpus(),fixtureReviewers),questions=fixtureQuestions();
  for(const question of questions)assert.deepEqual(bank.validate(question),[]);
  const question=questions[1],snapshot=bank.snapshot(question as QuizQuestion),payload=publicQuestion(snapshot,question.id);
  assert.deepEqual(Object.keys(payload).sort(),['id','options','prompt','type','verse']);
  assert.doesNotMatch(JSON.stringify(payload),/correctAnswer|explanation|contentHash|reviewer|ruleId|conceptId/);
  assert.ok(bank.validate({...question,review:null}).includes('trusted human review provenance'));
  assert.ok(new QuestionBankService({} as DataSource,new QuizCorpus(),[]).validate(question).length);
  assert.ok(bank.validate({...question,quran:{...question.quran!,verseSha256:'0'.repeat(64)}}).includes('corpus/reference/highlight'));
  assert.ok(bank.validate({...question,quran:{...question.quran!,start:3}}).includes('corpus/reference/highlight'));
  assert.ok(bank.validate({...question,correctAnswer:'missing'}).includes('options/correct answer'));
  assert.equal(questionHash(question),questionHash(JSON.parse(JSON.stringify(question))));
  assert.notEqual(questionHash(question),questionHash({...question,explanation:'Updated explanation'}));
  assert.equal(graphemeRange('نْ',0,1),false);assert.equal(graphemeRange('نْ',0,2),true);
});
