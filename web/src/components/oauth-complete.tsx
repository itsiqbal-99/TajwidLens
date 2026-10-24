"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { oauthChannel, OAuthCompletion } from '@/lib/oauth-completion';

export function OAuthComplete() {
  const router = useRouter();
  const [destination, setDestination] = useState('/home/');
  useEffect(() => {
    const next = new URLSearchParams(window.location.search).get('welcome') === '1' ? '/profile/?welcome=1' : '/home/';
    queueMicrotask(() => setDestination(next));
    const message: OAuthCompletion = {type:'complete',id:crypto.randomUUID(),next};
    const fallback = window.setTimeout(() => router.replace(next),12000);
    if (typeof BroadcastChannel === 'undefined') return () => window.clearTimeout(fallback);
    const channel = new BroadcastChannel(oauthChannel);
    channel.onmessage = ({data}) => {
      if (data?.type !== 'ack' || data.id !== message.id) return;
      window.clearTimeout(fallback);
      window.clearInterval(retry);
      window.close();
    };
    channel.postMessage(message);
    const retry = window.setInterval(() => channel.postMessage(message),300);
    return () => { window.clearTimeout(fallback);window.clearInterval(retry);channel.close(); };
  }, [router]);
  return <section className="account-page account-card oauth-complete">
    <CheckCircle2 size={38} aria-hidden="true" />
    <h1>Login Google berhasil.</h1>
    <p role="status">Mengembalikan Anda ke halaman utama. Jendela ini akan ditutup otomatis.</p>
    <Link href={destination}>Lanjutkan di halaman ini</Link>
  </section>;
}
