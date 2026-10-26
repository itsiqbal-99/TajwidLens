import {BadRequestException,ConflictException,Inject,Injectable,NotFoundException,Optional} from '@nestjs/common';
import {DataSource,EntityManager,In} from 'typeorm';
import {isUUID} from 'class-validator';
import {lessonCatalog} from '../learning/catalog';
import {QuizQuestion} from './quiz.entity';
import {QuizCorpus,sha256} from './corpus';
import {shuffled} from './engine';
import {QUESTION_REVIEWERS,SOURCE_APPROVALS,QuestionContent,QuestionSnapshot,Reviewer,SourceApproval,ReviewProvenance} from './question.types';

function canonical(value:unknown):string {
  if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
  if(value && typeof value==='object')return '{'+Object.entries(value).sort(([a],[b])=>a<b?-1:a>b?1:0).map(([key,value])=>JSON.stringify(key)+':'+canonical(value)).join(',')+'}';
  return JSON.stringify(value) ?? 'null';
}
export function questionHash(question:QuestionContent) {
  const {stableId,contentVersion,lessonId,conceptId,conceptLabel,type,prompt,options,correctAnswer,explanation,sources,quran}=question;
  return sha256(canonical({stableId,contentVersion,lessonId,conceptId,conceptLabel,type,prompt,options,correctAnswer,explanation,sources,quran,...(question.generation?{generation:question.generation}:{})}));
}
export function questionFingerprint(question:QuestionContent) {
  return sha256(canonical({lessonId:question.lessonId,type:question.type,prompt:question.prompt.trim().toLocaleLowerCase('id-ID'),quran:question.quran,
    labels:question.options.map(option=>option.label.trim().toLocaleLowerCase('id-ID')).sort()}));
}
const text=(value:unknown,max:number)=>typeof value==='string' && !!value.trim() && value.length<=max;

