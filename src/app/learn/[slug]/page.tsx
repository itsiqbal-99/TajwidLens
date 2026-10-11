import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpenText, CircleAlert } from "lucide-react";
import { getLesson, lessons } from "@/data/lessons";
import { getSurah, getVerse } from "@/data/quran";
import { annotations } from "@/data/annotations";
import { AudioPlayer } from "@/components/audio-player";

export function generateStaticParams() { return lessons.map((lesson) => ({ slug: lesson.id })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const lesson = getLesson((await params).slug); return { title: lesson?.title ?? "Materi tajwid" }; }

export default async function LessonPage({ params }: { params: Promise<{ slug: string }> }) {
  const lesson = getLesson((await params).slug);
  if (!lesson) notFound();
  const exampleSurah = getSurah(lesson.example.surah);
  const exampleVerse = getVerse(lesson.example.surah, lesson.example.ayah);
  const firstAnnotation = annotations.find((item) => item.surahNumber === lesson.example.surah && item.ayahNumber === lesson.example.ayah && item.ruleIds.includes(lesson.id));
  const exampleUrl = `/reading-guide/?surah=${lesson.example.surah}&ayah=${lesson.example.ayah}${firstAnnotation ? `&annotation=${firstAnnotation.id}` : ""}`;
  return <div className="page-container lesson-page page-top"><Link href="/learn/" className="back-link"><ArrowLeft size={17} /> Semua materi</Link><div className="lesson-layout"><article className="lesson-article"><div className="lesson-hero"><span className="eyebrow">{lesson.category.toUpperCase()} / MATERI TAJWID</span><h1>{lesson.title}</h1><p>{lesson.summary}</p></div><div className="lesson-prose"><section><span className="section-kicker">01 / INTI KAIDAH</span><h2>Penjelasan singkat</h2><p>{lesson.summary}</p></section><section><span className="section-kicker">02 / PELAJARI LEBIH DALAM</span><h2>Kapan hukum ini berlaku?</h2><p>{lesson.detail}</p><div className="lesson-callout"><strong>Kondisi</strong><p>{lesson.condition}</p></div></section><section><span className="section-kicker">03 / CARA MEMBACA</span><h2>Perhatikan bunyinya</h2><p>{lesson.pronunciation}</p></section><section><span className="section-kicker">04 / CONTOH DALAM AL-QUR&apos;AN</span><h2>Lihat pada ayat</h2>{exampleVerse && <div className="lesson-example"><div><strong>{exampleSurah?.name} · Ayat {exampleVerse.number}</strong><span>{lesson.example.note}</span></div><p dir="rtl" lang="ar">{exampleVerse.text}</p><Link href={exampleUrl}>Buka panduan pada ayat <ArrowRight size={17} /></Link></div>}</section><section><span className="section-kicker">05 / DENGARKAN</span><h2>Contoh audio</h2><AudioPlayer /></section><section><span className="section-kicker">06 / KESALAHAN UMUM</span><h2>Yang perlu dihindari</h2><div className="lesson-warning"><CircleAlert size={20} /><p>{lesson.commonMistake}</p></div></section></div></article><aside className="lesson-side"><div className="lesson-side-card"><BookOpenText size={22} /><strong>Belajar dalam konteks</strong><p>Setelah memahami kaidah, kembali ke ayat dan pilih bagian bacaan yang relevan.</p><Link href={exampleUrl}>Lihat contoh ayat <ArrowRight size={16} /></Link></div><div className="lesson-side-note"><strong>Status materi</strong><p>Disusun dari sumber tajwid yang dicantumkan dalam Referensi. Belum ditinjau ahli independen.</p><Link href="/reference/">Lihat sumber <ArrowRight size={15} /></Link></div></aside></div></div>;
}
