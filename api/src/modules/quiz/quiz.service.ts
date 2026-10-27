import {BadRequestException,ConflictException,GoneException,Injectable,NotFoundException} from '@nestjs/common';
import {randomUUID} from 'node:crypto';
import {DataSource,EntityManager,In,MoreThan} from 'typeorm';
import type {AttemptMode,QuizAttemptView,QuizAvailability} from '../../../../shared/quiz';
import {User} from '../users/user.entity';
import {UserLessonProgress} from '../learning/learning.entity';
import {sqlTable} from '../../database/sql-table';
import {QuizQuestion,QuizAttempt,QuizAttemptQuestion,MistakeReview} from './quiz.entity';
import {QuestionBankService,questionHash} from './question-bank.service';
import {feedback,publicQuestion,scoreAnswers,selectQuestions} from './engine';

export interface QuizAnswerInput {questionId:string;optionId:string}
const attemptDuration=24*60*60*1000;

@Injectable()
export class QuizService {
  constructor(private db:DataSource,private bank:QuestionBankService) {}
  async availability(lessonId:string,userId?:string):Promise<QuizAvailability> {
    this.bank.lesson(lessonId);
    const questions=await this.bank.eligible(lessonId);
    const available=questions.length>=7;
    const pending=userId?await this.db.getRepository(QuizAttempt).findOne({where:{userId,lessonId,mode:'LESSON_QUIZ',status:'IN_PROGRESS',expiresAt:MoreThan(new Date())},order:{createdAt:'DESC'}}):null;
    return {lessonId,available,eligibleCount:questions.length,requiredQuestions:7,
      reason:available?'AVAILABLE':'INSUFFICIENT_PUBLISHED',
      message:available?'Tujuh soal, minimal enam jawaban benar untuk lulus.':'Evaluasi sedang menunggu soal yang telah ditinjau. Aktivitas belajar Anda tetap tersimpan.',resumeAttemptId:pending?.id ?? null};
  }
  private async owned(manager:EntityManager,userId:string,id:string,lock=false) {
    const attempt=await manager.getRepository(QuizAttempt).findOne({where:{id,userId},...(lock?{lock:{mode:'pessimistic_write' as const}}:{})});
    if(!attempt)throw new NotFoundException('Evaluasi tidak ditemukan.');
    return attempt;
  }
  private items(manager:EntityManager,id:string) {return manager.getRepository(QuizAttemptQuestion).find({where:{attemptId:id},order:{ordinal:'ASC'}});}
  private view(attempt:QuizAttempt,items:QuizAttemptQuestion[]):QuizAttemptView {
    const expired=attempt.status==='EXPIRED' || (attempt.status==='IN_PROGRESS'&&attempt.expiresAt.getTime()<=Date.now());
    const result=attempt.status==='SUBMITTED'?{
      ...scoreAnswers(attempt.correctCount!,attempt.questionCount),completionVerified:attempt.mode==='LESSON_QUIZ'&&!!attempt.passed,
      feedback:items.map(item=>feedback(item.snapshot,item.id,item.selectedOptionId!)),
    }:null;
    return {id:attempt.id,lessonId:attempt.lessonId,mode:attempt.mode,status:expired?'EXPIRED':attempt.status,
      createdAt:attempt.createdAt.toISOString(),expiresAt:attempt.expiresAt.toISOString(),submittedAt:attempt.submittedAt?.toISOString() ?? null,
      questions:items.map(item=>({...publicQuestion(item.snapshot,item.id),selectedOptionId:item.selectedOptionId})),result};
  }
  private async live(manager:EntityManager,attempt:QuizAttempt,items:QuizAttemptQuestion[]) {
    if(items.length!==attempt.questionCount)return false;
    const questions=await manager.getRepository(QuizQuestion).findBy({id:In(items.map(item=>item.questionId))});
    return items.every(item=>{
      const question=questions.find(q=>q.id===item.questionId);
      return question?.reviewStatus==='PUBLISHED' && !question.suspended && !this.bank.validate(question).length && questionHash(question)===item.snapshot.contentHash;
    });
  }
  private writable(attempt:QuizAttempt) {
    if(attempt.status==='EXPIRED'||attempt.expiresAt.getTime()<=Date.now())throw new GoneException('Evaluasi sudah berakhir. Mulai evaluasi baru.');
    if(attempt.status!=='IN_PROGRESS')throw new ConflictException('Hasil evaluasi sudah disimpan.');
  }
  private async lockUser(manager:EntityManager,userId:string) {
    if(!await manager.getRepository(User).findOne({where:{id:userId},lock:{mode:'pessimistic_write'}}))throw new NotFoundException('Akun tidak ditemukan.');
  }
  private async insert(manager:EntityManager,userId:string,lessonId:string,mode:AttemptMode,questions:QuizQuestion[],id:string=randomUUID(),expiresAt=new Date(Date.now()+attemptDuration)) {
    const attempt=await manager.getRepository(QuizAttempt).save({id,userId,lessonId,mode,conceptId:mode==='LESSON_QUIZ'?null:questions[0].conceptId,
      status:'IN_PROGRESS',questionCount:questions.length,correctCount:null,passed:null,expiresAt,submittedAt:null});
    const items=await manager.getRepository(QuizAttemptQuestion).save(questions.map((question,ordinal)=>({attemptId:id,questionId:question.id,ordinal,snapshot:this.bank.snapshot(question),selectedOptionId:null})));
    return {attempt,items};
  }
  async create(userId:string,lessonId:string):Promise<QuizAttemptView> {
    this.bank.lesson(lessonId);
    return this.db.transaction(async manager=>{
      // Serialize creation per account; repeated clicks resume one active lesson attempt.
      await this.lockUser(manager,userId);
      const active=await manager.getRepository(QuizAttempt).findOne({where:{userId,lessonId,mode:'LESSON_QUIZ',status:'IN_PROGRESS',expiresAt:MoreThan(new Date())},order:{createdAt:'DESC'}});
      if(active){const items=await this.items(manager,active.id);if(await this.live(manager,active,items))return this.view(active,items);
        await manager.getRepository(QuizAttempt).update(active.id,{status:'EXPIRED'});}
      const bank=await this.bank.eligible(lessonId,manager);
      if(bank.length<7)throw new ConflictException('Quiz belum tersedia: diperlukan tujuh soal terpublikasi.');
      const previous=await manager.getRepository(QuizAttempt).findOne({where:{userId,lessonId,mode:'LESSON_QUIZ'},order:{createdAt:'DESC'}});
      const previousIds=new Set(previous?(await this.items(manager,previous.id)).map(item=>item.questionId):[]);
      const created=await this.insert(manager,userId,lessonId,'LESSON_QUIZ',selectQuestions(bank,previousIds));
      return this.view(created.attempt,created.items);
    });
  }
  async get(userId:string,id:string):Promise<QuizAttemptView> {
    const attempt=await this.owned(this.db.manager,userId,id),items=await this.items(this.db.manager,id);
    if(attempt.status==='IN_PROGRESS' && !await this.live(this.db.manager,attempt,items))attempt.status='EXPIRED';
    return this.view(attempt,items);
  }
  private validateAnswers(items:QuizAttemptQuestion[],answers:QuizAnswerInput[],complete:boolean) {
    if(!Array.isArray(answers)||answers.length<1||answers.length>items.length||new Set(answers.map(a=>a.questionId)).size!==answers.length
      || (complete && answers.length!==items.length))throw new BadRequestException('Lengkapi seluruh jawaban tanpa duplikasi.');
    for(const answer of answers){const item=items.find(item=>item.id===answer.questionId);
      if(!item || !item.snapshot.options.some(option=>option.id===answer.optionId))throw new BadRequestException('Pilihan jawaban tidak sesuai evaluasi.');}
  }
  private async writeAnswers(manager:EntityManager,attemptId:string,items:QuizAttemptQuestion[],answers:QuizAnswerInput[]) {
    const parameters:unknown[]=[attemptId];
    const clauses=answers.map(answer=>{const index=parameters.length+1;parameters.push(answer.questionId,answer.optionId);return `WHEN id=$${index}::uuid THEN $${index+1}::varchar`;});
    await manager.query(`UPDATE ${sqlTable(manager,QuizAttemptQuestion)} SET "selectedOptionId"=CASE ${clauses.join(' ')} ELSE "selectedOptionId" END WHERE "attemptId"=$1::uuid`,parameters);
    for(const answer of answers)items.find(item=>item.id===answer.questionId)!.selectedOptionId=answer.optionId;
  }
  async saveAnswers(userId:string,id:string,answers:QuizAnswerInput[]) {
    return this.db.transaction(async manager=>{
      const attempt=await this.owned(manager,userId,id,true);this.writable(attempt);
      const items=await this.items(manager,id);this.validateAnswers(items,answers,false);
      await this.writeAnswers(manager,id,items,answers);
      return this.view(attempt,items);
    });
  }
  private async evaluate(manager:EntityManager,attempt:QuizAttempt,items:QuizAttemptQuestion[],answers:QuizAnswerInput[]) {
    this.writable(attempt);this.validateAnswers(items,answers,true);
    if(!await this.live(manager,attempt,items))throw new ConflictException('Soal sedang diperbarui. Mulai evaluasi baru.');
    await this.writeAnswers(manager,attempt.id,items,answers);
    const result=scoreAnswers(items.filter(item=>item.selectedOptionId===item.snapshot.correctAnswer).length,items.length),now=new Date();
    await manager.getRepository(QuizAttempt).update(attempt.id,{status:'SUBMITTED',correctCount:result.correctCount,passed:result.passed,submittedAt:now});
    Object.assign(attempt,{status:'SUBMITTED',correctCount:result.correctCount,passed:result.passed,submittedAt:now});
    if(attempt.mode==='LESSON_QUIZ' && result.passed){
      // The only completion writer; grading, answers, provenance and reviews share this transaction.
      await manager.query(`INSERT INTO ${sqlTable(manager,UserLessonProgress)} ("userId","lessonId",status,"completedAt","lastAccessedAt","completionSource")
        VALUES ($1,$2,'COMPLETED',CURRENT_TIMESTAMP,clock_timestamp(),'QUIZ_VERIFIED')
        ON CONFLICT ("userId","lessonId") DO UPDATE SET status='COMPLETED',"completionSource"='QUIZ_VERIFIED',
          "completedAt"=CASE WHEN user_lesson_progress."completionSource"='QUIZ_VERIFIED' THEN user_lesson_progress."completedAt" ELSE EXCLUDED."completedAt" END,
          "lastAccessedAt"=GREATEST(user_lesson_progress."lastAccessedAt",EXCLUDED."lastAccessedAt"),"updatedAt"=clock_timestamp()`,[attempt.userId,attempt.lessonId]);
    }
    const wrong=new Map<string,QuizAttemptQuestion>();
    for(const item of items)if(item.selectedOptionId!==item.snapshot.correctAnswer)wrong.set(item.snapshot.conceptId,item);
    if(wrong.size)await manager.getRepository(MistakeReview).upsert([...wrong.values()].map(item=>({userId:attempt.userId,lessonId:attempt.lessonId,
      conceptId:item.snapshot.conceptId,conceptLabel:item.snapshot.conceptLabel,status:'NEEDS_REVIEW' as const,lastQuestionId:item.questionId,lastMistakeAt:now,improvedAt:null})),['userId','lessonId','conceptId']);
    if(attempt.mode==='REPLAY' && result.passed)await manager.getRepository(MistakeReview).update({userId:attempt.userId,lessonId:attempt.lessonId,conceptId:items[0].snapshot.conceptId},
      {status:'IMPROVED',improvedAt:now,lastQuestionId:items[0].questionId});
    return this.view(attempt,items);
  }
  async submit(userId:string,id:string,answers:QuizAnswerInput[]) {
    return this.db.transaction(async manager=>{
      const attempt=await this.owned(manager,userId,id,true),items=await this.items(manager,id);
      if(attempt.status==='SUBMITTED')return this.view(attempt,items);
      return this.evaluate(manager,attempt,items,answers);
    });
  }
  async replay(userId:string,question:QuizQuestion) {
    return this.db.transaction(async manager=>{
      await this.lockUser(manager,userId);
      const active=await manager.getRepository(QuizAttempt).findOne({where:{userId,lessonId:question.lessonId,conceptId:question.conceptId,mode:'REPLAY',status:'IN_PROGRESS',expiresAt:MoreThan(new Date())},order:{createdAt:'DESC'}});
      if(active){const items=await this.items(manager,active.id);if(await this.live(manager,active,items))return this.view(active,items);await manager.getRepository(QuizAttempt).update(active.id,{status:'EXPIRED'});}
      const created=await this.insert(manager,userId,question.lessonId,'REPLAY',[question]);
      return this.view(created.attempt,created.items);
    });
  }
  async detective(userId:string,question:QuizQuestion,answer:string,nonce:string) {
    return this.db.transaction(async manager=>{
      await this.lockUser(manager,userId);
      const existing=await manager.getRepository(QuizAttempt).findOneBy({id:nonce});
      if(existing){if(existing.userId!==userId || existing.mode!=='DETECTIVE')throw new NotFoundException('Latihan tidak ditemukan.');return this.view(existing,await this.items(manager,nonce));}
      const created=await this.insert(manager,userId,question.lessonId,'DETECTIVE',[question],nonce);
      return this.evaluate(manager,created.attempt,created.items,[{questionId:created.items[0].id,optionId:answer}]);
    });
  }
}
