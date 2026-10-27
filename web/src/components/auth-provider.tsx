"use client";
import {createContext,useCallback,useContext,useEffect,useRef,useState} from 'react';
import {usePathname,useRouter} from 'next/navigation';
import {Account,ApiError,authApi,AuthCapabilities} from '@/lib/auth-api';

type AuthState = {
  user:Account|null;loading:boolean;error:string;capabilities:AuthCapabilities|null;capabilitiesError:string;
  signingOut:boolean;refresh:(force?:boolean)=>Promise<boolean>;refreshCapabilities:()=>Promise<void>;
  updateAccount:(account:Account)=>void;logout:()=>Promise<void>;
};
const Context=createContext<AuthState>({user:null,loading:true,error:'',capabilities:null,capabilitiesError:'',signingOut:false,
  refresh:async()=>false,refreshCapabilities:async()=>{},updateAccount:()=>{},logout:async()=>{}});

export function AuthProvider({children}:{children:React.ReactNode}) {
  const router=useRouter(),pathname=usePathname();
  const [user,setUser]=useState<Account|null>(null),[loading,setLoading]=useState(true);
  const [error,setError]=useState(''),[capabilities,setCapabilities]=useState<AuthCapabilities|null>(null);
  const [capabilitiesError,setCapabilitiesError]=useState(''),[signingOut,setSigningOut]=useState(false);
  const version=useRef(0),ending=useRef(false);
  const sessionRequest=useRef<{version:number;promise:Promise<boolean>}|null>(null);
  const capabilitiesRequest=useRef<Promise<void>|null>(null);
  const [initialSessionChecked, setInitialSessionChecked] = useState(false);
  const refreshCapabilities=useCallback(()=>{
    if(capabilitiesRequest.current) return capabilitiesRequest.current;
    const promise=authApi<AuthCapabilities>('/auth/status').then(status=>{setCapabilities(status);setCapabilitiesError('');},reason=>{
      setCapabilitiesError(reason instanceof ApiError && reason.status===404?'Informasi layanan akun belum tersedia. Anda tetap dapat mencoba masuk atau daftar.':reason.message);
    }).finally(()=>{capabilitiesRequest.current=null;});
    capabilitiesRequest.current=promise;return promise;
  },[]);
  const refresh=useCallback((force=false)=>{
    if(ending.current) return Promise.resolve(false);
    if(force)version.current++;
    const current=version.current;
    if(sessionRequest.current?.version===current) return sessionRequest.current.promise;
    const promise=authApi<Account>('/auth/me').then(account=>{
      if(current===version.current){setUser(account);setError('');}return true;
    },reason=>{
      if(current===version.current){setUser(null);setError(reason instanceof ApiError && reason.status===401?'':reason.message);}return false;
    }).finally(()=>{
      if(current===version.current)setLoading(false);
      if(sessionRequest.current?.version===current)sessionRequest.current=null;
    });
    sessionRequest.current={version:current,promise};return promise;
  },[]);
  const updateAccount=useCallback((account:Account)=>{version.current++;setUser(account);setLoading(false);setError('');},[]);
  const logout=useCallback(async()=>{
    if(ending.current)return;
    ending.current=true;version.current++;setSigningOut(true);
    try {
      await authApi('/auth/logout',{});
      setUser(null);setError('');setLoading(false);
      router.replace('/login/');
    } catch(reason) {ending.current=false;setSigningOut(false);throw reason;}
  },[router]);
  useEffect(()=>{
    if(!pathname.startsWith('/login'))return;
    ending.current=false;queueMicrotask(()=>setSigningOut(false));
  },[pathname]);
  useEffect(()=>{
    queueMicrotask(()=>{void refresh();void refreshCapabilities();});
    const restored=(event:PageTransitionEvent)=>{if(event.persisted)void refresh();};
    window.addEventListener('pageshow',restored);
    return()=>window.removeEventListener('pageshow',restored);
  },[refresh,refreshCapabilities]);
  useEffect(()=>{if(user)router.prefetch('/login/');},[user,router]);
  useEffect(() => {
    // Wait for initial session to be checked after OAuth completion
    if (initialSessionChecked) {
      void refresh();
      void refreshCapabilities();
    }
  }, [initialSessionChecked, refresh, refreshCapabilities]);
  return <Context.Provider value={{user,loading,error,capabilities,capabilitiesError,signingOut,refresh,refreshCapabilities,updateAccount,logout}}>{children}</Context.Provider>;
}
export const useAuth=()=>useContext(Context);
