import {BadRequestException,ConflictException,ForbiddenException,GoneException,Inject,Injectable,ServiceUnavailableException} from '@nestjs/common';
import {createHmac,randomUUID,timingSafeEqual} from 'node:crypto';
import {DataSource} from 'typeorm';
import {isUUID} from 'class-validator';
import type {DetectiveView,DetectiveAnswer} from '../../../../shared/quiz';
import {QuizQuestion} from './quiz.entity';
import {QuestionBankService,questionHash} from './question-bank.service';
import {QuizService} from './quiz.service';
import {feedback,publicQuestion,shuffled} from './engine';
import {FeedbackService} from './feedback.service';
import {DETECTIVE_KEY} from './question.types';

export {DETECTIVE_KEY} from './question.types';
interface Challenge {questionId:string;nonce:string;ownerId:string|null;expiresAt:number;optionOrder:string[];versionTag:string}

@Injectable()
export class DetectiveService {
  constructor(private db:DataSource,private bank:QuestionBankService,private quiz:QuizService,@Inject(DETECTIVE_KEY) private key:Buffer|null,private reports:FeedbackService) {}
  private mac(value:string) {
    if(!this.key)throw new ServiceUnavailableException('Latihan sedang disiapkan.');
    return createHmac('sha256',this.key).update(value).digest();
  }
  private tag(question:QuizQuestion) {return this.mac('question-version:'+questionHash(question)).toString('base64url');}
  private token(challenge:Challenge) {
    const encoded=Buffer.from(JSON.stringify(challenge)).toString('base64url');
    return encoded+'.'+this.mac('challenge:'+encoded).toString('base64url');
  }
  private decode(value:string):Challenge {
    if(typeof value!=='string'||value.length>2048||!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{43}$/.test(value))throw new BadRequestException('Tantangan tidak valid.');
    const [encoded,signature]=value.split('.'),given=Buffer.from(signature,'base64url'),expected=this.mac('challenge:'+encoded);
    if(given.length!==expected.length||!timingSafeEqual(given,expected))throw new BadRequestException('Tantangan tidak valid.');
    let challenge:Challenge;
    try{challenge=JSON.parse(Buffer.from(encoded,'base64url').toString('utf8')) as Challenge;}catch{throw new BadRequestException('Tantangan tidak valid.');}
    if(!challenge||!isUUID(challenge.questionId)||!isUUID(challenge.nonce)||(challenge.ownerId!==null&&!isUUID(challenge.ownerId))
      || !Number.isInteger(challenge.expiresAt)||!Array.isArray(challenge.optionOrder)||challenge.optionOrder.length>6||typeof challenge.versionTag!=='string')throw new BadRequestException('Tantangan tidak valid.');
    if(challenge.expiresAt<=Date.now())throw new GoneException('Latihan sudah berakhir. Ambil soal baru.');
    return challenge;
  }
  async next(ownerId:string|null,previousId?:string):Promise<DetectiveView> {
    if(!this.key)return {available:false,storage:ownerId?'account':'guest',challenge:null,message:'Latihan sedang dipersiapkan. Materi belajar tetap dapat dibaca.'};
    // Load the small lesson index, then validate one lesson instead of transferring the whole bank.
    const indexed=await this.db.getRepository(QuizQuestion).find({select:{lessonId:true},where:{reviewStatus:'PUBLISHED',suspended:false,type:'TAJWID_IDENTIFICATION'}});
    let question:QuizQuestion|undefined,fallback:QuizQuestion|undefined;
    for(const lessonId of shuffled([...new Set(indexed.map(q=>q.lessonId))])){
      const pool=(await this.bank.eligible(lessonId,this.db.manager)).filter(q=>q.type==='TAJWID_IDENTIFICATION');
      fallback??=pool[0];const alternatives=pool.filter(q=>q.id!==previousId);
      if(alternatives.length){question=shuffled(alternatives)[0];break;}
    }
    question??=fallback;
    if(!question)return {available:false,storage:ownerId?'account':'guest',challenge:null,message:'Latihan sedang menunggu soal identifikasi yang telah ditinjau. Materi belajar tetap dapat dibaca.'};
    const snapshot=this.bank.snapshot(question);
    const token=this.token({questionId:question.id,nonce:randomUUID(),ownerId,expiresAt:Date.now()+600000,optionOrder:snapshot.options.map(option=>option.id),versionTag:this.tag(question)});
    return {available:true,storage:ownerId?'account':'guest',message:ownerId?'Kesalahan dapat Anda latih kembali melalui Mistake Replay.':'Mode tamu: hasil latihan tidak disimpan.',challenge:{token,question:publicQuestion(snapshot,question.id)}};
  }
  async answer(ownerId:string|null,token:string,optionId:string):Promise<DetectiveAnswer> {
    const challenge=this.decode(token);
    if(challenge.ownerId!==ownerId)throw new ForbiddenException('Mulai latihan baru setelah berganti sesi akun.');
    const question=await this.db.getRepository(QuizQuestion).findOneBy({id:challenge.questionId});
    if(!question||question.suspended||question.type!=='TAJWID_IDENTIFICATION'||question.reviewStatus!=='PUBLISHED'||this.bank.validate(question).length||this.tag(question)!==challenge.versionTag)throw new ConflictException('Soal sedang diperbarui. Ambil latihan baru.');
    if(!question.options.some(option=>option.id===optionId)||challenge.optionOrder.length!==question.options.length
      || new Set(challenge.optionOrder).size!==question.options.length||challenge.optionOrder.some(id=>!question.options.some(option=>option.id===id)))throw new BadRequestException('Pilihan jawaban tidak valid.');
    if(ownerId){
      const result=await this.quiz.detective(ownerId,question,optionId,challenge.nonce);
      const response=result.result!.feedback[0];
      response.id=question.id;response.options=challenge.optionOrder.map(id=>question.options.find(option=>option.id===id)!);
      return {feedback:response,saved:true,needsReview:!response.correct,reporting:{attemptId:result.id}};
    }
    const snapshot=this.bank.snapshot(question);
    snapshot.options=challenge.optionOrder.map(id=>question.options.find(option=>option.id===id)!);
    const response=feedback(snapshot,question.id,optionId);
    return {feedback:response,saved:false,needsReview:false,reporting:{token:this.reports.guestReceipt(snapshot)}};
  }
}
