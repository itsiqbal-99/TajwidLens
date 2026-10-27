"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { oauthChannel, OAuthCompletion } from '@/lib/oauth-completion';
import {ActionFeedback} from './action-feedback';

export function OAuthComplete() {
  const router = useRouter();
  const [destination] = useState('/dashboard/');
  useEffect(() => {
    const next = '/dashboard/';
    const message: OAuthCompletion = {type:'complete',id:crypto.randomUUID(),next};
    let fallback = window.setTimeout(() => router.replace(next),1200);
    let received=false;
    if (typeof BroadcastChannel === 'undefined') return () => window.clearTimeout(fallback);
    const channel = new BroadcastChannel(oauthChannel);
    channel.onmessage = ({data}) => {
      if(data?.type==='received' && data.id===message.id){
        if(!received){received=true;window.clearTimeout(fallback);fallback=window.setTimeout(()=>router.replace(next),8000);}
        return;
      }
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
    <ActionFeedback state="pending">Memastikan sesi dan mengembalikan Anda ke halaman utama…</ActionFeedback>
    <Link href={destination}>Lanjutkan di halaman ini</Link>
  </section>;
}
