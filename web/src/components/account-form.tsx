"use client";
import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiUrl, authApi } from '@/lib/auth-api';
import { useAuth } from './auth-provider';

type Mode = 'login'|'register'|'forgot-password'|'reset-password'|'verify-email'|'profile';
const titles:Record<Mode,string> = {login:'Selamat datang kembali',register:'Mulai dengan akun Anda','forgot-password':'Lupa kata sandi?','reset-password':'Buat kata sandi baru','verify-email':'Verifikasi email Anda',profile:'Profil Anda'};
export function AccountForm({mode}:{mode:Mode}) {
  const {user,loading,error:authError,refresh} = useAuth(); const router = useRouter();
  const [busy,setBusy] = useState(false), [error,setError] = useState(''), [message,setMessage] = useState(''), [token,setToken] = useState('');
  useEffect(()=>{
    const hash = new URLSearchParams(window.location.hash.slice(1));
    queueMicrotask(()=>{setToken(hash.get('token') || '');if(new URLSearchParams(window.location.search).has('error'))setError('Login Google tidak berhasil. Coba lagi atau gunakan metode masuk akun Anda.');});
    if(hash.has('token')) window.history.replaceState(null,'',window.location.pathname);
  },[]);
  async function action(work:()=>Promise<void>) {setBusy(true);setError('');setMessage('');try{await work();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
  function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault(); const fields = Object.fromEntries(new FormData(event.currentTarget));
    void action(async()=>{
      if(mode === 'login') {await authApi('/auth/login',fields);await refresh();router.push('/profile/');return;}
      if(mode === 'profile') {await authApi('/users/me',fields,'PATCH');await refresh();setMessage('Profil berhasil disimpan.');return;}
      const path = mode === 'register' ? '/auth/register' : mode === 'forgot-password' ? '/auth/password/forgot' : mode === 'reset-password' ? '/auth/password/reset' : '/auth/verify-email';
      const result = await authApi<{message:string}>(path,mode === 'verify-email' ? {token} : mode === 'reset-password' ? {...fields,token} : fields);
      setMessage(result.message); if(mode === 'verify-email') await refresh();
    });
  }
  const profile = mode === 'profile';
  return <section className="account-page"><div className="account-card"><span className="eyebrow">AKUN TAJWIDLENS</span><h1>{titles[mode]}</h1>
    <p>{profile ? 'Lengkapi profil sesuai kebutuhan belajar Anda.' : 'Al-Qur’an dan materi tajwid tetap dapat diakses tanpa akun.'}</p>
    {error && <p role="alert" className="account-error">{error}</p>}{message && <p role="status" className="account-notice">{message}</p>}
    {profile && loading ? <p role="status">Memuat profil…</p> : profile && !user ? <div><p>{authError || 'Silakan masuk untuk melihat profil.'}</p><Link href="/login/">Masuk ke akun</Link></div> : <>
      {profile && user && <div className="account-notice"><p>{user.email}</p><p>{user.emailVerified ? 'Email terverifikasi' : 'Email belum diverifikasi'}</p><p>Metode masuk: {user.loginMethods.map(m=>m === 'google' ? 'Google' : 'Email dan kata sandi').join(', ')}</p>
        {!user.emailVerified && <button type="button" disabled={busy} onClick={()=>void action(async()=>{const result=await authApi<{message:string}>('/auth/verification/resend',{email:user.email});setMessage(result.message);})}>Kirim ulang verifikasi</button>}</div>}
      <form onSubmit={submit} key={profile ? user?.id : mode}>
        {(profile || mode === 'register') && <label>Nama panggilan<input name="nickname" required maxLength={60} autoComplete="nickname" defaultValue={user?.nickname}/></label>}
        {['login','register','forgot-password'].includes(mode) && <label>Email<input name="email" type="email" required maxLength={254} autoComplete="email"/></label>}
        {['login','register','reset-password'].includes(mode) && <label>Kata sandi<input name="password" type="password" required minLength={mode === 'login' ? 1 : 12} maxLength={128} autoComplete={mode === 'login' ? 'current-password' : 'new-password'}/>{mode !== 'login' && <small>Gunakan 12–128 karakter.</small>}</label>}
        {profile && <><label>Nama lengkap (opsional)<input name="fullName" maxLength={120} autoComplete="name" defaultValue={user?.fullName || ''}/></label><label>Tujuan belajar (opsional)<textarea name="learningGoal" maxLength={500} defaultValue={user?.learningGoal || ''}/></label><label>Pemahaman tajwid<select name="level" defaultValue={user?.level || 'pemula'}><option value="pemula">Pemula</option><option value="menengah">Menengah</option><option value="lanjut">Lanjut</option></select></label></>}
        {['verify-email','reset-password'].includes(mode) && !token ? <p role="alert">Tautan tidak lengkap. Buka tautan dari email Anda.</p> : <button className="account-primary" disabled={busy || !apiUrl} type="submit">{busy ? 'Memproses…' : profile ? 'Simpan profil' : mode === 'login' ? 'Masuk' : mode === 'register' ? 'Daftar' : mode === 'forgot-password' ? 'Kirim tautan pemulihan' : mode === 'reset-password' ? 'Simpan kata sandi' : 'Verifikasi email'}</button>}
      </form>
      {['login','register'].includes(mode) && <>{apiUrl && <a className="account-google" href={`${apiUrl}/api/v1/auth/google/start`}>Lanjutkan dengan Google</a>}<p>{mode === 'login' ? 'Belum memiliki akun?' : 'Sudah memiliki akun?'} <Link href={mode === 'login' ? '/register/' : '/login/'}>{mode === 'login' ? 'Daftar' : 'Masuk'}</Link></p></>}
      {mode === 'login' && <Link href="/forgot-password/">Lupa kata sandi?</Link>}
      {['forgot-password','reset-password','verify-email'].includes(mode) && <Link href="/login/">Kembali ke halaman masuk</Link>}
      {profile && <button type="button" disabled={busy} onClick={()=>void action(async()=>{await authApi('/auth/logout',{});await refresh();router.push('/login/');})}>Keluar dari akun</button>}
    </>}
    {!apiUrl && <p role="status">Layanan akun belum dikonfigurasi.</p>}<Link className="account-guest" href="/explore/">Lanjut membaca tanpa akun →</Link>
  </div></section>;
}
