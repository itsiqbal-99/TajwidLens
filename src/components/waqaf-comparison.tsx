"use client";

import { useState } from "react";
import { learningVerses, waqafStudy } from "@/lib/reading-navigation";

export function WaqafComparison() {
  const [mode, setMode] = useState<"waqaf" | "wasal">("waqaf");
  const variant = waqafStudy[mode];
  return <section className="waqaf-comparison" aria-label="Perbandingan waqaf dan wasal">
    <span className="section-kicker">AL-FATIHAH 1:3 · CONTOH BERSUMBER</span>
    <p lang="ar" dir="rtl" className="comparison-word">{learningVerses["1:3"].text.split(" ")[1]}</p>
    <div className="view-switch" role="group" aria-label="Cara membaca akhir ayat">{(["waqaf", "wasal"] as const).map((value) => <button key={value} type="button" aria-pressed={mode === value} onClick={() => setMode(value)}>{waqafStudy[value].label}</button>)}</div>
    <div aria-live="polite" className="comparison-result"><h3>{variant.hukum}</h3><strong>{variant.reading}</strong><span>{variant.length}</span><p>{variant.explanation}</p><p><b>Hindari:</b> {variant.mistake}</p></div>
    <small>Teks ayat tetap seperti mushaf. Perbandingan ini khusus akhir Al-Fatihah ayat 3; contoh waqaf memakai sukun penuh (tanpa rawm).</small>
    <a href={waqafStudy.source} target="_blank" rel="noreferrer">{waqafStudy.sourceLabel}</a>
  </section>;
}
