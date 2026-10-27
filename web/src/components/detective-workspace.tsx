"use client";
import Link from 'next/link';
import {useEffect,useRef,useState} from 'react';
import {ScanSearch,ArrowRight,UserRound} from 'lucide-react';
import {ApiError,authApi} from '@/lib/auth-api';
import {DetectiveView,DetectiveAnswer,readDetective,readDetectiveAnswer} from '@/lib/quiz';
import {useAuth} from './auth-provider';
import {ActionFeedback} from './action-feedback';
import {QuestionChoices,AnswerReview} from './quiz-question';
import {Unavailable} from './quiz-workspace';

export function DetectiveWorkspace(){
  const {user,loading:authLoading,refresh}=useAuth(),owner=user?.id || 'guest';
  const [state,setState]=useState<{owner:string;data?:DetectiveView;answer?:DetectiveAnswer;error?:string}>({owner:''});
  const [busy,setBusy]=useState(false),[selected,setSelected]=useState<string|null>(null),[reload,setReload]=useState(0);
  const previous=useRef(''),active=useRef(owner);
  useEffect(()=>{active.current=owner;return()=>{active.current='';};},[owner]);
  useEffect(()=>{
    if(authLoading)return;let live=true;
    queueMicrotask(()=>{if(live){setState({owner});setSelected(null);setBusy(false);}});
    void authApi('/detective/questions'+(previous.current?`?previousId=${previous.current}`:'')).then(readDetective).then(data=>{if(live)setState({owner,data});},error=>{if(live)setState({owner,error:error.message});});
    return()=>{live=false;};
  },[owner,authLoading,reload]);
  const own=state.owner===owner,data=own?state.data:undefined,answer=own?state.answer:undefined;
  async function submit(){
    if(!data?.challenge || !selected || busy)return;const requestOwner=owner;
    setBusy(true);setState(s=>({...s,error:undefined}));
    try{const result=readDetectiveAnswer(await authApi('/detective/answer',{token:data.challenge.token,optionId:selected}));if(active.current===requestOwner){previous.current=data.challenge.question.id;setState({owner,data,answer:result});}}
    catch(error){if(active.current===requestOwner){setState(s=>({...s,error:(error as Error).message}));if(error instanceof ApiError && error.status===403)void refresh();}}
    finally{setBusy(false);}
  }
  return <div className="assessment-page"><header className="assessment-heading"><div><span className="eyebrow">LIHAT · KENALI · PAHAMI</span><h1>Tajwid Detective</h1><p>Amati bagian ayat yang ditandai, lalu kenali hukum bacaannya. Satu latihan kecil untuk memperdalam pemahaman.</p></div><ScanSearch size={38} aria-hidden="true"/></header><div className="detective-storage-note"><UserRound size={17}/><p>{user?'Kesalahan latihan dapat Anda ulangi melalui Mistake Replay. Latihan ini tidak meluluskan materi.':'Anda berlatih sebagai tamu. Jawaban tidak disimpan dan tidak memerlukan akun.'}</p>{!user && <Link href="/login/?next=/detective/">Masuk untuk menyimpan latihan<ArrowRight size={15}/></Link>}</div>
    <p className="quiz-expiry">Soal diturunkan dari anotasi reader dan diperiksa otomatis. Validasi otomatis belum setara review ahli tajwid.</p>
    {authLoading || !own || (!data && !state.error)?<section className="assessment-card"><ActionFeedback state="pending">Menyiapkan latihan…</ActionFeedback></section>:!data?<section className="assessment-card" role="alert"><h2>Latihan belum dapat dimuat.</h2><p>{state.error}</p><button className="button button-primary" onClick={()=>setReload(n=>n+1)}>Coba lagi</button></section>:!data.available?<Unavailable message={data.message}/>:answer?<><AnswerReview question={answer.feedback} focus reporting={answer.reporting}/><div className="assessment-card detective-next"><ActionFeedback state="success">{answer.saved?'Hasil latihan tersimpan':'Latihan selesai · hasil tamu tidak disimpan'}</ActionFeedback>{answer.needsReview && <Link href="/reviews/">Latih konsep ini kembali di Mistake Replay<ArrowRight size={16}/></Link>}<button className="button button-primary" onClick={()=>setReload(n=>n+1)}>Latihan berikutnya<ArrowRight size={16}/></button></div></>:<section className="assessment-card"><span className="section-kicker">KENALI BAGIAN YANG DITANDAI</span><QuestionChoices question={data.challenge!.question} selected={selected} busy={busy} onSelect={setSelected}/><div className="quiz-navigation"><p>Pembahasan tersedia setelah menjawab.</p><button className="button button-primary" disabled={!selected || busy} onClick={()=>void submit()}>{busy?'Memeriksa…':'Periksa jawaban'}<ArrowRight size={16}/></button></div>{busy && <ActionFeedback state="pending">Memeriksa jawaban Anda…</ActionFeedback>}{state.error && <p className="assessment-error" role="alert">{state.error} <button onClick={()=>setReload(n=>n+1)}>Muat latihan baru</button></p>}</section>}
  </div>;
}
