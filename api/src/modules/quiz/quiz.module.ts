import {Module} from '@nestjs/common';
import {randomBytes} from 'node:crypto';
import {CONFIG,AppConfig} from '../../config/config';
import {AuthModule} from '../auth/auth.module';
import {QuestionBankService} from './question-bank.service';
import {QuizCorpus} from './corpus';
import {QuizService} from './quiz.service';
import {DetectiveService,DETECTIVE_KEY} from './detective.service';
import {ReviewService} from './review.service';
import {QuizController,DetectiveController,ReviewController} from './quiz.controller';
import {OptionalSessionGuard} from './optional-session.guard';
import {QUESTION_REVIEWERS,SOURCE_APPROVALS,Reviewer,SourceApproval} from './question.types';
import {FeedbackService} from './feedback.service';
import {FeedbackController} from './feedback.controller';

export function loadReviewers():Reviewer[] {
  const reviewers:Reviewer[]=require('../../../content/reviewers.json');
  if(!Array.isArray(reviewers)||reviewers.some(reviewer=>!reviewer?.id||!reviewer.name||!reviewer.qualification||!reviewer.evidence)||new Set(reviewers.map(reviewer=>reviewer.id)).size!==reviewers.length)throw new Error('Invalid trusted reviewer registry');
  return reviewers;
}
export function loadSourceApprovals():SourceApproval[] {
  const approvals:SourceApproval[]=require('../../../content/source-approvals.json');
  if(!Array.isArray(approvals)||approvals.some(a=>!a?.id||!a.sourceVersion||!a.evidence||!Array.isArray(a.questionHashes)
    || ('kind' in a?(a.kind!=='REPOSITORY_DETERMINISTIC'||a.environment!=='development'||!a.authorizedAt||!a.authorization||!a.files):(!a.reviewerId||!a.reviewedAt)))
    ||new Set(approvals.map(a=>a.id)).size!==approvals.length)throw new Error('Invalid trusted source approval registry');
  return approvals;
}
@Module({imports:[AuthModule],controllers:[QuizController,DetectiveController,ReviewController,FeedbackController],providers:[QuizCorpus,QuestionBankService,QuizService,DetectiveService,ReviewService,OptionalSessionGuard,FeedbackService,
  {provide:QUESTION_REVIEWERS,useFactory:loadReviewers},
  {provide:SOURCE_APPROVALS,useFactory:loadSourceApprovals},
  {provide:DETECTIVE_KEY,inject:[CONFIG],useFactory:(config:AppConfig)=>{
    const configured=process.env.QUIZ_CHALLENGE_SECRET;
    if(configured && Buffer.byteLength(configured,'utf8')<32)throw new Error('QUIZ_CHALLENGE_SECRET must contain at least 32 random bytes');
    return configured?Buffer.from(configured,'utf8'):config.production?null:randomBytes(32);
  }}],exports:[QuestionBankService,QuizService]})
export class QuizModule {}
