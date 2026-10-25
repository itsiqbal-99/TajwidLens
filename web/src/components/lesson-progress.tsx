"use client";

import Link from 'next/link';
import {useEffect,useRef,useState} from 'react';
import {CheckCircle2,ArrowRight} from 'lucide-react';
import {ApiError,authApi} from '@/lib/auth-api';
import {LessonProgress as Progress,readLessonProgress} from '@/lib/learning';
import {useAuth} from './auth-provider';
import {ActionFeedback} from './action-feedback';

export function LessonProgress({lessonId,href,next}:{lessonId:string;href:string;next:{title:string;href:string}|null}) {
  const {user,loading:authLoading,refresh}=useAuth();
  const [attempt,setAttempt]=useState(0),[busy,setBusy]=useState(false);
  const [state,setState]=useState<{owner:string;data?:Progress;error?:Error;loading:boolean}>({owner:'',loading:true});
  const request=useRef<{key:string;promise:Promise<Progress>}|null>(null);
  const completing=useRef(false);
  const activeOwner=useRef<string|undefined>(undefined);
  const ownerId=user?.id;
  useEffect(()=>{activeOwner.current=ownerId?`${ownerId}:${lessonId}`:undefined;return ()=>{activeOwner.current=undefined;};},[ownerId,lessonId]);
  useEffect(()=>{
    if(!ownerId) return;
    let active=true;
    const owner=`${ownerId}:${lessonId}`,key=`${owner}:${attempt}`;
    if(request.current?.key!==key) request.current={key,promise:authApi<unknown>(`/learning/progress/${lessonId}/start`,{},'PUT').then(value=>readLessonProgress(value,lessonId))};
    queueMicrotask(()=>{if(active) setState({owner,loading:true});});
    request.current.promise.then(data=>{if(active) setState({owner,data,loading:false});},error=>{if(active) {setState({owner,error,loading:false});if(error instanceof ApiError && error.status===401) void refresh();}});
    return ()=>{active=false;};
  },[ownerId,lessonId,attempt,refresh]);
  async function complete() {
    if(!user || completing.current) return;
    const owner=`${user.id}:${lessonId}`;
    completing.current=true;setBusy(true);
    try {
      const data=readLessonProgress(await authApi<unknown>(`/learning/progress/${lessonId}/complete`,{},'PUT'),lessonId);
      if(activeOwner.current===owner) setState({owner,data,loading:false});
    } catch(error) {
      if(activeOwner.current===owner) {setState(previous=>({...previous,error:error as Error}));if(error instanceof ApiError && error.status===401) void refresh();}
    } finally {completing.current=false;setBusy(false);}
  }
  if(authLoading) return <section className="lesson-progress-panel"><ActionFeedback state="pending">Memeriksa sesi belajar…</ActionFeedback></section>;
  if(!user) return <section className="lesson-progress-panel lesson-progress-guest"><h2>Belajar sesuai ritme Anda.</h2><p>Materi ini tetap dapat dibaca tanpa akun. Masuk jika ingin menyimpan progres dan melanjutkan di perangkat lain.</p><Link href={`/login/?next=${encodeURIComponent(href)}`}>Masuk untuk menyimpan progres <ArrowRight size={16} aria-hidden="true" /></Link></section>;
  const own=state.owner===`${user.id}:${lessonId}`;
  const done=own && state.data?.status==='COMPLETED';
  return <section className="lesson-progress-panel" aria-labelledby="lesson-progress-heading"><div><span className="section-kicker">PROGRES ANDA</span><h2 id="lesson-progress-heading">{done?'Materi selesai': 'Sudah memahami materi ini?'}</h2><p>{done?'Tersimpan di akun Anda. Mengulang materi tidak menghapus penyelesaiannya.':'Membaca materi belum otomatis menyelesaikannya. Tandai selesai ketika Anda sudah siap.'}</p></div>
    {own && state.error && <p className="learning-inline-error" role="alert">{state.error instanceof ApiError && state.error.status===401?'Sesi berakhir. Masuk kembali untuk menyimpan progres.':'Progres belum berhasil dikonfirmasi. Coba lagi; materi tetap bisa dibaca.'}</p>}
    {!own || state.loading ? <ActionFeedback state="pending">Memuat progres materi…</ActionFeedback> : !state.data ? <button className="button button-secondary" type="button" onClick={()=>setAttempt(value=>value+1)}>Coba lagi</button> : done ? <ActionFeedback state="success" className="lesson-completed-status">Ditandai selesai</ActionFeedback> : <><span className="lesson-in-progress">Sedang dipelajari</span><button className="button button-primary" type="button" onClick={()=>void complete()} disabled={busy}>{busy?'Menyimpan…':'Tandai Selesai'}<CheckCircle2 size={17} aria-hidden="true" /></button>{busy && <ActionFeedback state="pending">Menyimpan progres Anda…</ActionFeedback>}</>}
    {done && next && <Link className="lesson-next-step" href={next.href}>Lanjut ke materi berikutnya: {next.title}<ArrowRight size={16} aria-hidden="true" /></Link>}
    <Link className="lesson-dashboard-link" href="/dashboard/">Kembali ke dashboard</Link>
  </section>;
}
