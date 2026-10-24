"use client";

import Link from 'next/link';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Eye, EyeOff, LockKeyhole } from 'lucide-react';
import { apiUrl, authApi } from '@/lib/auth-api';
import { googleLoginError, safeReturnPath } from '@/lib/auth-navigation';
import { assetPath } from '@/lib/asset-path';
import { useAuth } from './auth-provider';
import { isOAuthCompletion, oauthChannel } from '@/lib/oauth-completion';

type Mode = 'login' | 'register' | 'forgot-password' | 'reset-password' | 'verify-email' | 'profile';
const titles: Record<Mode, string> = {
  login: 'Senang Anda kembali.', register: 'Mulai perjalanan Anda.',
  'forgot-password': 'Lupa kata sandi?', 'reset-password': 'Buat kata sandi baru.',
  'verify-email': 'Verifikasi email Anda.', profile: 'Profil Anda',
};

function PasswordField({ login }: { login: boolean }) {
  const [visible, setVisible] = useState(false);
  return <div className="account-field">
    <label htmlFor="password">Kata sandi</label>
    <div className="password-field">
      <input id="password" name="password" type={visible ? 'text' : 'password'} required minLength={login ? 1 : 12} maxLength={128} autoComplete={login ? 'current-password' : 'new-password'} aria-describedby={login ? undefined : 'password-hint'} />
      <button type="button" onClick={() => setVisible(!visible)} aria-label={visible ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'} aria-pressed={visible}>
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
    {!login && <small id="password-hint">Gunakan 12–128 karakter.</small>}
  </div>;
}
export function GoogleIcon() {
  return <svg width="19" height="19" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2.1H12v4h5.4a4.6 4.6 0 0 1-2 3v2.5h3.3c1.9-1.8 2.9-4.3 2.9-7.4Z" />
    <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.7-2.4l-3.3-2.5c-.9.6-2.1.9-3.4.9-2.6 0-4.9-1.8-5.7-4.2H2.9v2.6A10 10 0 0 0 12 22Z" />
    <path fill="#FBBC05" d="M6.3 13.8a6 6 0 0 1 0-3.6V7.6H2.9a10 10 0 0 0 0 8.8l3.4-2.6Z" />
    <path fill="#EA4335" d="M12 6c1.5 0 2.8.5 3.9 1.5l2.9-2.9A9.5 9.5 0 0 0 12 2a10 10 0 0 0-9.1 5.6l3.4 2.6A6 6 0 0 1 12 6Z" />
  </svg>;
}
export function AccountForm({ mode }: { mode: Mode }) {
  const { user, loading, error: authError, capabilities, refresh } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [googleOpened, setGoogleOpened] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [token, setToken] = useState('');
  const [destination, setDestination] = useState('/home/');
  const [welcome, setWelcome] = useState(false);
  const [routeReady, setRouteReady] = useState(false);
  const working = useRef(false);
  const completing = useRef(false);
  const completionIds = useRef(new Set<string>());
  const errorRef = useRef<HTMLParagraphElement>(null);
  const profile = mode === 'profile';
  const entry = mode === 'login' || mode === 'register';
  const emailDeferred = !loading && !!capabilities && !capabilities.emailDelivery;
  const registrationDeferred = mode === 'register' && capabilities?.emailRegistration === false;

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const query = new URLSearchParams(window.location.search);
    queueMicrotask(() => {
      setToken(hash.get('token') || '');
      setDestination(query.get('error') === 'google_account_exists' ? '/profile/' : safeReturnPath(query.get('next')));
      setWelcome(query.get('welcome') === '1');
      setRouteReady(true);
      if (query.has('error')) setError(googleLoginError(query.get('error')));
    });
    if (hash.has('token')) window.history.replaceState(null, '', window.location.pathname);
  }, []);
  useEffect(() => { if (error) errorRef.current?.focus(); }, [error]);
  useEffect(() => {
    const restore = () => { working.current = false; setBusy(false); };
    window.addEventListener('pageshow', restore);
    return () => window.removeEventListener('pageshow', restore);
  }, []);
  useEffect(() => {
    if (!googleOpened) return;
    const checkSession = () => { if (!completing.current) void refresh(); };
    window.addEventListener('focus', checkSession);
    const channel = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel(oauthChannel);
    if (channel) channel.onmessage = async ({data}) => {
      if (!isOAuthCompletion(data)) return;
      completionIds.current.add(data.id);
      if (completing.current) return;
      completing.current = true;
      if (data.next === '/profile/?welcome=1') setDestination(data.next);
      if (await refresh()) completionIds.current.forEach(id => channel.postMessage({type:'ack',id}));
      else { completing.current = false;setError('Sesi Google belum tersedia. Periksa pengaturan cookie browser lalu coba lagi.'); }
    };
    return () => { window.removeEventListener('focus', checkSession);channel?.close(); };
  }, [googleOpened, refresh]);
  useEffect(() => {
    if (routeReady && !loading && user && entry) router.replace(destination);
  }, [routeReady, loading, user, entry, destination, router]);

  async function action(work: () => Promise<void>) {
    if (working.current) return;
    working.current = true; setBusy(true); setError(''); setMessage('');
    try { await work(); } catch (e) { setError((e as Error).message); }
    finally { working.current = false; setBusy(false); }
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    void action(async () => {
      if (mode === 'login') {
        await authApi('/auth/login', fields);
        if (!await refresh()) throw new Error('Sesi belum tersimpan. Periksa pengaturan cookie browser lalu coba lagi.');
        return;
      }
      if (profile) {
        await authApi('/users/me', fields, 'PATCH'); await refresh();
        if (welcome) router.replace('/home/'); else setMessage('Profil berhasil disimpan.');
        return;
      }
      const path = mode === 'register' ? '/auth/register' : mode === 'forgot-password' ? '/auth/password/forgot' : mode === 'reset-password' ? '/auth/password/reset' : '/auth/verify-email';
      const result = await authApi<{ message: string }>(path, mode === 'verify-email' ? { token } : mode === 'reset-password' ? { ...fields, token } : fields);
      setMessage(result.message);
      if (mode === 'verify-email') await refresh();
    });
  }
  function googleLogin() {
    if (working.current || !apiUrl || !capabilities?.google) return;
    setError('');
    completing.current = false;
    completionIds.current.clear();
    try { window.open(apiUrl + '/api/v1/auth/google/start', '_blank', 'noopener,noreferrer,popup,width=520,height=740'); }
    catch { setError('Browser tidak mengizinkan jendela Google. Gunakan tautan lanjutkan di tab ini.'); }
    setGoogleOpened(true);
  }

  return <section className={entry ? 'account-card' : 'account-page account-card'}>
    <span className="account-eyebrow">{profile ? 'AKUN ANDA' : 'AKUN TAJWIDLENS'}</span>
    {profile ? <h2>{welcome ? 'Bagaimana kami menyapa Anda?' : 'Informasi profil'}</h2> : <h1>{titles[mode]}</h1>}
    <p className="account-intro">{profile ? welcome ? 'Nama dari Google sudah terisi. Sesuaikan jika perlu, lalu mulai belajar.' : 'Atur nama dan informasi belajar Anda.' : mode === 'register' ? 'Satu akun, ruang untuk terus belajar.' : entry ? 'Masuk untuk melanjutkan perjalanan belajar Anda.' : 'Kelola akses ke akun TajwidLens Anda.'}</p>
    {entry && <>
      <button className="account-google" type="button" disabled={busy || !capabilities?.google} onClick={googleLogin}><GoogleIcon />{mode === 'register' ? 'Daftar dengan Google' : 'Masuk dengan Google'}</button>
      {googleOpened && <div className="account-notice" role="status">
        <p>Selesaikan login di jendela Google. Jika jendela tidak terbuka, <a href={apiUrl + '/api/v1/auth/google/start'}>lanjutkan di tab ini</a>.</p>
        <p>Jika Google menolak browser tertanam, buka halaman ini di Chrome atau Edge.</p>
        <button type="button" disabled={busy} onClick={() => void action(async () => { if (!await refresh()) setMessage('Sesi Google belum tersedia. Selesaikan login di jendela Google lalu coba lagi.'); })}>Periksa status login</button>
      </div>}
      {!loading && capabilities && !capabilities.google && <p className="account-muted">Login Google belum tersedia. Gunakan email atau lanjutkan tanpa akun.</p>}
      <div className="account-divider"><span>atau gunakan email</span></div>
    </>}
    {authError && <div className="account-notice"><p role="status">{authError}</p><button type="button" disabled={busy} onClick={() => void action(async () => { await refresh(); })}>Coba lagi</button></div>}
    {error && <p ref={errorRef} tabIndex={-1} role="alert" className="account-error">{error}</p>}
    {message && <p role="status" className="account-notice">{message}</p>}
    {registrationDeferred && !loading && capabilities && <p role="status" className="account-notice">Pendaftaran melalui email belum tersedia. Anda dapat menggunakan Google atau melanjutkan tanpa akun.</p>}
    {emailDeferred && ['forgot-password', 'verify-email'].includes(mode) && <p role="status" className="account-notice">Pengiriman email ditunda. Verifikasi dan pemulihan kata sandi melalui email belum tersedia. Jika akun Anda menggunakan Google, silakan masuk dengan Google.</p>}
    {mode === 'register' && capabilities?.developmentRegistration && <p className="account-development-note"><LockKeyhole size={14} aria-hidden="true" />Untuk pengujian, akun dapat langsung dipakai. Email belum diverifikasi.</p>}
    {profile && !user ? <p>{loading ? 'Memuat profil…' : 'Masuk kembali untuk melihat profil Anda.'} <Link href="/login/?next=/profile/">Masuk ke akun</Link></p> : <>
      {profile && user && !welcome && <div className="account-notice"><p>{user.email}</p><p>{user.emailVerified ? 'Email terverifikasi' : 'Email belum diverifikasi'}</p>
        {!user.emailVerified && (capabilities?.emailDelivery ? <button type="button" disabled={busy} onClick={() => void action(async () => { const result = await authApi<{ message: string }>('/auth/verification/resend', { email: user.email }); setMessage(result.message); })}>Kirim ulang verifikasi</button> : <p>Pengiriman verifikasi email ditunda.</p>)}
      </div>}
      <form onSubmit={submit} key={profile ? user?.id : mode} aria-busy={busy}>
        <fieldset disabled={busy || registrationDeferred || (emailDeferred && mode === 'forgot-password')}>
          {(profile || mode === 'register') && <div className="account-field"><label htmlFor="nickname">Nama panggilan</label><input id="nickname" name="nickname" required maxLength={60} autoComplete="nickname" defaultValue={user?.nickname} /></div>}
          {['login', 'register', 'forgot-password'].includes(mode) && <div className="account-field"><label htmlFor="email">Email</label><input id="email" name="email" type="email" required maxLength={254} autoComplete="email" autoCapitalize="none" spellCheck={false} placeholder="nama@email.com" /></div>}
          {['login', 'register', 'reset-password'].includes(mode) && <PasswordField login={mode === 'login'} />}
          {profile && !welcome && <>
            <div className="account-field"><label htmlFor="fullName">Nama lengkap (opsional)</label><input id="fullName" name="fullName" maxLength={120} autoComplete="name" defaultValue={user?.fullName || ''} /></div>
            <div className="account-field"><label htmlFor="learningGoal">Tujuan belajar (opsional)</label><textarea id="learningGoal" name="learningGoal" maxLength={500} defaultValue={user?.learningGoal || ''} /></div>
            <div className="account-field"><label htmlFor="level">Pemahaman tajwid</label><select id="level" name="level" defaultValue={user?.level || 'pemula'}><option value="pemula">Pemula</option><option value="menengah">Menengah</option><option value="lanjut">Lanjut</option></select></div>
          </>}
          {mode === 'login' && capabilities?.emailDelivery && <Link className="account-forgot" href="/forgot-password/">Lupa kata sandi?</Link>}
          {['verify-email', 'reset-password'].includes(mode) && !token ? <p role="alert">Tautan tidak lengkap. Buka tautan dari email Anda.</p> : <button className="account-primary" type="submit">{busy ? 'Memproses…' : profile ? welcome ? 'Simpan dan mulai belajar' : 'Simpan profil' : mode === 'login' ? 'Masuk' : mode === 'register' ? 'Daftar' : mode === 'forgot-password' ? 'Kirim tautan pemulihan' : mode === 'reset-password' ? 'Simpan kata sandi' : 'Verifikasi email'}<ArrowRight size={17} aria-hidden="true" /></button>}
        </fieldset>
      </form>
    </>}
    {entry ? <>
      <p className="account-switch">{mode === 'login' ? 'Belum punya akun?' : 'Sudah punya akun?'} <Link href={(mode === 'login' ? '/register/' : '/login/') + '?next=' + encodeURIComponent(destination)}>{mode === 'login' ? 'Daftar' : 'Masuk'}</Link></p>
      <div className="account-guest"><Link href="/home/">Lanjutkan tanpa akun <ArrowRight size={15} aria-hidden="true" /></Link><p>Membaca dan belajar tetap gratis, tanpa akun.</p></div>
    </> : !profile ? <p className="account-switch"><Link href="/login/">Kembali ke halaman masuk</Link></p> : user && <>
      {!welcome && user.loginMethods.includes('password') && !user.loginMethods.includes('google') && capabilities?.google && <form className="account-link-google" aria-label="Hubungkan akun Google" onSubmit={event => {
        event.preventDefault();
        const password = String(new FormData(event.currentTarget).get('password') || '');
        void action(async () => {
          const result = await authApi<{url:string}>('/auth/google/link',{password});
          window.location.assign(result.url);
        });
      }}>
        <h2>Hubungkan Google</h2>
        <p>Konfirmasi kata sandi, lalu pilih akun Google dengan email {user.email}. Setelah terhubung, Anda dapat masuk dengan Google atau kata sandi. Profil Anda tetap sama.</p>
        <div className="account-field"><label htmlFor="google-link-password">Konfirmasi kata sandi akun</label><input id="google-link-password" name="password" type="password" minLength={1} maxLength={128} autoComplete="current-password" required disabled={busy} /></div>
        <button type="submit" className="account-google" disabled={busy}><GoogleIcon />{busy ? 'Memproses…' : 'Hubungkan Google'}</button>
      </form>}
      {user.loginMethods.includes('google') && <p className="account-notice">Google terhubung. Anda dapat masuk menggunakan akun Google Anda.</p>}
      <button className="account-logout" type="button" disabled={busy} onClick={() => void action(async () => { await authApi('/auth/logout', {}); window.location.replace(assetPath('/login/')); })}>Keluar dari akun</button>
    </>}
  </section>;
}
