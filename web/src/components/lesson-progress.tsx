"use client";

import Link from 'next/link';
import {useEffect,useState} from 'react';
import {ArrowRight,ShieldCheck,Clock3} from 'lucide-react';
import {ApiError,authApi} from '@/lib/auth-api';
import {LessonProgress as Progress,readLessonProgress} from '@/lib/learning';
import {QuizAvailability,readAvailability} from '@/lib/quiz';
import {useAuth} from './auth-provider';
import {ActionFeedback} from './action-feedback';

export function LessonProgress({lessonId,href,next}:{lessonId:string;href:string;next:{title:string;href:string}|null}) {
  const {user,loading:authLoading,refresh}=useAuth(),ownerId=user?.id;
  const [attempt,setAttempt]=useState(0);
  const [state,setState]=useState<{owner:string;data?:Progress;quiz?:QuizAvailability;error?:Error;loading:boolean}>({owner:'',loading:true});
  useEffect(()=>{
    if(!ownerId)return;let active=true;
    const owner=ownerId+':'+lessonId;
    queueMicrotask(()=>{if(active)setState({owner,loading:true});});
    void Promise.all([
      authApi(`/learning/progress/${lessonId}/start`,{},'PUT').then(value=>readLessonProgress(value,lessonId)),
      authApi(`/quiz/lessons/${lessonId}/availability`).then(readAvailability),
    ]).then(([data,quiz])=>{if(active)setState({owner,data,quiz,loading:false});},error=>{
      if(active){setState({owner,error,loading:false});if(error instanceof ApiError && error.status===401)void refresh();}
    });
    return()=>{active=false;};
  },[ownerId,lessonId,attempt,refresh]);
  if(authLoading)return <section className="lesson-progress-panel"><ActionFeedback state="pending">Memeriksa sesi belajar…</ActionFeedback></section>;
  if(!user)return <section className="lesson-progress-panel lesson-progress-guest"><h2>Belajar sesuai ritme Anda.</h2><p>Materi tetap dapat dibaca tanpa akun. Masuk untuk menyimpan aktivitas belajar dan mengikuti evaluasi ketika soal tersedia.</p><Link href={`/login/?next=${encodeURIComponent(href)}`}>Masuk untuk menyimpan progres<ArrowRight size={16}/></Link><Link href="/detective/">Jelajahi Tajwid Detective</Link></section>;
  const own=state.owner===user.id+':'+lessonId,data=own?state.data:undefined,quiz=own?state.quiz:undefined;
  const done=data?.status==='COMPLETED',legacy=data?.legacyCompletedAt;
  return <section className="lesson-progress-panel" aria-labelledby="lesson-progress-heading"><div><span className="section-kicker">PEMAHAMAN ANDA</span><h2 id="lesson-progress-heading">{done?'Kelulusan terverifikasi':data?.status==='AWAITING_QUIZ'?'Sudah dipelajari, menunggu evaluasi.':'Siap menguji pemahaman?'}</h2><p>{done?'Anda telah lulus quiz materi ini. Mengulang bacaan tidak menghapus kelulusan.':'Kelulusan diperoleh melalui tujuh soal dengan minimal enam jawaban benar. Membaca materi tetap menyimpan aktivitas belajar.'}</p></div>
    {legacy && <p className="lesson-legacy-note"><Clock3 size={16}/><span>Histori ditandai selesai pada <time dateTime={legacy}>{new Date(legacy).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'})}</time> tetap tersimpan{done?'.':'; belum dihitung sebagai kelulusan quiz.'}</span></p>}
    {!own || state.loading?<ActionFeedback state="pending">Menyimpan aktivitas belajar…</ActionFeedback>:state.error?<div role="alert"><p>{state.error.message}</p><button className="button button-secondary" onClick={()=>setAttempt(n=>n+1)}>Coba lagi</button></div>:<>
      <ActionFeedback state="success">{done?'Lulus evaluasi':data?.status==='AWAITING_QUIZ'?'Histori belajar tersimpan':'Aktivitas belajar tersimpan'}</ActionFeedback>
      {quiz?.available?<Link className="button button-primary" href={quiz.resumeAttemptId?`/quiz/?attempt=${quiz.resumeAttemptId}`:`/quiz/?lessonId=${lessonId}`}>{quiz.resumeAttemptId?'Lanjutkan evaluasi':done?'Ulangi evaluasi':'Uji Pemahaman'}<ShieldCheck size={17}/></Link>:<div className="lesson-quiz-unavailable"><strong>Quiz belum tersedia</strong><p>{quiz?.message} Anda tetap dapat melanjutkan ke materi lain.</p></div>}
    </>}
    {next && <Link className="lesson-next-step" href={next.href}>Materi berikutnya: {next.title}<ArrowRight size={16}/></Link>}
    <Link className="lesson-dashboard-link" href="/dashboard/">Kembali ke dashboard</Link>
  </section>;
}
