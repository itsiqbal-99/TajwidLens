"use client";
import {useEffect,useMemo,useState,type CSSProperties} from 'react';
import {ArrowRight,CheckCircle2,CircleAlert,Layers3,RotateCcw} from 'lucide-react';
import {loadTajweedSurah,tajweedRules} from '@/lib/tajweed-data';
import {buildDetectiveTargets} from '@/lib/detective-round';
import {getHukumColor,getHukumLabel} from '@/lib/tajweed-presentation';
import type {TajweedSurahPayload} from '@/data/tajweed-types';
import {ActionFeedback} from './action-feedback';

const rounds=[
  {ayah:3,hukum:['ikhfa-haqiqi-noon','raa-tarqeeq','madd-tabee-kalimi','izhar-halqi-tanween','tafkheem-rank-1-tahhan']},
  {ayah:4,hukum:['ikhfa-haqiqi-noon','raa-tarqeeq','noon-mushaddadah','madd-tabee-kalimi','tafkheem-rank-1-tahhan']},
];

export function MultiDetective(){
  const [payload,setPayload]=useState<TajweedSurahPayload>();
  const [round,setRound]=useState(0);
  const [active,setActive]=useState<string>();
  const [answers,setAnswers]=useState<Record<string,string>>({});
  const [error,setError]=useState('');
  const spec=rounds[round],verse=payload?.verses.find(item=>item.number===spec.ayah);
  const targets=useMemo(()=>verse?buildDetectiveTargets(verse,tajweedRules,spec.hukum):[],[verse,spec]);
  const activeId=active??targets[0]?.id,selected=targets.find(item=>item.id===activeId),answered=Object.keys(answers).length;
  const score=targets.filter(item=>answers[item.id]===item.rule.hukumId).length;
  useEffect(()=>{let live=true;loadTajweedSurah(113).then(data=>{if(live){setRound(Math.floor(Math.random()*rounds.length));setPayload(data);}},reason=>{if(live)setError(reason instanceof Error?reason.message:'Latihan tidak dapat dimuat.');});return()=>{live=false};},[]);
  const next=()=>setActive(targets.find(item=>answers[item.id]===undefined)?.id);
  const restart=()=>{setRound(value=>rounds.length>1?(value+1+Math.floor(Math.random()*(rounds.length-1)))%rounds.length:value);setAnswers({});setActive(undefined);};
  if(error)return <section className="assessment-card" role="alert"><h2>Mode Telusuri Ayat belum dapat dimuat.</h2><p>{error}</p></section>;
  if(!payload||!verse||targets.length<4)return <section className="assessment-card"><ActionFeedback state="pending">Menyiapkan peta hukum…</ActionFeedback></section>;
  return <section className="assessment-card multi-detective">
    <div className="multi-detective-heading"><div><span className="section-kicker"><Layers3 size={15}/> MODE TELUSURI AYAT · MENENGAH</span><h2>Temukan hukum-hukum dalam satu ayat.</h2><p>Klik setiap tanda bernomor, lalu tentukan hukum bacaannya. Nama hukum ditulis dalam istilah yang umum dipakai di Indonesia.</p></div><div className="multi-progress" aria-label={`${answered} dari ${targets.length} tanda dijawab`}><strong>{answered}/{targets.length}</strong><span>tanda dijawab</span></div></div>
    <div className="multi-track" aria-hidden="true">{targets.map(item=><span key={item.id} className={answers[item.id]!==undefined?'done':''}/>)}</div>
    <figure className="multi-verse"><figcaption>QS. Al-Falaq · 113:{verse.number}<span>Pilih tanda pada ayat</span></figcaption><p lang="ar" dir="rtl">{targets.flatMap((item,index)=>{const before=verse.text.slice(index?targets[index-1].end:0,item.start),answer=answers[item.id],correct=answer===item.rule.hukumId;return [before,<button type="button" key={item.id} aria-label={`Tanda ${index+1}: ${item.quote}`} aria-pressed={activeId===item.id} className={`${activeId===item.id?'active ':''}${answer!==undefined?(correct?'correct':'wrong'):''}`} style={{'--target-color':getHukumColor(item.rule)} as CSSProperties} onClick={()=>setActive(item.id)}>{item.quote}<sup>{index+1}</sup></button>];}).concat(verse.text.slice(targets.at(-1)!.end))}</p><small>{payload.source.displayEdition}</small></figure>
    {answered===targets.length?<div className="multi-result"><CheckCircle2 size={24}/><div><strong>{score} dari {targets.length} tepat</strong><p>{score===targets.length?'Semua tanda berhasil dikenali.':'Tinjau tanda yang berwarna jingga, lalu coba ayat berikutnya.'}</p></div><button className="button button-primary" onClick={restart}>Ayat berikutnya<ArrowRight size={16}/></button></div>:selected&&<div className="multi-question"><div><span>TANDA {targets.indexOf(selected)+1}</span><strong>Hukum apa yang berlaku pada <b lang="ar" dir="rtl">{selected.quote}</b>?</strong></div><div className="multi-options">{targets.map(item=>{const picked=answers[selected.id],id=item.rule.hukumId;return <button type="button" key={id} disabled={picked!==undefined} className={picked===id?(id===selected.rule.hukumId?'correct':'wrong'):''} onClick={()=>setAnswers(value=>({...value,[selected.id]:id}))}>{getHukumLabel(item.rule)}</button>})}</div>{answers[selected.id]!==undefined&&<div className={`multi-feedback ${answers[selected.id]===selected.rule.hukumId?'correct':'wrong'}`}>{answers[selected.id]===selected.rule.hukumId?<CheckCircle2 size={18}/>:<CircleAlert size={18}/>}<p><strong>{answers[selected.id]===selected.rule.hukumId?'Tepat.':'Belum tepat.'}</strong> {getHukumLabel(selected.rule)}. {answers[selected.id]===selected.rule.hukumId?'Lanjutkan ke tanda berikutnya.':'Perhatikan pemicu dan posisi huruf pada tanda ini.'}</p><button onClick={next}>Lanjut<ArrowRight size={15}/></button></div>}</div>}
    <button className="multi-reset" onClick={()=>{setAnswers({});setActive(targets[0]?.id)}}><RotateCcw size={14}/>Ulangi ayat ini</button>
  </section>;
}
