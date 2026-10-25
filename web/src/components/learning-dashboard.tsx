"use client";

import Link from 'next/link';
import {useEffect,useRef,useState} from 'react';
import {ArrowRight,ArrowUpRight,BookOpen,CheckCircle2,RefreshCw,CircleDot,Circle,Layers,Route,Check} from 'lucide-react';
import {ApiError,authApi} from '@/lib/auth-api';
import {readLearningDashboard,LearningDashboard as Dashboard,lessonStatusLabel} from '@/lib/learning';
import {lessonCatalog} from '@/data/lesson-catalog';
import {useAuth} from './auth-provider';
import {ActionFeedback} from './action-feedback';

function DashboardContent({data}:{data:Dashboard}) {
  const {summary,continueLearning:next}=data;
  const fresh=summary.completedLessons===0 && summary.inProgressLessons===0;
  const states=new Map(data.lessonStates.map(row=>[row.lessonId,row.status]));
  const categories=[...new Set(lessonCatalog.map(lesson=>lesson.category))];
  const completedItem=(lesson:Dashboard['completedLessons'][number])=><li key={lesson.lessonId}><CheckCircle2 size={19} aria-hidden="true"/><Link href={lesson.href}><span>{lesson.title}<time dateTime={lesson.completedAt}>{new Date(lesson.completedAt).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'})}</time></span><ArrowUpRight size={16} aria-hidden="true"/></Link></li>;
  return <>
    <div className="dashboard-metrics" aria-label="Ringkasan status materi">
      <div><span className="metric-icon metric-done"><CheckCircle2 size={20}/></span><p><strong>{summary.completedLessons}<small> / {summary.totalLessons}</small></strong><span>Materi selesai</span></p></div>
      <div><span className="metric-icon metric-active"><CircleDot size={20}/></span><p><strong>{summary.inProgressLessons}</strong><span>Sedang dipelajari</span></p></div>
      <div><span className="metric-icon"><Layers size={20}/></span><p><strong>{summary.totalLessons-summary.completedLessons-summary.inProgressLessons}</strong><span>Belum mulai</span></p></div>
    </div>
    <div className="dashboard-primary-grid">
      <section className="dashboard-continue" aria-labelledby="continue-heading">
        <div className="dashboard-card-label"><span><Route size={16} aria-hidden="true"/>{data.allCompleted?'SELURUH MATERI SELESAI':'LANGKAH BELAJAR BERIKUTNYA'}</span><span className="dashboard-topic">{next?.category || '24 materi'}</span></div>
        <div className="dashboard-continue-copy"><span className="dashboard-lesson-index">{next?`MATERI ${String(lessonCatalog.findIndex(l=>l.id===next.lessonId)+1).padStart(2,'0')}`:'PERJALANAN ANDA'}</span><h2 id="continue-heading">{data.allCompleted?'Bekal belajar Anda semakin lengkap.':next!.title}</h2><p>{data.allCompleted?'Seluruh materi telah Anda tandai selesai. Anda tetap dapat mengulang dan memperdalam bacaan bersama guru.':fresh?'Tidak perlu terburu-buru. Mulai dari materi pertama, lalu bangun pemahaman selangkah demi selangkah.':next!.summary}</p><Link className="button button-primary" href={data.allCompleted?'/learn/':next!.href}>{data.allCompleted?'Ulangi materi':fresh?'Mulai belajar':'Lanjutkan belajar'}<ArrowRight size={18} aria-hidden="true"/></Link></div>
        <div className="dashboard-continue-note"><BookOpen size={16} aria-hidden="true"/><span>{data.allCompleted?'Semua materi tetap dapat Anda baca kembali.':'Anda bebas memilih materi. Progres tersimpan di akun Anda.'}</span></div>
      </section>
      <section className="dashboard-progress" aria-labelledby="progress-heading">
        <span className="section-kicker">GAMBARAN KESELURUHAN</span><h2 id="progress-heading">Progres belajar</h2>
        <div className="dashboard-ring" role="progressbar" aria-label="Progres penyelesaian materi" aria-valuemin={0} aria-valuemax={100} aria-valuenow={summary.progressPercentage} aria-valuetext={`${summary.completedLessons} dari ${summary.totalLessons} materi selesai`}>
          <svg viewBox="0 0 120 120" aria-hidden="true"><circle className="ring-track" cx="60" cy="60" r="49"/><circle className="ring-value" cx="60" cy="60" r="49" pathLength="100" strokeDasharray={`${summary.progressPercentage} 100`} style={{opacity:summary.progressPercentage?1:0}}/></svg>
          <div><strong>{summary.progressPercentage.toLocaleString('id-ID',{maximumFractionDigits:1})}<small>%</small></strong><span>terselesaikan</span></div>
        </div>
        <p><strong>{summary.completedLessons} dari {summary.totalLessons} materi selesai</strong><span>{data.allCompleted?'Saatnya mengulang dan memperdalam.':`${summary.totalLessons-summary.completedLessons} materi menanti untuk dipahami.`}</span></p>
      </section>
    </div>
    <div className="dashboard-detail-grid">
      <section className="dashboard-map dashboard-panel" aria-labelledby="map-heading">
        <div className="dashboard-section-head"><div><span className="section-kicker">SETIAP LANGKAH TERLIHAT</span><h2 id="map-heading">Peta progres Anda</h2></div><span>{summary.totalLessons} materi</span></div>
        <p className="dashboard-section-intro">Pilih nomor materi untuk membuka atau mengulangnya.</p>
        <div className="dashboard-module-map">{lessonCatalog.map((lesson,index)=>{
          const status=states.get(lesson.id)!;
          return <Link key={lesson.id} href={`/learn/${lesson.slug}/`} className={`module-map-cell status-${status.toLowerCase()}`} title={`${lesson.title} — ${lessonStatusLabel[status]}`} aria-label={`${index+1}. ${lesson.title} — ${lessonStatusLabel[status]}`}><span>{String(index+1).padStart(2,'0')}</span>{status==='COMPLETED'?<Check size={13} aria-hidden="true"/>:status==='IN_PROGRESS'?<CircleDot size={13} aria-hidden="true"/>:<Circle size={11} aria-hidden="true"/>}</Link>;
        })}</div>
        <div className="dashboard-map-legend"><span><CheckCircle2 size={14}/>Selesai</span><span><CircleDot size={14}/>Sedang dipelajari</span><span><Circle size={13}/>Belum mulai</span></div>
        <div className="dashboard-insight"><span className="dashboard-insight-icon"><Route size={18} aria-hidden="true"/></span><p><strong>{data.allCompleted?'Seluruh peta sudah terisi.':fresh?'Satu langkah kecil untuk memulai.':summary.inProgressLessons?`${summary.inProgressLessons} materi masih Anda pelajari.`:'Siap untuk langkah berikutnya.'}</strong><span>{data.allCompleted?'Ulangi topik pilihan untuk menjaga pemahaman.':next?`Lanjutkan ${next.title.toLowerCase()} atau jelajahi materi lain sesuai kebutuhan Anda.`:''}</span></p></div>
      </section>
      <section className="dashboard-topics dashboard-panel" aria-labelledby="topics-heading"><span className="section-kicker">RINGKASAN PER TOPIK</span><h2 id="topics-heading">Cakupan belajar</h2><div className="dashboard-topic-list">{categories.map(category=>{
        const lessons=lessonCatalog.filter(l=>l.category===category),done=lessons.filter(l=>states.get(l.id)==='COMPLETED').length;
        return <div key={category}><p><span>{category}</span><strong>{done}<small>/{lessons.length}</small></strong></p><div className="topic-progress-track" aria-hidden="true"><span style={{width:`${done/lessons.length*100}%`}}/></div></div>;
      })}</div></section>
    </div>
    <section className="dashboard-completed dashboard-panel" aria-labelledby="completed-heading"><div className="dashboard-section-head"><div><span className="section-kicker">TERSIMPAN DALAM PERJALANAN ANDA</span><h2 id="completed-heading">Materi yang sudah selesai</h2></div><span>{summary.completedLessons} materi</span></div>{data.completedLessons.length?<ul>{data.completedLessons.slice(0,3).map(completedItem)}</ul>:<p>Belum ada materi yang ditandai selesai. Mulai dari satu materi saat Anda siap.</p>}{data.completedLessons.length>3 && <details><summary>Lihat {data.completedLessons.length-3} materi lainnya</summary><ul>{data.completedLessons.slice(3).map(completedItem)}</ul></details>}</section>
  </>;
}

export function LearningDashboard() {
  const {user,refresh}=useAuth();
  const [attempt,setAttempt]=useState(0);
  const [state,setState]=useState<{owner:string;data?:Dashboard;error?:Error;loading:boolean}>({owner:'',loading:true});
  const request=useRef<{key:string;promise:Promise<Dashboard>;pending:boolean}|null>(null);
  const ownerId=user?.id;
  useEffect(()=>{
    if(!ownerId) return;
    let active=true;
    const owner=ownerId,key=`${owner}:${attempt}`;
    if(request.current?.key!==key || !request.current.pending) {
      const promise=authApi<unknown>('/learning/dashboard').then(readLearningDashboard);
      request.current={key,promise,pending:true};
      promise.finally(()=>{if(request.current?.key===key) request.current.pending=false;}).catch(()=>{});
    }
    queueMicrotask(()=>{if(active) setState({owner,loading:true});});
    request.current.promise.then(data=>{if(active) setState({owner,data,loading:false});},error=>{
      if(active) {setState({owner,error,loading:false});if(error instanceof ApiError && error.status===401) void refresh();}
    });
    return ()=>{active=false;};
  },[ownerId,attempt,refresh]);
  useEffect(()=>{
    const reload=()=>{if(!document.hidden && !request.current?.pending) setAttempt(value=>value+1);};
    window.addEventListener('focus',reload);window.addEventListener('pageshow',reload);
    return ()=>{window.removeEventListener('focus',reload);window.removeEventListener('pageshow',reload);};
  },[]);
  if(!user) return null;
  const loading=state.owner!==user.id || state.loading;
  const data=state.owner===user.id?state.data:undefined;
  return <div className="personal-dashboard">
    <header className="dashboard-heading"><div><span className="eyebrow">RUANG BELAJAR ANDA</span><h1>Assalamu&apos;alaikum, {user.nickname}.</h1><p>Lihat perjalanan Anda, pahami progresnya, dan temukan langkah berikutnya.</p></div><Link className="dashboard-header-link" href="/learn/">Jelajahi materi<ArrowUpRight size={16}/></Link></header>
    {loading ? <div className="dashboard-loading"><ActionFeedback state="pending">Memuat progres belajar…</ActionFeedback><span className="dashboard-skeleton"/><div className="dashboard-skeleton-grid"><span/><span/><span/></div></div> : state.error ? <section className="dashboard-unavailable" role="alert"><BookOpen size={25} aria-hidden="true"/><h2>Progres belum dapat ditampilkan.</h2><p>{state.error instanceof ApiError && state.error.status===401?'Sesi Anda telah berakhir. Silakan masuk kembali.':'Progres Anda tidak diubah. Periksa koneksi, lalu coba lagi.'}</p><button className="button button-primary" type="button" onClick={()=>setAttempt(value=>value+1)}><RefreshCw size={15} aria-hidden="true"/>Coba lagi</button><Link href="/learn/">Materi tetap bisa dibaca<ArrowRight size={15} aria-hidden="true"/></Link></section> : data && <DashboardContent data={data}/>}
    <Link className="dashboard-library-link" href="/learn/"><span><BookOpen size={19} aria-hidden="true" /><span>Jelajahi semua materi<small>Anda bebas memilih urutan belajar.</small></span></span><ArrowRight size={18} aria-hidden="true" /></Link>
  </div>;
}
