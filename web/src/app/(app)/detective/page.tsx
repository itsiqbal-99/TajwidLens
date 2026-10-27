import type {Metadata} from 'next';
import {Suspense} from 'react';
import {DetectiveWorkspace} from '@/components/detective-workspace';
export const metadata:Metadata={title:'Tajwid Detective'};
export default function Page(){return <Suspense><DetectiveWorkspace/></Suspense>;}
