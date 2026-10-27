import {LoaderCircle} from 'lucide-react';

export function ActionFeedback({state,children,className=''}:{state:'pending'|'success';children:React.ReactNode;className?:string}) {
  return <div className={`action-feedback action-feedback-${state} ${className}`} role="status" aria-live="polite" aria-atomic="true">
    {state==='pending'?<LoaderCircle className="action-spinner" size={19} aria-hidden="true"/>:<svg className="action-check" viewBox="0 0 24 24" width="23" height="23" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m7.5 12 3 3 6-6"/></svg>}
    <span>{children}</span>
  </div>;
}
