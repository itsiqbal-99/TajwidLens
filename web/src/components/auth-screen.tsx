"use client";

import Image from 'next/image';
import { PointerEvent } from 'react';
import { BookOpen } from 'lucide-react';
import { AccountForm } from './account-form';
import { assetPath } from '@/lib/asset-path';

function moveArtwork(event: PointerEvent<HTMLElement>) {
  if (event.pointerType !== 'mouse' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const box = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty('--art-x', (((event.clientX - box.left) / box.width - .5) * 12) + 'px');
  event.currentTarget.style.setProperty('--art-y', (((event.clientY - box.top) / box.height - .5) * 10) + 'px');
}

export function AuthScreen({ mode }: { mode: 'login' | 'register' }) {
  return <div className="auth-entry">
    <div className="auth-form-panel"><AccountForm mode={mode} /></div>
    <aside className="auth-hero" aria-label="Belajar bersama TajwidLens" onPointerMove={moveArtwork} onPointerLeave={event => { event.currentTarget.style.removeProperty('--art-x'); event.currentTarget.style.removeProperty('--art-y'); }}>
      <div className="auth-illustration" aria-hidden="true">
        <div className="auth-artwork-depth">
          <Image src={assetPath('/auth-study-architectural.webp')} fill sizes="(max-width: 850px) 100vw, 650px" alt="" priority />
        </div>
      </div>
      <div className="auth-hero-heading">
        <span className="auth-editorial-label"><span />RUANG UNTUK BERTUMBUH</span>
        <h2>Bacaan lebih baik.<br /><span>Dimulai dari sini.</span></h2>
        <p>Temukan ketenangan dalam setiap ayat.<br />Pelajari tajwid, selangkah demi selangkah.</p>
      </div>
      <div className="auth-quote">
        <figure>
          <span className="auth-quote-label"><BookOpen size={15} aria-hidden="true" />BELAJAR &amp; MENGAJARKAN</span>
          <blockquote>
            <p className="auth-quote-arabic" lang="ar" dir="rtl">خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ</p>
            <p className="auth-quote-translation">“Sebaik-baik orang di antara kalian adalah yang belajar Al-Qur&apos;an dan mengajarkannya.”</p>
          </blockquote>
          <figcaption>HR. Bukhari no. 5027 <span>· Dari Utsman bin &apos;Affan</span></figcaption>
        </figure>
      </div>
      <div className="auth-hero-foot"><span>BACA. PAHAMI. AMALKAN.</span><span>TAJWIDLENS</span></div>
    </aside>
  </div>;
}

