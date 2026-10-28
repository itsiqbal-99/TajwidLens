import {Injectable,ServiceUnavailableException} from '@nestjs/common';
import {DataSource} from 'typeorm';
import {lessonCatalog} from '../modules/learning/catalog';
import {QuestionBankService} from '../modules/quiz/question-bank.service';
import {QuizCorpus} from '../modules/quiz/corpus';

@Injectable()
export class ReadinessService {
  private cached:{until:number;value:Promise<{status:string;lessonsReady:number;detectiveReady:boolean}>}|null=null;
  constructor(private db:DataSource,private bank:QuestionBankService,private corpus:QuizCorpus) {}

  check() {
    if(this.cached && this.cached.until>Date.now())return this.cached.value;
    const value=this.verify().catch(()=>{throw new ServiceUnavailableException('Deployment belum siap.');});
    this.cached={until:Date.now()+60000,value};
    return value;
  }

  private async verify() {
    await this.db.query('SELECT 1');
    if(await this.db.showMigrations())throw new Error('Pending migrations');
    this.corpus.verse(1,1);
    const eligible=await this.bank.eligible();
    const lessonsReady=lessonCatalog.filter(lesson=>eligible.filter(q=>q.lessonId===lesson.id).length>=7).length;
    const detectiveReady=eligible.some(q=>q.type==='TAJWID_IDENTIFICATION');
    if(lessonsReady!==lessonCatalog.length || !detectiveReady)throw new Error('Question bank incomplete');
    return {status:'ready',lessonsReady,detectiveReady};
  }
}
