import 'reflect-metadata';
import {readFileSync,writeFileSync,renameSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {DataSource} from 'typeorm';
import {loadQuestionSources,validateQuestionManifest} from './question-sources';
import {generateCandidates,validateGenerated} from '../src/modules/quiz/generation';
import {QuestionBankService,questionHash} from '../src/modules/quiz/question-bank.service';
import {loadReviewers,loadSourceApprovals} from '../src/modules/quiz/quiz.module';
import type {QuestionContent} from '../src/modules/quiz/question.types';
import {lessonCatalog} from '../src/modules/learning/catalog';

async function main(){
  const mode=process.argv[2],apply=process.argv.includes('--apply'),dry=process.argv.includes('--dry-run');
  if(!['audit','generate','validate','import','publish'].includes(mode))throw new Error('Use audit|generate|validate|import|publish [--apply] [--dry-run]');
  const source=loadQuestionSources(),file=resolve(__dirname,'../content/generated-candidates.json');
  if(['validate','import','publish'].includes(mode)&&!existsSync(file))throw new Error('Generate candidates first: npm run questions:generate -- --apply');
  const previous:QuestionContent[]=existsSync(file)?JSON.parse(readFileSync(file,'utf8')):[];
  if(!Array.isArray(previous)||previous.length>1000)throw new Error('Invalid candidate file');
  if(['validate','import','publish'].includes(mode)){
    const manifest=JSON.parse(readFileSync(resolve(__dirname,'../content/generated-manifest.json'),'utf8'));
    validateQuestionManifest(manifest,previous,source.sourceVersion);
  }
  const bank=new QuestionBankService({} as DataSource,source.corpus,loadReviewers(),loadSourceApprovals());
  const generated=generateCandidates(source,previous),questions=mode==='generate'||mode==='audit'?generated.questions:previous;
  const validation=validateGenerated(questions,source,bank);
  const rows=lessonCatalog.map(lesson=>{const q=questions.filter(q=>q.lessonId===lesson.id),valid=validation.filter(v=>v.lessonId===lesson.id&&v.passed),identification=q.filter(q=>q.type==='TAJWID_IDENTIFICATION').length;
    return {lessonId:lesson.id,title:lesson.title,sourceFields:q.filter(q=>q.type==='MULTIPLE_CHOICE').length,
      generated:q.length,validated:valid.length,failed:q.length-valid.length,published:q.filter(q=>q.reviewStatus==='PUBLISHED').length,identification,
      sourceVerified:validation.filter(v=>v.lessonId===lesson.id&&v.passed&&v.readiness==='SOURCE_VERIFIED').length,
      assessment:identification?'MIXED':'THEORY_ONLY',gap:q.length<7?'CONTENT_GAP':'EXPERT_REVIEW_REQUIRED'};});
  console.table(rows.map(({title,...row})=>row));
  console.log(JSON.stringify({sourceVersion:source.sourceVersion,generated:questions.length,passed:validation.filter(v=>v.passed).length,failed:validation.filter(v=>!v.passed).length,excluded:generated.excluded,publication:'Separate explicit approval required; no human review inferred.'}));
  if(validation.some(v=>!v.passed)){for(const v of validation.filter(v=>!v.passed))console.error(v.id+': '+v.errors.join(', '));throw new Error('Candidate validation failed; no write performed');}
  if(mode==='generate' && apply && !dry){
    const manifest=resolve(__dirname,'../content/generated-manifest.json');
    writeFileSync(manifest+'.tmp',JSON.stringify({sourceVersion:source.sourceVersion,files:source.files,questionHashes:questions.map(questionHash).sort(),coverage:rows,excluded:generated.excluded},null,2)+'\n',{encoding:'utf8',mode:0o600});
    writeFileSync(file+'.tmp',JSON.stringify(questions,null,2)+'\n',{encoding:'utf8',mode:0o600});renameSync(manifest+'.tmp',manifest);renameSync(file+'.tmp',file);
    console.log('Saved DRAFT candidates; no database or publication changes.');
  }
  if((mode==='import'||mode==='publish') && apply && !dry){
    const {readConfig}=await import('../src/config/config');if(readConfig().production)throw new Error('Production writes are not authorized by this CLI');
    const {default:db}=await import('../src/database/data-source');await db.initialize();
    try{
      if(await db.showMigrations())throw new Error('Apply the reviewed development migration first');
      const live=new QuestionBankService(db,source.corpus,loadReviewers(),loadSourceApprovals());
      if(mode==='import'){await live.import(questions);console.log('Idempotent import completed; existing publication/quarantine preserved.');}
      else{
        if(process.argv.includes('--human-review')){
          const reviewed:QuestionContent[]=JSON.parse(readFileSync(resolve(__dirname,'../content/question-bank.json'),'utf8'));
          const selected=questions.map(q=>({q,approval:reviewed.find(row=>row.id===q.id&&row.review)})).filter(pair=>pair.approval);
          if(!selected.length)throw new Error('No actual human approvals in question-bank.json');
          for(const {q,approval} of selected)if(questionHash(q)!==questionHash(approval!)||live.validate({...q,reviewStatus:'PUBLISHED',review:approval!.review}).length)throw new Error('Exact immutable version and trusted human review required');
          for(const {q,approval} of selected)await live.publish(q.id,null,approval!.review!);
          console.log('Published only versions with explicit trusted human approval.');return;
        }
        const approvalId=process.argv.find(v=>v.startsWith('--approval='))?.slice(11);if(!approvalId)throw new Error('Explicit --approval=<trusted-source-approval-id> required');
        const eligible=questions.map(q=>({...q,sourceApprovalId:approvalId}));
        if(eligible.some(q=>!live.sourceVerified(q)&&!live.repositoryVerified(q)))throw new Error('Not every exact question version has trusted source and transformation approval; publication refused');
        await live.publish(eligible.map(q=>q.id),approvalId);
        console.log('Published only explicitly approved immutable versions; no human-reviewed status assigned.');
      }
    }finally{await db.destroy();}
  }else if(dry||!apply||['audit','validate'].includes(mode))console.log('Preview only. Use --apply to write; --dry-run always prevents writes.');
}
main().catch(error=>{console.error(error instanceof Error?error.message:'Question operation failed');process.exitCode=1;});
