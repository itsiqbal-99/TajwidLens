import type { Metadata } from "next";
import { Suspense } from "react";
import { QuranWorkspace } from "@/components/quran-workspace";
import { ReadingSearch } from "@/components/search";

export const metadata: Metadata = { title: "Panduan Bacaan" };
export default function ReadingGuidePage() { return <div className="page-container page-top guide-page"><div className="guide-heading"><div><span className="eyebrow">PANDUAN BACAAN / FITUR UTAMA</span><h1>Bingung cara bacanya?</h1><p>Tanyakan dengan bahasa sehari-hari, pilih ayat, lalu ketuk bagian yang terasa sulit. Kenali huruf pemicunya dan pahami cara membacanya.</p></div><span className="guide-heading-mark" lang="ar" aria-hidden="true">اقرأ</span></div><ReadingSearch /><div className="guide-workspace-heading"><span className="eyebrow">COBA LANGSUNG</span><h2>Pilih bagian ayat untuk membuka penjelasan.</h2></div><Suspense fallback={<div className="workspace-loading">Menyiapkan panduan bacaan…</div>}><QuranWorkspace mode="guide" /></Suspense></div>; }