@Injectable()
export class QuestionBankService {
  constructor(private db:DataSource,private corpus:QuizCorpus,@Inject(QUESTION_REVIEWERS) private reviewers:readonly Reviewer[],@Optional() @Inject(SOURCE_APPROVALS) private approvals:readonly SourceApproval[]=[]) {}
  sourceVerified(question:QuestionContent) {
    const approval=this.approvals.find(a=>a.id===question.sourceApprovalId);
    if(approval && 'kind' in approval)return false;
    const reviewer=this.reviewers.find(r=>r.id===approval?.reviewerId);
    return !!(question.generation && approval && reviewer?.name && reviewer.qualification && reviewer.evidence && approval.evidence?.trim()
      && Number.isFinite(Date.parse(approval.reviewedAt)) && Date.parse(approval.reviewedAt)<=Date.now()
      && approval.sourceVersion===question.generation.sourceVersion && Array.isArray(approval.questionHashes) && approval.questionHashes.includes(questionHash(question)));
  }
  repositoryVerified(question:QuestionContent) {
    const approval=this.approvals.find(a=>a.id===question.sourceApprovalId),g=question.generation;
    return !!(process.env.NODE_ENV!=='production' && g && approval && 'kind' in approval
      && approval.kind==='REPOSITORY_DETERMINISTIC' && approval.environment==='development'
      && text(approval.authorization,2000) && text(approval.evidence,2000)
      && Number.isFinite(Date.parse(approval.authorizedAt)) && Date.parse(approval.authorizedAt)<=Date.now()
      && sha256(JSON.stringify(approval.files))===approval.sourceVersion && approval.sourceVersion===g.sourceVersion
      && approval.files[g.sourcePath]===g.sourceSha256 && approval.questionHashes.includes(questionHash(question)));
  }
  lesson(id:string) {
    const lesson=lessonCatalog.find(lesson=>lesson.id===id);
    if(!lesson)throw new NotFoundException('Materi tidak ditemukan.');
    return lesson;
  }
  validate(question:QuestionContent):string[] {
    const errors:string[]=[];
    if(!question || !isUUID(question.id) || !text(question.stableId,100) || !/^[a-z0-9][a-z0-9_-]*$/.test(question.stableId)
      || !Number.isInteger(question.contentVersion) || question.contentVersion<1)errors.push('identity/version');
    if(!lessonCatalog.some(lesson=>lesson.id===question?.lessonId))errors.push('lesson');
    if(!text(question?.conceptId,100)||!text(question?.conceptLabel,200)||!text(question?.prompt,1200)||!text(question?.explanation,4000))errors.push('concept/prompt/explanation');
    if(!['MULTIPLE_CHOICE','TAJWID_IDENTIFICATION'].includes(question?.type))errors.push('question type');
    const options=question?.options;
    if(!Array.isArray(options) || options.length<2 || options.length>6 || options.some(option=>!option || !text(option.id,50) || !/^[A-Za-z0-9_-]{1,50}$/.test(option.id) || !text(option.label,400))
      || new Set(options.map(option=>option.id)).size!==options.length || new Set(options.map(option=>option.label.trim().toLocaleLowerCase('id-ID'))).size!==options.length
      || !options.some(option=>option.id===question.correctAnswer))errors.push('options/correct answer');
    if(!Array.isArray(question?.sources)||!question.sources.length||question.sources.length>10
      || question.sources.some(source=>!source || !text(source.title,300)||!text(source.location,500)
        || (source.url!==undefined && (!text(source.url,1000)||!this.https(source.url)))))errors.push('sources');
    if(!['DRAFT','REVIEWED','PUBLISHED'].includes(question?.reviewStatus))errors.push('review status');
    if(question?.generation){
      const g=question.generation;
      if(!['LESSON_FIELD_V1','ANNOTATION_V1'].includes(g.method) || g.templateVersion!==1 || !/^[a-f0-9]{64}$/.test(g.sourceVersion)
        || !text(g.sourcePath,500) || !/^[a-f0-9]{64}$/.test(g.sourceSha256) || !text(g.sourceField,200) || !/^[a-f0-9]{64}$/.test(g.sourceValueSha256)
        || !/^[a-f0-9]{64}$/.test(g.mappingSha256) || g.validation?.status!=='VALIDATION_PASSED' || !Array.isArray(g.validation.checks) || !g.validation.checks.length
        || (g.method==='ANNOTATION_V1' && (!g.annotationSource || !text(g.annotationSource.provider,100) || !text(g.annotationSource.commit,100) || !/^[a-f0-9]{64}$/.test(g.annotationSource.payloadSha256))))errors.push('generation provenance');
    }
    if(question?.reviewStatus!=='DRAFT' && !(question?.reviewStatus==='PUBLISHED' && (this.sourceVerified(question)||this.repositoryVerified(question)))){
      const provenance=question?.review;
      const reviewer=this.reviewers.find(reviewer=>reviewer.id===provenance?.reviewerId);
      if(!reviewer || !text(reviewer.name,200)||!text(reviewer.qualification,1000)||!text(reviewer.evidence,2000)
        || !provenance || !text(provenance.evidence,2000) || !text(provenance.reviewedAt,40) || !Number.isFinite(Date.parse(provenance.reviewedAt))
        || Date.parse(provenance.reviewedAt)>Date.now())errors.push('trusted human review provenance');
    }
    if(question?.type==='TAJWID_IDENTIFICATION' && !question.quran)errors.push('Quran reference required');
    if(question?.quran){try{this.corpus.resolve(question.quran);}catch{errors.push('corpus/reference/highlight');}}
    return errors;
  }
  private https(value:string) {try{const url=new URL(value);return url.protocol==='https:' && !url.username && !url.password;}catch{return false;}}
  async eligible(lessonId?:string,manager:EntityManager=this.db.manager):Promise<QuizQuestion[]> {
    const rows=await manager.getRepository(QuizQuestion).find({where:{reviewStatus:'PUBLISHED',suspended:false,...(lessonId?{lessonId}:{})},order:{contentVersion:'DESC',id:'ASC'}});
    const stable=new Set<string>(),fingerprints=new Map<string,QuizQuestion|null>();
    for(const row of rows){
      if(stable.has(row.stableId))continue;
      stable.add(row.stableId);
      if(this.validate(row).length)continue;
      const fingerprint=questionFingerprint(row);
      if(!fingerprints.has(fingerprint))fingerprints.set(fingerprint,row);
      else {const old=fingerprints.get(fingerprint);if(old && old.options.find(option=>option.id===old.correctAnswer)?.label!==row.options.find(option=>option.id===row.correctAnswer)?.label)fingerprints.set(fingerprint,null);}
    }
    return [...fingerprints.values()].filter((question):question is QuizQuestion=>question!==null);
  }
  snapshot(question:QuizQuestion):QuestionSnapshot {
    if(question.suspended || question.reviewStatus!=='PUBLISHED' || this.validate(question).length)throw new BadRequestException('Soal belum memenuhi syarat publikasi.');
    return {questionId:question.id,stableId:question.stableId,contentVersion:question.contentVersion,contentHash:questionHash(question),lessonId:question.lessonId,
      conceptId:question.conceptId,conceptLabel:question.conceptLabel,type:question.type,prompt:question.prompt,options:shuffled(question.options),
      correctAnswer:question.correctAnswer,explanation:question.explanation,sources:question.sources,
      verse:question.quran?this.corpus.resolve(question.quran):null,review:question.review ?? null,...(question.generation?{generation:question.generation}:{}),...(question.sourceApprovalId?{sourceApprovalId:question.sourceApprovalId}:{})};
  }
  async import(questions:QuestionContent[]) {
    if(!Array.isArray(questions)||questions.length>1000)throw new BadRequestException('Format bank soal tidak valid.');
    const seen=new Set<string>();
    for(const question of questions){const errors=this.validate(question);if(errors.length)throw new BadRequestException('Question '+question?.id+': '+errors.join(', '));
      const key=question.stableId+':'+question.contentVersion;if(seen.has(key))throw new BadRequestException('Duplicate question version.');seen.add(key);}
    await this.db.transaction(async manager=>{
      const repository=manager.getRepository(QuizQuestion);
      const stored=questions.length?await repository.findBy({id:In(questions.map(q=>q.id))}):[];
      const existing=new Map(stored.map(q=>[q.id,q]));
      const fresh:Partial<QuizQuestion>[]=[];
      for(const question of questions){
        const old=existing.get(question.id);
        if(old){if(questionHash(old)!==questionHash(question))throw new BadRequestException('Question versions are immutable; create a new version.');continue;}
        const {id,stableId,contentVersion,lessonId,conceptId,conceptLabel,type,prompt,options,correctAnswer,explanation,sources,quran,reviewStatus,review,generation,sourceApprovalId}=question;
        fresh.push({id,stableId,contentVersion,lessonId,conceptId,conceptLabel,type,prompt,options,correctAnswer,explanation,sources,quran,reviewStatus,review,generation:generation ?? null,sourceApprovalId:sourceApprovalId ?? null});
      }
      if(fresh.length)await repository.insert(fresh);
    });
    return {imported:questions.length};
  }
  async publish(id:string|string[],sourceApprovalId:string|null,review?:ReviewProvenance){
    const ids=typeof id==='string'?[id]:id;
    if(!ids.length||ids.length>1000||new Set(ids).size!==ids.length||ids.some(id=>!isUUID(id)))throw new BadRequestException('Daftar versi soal tidak valid.');
    return this.db.transaction(async manager=>{
      const repository=manager.getRepository(QuizQuestion);
      const questions=await repository.createQueryBuilder('question').whereInIds(ids).orderBy('question.id','ASC').setLock('pessimistic_write').getMany();
      if(questions.length!==ids.length)throw new NotFoundException('Soal tidak ditemukan.');
      for(const question of questions){
        if(question.suspended)throw new ConflictException('Selesaikan review karantina sebelum publikasi.');
        const published={...question,reviewStatus:'PUBLISHED' as const,sourceApprovalId,review:review ?? question.review};
        if(this.validate(published).length)throw new BadRequestException('Bukti persetujuan sumber dan transformasi untuk versi ini belum lengkap.');
      }
      await repository.update(ids,{reviewStatus:'PUBLISHED',sourceApprovalId,...(review?{review}:{}),updatedAt:new Date()});
    });
  }
}
