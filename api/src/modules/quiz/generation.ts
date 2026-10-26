import {createHash} from 'node:crypto';
import {lessonCatalog} from '../learning/catalog';
import {QuizCorpus,sha256} from './corpus';
import {QuestionContent,GenerationProvenance} from './question.types';
import {questionHash,QuestionBankService} from './question-bank.service';
import type {LessonStudy,LearningReference} from '../../../../shared/learning-content';

export interface GenerationLesson {id:string;title:string;category:string;condition:string;pronunciation:string;commonMistake:string}
export type ComprehensionCase=[id:string,objectiveId:string,prompt:string,correct:string,distractors:string[],explanation:string,skill:'APPLY'|'DISTINGUISH'|'DIAGNOSE'];
export interface GenerationRule {id:string;hukumId:string;hukumAr:string;categoryId:string;category:string;topicId:string;topic:string;ruleAr:string}
export interface LessonRuleMap {lessonId:string;group:string;field:'categoryId'|'hukumId';value:string}
export interface GenerationSources {
  lessons:readonly GenerationLesson[];rules:Record<string,GenerationRule>;rawRules:{id:string;status:string;needsReview?:boolean}[];
  mapping:LessonRuleMap[];sourceVersion:string;files:Record<string,string>;corpus:QuizCorpus;commit:string;
  cases:Record<string,ComprehensionCase[]>;studies:readonly LessonStudy[];references:readonly LearningReference[];
}
const sectionRecall=/menurut bagian|tercantum pada bagian|pernyataan mana yang tercantum/i;
const nonempty=(value:unknown)=>typeof value==='string'&&!!value.trim();
function studySources(source:GenerationSources,study:LessonStudy){
  if(!study.references?.length)throw new Error('Missing study source: '+study.lessonId);
  return study.references.map(ref=>{
    const reference=source.references.find(r=>r.id===ref.id);
    if(!reference||!nonempty(ref.location)||!reference.url.startsWith('https://')
      ||(ref.page!==undefined&&(!Number.isInteger(ref.page)||ref.page<1||(reference.pages!==undefined&&ref.page>reference.pages))))throw new Error('Invalid study reference: '+study.lessonId);
    return {title:reference.title,location:ref.location+(ref.page?` · PDF mulai halaman ${ref.page}`:''),url:reference.url+(ref.page?`#page=${ref.page}`:'')};
  });
}
const groups:Record<string,{field:'categoryId'|'hukumId';values:string[];scope:string}>={
  noon:{field:'categoryId',values:['izhar-halqi','idgham-bi-ghunnah','idgham-bila-ghunnah','iqlab','ikhfa-haqiqi'],scope:'hukum dasar nun sukun dan tanwin'},
  meem:{field:'categoryId',values:['idgham-shafawi','ikhfa-shafawi','izhar-shafawi'],scope:'hukum mim sukun'},
  ghunnah:{field:'hukumId',values:['noon-mushaddadah','meem-mushaddadah'],scope:'huruf bertasydid yang mengandung ghunnah'},
  mad:{field:'categoryId',values:['madd-tabee','leen-letters','madd-far-hamz','madd-lazim'],scope:'kategori mad dari pilihan berikut'},
  raa:{field:'hukumId',values:['raa-tafkheem','raa-tarqeeq'],scope:'ketebalan bunyi ra'},
};
function uuid(name:string){
  const hash=createHash('sha1').update(Buffer.from('15288d4d40e14b8cb607900cf75240b2','hex')).update(name).digest();
  hash[6]=(hash[6]&15)|80;hash[8]=(hash[8]&63)|128;
  const h=hash.subarray(0,16).toString('hex');return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;
}
const bodyHash=(q:QuestionContent)=>questionHash({...q,contentVersion:1});
export function generationFingerprint(q:QuestionContent){
  return q.quran?sha256(JSON.stringify([q.type,q.quran.surah,q.quran.ayah,q.quran.start,q.quran.end,q.quran.ruleId])):sha256(JSON.stringify([q.lessonId,q.generation?.sourceField]));
}
export function generateCandidates(source:GenerationSources,previous:readonly QuestionContent[]=[]){
  const questions:QuestionContent[]=[],excluded:Record<string,number>={ambiguous:0,unsupported:0,invalidRange:0,duplicate:0,sourceConflict:0};
  const known=new Set(lessonCatalog.map(l=>l.id));
  if(source.lessons.length!==known.size||source.lessons.some(l=>!known.has(l.id))||new Set(source.lessons.map(l=>l.id)).size!==source.lessons.length)throw new Error('Invalid/duplicate lesson source');
  if(source.studies.length!==known.size||new Set(source.studies.map(s=>s.lessonId)).size!==known.size||source.studies.some(s=>!known.has(s.lessonId))||Object.keys(source.cases).some(id=>!known.has(id)))throw new Error('Invalid study/case coverage');
  const studyByLesson=new Map(source.studies.map(s=>[s.lessonId,s]));
  const referencesByLesson=new Map(source.studies.map(s=>[s.lessonId,studySources(source,s)]));
  for(const map of source.mapping)if(!known.has(map.lessonId)||!groups[map.group]||!['categoryId','hukumId'].includes(map.field))throw new Error('Invalid lesson-rule mapping');
  const mappingSha256=sha256(JSON.stringify(source.mapping));
  const rawRules=new Map(source.rawRules.map(r=>[r.id,r]));
  const rules=Object.values(source.rules).filter(r=>{const raw=rawRules.get(r.id);return raw?.status==='stable'&&!raw.needsReview;});
  const add=(key:string,content:Omit<QuestionContent,'id'|'stableId'|'contentVersion'|'reviewStatus'|'review'>)=>{
    const stableId='generated-'+sha256(key).slice(0,40);
    const base={...content,id:'',stableId,contentVersion:1,reviewStatus:'DRAFT' as const,review:null,sourceApprovalId:null};
    const old=previous.filter(q=>q.stableId===stableId).sort((a,b)=>b.contentVersion-a.contentVersion)[0];
    const version=old?(bodyHash(old)===bodyHash(base)?old.contentVersion:old.contentVersion+1):1;
    questions.push({...base,contentVersion:version,id:uuid(stableId+':'+version+':'+bodyHash(base))});
  };
  const provenance=(method:GenerationProvenance['method'],path:string,field:string,value:string):GenerationProvenance=>({method,templateVersion:1,sourceVersion:source.sourceVersion,
    sourcePath:path,sourceSha256:source.files[path],sourceField:field,sourceValueSha256:sha256(value),mappingSha256,
    validation:{status:'VALIDATION_PASSED',checks:['structure','source-hash','lesson-rule-map','single-answer','distractor-set','duplicate-fingerprint','corpus-graphemes']}});
  for(const lesson of source.lessons){
    const study=studyByLesson.get(lesson.id)!,cases=source.cases[lesson.id],seenIds=new Set<string>(),seenPrompts=new Set<string>();
    const sources=referencesByLesson.get(lesson.id)!;
    if(!Array.isArray(cases)||!cases.length)throw new Error('Missing comprehension cases: '+lesson.id);
    for(const item of cases){
      if(!Array.isArray(item)||item.length!==7)throw new Error('Invalid comprehension case: '+lesson.id);
      const [id,objectiveId,prompt,correct,distractors,explanation,skill]=item,objective=study.concepts.find(c=>c.id===objectiveId);
      if(!/^[a-z0-9-]{1,60}$/.test(id)||!objective||!nonempty(prompt)||sectionRecall.test(prompt)||!nonempty(correct)
        ||!Array.isArray(distractors)||distractors.length!==3||!distractors.every(nonempty)||!nonempty(explanation)||!['APPLY','DISTINGUISH','DIAGNOSE'].includes(skill)
        ||seenIds.has(id)||seenPrompts.has(prompt.trim().toLowerCase()))throw new Error('Invalid/repeated comprehension objective or scenario: '+lesson.id+'/'+id);
      seenIds.add(id);seenPrompts.add(prompt.trim().toLowerCase());
      const labels=[correct,...distractors];
      if(new Set(labels.map(l=>l.trim().toLowerCase())).size!==4)throw new Error('Ambiguous/repeated comprehension choices: '+id);
      const path='api/content/comprehension-cases.json',generation=provenance('CONCEPT_APPLICATION_V1',path,lesson.id+'.'+id,JSON.stringify(item));
      generation.validation.checks.push('learning-objective','applied-scenario','primary-source-reference');
      add('concept:'+lesson.id+':'+id,{lessonId:lesson.id,conceptId:lesson.id+'-'+objectiveId,conceptLabel:lesson.title+' · '+objective.title,type:'MULTIPLE_CHOICE',prompt,
        options:labels.map(label=>({id:'choice-'+sha256(lesson.id+':'+id+':'+label).slice(0,20),label})),correctAnswer:'choice-'+sha256(lesson.id+':'+id+':'+correct).slice(0,20),
        explanation,sources:[...sources,{title:'TajwidLens — '+objective.title,location:'shared/learning-content.json#'+lesson.id+'.'+objectiveId+' · SHA-256 '+source.files['shared/learning-content.json']}],quran:null,generation});
    }
  }
  const pools=new Map<string,{lessonId:string;key:string;order:string;content:Omit<QuestionContent,'id'|'stableId'|'contentVersion'|'reviewStatus'|'review'>}[]>();
  const seen=new Set<string>();
  for(const file of source.corpus.metadata().files){
    for(const verse of source.corpus.verses(file.surah))for(const annotation of verse.annotations){
      const rule=source.rules[annotation.ruleId];if(!rule||!rules.some(r=>r.id===rule.id)){excluded.unsupported++;continue;}
      // Upstream calls the iqlab trigger mim here; lesson/rule sources conflict. Never publish that rule.
      if(rule.id==='iqlab-noon.1'){excluded.sourceConflict++;continue;}
      const mappings=source.mapping.filter(map=>rule[map.field]===map.value);
      if(mappings.length!==1){excluded.unsupported++;continue;}const map=mappings[0],group=groups[map.group];
      const groupRules=rules.filter(r=>group.values.includes(r[group.field]));
      const optionRules=group.values.map(value=>groupRules.find(r=>r[group.field]===value)).filter((r):r is GenerationRule=>!!r);
      if(optionRules.length<2)continue;
      const overlaps=verse.annotations.filter(a=>a.start<annotation.end&&a.end>annotation.start).map(a=>source.rules[a.ruleId]).filter((r):r is GenerationRule=>!!r);
      if(overlaps.some(r=>group.values.includes(r[group.field])&&r[group.field]!==rule[group.field]) || (map.group==='raa'&&overlaps.some(r=>r.categoryId==='raa-rules'&&!group.values.includes(r.hukumId)))){excluded.ambiguous++;continue;}
      const quran={surah:file.surah,ayah:verse.number,start:annotation.start,end:annotation.end,offsetUnit:'utf16' as const,corpusVersion:source.corpus.metadata().source.corpusVersion,
        editionSha256:source.corpus.metadata().source.displayEditionSha256,verseSha256:sha256(verse.text),annotationId:annotation.id,ruleId:rule.id};
      const key=JSON.stringify([file.surah,verse.number,annotation.start,annotation.end,rule.id]);if(seen.has(key)){excluded.duplicate++;continue;}seen.add(key);
      const lesson=source.lessons.find(l=>l.id===map.lessonId)!;
      const generation=provenance('ANNOTATION_V1','web/src/data/tajweed-rules-generated.json',rule.id,rule.ruleAr);
      generation.annotationSource={provider:'Quran.ws Tajweed',commit:source.commit,payloadSha256:file.sha256,confidence:'NOT_PROVIDED'};
      const content={lessonId:lesson.id,conceptId:rule[group.field],conceptLabel:group.field==='hukumId'?rule.hukumAr:rule.category,type:'TAJWID_IDENTIFICATION' as const,
        prompt:`Pada kelompok ${group.scope}, pilih hukum yang sesuai dengan bagian ayat yang ditandai.`,
        options:optionRules.map(r=>({id:r[group.field],label:group.field==='hukumId'?r.hukumAr:r.category})),correctAnswer:rule[group.field],
        explanation:`Bagian yang ditandai merujuk pada ${group.field==='hukumId'?rule.hukumAr:rule.category}. ${lesson.condition}\n\nCara membacanya: ${lesson.pronunciation}\n\nYang perlu dihindari: ${lesson.commonMistake} Pilihan hukum lain harus diperiksa dari pemicunya sendiri; tidak cukup menyamakan semua huruf yang bertanda.`,
        sources:[{title:'Quran.ws Tajweed '+rule.id,location:'corpus '+quran.corpusVersion+' · annotation '+annotation.id+' · payload SHA-256 '+file.sha256,url:'https://github.com/quran-ws/quran-tajweed/tree/'+source.commit},
          ...referencesByLesson.get(lesson.id)!,
          {title:'TajwidLens — '+lesson.title,location:'web/src/data/lessons.ts#'+lesson.id+'.condition · SHA-256 '+source.files['web/src/data/lessons.ts']}],quran,generation};
      const pool=pools.get(lesson.id) || [];pool.push({lessonId:lesson.id,key,order:sha256(key),content});pools.set(lesson.id,pool);
    }
  }
  for(const lesson of source.lessons){
    const pool=(pools.get(lesson.id)||[]).sort((a,b)=>a.order.localeCompare(b.order)),verses=new Set<string>();
    let count=0;
    // Prefer distinct ayahs; do not pad a quota by rewording the same source fact.
    for(const candidate of pool){const verse=candidate.content.quran!,key=verse.surah+':'+verse.ayah;if(verses.has(key))continue;
      if(count>=14)break;try{source.corpus.resolve(verse);}catch{excluded.invalidRange++;continue;}
      verses.add(key);add('annotation:'+candidate.key,candidate.content);count++;}
  }
  return {questions,excluded,opportunities:Object.fromEntries([...pools].map(([id,pool])=>[id,pool.length]))};
}
export function validateGenerated(questions:readonly QuestionContent[],source:GenerationSources,bank:QuestionBankService){
  const expected=new Map(generateCandidates(source).questions.map(q=>[q.stableId,q])),seen=new Set<string>();
  return questions.map(question=>{
    const errors=bank.validate(question),wanted=expected.get(question.stableId);
    if(!question.generation || question.generation.sourceVersion!==source.sourceVersion)errors.push('source version/provenance mismatch');
    if(!wanted || bodyHash(question)!==bodyHash(wanted))errors.push('source/template/mapping/answer/explanation mismatch');
    const fingerprint=generationFingerprint(question);if(seen.has(fingerprint))errors.push('semantic-equivalent duplicate');seen.add(fingerprint);
    return {id:question.id,lessonId:question.lessonId,passed:errors.length===0,errors,readiness:bank.sourceVerified(question)?'SOURCE_VERIFIED':'EXPERT_REVIEW_REQUIRED'};
  });
}
