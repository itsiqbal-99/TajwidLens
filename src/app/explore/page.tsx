import type { Metadata } from "next";
import { Suspense } from "react";
import { QuranWorkspace } from "@/components/quran-workspace";

export const metadata: Metadata = { title: "Jelajahi Al-Qur'an" };
export default function ExplorePage() { return <div className="page-container page-top"><div className="page-heading"><span className="eyebrow">JELAJAHI AL-QUR&apos;AN</span><h1>Seluruh Al-Qur&apos;an, ayat demi ayat.</h1><p>Baca satu ayat atau beberapa ayat berurutan dari 114 surah. Atur ukuran huruf dan warna sesuai kenyamanan; ketuk bagian ayat ketika ingin memahami hukumnya.</p></div><Suspense fallback={<div className="workspace-loading">Menyiapkan pembaca ayat…</div>}><QuranWorkspace /></Suspense></div>; }
