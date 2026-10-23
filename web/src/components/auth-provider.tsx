"use client";
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Account, ApiError, apiUrl, authApi } from '@/lib/auth-api';
const Context = createContext<{user:Account|null;loading:boolean;error:string;refresh:()=>Promise<void>}>({user:null,loading:true,error:'',refresh:async()=>{}});
export function AuthProvider({children}:{children:React.ReactNode}) {
  const [user,setUser] = useState<Account|null>(null), [loading,setLoading] = useState(true), [error,setError] = useState('');
  const refresh = useCallback(async () => {
    try {setUser(await authApi<Account>('/auth/me'));setError('');}
    catch(e) {setUser(null);setError(e instanceof ApiError && e.status === 401 ? '' : (e as Error).message);}
    finally {setLoading(false);}
  },[]);
  useEffect(() => {queueMicrotask(()=>{if(apiUrl) void refresh(); else setLoading(false);});},[refresh]);
  return <Context.Provider value={{user,loading,error,refresh}}>{children}</Context.Provider>;
}
export const useAuth = () => useContext(Context);
