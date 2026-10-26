"use client";

import Link from 'next/link';
import {useEffect,useRef,useState} from 'react';
import {ArrowRight,ArrowUpRight,BookOpen,Check,CheckCircle2,RotateCcw,ShieldCheck,Target} from 'lucide-react';
import type {QuizAttemptView,QuizResult} from '@/lib/quiz';
import {lessonCatalog} from '@/data/lesson-catalog';
import {AnswerReview} from './quiz-question';

export function QuizResultView({attempt,result,busy,onRetry}:{attempt:QuizAttemptView;result:QuizResult;busy:boolean;onRetry:()=>void}){
  const [onlyMistakes,setOnlyMistakes]=useState(false),heading=useRef<HTMLHeadingElement>(null);
  useEffect(()=>{heading.current?.focus();},[]);
  const replay=attempt.mode==='REPLAY',lesson=lessonCatalog.find(l=>l.id===attempt.lessonId),index=lesson?lessonCatalog.indexOf(lesson):-1;
  const next=index>=0?lessonCatalog[index+1]:undefined,wrong=result.totalQuestions-result.correctCount;
  const title=replay?(result.passed?'Konsep berhasil dilatih kembali.':'Mari pelajari pembahasannya.'):result.passed?'Bagus! Evaluasi materi ini selesai.':'Pemahaman bertumbuh lewat latihan.';
  const items=result.feedback.filter(q=>!onlyMistakes||!q.correct);
  return <div className="quiz-results">
    <section className={`result-overview ${result.passed?'result-success':'result-practice'}`} aria-labelledby="result-heading">
      <div className="result-overview-copy"><span className="result-outcome">{result.passed?<CheckCircle2 size={16}/>:<Target size={16}/>} {replay?'LATIHAN ULANG SELESAI':result.passed?'EVALUASI BERHASIL':'LANJUTKAN PROSES BELAJAR'}</span>
        <h2 id="result-heading" ref={heading} tabIndex={-1}>{title}</h2>
        <p>{replay?'Latihan ini membantu menguatkan konsep. Nilai dan kelulusan quiz sebelumnya tetap.':result.passed?'Anda sudah mampu menerapkan konsep pada evaluasi ini. Tinjau alasannya, lalu lanjutkan ke materi berikutnya.':'Kesalahan menunjukkan bagian yang bisa dikuatkan. Baca pembahasannya, pelajari kembali konsepnya, lalu coba dengan soal lain.'}</p>
        <span className="result-saved"><ShieldCheck size={15}/>{result.completionVerified?'Kelulusan terverifikasi dan tersimpan di akun Anda.':'Hasil evaluasi tersimpan di akun Anda.'}</span>
      </div>
      <div className="result-score-display"><div className="result-score-ring"><svg viewBox="0 0 160 160" aria-hidden="true"><circle className="result-ring-track" cx="80" cy="80" r="68"/><circle className="result-ring-value" cx="80" cy="80" r="68" pathLength="100" strokeDasharray={`${result.percentage} 100`}/></svg><div><strong>{result.correctCount}<small>/{result.totalQuestions}</small></strong><span>jawaban benar</span></div></div><span className="result-percentage">{result.percentage.toLocaleString('id-ID')}% akurasi jawaban</span></div>
      <div className="result-metrics"><div><Check size={17}/><span>Sudah tepat<strong>{result.correctCount} jawaban</strong></span></div><div><RotateCcw size={16}/><span>Perlu dilatih<strong>{wrong} jawaban</strong></span></div><div><Target size={17}/><span>{replay?'Bentuk latihan':'Ambang kelulusan'}<strong>{replay?'Penguatan konsep':'6 dari 7 benar'}</strong></span></div></div>
    </section>
    <section className="result-next-action" aria-labelledby="result-next-heading"><div><span className="section-kicker">LANGKAH BERIKUTNYA</span><h3 id="result-next-heading">{replay?'Beri ruang untuk pengulangan.':result.passed?(next?`Berikutnya: ${next.title}`:'Semua materi sudah Anda jelajahi?'):'Mulai dari bagian yang masih sulit.'}</h3><p>{result.passed?'Pemahaman menjadi lebih kuat saat terus dipakai. Anda dapat melanjutkan atau mengulang evaluasi ini.':'Gunakan pembahasan di bawah sebagai petunjuk saat membaca materi kembali.'}</p></div><div className="result-next-buttons">{replay?<Link className="button button-primary" href="/reviews/">Kembali ke latihan ulang<ArrowRight size={16}/></Link>:<>{result.passed&&next?<Link className="button button-primary" href={`/learn/${next.slug}/`}>Materi berikutnya<ArrowRight size={16}/></Link>:<Link className="button button-secondary" href={lesson?`/learn/${lesson.slug}/`:'/learn/'}><BookOpen size={16}/>Pelajari kembali materi</Link>}<button className={`button ${result.passed?'button-secondary':'button-primary'}`} disabled={busy} onClick={onRetry}><RotateCcw size={15}/>{busy?'Menyiapkan…':'Coba evaluasi lagi'}</button></>}</div></section>
    <section className="result-review-section" aria-labelledby="result-review-heading"><div className="result-review-header"><div><span className="section-kicker">PAHAMI ALASANNYA</span><h2 id="result-review-heading">Pahami setiap jawaban.</h2><p>Pembahasan mengikuti versi soal saat evaluasi dimulai.</p></div><div className="result-review-filter" aria-label="Filter pembahasan"><button aria-pressed={!onlyMistakes} onClick={()=>setOnlyMistakes(false)}>Semua <span>{result.totalQuestions}</span></button><button aria-pressed={onlyMistakes} onClick={()=>setOnlyMistakes(true)}>Perlu dilatih <span>{wrong}</span></button></div></div>
      {items.length?items.map(q=><AnswerReview key={q.id} question={q} number={result.feedback.indexOf(q)+1} reporting={{attemptId:attempt.id}}/>):<div className="result-no-mistakes"><CheckCircle2 size={26}/><h3>Semua jawaban sudah tepat.</h3><p>Anda tetap dapat membuka seluruh pembahasan untuk menguatkan alasannya.</p><button onClick={()=>setOnlyMistakes(false)}>Lihat semua pembahasan<ArrowRight size={15}/></button></div>}
    </section>
    <Link className="result-replay-link" href="/reviews/"><span><RotateCcw size={17}/>Latih konsep yang perlu diulang</span><ArrowUpRight size={18}/></Link>
  </div>;
}
