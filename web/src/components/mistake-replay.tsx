"use client";
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {useEffect,useRef,useState} from 'react';
import {RotateCcw,ArrowRight,CheckCircle2} from 'lucide-react';
import {lessonCatalog} from '@/data/lesson-catalog';
import {authApi,ApiError} from '@/lib/auth-api';
import {MistakeList,readMistakes,readAttempt} from '@/lib/quiz';
import {useAuth} from './auth-provider';
import {ActionFeedback} from './action-feedback';
export function MistakeReplay(){
  const {user,refresh}=useAuth(),owner=user?.id,router=useRouter();
  const [state,setState]=useState<{owner?:string;data?:MistakeList;error?:string}>({});
  const [reload,setReload]=useState(0),[busy,setBusy]=useState(''),[error,setError]=useState('');
  const active=useRef(owner);useEffect(()=>{active.current=owner;return()=>{active.current=undefined;};},[owner]);
  useEffect(()=>{
    if(!owner)return;let live=true;
    queueMicrotask(()=>{if(live)setState({owner});});
    void authApi('/reviews/mistakes').then(readMistakes).then(data=>{if(live)setState({owner,data});},error=>{if(live){setState({owner,error:error.message});if(error instanceof ApiError && error.status===401)void refresh();}});
    return()=>{live=false;};
  },[owner,reload,refresh]);
  const data=state.owner===owner?state.data:undefined;
  async function practice(id:string){
    if(busy)return;const requestOwner=owner;setBusy(id);setError('');
    try{const attempt=readAttempt(await authApi(`/reviews/mistakes/${id}/practice`,{}));if(active.current===requestOwner)router.push(`/quiz/?attempt=${attempt.id}`);}
    catch(err){if(active.current===requestOwner){setError((err as Error).message);if(err instanceof ApiError && err.status===401)void refresh();}}finally{setBusy('');}
  }
  async function more(){
    if(!data?.nextCursor || busy)return;const requestOwner=owner;setBusy('more');setError('');
    try{const page=readMistakes(await authApi(`/reviews/mistakes?cursor=${encodeURIComponent(data.nextCursor)}`));if(active.current===requestOwner)setState({owner,data:{...page,items:[...data.items,...page.items.filter(i=>!data.items.some(old=>old.id===i.id))]}});}
    catch(err){if(active.current===requestOwner)setError((err as Error).message);}finally{setBusy('');}
  }
  return <div className="assessment-page"><header className="assessment-heading"><div><span className="eyebrow">MISTAKE REPLAY</span><h1>Pemahaman layak diulang.</h1><p>Latihan pilihan untuk konsep yang pernah terasa sulit. Mulai kapan pun Anda siap; nilai quiz dan kelulusan materi tetap terjaga.</p></div><RotateCcw size={36} aria-hidden="true"/></header>{!data?state.error?<section className="assessment-card" role="alert"><h2>Latihan ulang belum dapat dimuat.</h2><p>{state.error}</p><button className="button button-primary" onClick={()=>setReload(n=>n+1)}>Coba lagi</button></section>:<ActionFeedback state="pending">Memuat konsep latihan…</ActionFeedback>:<><div className="replay-summary"><strong>{data.needsReviewCount}</strong><p>konsep bisa dilatih kembali<span>Konsep yang belum diperbaiki tampil lebih dahulu.</span></p></div>{!data.items.length?<section className="assessment-card assessment-empty"><CheckCircle2 size={32}/><h2>Belum ada konsep untuk diulang.</h2><p>Konsep akan muncul di sini setelah Anda menjawab kurang tepat dalam quiz atau Detective saat masuk akun.</p><Link className="button button-primary" href="/detective/">Jelajahi Detective<ArrowRight size={16}/></Link></section>:<div className="replay-list">{data.items.map(item=><article className="assessment-card replay-item" key={item.id}><span className={`replay-status ${item.status==='IMPROVED'?'improved':''}`}>{item.status==='IMPROVED'?<CheckCircle2 size={16}/>:<RotateCcw size={16}/>} {item.status==='IMPROVED'?'Berhasil dilatih kembali':'Bisa dilatih kembali'}</span><h2>{item.conceptLabel}</h2><p>{lessonCatalog.find(l=>l.id===item.lessonId)?.title}</p><small>Latihan terakhir <time dateTime={item.improvedAt || item.lastMistakeAt}>{new Date(item.improvedAt || item.lastMistakeAt).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'})}</time></small>{item.practiceAvailable?<button className="button button-secondary" disabled={!!busy} onClick={()=>void practice(item.id)}>{busy===item.id?'Menyiapkan…':'Latih kembali'}<ArrowRight size={16}/></button>:<p className="replay-unavailable">Soal latihan yang telah direview belum tersedia untuk konsep ini.</p>}</article>)}</div>}{data.nextCursor && <button className="button button-secondary" disabled={!!busy} onClick={()=>void more()}>Lihat konsep lainnya</button>}</>}{busy && <ActionFeedback state="pending">Menyiapkan latihan Anda…</ActionFeedback>}{error && <p className="assessment-error" role="alert">{error}</p>}<Link className="assessment-back" href="/dashboard/">Kembali ke dashboard<ArrowRight size={16}/></Link></div>;
}
