"use client";

import Link from 'next/link';
import {useSearchParams} from 'next/navigation';
import {useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,ShieldCheck,BookOpen,LockKeyhole} from 'lucide-react';
import {lessonCatalog} from '@/data/lesson-catalog';
import {ApiError,authApi} from '@/lib/auth-api';
import {assetPath} from '@/lib/asset-path';
import {QuizAttemptView,QuizAvailability,readAttempt,readAvailability} from '@/lib/quiz';
import {RequireAccount} from './require-account';
import {useAuth} from './auth-provider';
import {ActionFeedback} from './action-feedback';
import {QuestionChoices,AnswerReview} from './quiz-question';

export function QuizWorkspace(){
  const params=useSearchParams();
  return <RequireAccount returnTo={`/quiz/?${params.toString()}`}><QuizContent/></RequireAccount>;
}
function QuizContent(){
  const params=useSearchParams(),lessonId=params.get('lessonId') || '',attemptId=params.get('attempt') || '';
  const {user,refresh}=useAuth(),owner=user?.id;
  const lesson=lessonCatalog.find(l=>l.id===lessonId),[reload,setReload]=useState(0);
  const [state,setState]=useState<{owner?:string;data?:QuizAttemptView;availability?:QuizAvailability;error?:Error;loading:boolean}>({loading:true});
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[saved,setSaved]=useState(false);
  const lastLoaded=useRef('');
  const active=useRef<string|undefined>(undefined);
  useEffect(()=>{active.current=owner?`${owner}:${attemptId || lessonId}`:undefined;return()=>{active.current=undefined;};},[owner,attemptId,lessonId]);
  const data=state.owner===owner?state.data:undefined;
  const requested=Number(params.get('q') || '1');
  const questionIndex=Number.isInteger(requested)?Math.max(0,Math.min((data?.questions.length || 1)-1,requested-1)):0;
  const heading=useRef<HTMLHeadingElement>(null);
  useEffect(()=>{heading.current?.focus();},[questionIndex,data?.status]);
  useEffect(()=>{
    if(!owner || (attemptId && lastLoaded.current===`${owner}:${attemptId}:${reload}`))return;let live=true;
    queueMicrotask(()=>{if(live){setState({owner,loading:true});setError('');}});
    const load=async()=>{
      if(attemptId)return {data:readAttempt(await authApi(`/quiz/attempts/${encodeURIComponent(attemptId)}`))};
      if(!lesson)throw new Error('Pilih materi dari halaman belajar untuk membuka evaluasi.');
      const availability=readAvailability(await authApi(`/quiz/lessons/${lesson.id}/availability`));
      if(!availability.available)return {availability};
      return {data:readAttempt(await authApi(`/quiz/lessons/${lesson.id}/attempts`,{}))};
    };
    void load().then(result=>{if(live){if(result.data)lastLoaded.current=`${owner}:${result.data.id}:${reload}`;setState({owner,...result,loading:false});if(result.data && !attemptId)window.history.replaceState(null,'',`${assetPath('/quiz/')}?attempt=${result.data.id}&q=1`);}},err=>{if(live){setState({owner,error:err,loading:false});if(err instanceof ApiError && err.status===401)void refresh();}});
    return()=>{live=false;};
  },[owner,attemptId,lessonId,lesson,reload,refresh]);
  useEffect(()=>{
    if(data?.status!=='IN_PROGRESS')return;
    // shortcut: SPA history relies on saved drafts; add router-level blocking if every history exit must prompt.
    const confirm=(event:BeforeUnloadEvent)=>{event.preventDefault();};
    const intercept=(event:MouseEvent)=>{const link=(event.target as Element).closest('a');if(link && !link.target && !event.ctrlKey && !event.metaKey && !window.confirm('Evaluasi belum dikirim. Pilihan yang berhasil disimpan dapat dilanjutkan selama 24 jam. Tinggalkan evaluasi?'))event.preventDefault();};
    window.addEventListener('beforeunload',confirm);document.addEventListener('click',intercept,true);
    return()=>{window.removeEventListener('beforeunload',confirm);document.removeEventListener('click',intercept,true);};
  },[data?.status]);
  async function select(optionId:string){
    if(!data || busy)return;const previous=data,question=data.questions[questionIndex],requestOwner=active.current;
    setBusy(true);setError('');setSaved(false);setState(s=>({...s,data:{...data,questions:data.questions.map(q=>q.id===question.id?{...q,selectedOptionId:optionId}:q)}}));
    try{const next=readAttempt(await authApi(`/quiz/attempts/${data.id}/answers`,{answers:[{questionId:question.id,optionId}]},'PUT'));if(active.current===requestOwner){setState(s=>({...s,data:next}));setSaved(true);}}
    catch(err){if(active.current===requestOwner){setState(s=>({...s,data:previous}));setError((err as Error).message);if(err instanceof ApiError && err.status===401)void refresh();}}
    finally{setBusy(false);}
  }
  async function submit(){
    if(!data || busy || data.questions.some(q=>q.selectedOptionId===null))return;const requestOwner=active.current;
    setBusy(true);setError('');
    try{const next=readAttempt(await authApi(`/quiz/attempts/${data.id}/submit`,{answers:data.questions.map(q=>({questionId:q.id,optionId:q.selectedOptionId}))}));if(active.current===requestOwner)setState(s=>({...s,data:next}));}
    catch(err){if(active.current===requestOwner){setError((err as Error).message);if(err instanceof ApiError && err.status===401)void refresh();}}
    finally{setBusy(false);}
  }
  async function retry(){
    if(!data || busy)return;setBusy(true);setError('');const requestOwner=active.current;
    try{const next=readAttempt(await authApi(`/quiz/lessons/${data.lessonId}/attempts`,{}));if(active.current===requestOwner){lastLoaded.current=`${owner}:${next.id}:${reload}`;setState({owner,data:next,loading:false});setSaved(false);window.history.replaceState(null,'',`${assetPath('/quiz/')}?attempt=${next.id}&q=1`);}}
    catch(err){if(active.current===requestOwner)setError((err as Error).message);}finally{setBusy(false);}
  }
  const currentLesson=lessonCatalog.find(l=>l.id===(data?.lessonId || lessonId));
  const back=currentLesson?`/learn/${currentLesson.slug}/`:'/learn/';
  const nextLesson=currentLesson && lessonCatalog[lessonCatalog.indexOf(currentLesson)+1];
  return <div className="assessment-page"><header className="assessment-heading"><Link className="assessment-back" href={back}><ArrowLeft size={16}/>Kembali ke materi</Link><div><span className="eyebrow">{data?.mode==='REPLAY'?'MISTAKE REPLAY':'UJI PEMAHAMAN'}</span><h1>{data?.mode==='REPLAY'?'Latih kembali, selangkah lagi.':currentLesson?.title || 'Evaluasi materi'}</h1><p>{data?.mode==='REPLAY'?'Latihan ini membantu menguatkan konsep. Nilai quiz dan kelulusan materi tidak berubah.':'Tujuh soal untuk mengonfirmasi pemahaman Anda. Minimal enam jawaban benar untuk lulus.'}</p></div><ShieldCheck size={34} aria-hidden="true"/></header>
    <p className="quiz-expiry">Latihan berbasis materi dan anotasi aplikasi, dengan validasi otomatis yang belum setara review ahli tajwid. Quiz mengukur pemahaman materi tertulis; pelafalan tetap perlu bimbingan guru.</p>
    {state.owner!==owner || state.loading?<div className="assessment-card"><ActionFeedback state="pending">Menyiapkan evaluasi Anda…</ActionFeedback></div>:state.error?<section className="assessment-card" role="alert"><h2>Evaluasi belum dapat dimuat.</h2><p>{state.error.message}</p><button className="button button-primary" onClick={()=>setReload(n=>n+1)}>Coba lagi</button></section>:!data?<Unavailable message={state.availability?.message || 'Evaluasi belum tersedia.'}/>:data.status==='EXPIRED'?<section className="assessment-card"><h2>Evaluasi ini sudah berakhir.</h2><p>Mulai evaluasi baru untuk mendapatkan soal yang tersedia saat ini. Progres belajar Anda tetap tersimpan.</p><button className="button button-primary" disabled={busy} onClick={()=>void retry()}>Mulai evaluasi baru</button></section>:data.result?<>
      <section className={`assessment-result ${data.result.passed?'result-passed':''}`}><div className="assessment-result-score"><strong>{data.result.correctCount}<small>/{data.result.totalQuestions}</small></strong><span>{data.result.percentage.toLocaleString('id-ID')}%</span></div><div><span className="section-kicker">{data.mode==='REPLAY'?'HASIL LATIHAN':'HASIL EVALUASI'}</span><h2 ref={heading} tabIndex={-1}>{data.mode==='REPLAY'?(data.result.passed?'Konsep berhasil dilatih kembali.':'Mari pelajari pembahasannya.'):data.result.passed?'Bagus! Evaluasi materi ini selesai.':'Pemahaman bertumbuh lewat latihan.'}</h2><p>{data.result.completionVerified?'Kelulusan terverifikasi dan tersimpan di akun Anda.':data.mode==='REPLAY'?'Latihan ini tidak mengubah nilai evaluasi atau penyelesaian materi.':`Anda menjawab ${data.result.correctCount} dari 7 soal dengan benar. Pelajari bagian yang masih sulit, lalu coba lagi.`}</p><div className="assessment-actions">{data.mode==='LESSON_QUIZ' && <button className="button button-secondary" disabled={busy} onClick={()=>void retry()}>{busy?'Menyiapkan…':'Coba evaluasi lagi'}</button>}{data.result.completionVerified && nextLesson && <Link className="button button-primary" href={`/learn/${nextLesson.slug}/`}>Materi berikutnya<ArrowRight size={16}/></Link>}{data.mode==='REPLAY' && <Link className="button button-primary" href="/reviews/">Kembali ke latihan ulang</Link>}</div></div></section>
      <div className="assessment-review-heading"><h2>Pahami setiap jawaban.</h2><p>Pembahasan berikut berasal dari versi soal saat evaluasi dimulai.</p></div>{data.result.feedback.map((q,i)=><AnswerReview key={q.id} question={q} number={i+1} reporting={{attemptId:data.id}}/>)}<Link className="button button-secondary" href="/reviews/">Lihat konsep yang bisa dilatih kembali<ArrowRight size={16}/></Link>
    </>:<section className="assessment-card quiz-active"><div className="quiz-step-heading"><h2 ref={heading} tabIndex={-1}>Soal {questionIndex+1} dari {data.questions.length}</h2><span>{data.questions.filter(q=>q.selectedOptionId!==null).length} terjawab</span></div><div className="quiz-step-track" role="progressbar" aria-label="Soal terjawab" aria-valuemin={0} aria-valuemax={data.questions.length} aria-valuenow={data.questions.filter(q=>q.selectedOptionId!==null).length}>{data.questions.map((q,i)=><span key={q.id} className={q.selectedOptionId!==null?'answered':i===questionIndex?'current':''}/>)}</div><div className="quiz-question-transition" key={questionIndex}><QuestionChoices question={data.questions[questionIndex]} selected={data.questions[questionIndex].selectedOptionId} busy={busy} onSelect={id=>void select(id)}/></div><div className="quiz-save-state">{busy?<ActionFeedback state="pending">Menyimpan pilihan…</ActionFeedback>:saved?<ActionFeedback state="success">Pilihan tersimpan</ActionFeedback>:<p><LockKeyhole size={14}/>Pembahasan terbuka setelah seluruh jawaban dikirim.</p>}</div><div className="quiz-navigation"><button className="button button-secondary" disabled={busy || questionIndex===0} onClick={()=>{setSaved(false);window.history.replaceState(null,'',`${assetPath('/quiz/')}?attempt=${data.id}&q=${questionIndex}`);}}><ArrowLeft size={16}/>Sebelumnya</button>{questionIndex<data.questions.length-1?<button className="button button-primary" disabled={busy || data.questions[questionIndex].selectedOptionId===null} onClick={()=>{setSaved(false);window.history.replaceState(null,'',`${assetPath('/quiz/')}?attempt=${data.id}&q=${questionIndex+2}`);}}>Berikutnya<ArrowRight size={16}/></button>:<button className="button button-primary" disabled={busy || data.questions.some(q=>q.selectedOptionId===null)} onClick={()=>void submit()}>{busy?'Mengirim…':'Kirim jawaban'}<ArrowRight size={16}/></button>}</div><p className="quiz-expiry">Pilihan tersimpan selama 24 jam sejak evaluasi dimulai.</p></section>}
    {error && <p className="assessment-error" role="alert">{error} Hasil belum dikonfirmasi; Anda dapat mencoba kembali.</p>}
  </div>;
}
export function Unavailable({message}:{message:string}){
  return <section className="assessment-card assessment-empty"><span className="assessment-empty-icon"><BookOpen size={30}/></span><span className="section-kicker">KUALITAS MATERI DIUTAMAKAN</span><h2>Soal sedang dipersiapkan.</h2><p>{message}</p><p>Quiz akan dibuka setelah soal dan pembahasannya memiliki review yang dapat dipertanggungjawabkan.</p><Link className="button button-primary" href="/learn/">Lanjutkan belajar<ArrowRight size={16}/></Link></section>;
}
