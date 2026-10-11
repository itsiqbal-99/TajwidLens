import type { Metadata } from "next";
import { Suspense } from "react";
import { QuranWorkspace } from "@/components/quran-workspace";

export const metadata: Metadata = { title: "Jelajahi Al-Qur'an" };
export default function ExplorePage() { return <div className="page-container page-top"><div className="page-heading"><span className="eyebrow">JELAJAHI AL-QUR&apos;AN</span><h1>Seluruh Al-Qur&apos;an, ayat demi ayat.</h1><p>Pilih salah satu dari 114 surah dan 6.236 ayat. Peta warna menampilkan hukum yang dapat dikenali dari tanda teks; lihat penjelasan dan batas deteksinya pada setiap ayat.</p></div><Suspense fallback={<div className="workspace-loading">Menyiapkan pembaca ayat…</div>}><QuranWorkspace /></Suspense></div>; }
