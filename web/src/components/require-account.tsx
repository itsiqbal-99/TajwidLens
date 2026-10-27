"use client";
import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { safeReturnPath } from '@/lib/auth-navigation';
import { useAuth } from './auth-provider';
import { ActionFeedback } from './action-feedback';

export function RequireAccount({children,returnTo}:{children:React.ReactNode;returnTo:string}) {
  const {user,loading,error,signingOut}=useAuth();
  const router=useRouter();
  const login=`/login/?next=${encodeURIComponent(safeReturnPath(returnTo))}`;
  useEffect(()=>{if(!signingOut && !loading && !user && !error) router.replace(login);},[signingOut,loading,user,error,login,router]);
  if(loading || (signingOut && !user)) return <div className="account-page"><ActionFeedback state="pending">{signingOut?'Mengakhiri sesi dengan aman…':'Memeriksa sesi…'}</ActionFeedback></div>;
  if(!user) return <div className="account-page"><p role="status">{error || 'Silakan masuk untuk melanjutkan.'} <Link href={login}>Masuk</Link></p></div>;
  return children;
}
