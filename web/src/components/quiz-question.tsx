"use client";
import {useEffect,useRef} from 'react';
import {CheckCircle2,RotateCcw,Lightbulb,ArrowRight,BookOpenText} from 'lucide-react';
import type {PublicQuestion,QuestionFeedback} from '@/lib/quiz';
import {QuestionReport} from './question-report';

export function QuestionVerse({verse}:{verse:PublicQuestion['verse']}) {
  if(!verse)return null;
  return <figure className="quiz-verse"><figcaption>QS. {verse.surah}:{verse.ayah} <span>Perhatikan bagian yang ditandai</span></figcaption><p lang="ar" dir="rtl">{verse.text.slice(0,verse.start)}<mark>{verse.text.slice(verse.start,verse.end)}</mark>{verse.text.slice(verse.end)}</p><small>{verse.edition}</small></figure>;
}
export function QuestionChoices({question,selected,busy,onSelect}:{question:PublicQuestion;selected:string|null;busy:boolean;onSelect:(id:string)=>void}) {
  return <fieldset className="quiz-choices" disabled={busy}><legend>{question.prompt}</legend><QuestionVerse verse={question.verse}/>{question.options.map((option,index)=><label key={option.id} className={`quiz-option ${selected===option.id?'is-selected':''}`}><input type="radio" name={`question-${question.id}`} value={option.id} checked={selected===option.id} onChange={()=>onSelect(option.id)}/><span className="quiz-option-letter" aria-hidden="true">{String.fromCharCode(65+index)}</span><span dir="auto">{option.label}</span>{selected===option.id && <span className="quiz-selected-label">Dipilih</span>}</label>)}</fieldset>;
}
export function AnswerReview({question,number,focus=false,reporting}:{question:QuestionFeedback;number?:number;focus?:boolean;reporting?:{attemptId:string}|{token:string}|null}) {
  const heading=useRef<HTMLHeadingElement>(null);
  useEffect(()=>{if(focus)heading.current?.focus();},[focus,question.id]);
  const selected=question.options.find(o=>o.id===question.selectedOptionId)!,correct=question.options.find(o=>o.id===question.correctOptionId)!;
  return <article className={`quiz-answer-review ${question.correct?'is-correct':'needs-practice'}`}>
    <div className="quiz-review-status">{question.correct?<CheckCircle2 size={17}/>:<RotateCcw size={17}/>}<span>{number?`Soal ${number} · `:''}{question.correct?'Benar':'Perlu dilatih kembali'}</span></div>
    <h3 ref={heading} tabIndex={focus?-1:undefined}>{question.prompt}</h3><QuestionVerse verse={question.verse}/>
    <div className={`answer-comparison ${question.correct?'answer-matched':''}`}><div className={question.correct?'answer-correct':'answer-selected'}><span>{question.correct?<CheckCircle2 size={14}/>:<RotateCcw size={14}/>}Jawaban Anda</span><strong dir="auto">{selected.label}</strong></div>{!question.correct&&<><ArrowRight className="answer-comparison-arrow" size={18}/><div className="answer-correct"><span><CheckCircle2 size={14}/>Jawaban yang tepat</span><strong dir="auto">{correct.label}</strong></div></>}</div>
    <div className="quiz-explanation"><span className="section-kicker"><Lightbulb size={16}/>MENGAPA DEMIKIAN?</span><p>{question.explanation}</p></div>
    {question.validation==='AUTOMATED_SOURCE' && <p className="quiz-expiry">Validasi otomatis dari materi dan anotasi aplikasi · belum review ahli tajwid.</p>}
    <details className="answer-source-details"><summary><BookOpenText size={15}/>Sumber &amp; versi materi<span>Versi {question.contentVersion}</span></summary><ul className="quiz-sources">{question.sources.map((s,index)=><li key={index}>{s.url?<a href={s.url} target="_blank" rel="noreferrer">{s.title}</a>:s.title} · {s.location}</li>)}</ul></details>
    {reporting && <QuestionReport questionId={question.questionId} version={question.contentVersion} context={reporting}/>}
  </article>;
}
