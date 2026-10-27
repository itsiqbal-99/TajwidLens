"use client";

import { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {ActionFeedback} from './action-feedback';

export function OAuthComplete() {
  const router = useRouter();
  const [destination] = useState('/dashboard/');
  const [checked, setChecked] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Immediately verify session via API
    const verifySession = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/me`, {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
        if (res.ok) {
          const user = await res.json();
          setVerified(true);
          setChecked(true);
          
          // Close current tab/window and redirect opener to dashboard
          const opener = window.opener;
          if (opener && typeof opener !== 'string') {
            try {
              opener.location.replace(destination);
            } catch (e) {
              router.replace(destination);
            }
          } else {
            router.replace(destination);
          }
          // Close current window/tab
          window.close();
        } else {
          setChecked(true);
          setError('Sesi tidak terverifikasi. Silakan login kembali.');
        }
      } catch (e) {
        setChecked(true);
        setError('Gagal memverifikasi sesi. Coba lagi atau lanjutkan tanpa akun.');
      }
    };

    verifySession();

    // Also listen for any BroadcastChannel message as secondary signal
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel('tajwidlens-oauth-completion');
      const message = { type: 'check', id: crypto.randomUUID(), next: '/dashboard/' };
      channel.postMessage(message);
      
      channel.onmessage = (e) => {
        if (e.data && e.data.type === 'received' && e.data.id) {
          setVerified(true);
          setChecked(true);
          
          // Also close and redirect opener
          const opener = window.opener;
          if (opener && typeof opener !== 'string') {
            try {
              opener.location.replace(destination);
            } catch (e) {
              router.replace(destination);
            }
          } else {
            router.replace(destination);
          }
          window.close();
        }
      };
    }

    return () => {};
  }, [router, destination]);

  if (checked) {
    if (verified) {
      return <section className="account-page account-card oauth-complete">
        <CheckCircle2 size={38} aria-hidden="true" />
        <h1>Login Google berhasil.</h1>
        <ActionFeedback state="success">Sesi aktif. Anda dialihkan ke dashboard…</ActionFeedback>
      </section>;
    }
    return <section className="account-page account-card oauth-complete">
      <CheckCircle2 size={38} aria-hidden="true" />
      <h1>Login Google berhasil.</h1>
      <ActionFeedback state="error">{error}</ActionFeedback>
      <p>Sesi tidak valid. <a href={destination} onClick={(e) => e.preventDefault()}>Lanjutkan tanpa akun Google</a></p>
    </section>;
  }

  return <section className="account-page account-card oauth-complete">
    <CheckCircle2 size={38} aria-hidden="true" />
    <h1>Login Google berhasil.</h1>
    <ActionFeedback state="pending">Memastikan sesi dan mengembalikan Anda ke halaman utama…</ActionFeedback>
  </section>;
}
