import type { Metadata } from "next";
import { PronunciationStudio } from "@/components/pronunciation-studio";

export const metadata: Metadata = { title: "Pelafalan Huruf" };
export default function PronunciationPage() { return <div className="page-container page-top"><div className="page-heading"><span className="eyebrow">STUDIO PELAFALAN</span><h1>Kenali huruf dari tempat bunyinya.</h1><p>Pilih huruf untuk melihat kelompok makhraj, petunjuk pelafalan, dan sifat dasarnya. Latihan bunyi yang tepat tetap memerlukan contoh dan koreksi guru.</p></div><PronunciationStudio /></div>; }
