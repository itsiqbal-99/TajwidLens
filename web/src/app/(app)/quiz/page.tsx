import {Suspense} from 'react';
import type {Metadata} from 'next';
import {QuizWorkspace} from '@/components/quiz-workspace';
import {ActionFeedback} from '@/components/action-feedback';
export const metadata:Metadata={title:'Uji Pemahaman'};
export default function Page(){return <Suspense fallback={<ActionFeedback state="pending">Memuat evaluasi…</ActionFeedback>}><QuizWorkspace/></Suspense>;}
