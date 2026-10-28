"use client";
import {useEffect,useMemo,useState,type CSSProperties} from 'react';
import {ArrowRight,CheckCircle2,CircleAlert,Layers3,RotateCcw} from 'lucide-react';
import {loadTajweedSurah,tajweedIndex,tajweedRules} from '@/lib/tajweed-data';
import {buildDetectiveTargets} from '@/lib/detective-round';
import {getHukumColor,getHukumLabel} from '@/lib/tajweed-presentation';
import type {TajweedSurahPayload,TajweedVerse} from '@/data/tajweed-types';
import type {DetectiveTarget} from '@/lib/detective-round';
import {ActionFeedback} from './action-feedback';

type Round={payload:TajweedSurahPayload;verse:TajweedVerse;targets:DetectiveTarget[]};
const shuffle=<T,>(items:T[])=>items.map(value=>({value,order:Math.random()})).sort((a,b)=>a.order-b.order).map(item=>item.value);
async function randomRound():Promise<Round>{
  for(let attempt=0;attempt<12;attempt++){
    const summary=shuffle([...tajweedIndex.surahs])[0],payload=await loadTajweedSurah(summary.number);
    const candidates=shuffle(payload.verses.filter(verse=>verse.annotations.length>=4).map(verse=>{
      const ids=shuffle([...new Set(verse.annotations.map(item=>tajweedRules[item.ruleId]?.hukumId).filter(Boolean))]);
      return {verse,targets:buildDetectiveTargets(verse,tajweedRules,ids).slice(0,6)};
    }).filter(item=>item.targets.length>=4));
    if(candidates[0])return {payload,verse:candidates[0].verse,targets:candidates[0].targets};
  }
  throw new Error('Belum menemukan ayat dengan tanda tajwid yang cukup.');
}
export function MultiDetective(){
  const [round,setRound]=useState<Round>();const [active,setActive]=useState<string>();const [answers,setAnswers]=useState<Record<string,string>>({});const [error,setError]=useState('');
  const load=()=>{setRound(undefined);setAnswers({});setActive(undefined);setError('');void randomRound().then(setRound,reason=>setError(reason instanceof Error?reason.message:'Latihan tidak dapat dimuat.'));};
  useEffect(()=>{void Promise.resolve().then(load);},[]);
  const payload=round?.payload,verse=round?.verse,targets=useMemo(()=>round?.targets??[],[round]),activeId=active??targets[0]?.id,selected=targets.find(item=>item.id===activeId),answered=Object.keys(answers).length,score=targets.filter(item=>answers[item.id]===item.rule.hukumId).length;
  const next=()=>setActive(targets.find(item=>answers[item.id]===undefined)?.id);
  const textNodes=useMemo(()=>verse?targets.flatMap((item,index)=>{const before=verse.text.slice(index?targets[index-1].end:0,item.start),answer=answers[item.id],correct=answer===item.rule.hukumId;return [before,<button type="button" key={item.id} aria-label={`Tanda ${index+1}: ${item.quote}`} aria-pressed={activeId===item.id} className={`${activeId===item.id?'active ':''}${answer!==undefined?(correct?'correct':'wrong'):''}`} style={{'--target-color':getHukumColor(item.rule)} as CSSProperties} onClick={()=>setActive(item.id)}>{item.quote}<sup>{index+1}</sup></button>];}).concat(verse.text.slice(targets.at(-1)!.end)):[],[activeId,answers,targets,verse]);
  if(error)return <section className="assessment-card" role="alert"><h2>Mode Telusuri Ayat belum dapat dimuat.</h2><p>{error}</p><button className="button button-primary" onClick={load}>Coba lagi</button></section>;
  if(!payload||!verse||targets.length<4)return <section className="assessment-card"><ActionFeedback state="pending">Menyiapkan ayat acak dari seluruh Al-Qur&apos;an…</ActionFeedback></section>;
  return <section className="assessment-card multi-detective"><div className="multi-detective-heading"><div><span className="section-kicker"><Layers3 size={15}/> MODE TELUSURI AYAT · MENENGAH</span><h2>Temukan hukum-hukum dalam satu ayat.</h2><p>Klik setiap tanda bernomor, lalu tentukan hukum bacaannya. Ayat dipilih acak dari seluruh Al-Qur&apos;an.</p></div><div className="multi-progress" aria-label={`${answered} dari ${targets.length} tanda dijawab`}><strong>{answered}/{targets.length}</strong><span>tanda dijawab</span></div></div><div className="multi-track" aria-hidden="true">{targets.map(item=><span key={item.id} className={answers[item.id]!==undefined?'done':''}/>)}</div><figure className="multi-verse"><figcaption>QS. {payload.surah.name} · {payload.surah.number}:{verse.number}<span>Pilih tanda pada ayat</span></figcaption><p lang="ar" dir="rtl">{textNodes}</p><small>{payload.source.displayEdition}</small></figure>{answered===targets.length?<div className="multi-result"><CheckCircle2 size={24}/><div><strong>{score} dari {targets.length} tepat</strong><p>{score===targets.length?'Semua tanda berhasil dikenali.':'Tinjau tanda yang berwarna jingga, lalu coba ayat berikutnya.'}</p></div><button className="button button-primary" onClick={load}>Ayat berikutnya<ArrowRight size={16}/></button></div>:selected&&<div className="multi-question"><div><span>TANDA {targets.indexOf(selected)+1}</span><strong>Hukum apa yang berlaku pada <b lang="ar" dir="rtl">{selected.quote}</b>?</strong></div><div className="multi-options">{targets.map(item=>{const picked=answers[selected.id],id=item.rule.hukumId;return <button type="button" key={id} disabled={picked!==undefined} className={picked===id?(id===selected.rule.hukumId?'correct':'wrong'):''} onClick={()=>setAnswers(value=>({...value,[selected.id]:id}))}>{getHukumLabel(item.rule)}</button>})}</div>{answers[selected.id]!==undefined&&<div className={`multi-feedback ${answers[selected.id]===selected.rule.hukumId?'correct':'wrong'}`}>{answers[selected.id]===selected.rule.hukumId?<CheckCircle2 size={18}/>:<CircleAlert size={18}/>}<p><strong>{answers[selected.id]===selected.rule.hukumId?'Tepat.':'Belum tepat.'}</strong> {getHukumLabel(selected.rule)}. {answers[selected.id]===selected.rule.hukumId?'Lanjutkan ke tanda berikutnya.':'Perhatikan pemicu dan posisi huruf pada tanda ini.'}</p><button onClick={next}>Lanjut<ArrowRight size={15}/></button></div>}</div>}<button className="multi-reset" onClick={()=>{setAnswers({});setActive(targets[0]?.id)}}><RotateCcw size={14}/>Ulangi ayat ini</button></section>;
}
