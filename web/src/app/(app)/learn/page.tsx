import type { Metadata } from "next";
import { LessonLibrary } from "@/components/lesson-library";
import { LearningPath } from "@/components/learning-path";
import { lessons } from "@/data/lessons";

export const metadata: Metadata = { title: "Belajar Tajwid" };
export default function LearnPage() { return <div className="page-container page-top"><div className="page-heading library-heading"><span className="eyebrow">PERPUSTAKAAN TAJWID</span><h1>Kaidah yang bisa dipahami, bukan sekadar dihafal.</h1><p>{lessons.length} materi awal dari dasar hingga konteks bacaan. Setiap materi terhubung ke contoh ayat yang tersedia.</p></div><LearningPath /><LessonLibrary /><p className="content-caveat">Cakupan materi masih bertahap. Penjelasan belum melalui peninjauan ahli independen; gunakan bersama bimbingan guru Al-Qur&apos;an.</p></div>; }
