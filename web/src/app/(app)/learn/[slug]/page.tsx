import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpenText, CircleAlert } from "lucide-react";
import { getLesson, lessons } from "@/data/lessons";
import { getSurah, getWords } from "@/data/quran";
import { learningVerses, lessonHref } from "@/lib/reading-navigation";
import { AudioPlayer } from "@/components/audio-player";
import { LessonVisual } from "@/components/lesson-visual";
import { LessonProgress } from "@/components/lesson-progress";

export function generateStaticParams() { return lessons.map((lesson) => ({ slug: lesson.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const lesson = getLesson((await params).slug); return { title: lesson?.title ?? "Materi tajwid" }; }

export default async function LessonPage({ params }: { params: Promise<{ slug: string }> }) {
  const lesson = getLesson((await params).slug);
  if (!lesson) notFound();
  const exampleSurah = getSurah(lesson.example.surah);
  const exampleVerse = learningVerses[`${lesson.example.surah}:${lesson.example.ayah}`];
  const exampleWords = exampleVerse ? getWords(exampleVerse.text) : [];
  const exampleUrl = lessonHref(lesson);
  const lessonIndex = lessons.findIndex((item) => item.id === lesson.id);
  return <div className="page-container lesson-page page-top">
    <Link href="/learn/" className="back-link"><ArrowLeft size={17} /> Semua materi</Link>
    <div className="lesson-layout">
      <article className="lesson-article">
        <div className="lesson-hero"><div className="lesson-hero-copy"><span className="eyebrow">{lesson.category.toUpperCase()} / MATERI TAJWID</span><h1>{lesson.title}</h1><p>{lesson.summary}</p></div><LessonVisual category={lesson.category} sample={lesson.focus.sample} index={lessons.findIndex((item) => item.id === lesson.id)} large/></div>
        <div className="lesson-prose">
          <section><span className="section-kicker">01 / VERSI SINGKAT</span><h2>Pahami dengan satu kalimat</h2><p>{lesson.focus.explanation}</p></section>
          <section><span className="section-kicker">02 / POLA &amp; HURUF PEMICU</span><h2>Kenali tandanya</h2><div className="lesson-rule-spotlight"><div className="lesson-rule-copy"><span>{lesson.focus.label}</span><strong>{lesson.focus.formula}</strong><div className="lesson-letter-list" dir="rtl" lang="ar">{lesson.focus.letters.map((letter, index) => <b key={`${letter}-${index}`}>{letter}</b>)}</div></div><div className="lesson-rule-sample"><span>CONTOH UTAMA</span><strong dir="rtl" lang="ar">{lesson.focus.sample}</strong><p>{lesson.focus.explanation}</p></div></div></section>
          <section><span className="section-kicker">03 / KAPAN DIPAKAI?</span><h2>Cari kondisi ini</h2><div className="lesson-callout"><strong>Kondisi</strong><p>{lesson.condition}</p></div><details className="lesson-detail-more"><summary>Penjelasan lebih lengkap</summary><p>{lesson.detail}</p></details></section>
          <section><span className="section-kicker">04 / CARA MEMBACA</span><h2>Ikuti langkah bunyinya</h2><p>{lesson.pronunciation}</p></section>
          <section><span className="section-kicker">05 / CONTOH DALAM AL-QUR&apos;AN</span><h2>Bagian penting sudah ditandai</h2>{exampleVerse && <div className="lesson-example"><div><strong>{exampleSurah?.name} · Ayat {exampleVerse.number}</strong><span>{lesson.example.note}</span></div><p dir="rtl" lang="ar">{exampleWords.map((word, index) => lesson.focus.wordIndices.includes(index) ? <mark className="lesson-example-focus" key={`${word}-${index}`}>{word}</mark> : <span key={`${word}-${index}`}>{word}</span>)}</p><small>Bagian berwarna adalah fokus contoh pada materi ini.</small><Link href={exampleUrl}>Buka panduan pada ayat <ArrowRight size={17} /></Link></div>}</section>
          <section><span className="section-kicker">06 / DENGARKAN</span><h2>Contoh audio</h2><AudioPlayer /></section>
          <section><span className="section-kicker">07 / KESALAHAN UMUM</span><h2>Yang perlu dihindari</h2><div className="lesson-warning"><CircleAlert size={20} /><p>{lesson.commonMistake}</p></div></section>
        </div>
      </article>
      <aside className="lesson-side"><div className="lesson-side-card"><BookOpenText size={22} /><strong>Belajar dalam konteks</strong><p>Setelah memahami kaidah, kembali ke ayat dan pilih bagian bacaan yang relevan.</p><Link href={exampleUrl}>Lihat contoh ayat <ArrowRight size={16} /></Link></div><div className="lesson-side-note"><strong>Status materi</strong><p>Aturan diperiksa silang dengan rujukan tajwid yang dicantumkan. Materi ini tetap bukan pengganti talaqqi dan koreksi guru.</p><Link href="/reference/">Lihat sumber <ArrowRight size={15} /></Link></div></aside>
    </div>
    <LessonProgress lessonId={lesson.id} href={`/learn/${lesson.slug}/`} next={lessons[lessonIndex+1] ? {title:lessons[lessonIndex+1].title,href:`/learn/${lessons[lessonIndex+1].slug}/`} : null} />
    <nav className="learning-order" aria-label="Urutan materi">{lessons[lessonIndex - 1] && <Link href={`/learn/${lessons[lessonIndex - 1].slug}/`}>← Sebelumnya: {lessons[lessonIndex - 1].title}</Link>}{lessons[lessonIndex + 1] && <Link href={`/learn/${lessons[lessonIndex + 1].slug}/`}>Lanjut: {lessons[lessonIndex + 1].title} →</Link>}</nav>
  </div>;
}
