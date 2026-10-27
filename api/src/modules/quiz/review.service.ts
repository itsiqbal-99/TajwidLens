import {BadRequestException,ConflictException,Injectable,NotFoundException} from '@nestjs/common';
import {isUUID} from 'class-validator';
import {DataSource} from 'typeorm';
import type {MistakeList} from '../../../../shared/quiz';
import {MistakeReview} from './quiz.entity';
import {QuestionBankService} from './question-bank.service';
import {QuizService} from './quiz.service';
import {shuffled} from './engine';

@Injectable()
export class ReviewService {
  constructor(private db:DataSource,private bank:QuestionBankService,private quiz:QuizService) {}
  async list(userId:string,cursor?:string):Promise<MistakeList> {
    const repository=this.db.getRepository(MistakeReview);
    const rank=`CASE WHEN review.status='NEEDS_REVIEW' THEN 0 ELSE 1 END`;
    const query=repository.createQueryBuilder('review').where('review.userId = :userId',{userId}).orderBy(rank,'ASC').addOrderBy('review.id','ASC').take(21);
    if(cursor){
      let position:{rank:number;id:string};
      try{position=JSON.parse(Buffer.from(cursor,'base64url').toString('utf8')) as typeof position;}catch{throw new BadRequestException('Cursor tidak valid.');}
      if(!position||![0,1].includes(position.rank)||!isUUID(position.id))throw new BadRequestException('Cursor tidak valid.');
      query.andWhere(`((${rank}) > :rank OR ((${rank}) = :rank AND review.id > :cursor))`,{rank:position.rank,cursor:position.id});
    }
    const [rows,needsReviewCount,questions]=await Promise.all([query.getMany(),repository.countBy({userId,status:'NEEDS_REVIEW'}),this.bank.eligible()]);
    const page=rows.slice(0,20);
    const last=page.at(-1);
    return {needsReviewCount,nextCursor:rows.length>20&&last?Buffer.from(JSON.stringify({rank:last.status==='NEEDS_REVIEW'?0:1,id:last.id})).toString('base64url'):null,items:page.map(row=>({
      id:row.id,lessonId:row.lessonId,conceptId:row.conceptId,conceptLabel:row.conceptLabel,status:row.status,
      lastMistakeAt:row.lastMistakeAt.toISOString(),improvedAt:row.improvedAt?.toISOString() ?? null,
      practiceAvailable:questions.some(question=>question.lessonId===row.lessonId&&question.conceptId===row.conceptId),
    }))};
  }
  async practice(userId:string,id:string) {
    const review=await this.db.getRepository(MistakeReview).findOneBy({id,userId});
    if(!review)throw new NotFoundException('Konsep latihan tidak ditemukan.');
    const questions=(await this.bank.eligible(review.lessonId)).filter(question=>question.conceptId===review.conceptId);
    if(!questions.length)throw new ConflictException('Latihan ulang sedang menunggu soal yang telah ditinjau.');
    const alternatives=questions.filter(question=>question.id!==review.lastQuestionId);
    return this.quiz.replay(userId,shuffled(alternatives.length?alternatives:questions)[0]);
  }
}
