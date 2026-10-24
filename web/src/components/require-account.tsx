"use client";
import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { safeReturnPath } from '@/lib/auth-navigation';
import { useAuth } from './auth-provider';

export function RequireAccount({children,returnTo}:{children:React.ReactNode;returnTo:string}) {
  const {user,loading,error}=useAuth();
  const router=useRouter();
  const login=`/login/?next=${encodeURIComponent(safeReturnPath(returnTo))}`;
  useEffect(()=>{if(!loading && !user && !error) router.replace(login);},[loading,user,error,login,router]);
  if(loading) return <div className="account-page" role="status">Memeriksa sesi…</div>;
  if(!user) return <div className="account-page"><p role="status">{error || 'Silakan masuk untuk melanjutkan.'} <Link href={login}>Masuk</Link></p></div>;
  return children;
}
