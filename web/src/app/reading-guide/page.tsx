import type { Metadata } from "next";
import { Suspense } from "react";
import { QuranWorkspace } from "@/components/quran-workspace";
import { ReadingSearch } from "@/components/search";

export const metadata: Metadata = { title: "Panduan Bacaan" };
export default function ReadingGuidePage() { return <div className="page-container page-top guide-page"><div className="guide-heading"><div><span className="eyebrow">PANDUAN BACAAN / FITUR UTAMA</span><h1>Bingung cara bacanya?</h1><p>Cari materi tajwid dengan bahasa sehari-hari, atau pilih ayat dari seluruh Al-Qur&apos;an. Peta hukum memakai rentang anotasi prahitung dari korpus sumber yang dipatok dan diverifikasi.</p></div><span className="guide-heading-mark" lang="ar" aria-hidden="true">اقرأ</span></div><ReadingSearch /><div className="guide-workspace-heading"><span className="eyebrow">COBA LANGSUNG</span><h2>Pilih bagian ayat untuk membuka penjelasan.</h2></div><Suspense fallback={<div className="workspace-loading">Menyiapkan panduan bacaan…</div>}><QuranWorkspace mode="guide" /></Suspense></div>; }
