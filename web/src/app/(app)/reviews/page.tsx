import type {Metadata} from 'next';
import {RequireAccount} from '@/components/require-account';
import {MistakeReplay} from '@/components/mistake-replay';
export const metadata:Metadata={title:'Mistake Replay'};
export default function Page(){return <RequireAccount returnTo="/reviews/"><MistakeReplay/></RequireAccount>;}
