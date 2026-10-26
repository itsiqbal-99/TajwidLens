import {randomInt} from 'node:crypto';
import type {QuestionContent,QuestionSnapshot} from './question.types';
import type {PublicQuestion,QuestionFeedback} from '../../../../shared/quiz';

export function shuffled<T>(values:readonly T[],integer:(max:number)=>number=randomInt):T[] {
  const result=[...values];
  for(let index=result.length-1;index>0;index--){const other=integer(index+1);[result[index],result[other]]=[result[other],result[index]];}
  return result;
}
export function selectQuestions<T extends Pick<QuestionContent,'id'|'type'>>(bank:readonly T[],previous:ReadonlySet<string>=new Set()):T[] {
  if(bank.length<7)throw new Error('Insufficient published question bank');
  const candidates=shuffled(bank).sort((a,b)=>Number(previous.has(a.id))-Number(previous.has(b.id)));
  // Some lessons teach foundations absent from the annotation taxonomy; use their actual theory questions.
  const chosen=['MULTIPLE_CHOICE','TAJWID_IDENTIFICATION'].flatMap(type=>{const question=candidates.find(q=>q.type===type);return question?[question]:[];});
  for(const question of candidates)if(chosen.length<7 && !chosen.some(item=>item.id===question.id))chosen.push(question);
  if(chosen.length!==7 || new Set(chosen.map(q=>q.id)).size!==7)throw new Error('Question selection is not unique');
  return shuffled(chosen);
}
export function scoreAnswers(correctCount:number,total:number) {
  if(!Number.isInteger(correctCount)||![1,7].includes(total)||correctCount<0||correctCount>total)throw new Error('Invalid evaluation count');
  return {correctCount,totalQuestions:total,percentage:Math.round(correctCount/total*10000)/100,passed:correctCount>=(total===7?6:1)};
}
export function publicQuestion(snapshot:QuestionSnapshot,id:string):PublicQuestion {
  return {id,type:snapshot.type,prompt:snapshot.prompt,options:snapshot.options.map(option=>({id:option.id,label:option.label})),verse:snapshot.verse};
}
export function feedback(snapshot:QuestionSnapshot,id:string,answer:string):QuestionFeedback {
  return {...publicQuestion(snapshot,id),questionId:snapshot.questionId,selectedOptionId:answer,correctOptionId:snapshot.correctAnswer,
    correct:answer===snapshot.correctAnswer,explanation:snapshot.explanation,sources:snapshot.sources,contentVersion:snapshot.contentVersion,
    ...(snapshot.generation && !snapshot.review?{validation:'AUTOMATED_SOURCE' as const}:{})};
}
