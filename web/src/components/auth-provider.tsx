"use client";
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Account, ApiError, authApi, AuthCapabilities } from '@/lib/auth-api';

type AuthState = {user:Account|null;loading:boolean;error:string;capabilities:AuthCapabilities|null;refresh:()=>Promise<boolean>};
const Context = createContext<AuthState>({user:null,loading:true,error:'',capabilities:null,refresh:async()=>false});

export function AuthProvider({children}:{children:React.ReactNode}) {
  const [user,setUser] = useState<Account|null>(null), [loading,setLoading] = useState(true);
  const [error,setError] = useState(''), [capabilities,setCapabilities] = useState<AuthCapabilities|null>(null);
  const refresh = useCallback(async () => {
    const [status,session] = await Promise.allSettled([
      authApi<AuthCapabilities>('/auth/status'),authApi<Account>('/auth/me'),
    ]);
    setCapabilities(status.status === 'fulfilled' ? status.value : null);
    setUser(session.status === 'fulfilled' ? session.value : null);
    const sessionError = session.status === 'rejected' && !(session.reason instanceof ApiError && session.reason.status === 401);
    setError(sessionError ? session.reason.message : status.status === 'rejected'
      ? status.reason.status === 404 ? 'Informasi layanan akun belum tersedia. Anda tetap dapat mencoba masuk atau daftar.' : status.reason.message : '');
    setLoading(false);
    return session.status === 'fulfilled';
  },[]);
  useEffect(() => {
    queueMicrotask(()=>void refresh());
    const restored = (event:PageTransitionEvent)=>{if(event.persisted) void refresh();};
    window.addEventListener('pageshow',restored);
    return ()=>window.removeEventListener('pageshow',restored);
  },[refresh]);
  return <Context.Provider value={{user,loading,error,capabilities,refresh}}>{children}</Context.Provider>;
}
export const useAuth = () => useContext(Context);
