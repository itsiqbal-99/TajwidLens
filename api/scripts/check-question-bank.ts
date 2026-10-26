import 'reflect-metadata';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {DataSource} from 'typeorm';
import {lessonCatalog} from '../src/modules/learning/catalog';
import {QuizCorpus} from '../src/modules/quiz/corpus';
import {QuestionBankService,questionFingerprint} from '../src/modules/quiz/question-bank.service';
import {QuestionContent,Reviewer} from '../src/modules/quiz/question.types';

async function main(){
  const root=resolve(__dirname,'../content');
  const questions:QuestionContent[]=JSON.parse(readFileSync(resolve(root,'question-bank.json'),'utf8'));
  const reviewers:Reviewer[]=JSON.parse(readFileSync(resolve(root,'reviewers.json'),'utf8'));
  if(!Array.isArray(reviewers)||reviewers.some(r=>!r || !r.id || !r.name || !r.qualification || !r.evidence) || new Set(reviewers.map(r=>r.id)).size!==reviewers.length)throw new Error('Invalid trusted reviewer registry');
  if(!Array.isArray(questions)||questions.length>1000)throw new Error('Invalid bank format');
  const bank=new QuestionBankService({} as DataSource,new QuizCorpus(),reviewers),seen=new Set<string>(),fingerprints=new Map<string,string>();
  for(const q of questions){
    const errors=bank.validate(q);if(errors.length)throw new Error(`Question ${q?.id}: ${errors.join(', ')}`);
    const key=q.stableId+':'+q.contentVersion,fingerprint=questionFingerprint(q);
    if(seen.has(key))throw new Error('Duplicate question version: '+key);seen.add(key);
    const duplicate=fingerprints.get(fingerprint);
    if(duplicate && duplicate!==q.stableId)throw new Error('Duplicate/conflicting question content: '+duplicate+' / '+q.stableId);
    fingerprints.set(fingerprint,q.stableId);
  }
  console.table(lessonCatalog.map(lesson=>{const rows=questions.filter(q=>q.lessonId===lesson.id);return {lesson:lesson.id,DRAFT:rows.filter(q=>q.reviewStatus==='DRAFT').length,REVIEWED:rows.filter(q=>q.reviewStatus==='REVIEWED').length,PUBLISHED:rows.filter(q=>q.reviewStatus==='PUBLISHED').length,MCQ:rows.filter(q=>q.type==='MULTIPLE_CHOICE').length,IDENTIFICATION:rows.filter(q=>q.type==='TAJWID_IDENTIFICATION').length};}));
  console.log(`Technical validation PASS: ${questions.length} questions; ${reviewers.length} configured reviewers. Technical checks do not establish scientific validity.`);
  if(process.argv.includes('--import')){
    const {default:db}=await import('../src/database/data-source');await db.initialize();
    try{if(await db.showMigrations())throw new Error('Apply reviewed migrations before import');const result=await new QuestionBankService(db,new QuizCorpus(),reviewers).import(questions);console.log(`Imported ${result.imported} explicit versions; no automatic promotion or deletion.`);}finally{await db.destroy();}
  }
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
