"use client";

import Link from "next/link";
import {ArrowUpRight,Search,CheckCircle2,CircleDot,Circle} from "lucide-react";
import {useEffect,useMemo,useRef,useState} from "react";
import {lessons} from "@/data/lessons";
import {ApiError,authApi} from "@/lib/auth-api";
import {LessonStatus,readLessonProgressList,lessonStatusLabel} from "@/lib/learning";
import {useAuth} from "./auth-provider";
import {ActionFeedback} from "./action-feedback";
import {LessonVisual} from "./lesson-visual";
import {LearningPath} from "./learning-path";

const categories=["Semua",...new Set(lessons.map(lesson=>lesson.category))];
export function LessonLibrary() {
  const {user,refresh}=useAuth(),ownerId=user?.id;
  const [category,setCategory]=useState("Semua"),[query,setQuery]=useState(""),[attempt,setAttempt]=useState(0);
  const [progress,setProgress]=useState<{owner:string;states?:Map<string,LessonStatus>;error?:Error}>({owner:''});
  const request=useRef<{key:string;promise:Promise<Map<string,LessonStatus>>;pending:boolean}|null>(null);
  useEffect(()=>{
    if(!ownerId)return;
    let active=true;
    const key=ownerId+':'+attempt;
    if(request.current?.key!==key || !request.current.pending){
      const promise=authApi<unknown>('/learning/progress').then(readLessonProgressList).then(rows=>new Map(rows.map(row=>[row.lessonId,row.status])));
      request.current={key,promise,pending:true};
      promise.finally(()=>{if(request.current?.key===key)request.current.pending=false;}).catch(()=>{});
    }
    request.current.promise.then(states=>{if(active)setProgress({owner:ownerId,states});},error=>{
      if(active){setProgress({owner:ownerId,error});if(error instanceof ApiError && error.status===401)void refresh();}
    });
    return()=>{active=false;};
  },[ownerId,attempt,refresh]);
  useEffect(()=>{
    const reload=()=>{if(!document.hidden && !request.current?.pending)setAttempt(value=>value+1);};
    window.addEventListener('focus',reload);window.addEventListener('pageshow',reload);
    return()=>{window.removeEventListener('focus',reload);window.removeEventListener('pageshow',reload);};
  },[]);
  const states=progress.owner===ownerId?progress.states:undefined;
  const error=progress.owner===ownerId?progress.error:undefined;
  const filtered=useMemo(()=>lessons.filter(lesson=>(category==="Semua" || lesson.category===category) && (lesson.title+' '+lesson.summary+' '+lesson.keywords.join(' ')).toLowerCase().includes(query.toLowerCase().trim())),[category,query]);
  return <>
    <LearningPath states={states}/>
    {user && <div className="library-progress-summary">
      {error?<p role="alert">Penanda progres belum dapat dimuat. Materi tetap bisa dibaca. <button type="button" onClick={()=>setAttempt(value=>value+1)}>Coba lagi</button></p>:states?<p><CheckCircle2 size={18} aria-hidden="true"/><strong>{[...states.values()].filter(status=>status==='COMPLETED').length} dari {lessons.length} materi selesai</strong><span>Penanda mengikuti progres akun Anda.</span></p>:<ActionFeedback state="pending">Memuat penanda progres…</ActionFeedback>}
    </div>}
    <div className="library"><div className="library-tools"><div className="category-tabs" role="group" aria-label="Kategori materi">{categories.map(item=><button type="button" key={item} className={item===category?"active":""} onClick={()=>setCategory(item)} aria-pressed={item===category}>{item}</button>)}</div><label className="library-search"><Search size={17}/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Cari materi…" aria-label="Cari materi tajwid"/></label></div>
      {filtered.length?<div className="lesson-list">{filtered.map(lesson=>{
        const index=lessons.findIndex(item=>item.id===lesson.id),status=states?.get(lesson.id);
        return <Link key={lesson.id} href={'/learn/'+lesson.slug+'/'} className={'lesson-row'+(status?' lesson-status-'+status.toLowerCase():'')}>
          <div className="lesson-card-top"><span className="lesson-number">{String(index+1).padStart(2,"0")}</span><ArrowUpRight size={19}/></div>
          <LessonVisual category={lesson.category} sample={lesson.focus.sample} index={index}/>
          <div className="lesson-card-copy"><span className="eyebrow">{lesson.category}</span><h2>{lesson.title}</h2><p>{lesson.summary}</p>
            {status && <span className={'lesson-status-badge status-'+status.toLowerCase()}>{status==='COMPLETED'?<CheckCircle2 size={14}/>:status==='IN_PROGRESS'?<CircleDot size={14}/>:<Circle size={12}/>}<span>{lessonStatusLabel[status]}</span></span>}
          </div>
        </Link>;
      })}</div>:<div className="library-empty"><strong>Materi belum ditemukan.</strong><p>Coba istilah lain atau pilih kategori Semua.</p></div>}
    </div>
  </>;
}
