"use client";
import {useId,useRef,useState} from 'react';
import {Flag,X} from 'lucide-react';
import categories from '../../../shared/question-feedback-categories.json';
import {authApi} from '@/lib/auth-api';
import {ActionFeedback} from './action-feedback';

export function QuestionReport({questionId,version,context}:{questionId:string;version:number;context:{attemptId:string}|{token:string}}){
  const dialog=useRef<HTMLDialogElement>(null),trigger=useRef<HTMLButtonElement>(null),form=useRef<HTMLFormElement>(null),id=useId();
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[success,setSuccess]=useState(false),requestId=useRef('');
  function open(){requestId.current=crypto.randomUUID();setError('');setSuccess(false);form.current?.reset();dialog.current?.showModal();}
  function close(){if(busy)return;dialog.current?.close();trigger.current?.focus();}
  async function submit(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();if(busy)return;const values=new FormData(event.currentTarget);setBusy(true);setError('');
    try{
      const response=await authApi<{message:string}>(`/questions/${questionId}/feedback`,{requestId:requestId.current,questionVersion:version,category:values.get('category'),description:values.get('description') || '',...context});
      if(response.message!=='Terima kasih. Laporanmu sudah tersimpan untuk ditinjau.')throw new Error('Laporan belum dapat dikonfirmasi. Coba lagi.');
      form.current?.reset();setSuccess(true);
    }catch(error){setError((error as Error).message);}finally{setBusy(false);}
  }
  return <div className="question-report"><button ref={trigger} className="question-report-trigger" type="button" onClick={open}><Flag size={13} aria-hidden="true"/>Laporkan kesalahan soal</button>
    <dialog ref={dialog} className="question-report-dialog" aria-labelledby={id+'-title'} aria-describedby={id+'-intro'} onCancel={event=>{if(busy)event.preventDefault();}} onClose={()=>trigger.current?.focus()}>
      <div className="question-report-head"><span className="section-kicker">BANTU JAGA KUALITAS MATERI</span><button type="button" className="icon-button" aria-label="Tutup laporan" disabled={busy} onClick={close}><X size={19}/></button></div>
      <h2 id={id+'-title'}>Laporkan kesalahan</h2><p id={id+'-intro'}>Menemukan sesuatu yang kurang tepat? Laporkan agar materi ini bisa kami periksa.</p>
      {success?<div className="question-report-success"><ActionFeedback state="success">Terima kasih. Laporanmu sudah tersimpan untuk ditinjau.</ActionFeedback><p>Laporan akan diperiksa. Nilai dan progres belajar Anda tidak berubah.</p><button className="button button-secondary" type="button" onClick={close}>Selesai</button></div>:<form ref={form} onSubmit={event=>void submit(event)}><fieldset disabled={busy}><label htmlFor={id+'-category'}>Bagian yang perlu diperiksa</label><select id={id+'-category'} name="category" required defaultValue=""><option value="" disabled>Pilih kategori laporan</option>{Object.entries(categories).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select><label htmlFor={id+'-description'}>Keterangan <span>(opsional)</span></label><textarea id={id+'-description'} name="description" maxLength={2000} rows={4} placeholder="Ceritakan bagian yang menurut Anda perlu diperiksa."/><small>Hindari mencantumkan data pribadi. Maksimal 2.000 karakter.</small></fieldset>{error && <p className="assessment-error" role="alert">{error}</p>}{busy && <ActionFeedback state="pending">Menyimpan laporan…</ActionFeedback>}<div className="question-report-actions"><button className="button button-secondary" type="button" disabled={busy} onClick={close}>Batal</button><button className="button button-primary" type="submit" disabled={busy}>{busy?'Menyimpan…':'Kirim laporan'}</button></div></form>}
    </dialog>
  </div>;
}
