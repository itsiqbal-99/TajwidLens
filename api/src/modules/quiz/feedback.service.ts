import {BadRequestException,ConflictException,ForbiddenException,Inject,Injectable,NotFoundException} from '@nestjs/common';
import {createHmac,timingSafeEqual} from 'node:crypto';
import {DataSource} from 'typeorm';
import {isUUID} from 'class-validator';
import {QuestionReport} from './feedback.entity';
import {QuizQuestion,QuizAttempt,QuizAttemptQuestion} from './quiz.entity';
import {DETECTIVE_KEY,QuestionSnapshot} from './question.types';
import {QuestionBankService,questionHash} from './question-bank.service';
import {QuizCorpus,sha256} from './corpus';
import {FeedbackDto,feedbackCategories} from './feedback.dto';
import type {FeedbackCategory,FeedbackStatus} from '../../../../shared/question-feedback';

const thanks={message:'Terima kasih. Laporanmu sudah tersimpan untuk ditinjau.'};
@Injectable()
export class FeedbackService {
  constructor(private db:DataSource,private bank:QuestionBankService,@Inject(DETECTIVE_KEY) private key:Buffer|null,private corpus:QuizCorpus){}
  private mac(encoded:string){if(!this.key)throw new BadRequestException('Mulai latihan baru untuk melaporkan soal.');return createHmac('sha256',this.key).update('question-feedback:'+encoded).digest();}
  guestReceipt(snapshot:QuestionSnapshot){
    const payload=Buffer.from(JSON.stringify({id:snapshot.questionId,version:snapshot.contentVersion,hash:snapshot.contentHash,expiresAt:Date.now()+86400000})).toString('base64url');
    return payload+'.'+this.mac(payload).toString('base64url');
  }
  private receipt(token:string){
    if(!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{43}$/.test(token)||token.length>2048)throw new BadRequestException('Bukti latihan tidak valid.');
    const [payload,signature]=token.split('.'),given=Buffer.from(signature,'base64url'),expected=this.mac(payload);
    if(given.length!==expected.length||!timingSafeEqual(given,expected))throw new BadRequestException('Bukti latihan tidak valid.');
    let value:{id:string;version:number;hash:string;expiresAt:number};
    try{value=JSON.parse(Buffer.from(payload,'base64url').toString('utf8'));}catch{throw new BadRequestException('Bukti latihan tidak valid.');}
    if(!value||!isUUID(value.id)||!Number.isInteger(value.version)||!/^[a-f0-9]{64}$/.test(value.hash)||!Number.isInteger(value.expiresAt)||value.expiresAt<=Date.now())throw new BadRequestException('Bukti latihan berakhir. Mulai latihan baru.');
    return value;
  }
  async report(userId:string|null,questionId:string,input:FeedbackDto){
    if(!isUUID(input.requestId)||!Object.hasOwn(feedbackCategories,input.category)||!Number.isInteger(input.questionVersion)||input.questionVersion<1
      || (input.description!==undefined && typeof input.description!=='string') || (input.description?.length ?? 0)>2000 || !!input.attemptId===!!input.token)throw new BadRequestException('Laporan tidak valid.');
    let snapshot:QuestionSnapshot,attemptId:string|null=null;
    if(input.attemptId){
      if(!userId)throw new ForbiddenException('Masuk kembali untuk melaporkan hasil evaluasi ini.');
      const attempt=await this.db.getRepository(QuizAttempt).findOneBy({id:input.attemptId,userId,status:'SUBMITTED'});
      const item=attempt && await this.db.getRepository(QuizAttemptQuestion).findOneBy({attemptId:attempt.id,questionId});
      if(!item || item.snapshot.contentVersion!==input.questionVersion)throw new NotFoundException('Hasil soal tidak ditemukan.');
      snapshot=item.snapshot;attemptId=input.attemptId;
    }else{
      if(userId)throw new ForbiddenException('Bukti latihan tamu tidak berlaku untuk sesi akun ini.');
      const proof=this.receipt(input.token!);
      if(proof.id!==questionId || proof.version!==input.questionVersion)throw new BadRequestException('Versi laporan tidak sesuai latihan.');
      const question=await this.db.getRepository(QuizQuestion).findOneBy({id:questionId});
      if(!question || questionHash(question)!==proof.hash)throw new ConflictException('Versi soal berubah. Mulai latihan baru.');
      // Historical guest reports remain valid after suspension; do not reopen publication.
      const verse=question.quran?this.corpus.resolve(question.quran):null;
      snapshot={questionId:question.id,stableId:question.stableId,contentVersion:question.contentVersion,contentHash:proof.hash,lessonId:question.lessonId,
        conceptId:question.conceptId,conceptLabel:question.conceptLabel,type:question.type,prompt:question.prompt,options:question.options,correctAnswer:question.correctAnswer,explanation:question.explanation,sources:question.sources,verse,review:question.review,generation:question.generation,sourceApprovalId:question.sourceApprovalId};
    }
    const description=(input.description || '').trim(),requestHash=sha256(JSON.stringify([userId,questionId,input.questionVersion,attemptId,input.category,description]));
    await this.db.getRepository(QuestionReport).createQueryBuilder().insert().values({id:input.requestId,questionId,questionVersion:input.questionVersion,attemptId,reporterUserId:userId,
      category:input.category,description,status:'OPEN',priority:['QURAN_TEXT_REFERENCE','HIGHLIGHT_MISMATCH'].includes(input.category)?'HIGH':'NORMAL',requestHash,snapshot}).orIgnore().execute();
    const saved=await this.db.getRepository(QuestionReport).findOneByOrFail({id:input.requestId});
    if(saved.requestHash!==requestHash)throw new ConflictException('Identitas laporan sudah digunakan. Buka formulir laporan baru.');
    return thanks;
  }
  // Internal CLI only: no public list or review controller exists.
  async list(filters:{status?:FeedbackStatus;questionId?:string;category?:FeedbackCategory}={}){
    return this.db.getRepository(QuestionReport).find({where:filters,order:{priority:'ASC',createdAt:'ASC'},take:50});
  }
  async review(id:string,status:Exclude<FeedbackStatus,'OPEN'>,actor:string,note:string){
    if(!['IN_REVIEW','RESOLVED','REJECTED'].includes(status)||!actor.trim()||actor.length>200||note.length>2000||(['RESOLVED','REJECTED'].includes(status)&&!note.trim()))throw new BadRequestException('Status, identitas reviewer dan catatan resolusi diperlukan.');
    const result=await this.db.getRepository(QuestionReport).update(id,{status,reviewedAt:new Date(),reviewedBy:actor,updatedAt:new Date(),resolutionNote:note.trim()||null});
    if(!result.affected)throw new NotFoundException('Laporan tidak ditemukan.');
  }
  async quarantine(id:string,suspend:boolean,actor:string,reason:string){
    if(!actor.trim()||actor.length>200||!reason.trim()||reason.length>500)throw new BadRequestException('Identitas operator dan alasan diperlukan.');
    await this.db.transaction(async manager=>{
      const question=await manager.getRepository(QuizQuestion).findOne({where:{id},lock:{mode:'pessimistic_write'}});
      if(!question)throw new NotFoundException('Soal tidak ditemukan.');
      if(question.suspended===suspend)return;
      if(!suspend && (question.reviewStatus!=='PUBLISHED'||this.bank.validate(question).length))throw new ConflictException('Validasi publikasi belum terpenuhi.');
      const moderation=suspend?{at:new Date().toISOString(),by:actor,reason}:{...question.moderation!,releasedAt:new Date().toISOString(),releasedBy:actor,releaseNote:reason};
      await manager.getRepository(QuizQuestion).update(id,{suspended:suspend,moderation,updatedAt:new Date()});
    });
  }
}
