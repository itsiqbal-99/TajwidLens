import type {Metadata} from 'next';
import {RequireAccount} from '@/components/require-account';
import {LearningDashboard} from '@/components/learning-dashboard';

export const metadata:Metadata={title:'Ruang Belajar'};
export default function Page() {return <RequireAccount returnTo="/dashboard/"><LearningDashboard /></RequireAccount>;}
