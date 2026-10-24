"use client";

import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, BookOpen, Check, Mail, KeyRound, UserRound } from 'lucide-react';
import { assetPath } from '@/lib/asset-path';
import { AccountForm, GoogleIcon } from './account-form';
import { useAuth } from './auth-provider';

export function ProfileScreen() {
  const {user} = useAuth();
  if (!user) return null;
  return <div className="profile-screen">
    <div className="profile-breadcrumb"><Link href="/home/">Beranda</Link><span>/</span><span>Akun saya</span></div>
    <header className="profile-hero">
      <div className="profile-hero-copy">
        <span className="profile-kicker">RUANG BELAJAR ANDA</span>
        <h1>Selamat datang,<br />{user.nickname}.</h1>
        <p>Langkah kecil hari ini, bacaan lebih baik esok hari.<br />Atur profil dan buat pengalaman belajar lebih personal.</p>
        <Link className="profile-continue" href="/learn/">Lanjutkan belajar <ArrowUpRight size={16} aria-hidden="true" /></Link>
      </div>
      <div className="profile-hero-art" aria-hidden="true"><Image src={assetPath('/auth-study-architectural.webp')} fill sizes="(max-width: 700px) 100vw, 560px" alt="" priority /></div>
    </header>
    <div className="profile-workspace">
      <aside className="profile-identity">
        <div className="profile-avatar" aria-hidden="true">{user.nickname.trim().slice(0,1).toUpperCase() || <UserRound size={30} />}</div>
        <span className="profile-kicker">AKUN PERSONAL</span>
        <h2>{user.nickname}</h2>
        <p className="profile-email">{user.email}</p>
        <div className={`profile-verification ${user.emailVerified ? 'is-verified' : ''}`}>{user.emailVerified ? <Check size={13} aria-hidden="true" /> : <Mail size={13} aria-hidden="true" />}{user.emailVerified ? 'Terverifikasi' : 'Belum terverifikasi'}</div>
        <div className="profile-access"><h3>Metode masuk</h3>
          {user.loginMethods.includes('google') && <p><GoogleIcon /><span>Akun Google<small>Terhubung</small></span><Check size={15} aria-hidden="true" /></p>}
          {user.loginMethods.includes('password') && <p><KeyRound size={19} aria-hidden="true" /><span>Email &amp; kata sandi<small>Tersedia</small></span><Check size={15} aria-hidden="true" /></p>}
        </div>
        <div className="profile-learning-note"><BookOpen size={20} aria-hidden="true" /><p>Belajar dengan tenang.<br />Bertumbuh dengan konsisten.</p></div>
      </aside>
      <div className="profile-editor"><AccountForm mode="profile" /></div>
    </div>
  </div>;
}
