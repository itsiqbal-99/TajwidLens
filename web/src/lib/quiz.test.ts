import {expect,it} from 'vitest';
import {readAvailability,readAttempt,readDetective,readMistakes} from './quiz';
const id='00000000-0000-4000-8000-000000000001';
it('accepts the genuine empty content gate, without inventing questions',()=>{
  expect(readAvailability({lessonId:'pengantar',available:false,eligibleCount:0,requiredQuestions:7,reason:'INSUFFICIENT_PUBLISHED',message:'Menunggu review',resumeAttemptId:null}).available).toBe(false);
  expect(readDetective({available:false,storage:'guest',message:'Menunggu review',challenge:null}).challenge).toBeNull();
  for(const data of [null,{}, {available:true,storage:'guest',message:'Ready',challenge:null}])expect(()=>readDetective(data)).toThrow();
});
it('validates persisted drafts and server results before showing completion',()=>{
  const questions=Array.from({length:7},(_,i)=>({id:id.slice(0,-1)+(i+1),type:'MULTIPLE_CHOICE',prompt:'Fixture',options:[{id:'a',label:'A'},{id:'b',label:'B'}],verse:null,selectedOptionId:null}));
  const draft={id,lessonId:'pengantar',mode:'LESSON_QUIZ',status:'IN_PROGRESS',createdAt:'2026-10-25T00:00:00Z',expiresAt:'2026-10-26T00:00:00Z',submittedAt:null,questions,result:null};
  expect(readAttempt(draft).result).toBeNull();
  for(const d of [{...draft,questions:questions.slice(1)},{...draft,result:{passed:true}},{...draft,status:'SUBMITTED'},{...draft,questions:questions.map(q=>({...q,selectedOptionId:'c'}))}])expect(()=>readAttempt(d)).toThrow();
  const result={correctCount:6,totalQuestions:7,percentage:85.71,passed:true,completionVerified:true,feedback:questions.map((q,i)=>({...q,questionId:q.id,selectedOptionId:i===6?'b':'a',correctOptionId:'a',correct:i!==6,explanation:'Fixture explanation',sources:[{title:'Fixture',location:'Test'}],contentVersion:1}))};
  expect(readAttempt({...draft,status:'SUBMITTED',submittedAt:'2026-10-25T01:00:00Z',result}).result!.completionVerified).toBe(true);
  expect(()=>readAttempt({...draft,status:'SUBMITTED',submittedAt:'2026-10-25T01:00:00Z',result:{...result,correctCount:5}})).toThrow();
});
it('validates optional reviews and never manufactures a successful empty response',()=>{
  expect(readMistakes({needsReviewCount:0,items:[],nextCursor:null}).items).toHaveLength(0);
  for(const d of [null,{}, {needsReviewCount:-1,items:[],nextCursor:null}])expect(()=>readMistakes(d)).toThrow();
});
