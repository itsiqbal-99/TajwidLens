import Link from "next/link";
import { lessons } from "@/data/lessons";
import { CheckCircle2 } from 'lucide-react';
import type { LessonStatus } from '@/lib/learning';

const stages = [
  { title: "1. Kenali huruf & tanda", ids: ["pengantar", "huruf-hijaiyah", "harakat"] },
  { title: "2. Latih bunyi huruf", ids: ["makhraj", "sifat-huruf"] },
  { title: "3. Pertemuan & dengung", ids: ["nun-tanwin", "mim-sukun", "ghunnah", "lam-tarif"] },
  { title: "4. Panjang & sifat bunyi", ids: ["mad-tabii", "mad-arid", "mad-lazim", "qalqalah", "tafkhim-tarqiq"] },
  { title: "5. Berhenti & memulai", ids: ["waqaf-ibtida", "hamzatul-wasl"] },
];

export function LearningPath({states}:{states?:ReadonlyMap<string,LessonStatus>}) {
  return <section className="learning-path" aria-label="Rekomendasi urutan belajar"><h2>Baru mulai? Ikuti urutan ini.</h2><p>Mulai dari dasar, lalu buka cabang hukum yang ingin dipahami. Anda bebas mengulang materi kapan saja.</p><ol>{stages.map((stage) => <li key={stage.title}><h3>{stage.title}</h3>{stage.ids.map((id) => <Link key={id} href={`/learn/${id}/`} className={states?.get(id)==='COMPLETED'?'path-lesson-completed':undefined}>{lessons.find((lesson) => lesson.id === id)?.title}{states?.get(id)==='COMPLETED' && <span><CheckCircle2 size={12} aria-hidden="true"/>Selesai</span>}</Link>)}</li>)}</ol></section>;
}
