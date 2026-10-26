import 'reflect-metadata';
import {isUUID} from 'class-validator';
import db from '../src/database/data-source';
import {readConfig} from '../src/config/config';
import {FeedbackService} from '../src/modules/quiz/feedback.service';
import {QuestionBankService} from '../src/modules/quiz/question-bank.service';
import {QuizCorpus} from '../src/modules/quiz/corpus';
import {loadReviewers,loadSourceApprovals} from '../src/modules/quiz/quiz.module';
import {feedbackCategories} from '../src/modules/quiz/feedback.dto';
import type {FeedbackStatus,FeedbackCategory} from '../../shared/question-feedback';

async function main(){
  const action=process.argv[2],value=(name:string)=>process.argv.find(v=>v.startsWith('--'+name+'='))?.slice(name.length+3);
  if(!['list','review','suspend','release'].includes(action))throw new Error('Use list|review|suspend|release; changes require --apply, --id, --actor and --note');
  if(readConfig().production)throw new Error('Production operations are not authorized by this local CLI');
  const status=value('status'),questionId=value('question'),category=value('category');
  if(status&&!['OPEN','IN_REVIEW','RESOLVED','REJECTED'].includes(status))throw new Error('Invalid status');
  if(questionId&&!isUUID(questionId))throw new Error('Invalid question ID');
  if(category&&!Object.hasOwn(feedbackCategories,category))throw new Error('Invalid category');
  await db.initialize();
  try{
    if(await db.showMigrations())throw new Error('Apply the reviewed development migration first');
    const corpus=new QuizCorpus(),bank=new QuestionBankService(db,corpus,loadReviewers(),loadSourceApprovals()),service=new FeedbackService(db,bank,null,corpus);
    if(action==='list')console.log(JSON.stringify(await service.list({...(status?{status:status as FeedbackStatus}:{}),...(questionId?{questionId}:{}),...(category?{category:category as FeedbackCategory}:{})}),null,2));
    else{
      const id=value('id'),actor=value('actor'),note=value('note') || '';
      if(!id||!isUUID(id)||!actor?.trim())throw new Error('Explicit UUID --id and accountable --actor required');
      const [role]=await db.query('SELECT current_user AS actor');
      const identity=role.actor+' / '+actor;
      if(!process.argv.includes('--apply')||process.argv.includes('--dry-run')){console.log('Preview only: '+action+' '+id+' by '+identity);return;}
      if(action==='review')await service.review(id,status as Exclude<FeedbackStatus,'OPEN'>,identity,note);
      else await service.quarantine(id,action==='suspend',identity,note);
      console.log('Saved '+action+'. Question answers, historical scores and completion were not changed.');
    }
  }finally{await db.destroy();}
}
main().catch(error=>{console.error('Feedback operation failed: '+(error instanceof Error?error.message:'invalid operation'));process.exitCode=1;});
