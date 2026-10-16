"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, MoveUpRight, Check, BookOpenText } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

const examples = [
  {
    tab: "Dengung & ikhfa",
    reference: "AL-FALAQ · 113:2",
    verseId: "113:2",
    label: "Ikhfa haqiqi",
    reason: "Nun sukun bertemu huruf syin saat dua kata disambung.",
    guidance: "Samarkan bunyi nun dengan ghunnah sekitar dua harakat, lalu masuk ke syin.",
    url: "/reading-guide/?surah=113&ayah=2&annotation=113%3A2%3A1",
  },
  {
    tab: "Berhenti & sambung",
    reference: "AL-FATIHAH · 1:3",
    verseId: "1:3",
    label: "Mad ‘aridh lissukun",
    reason: "Ketika berhenti pada akhir ayat, mim terakhir menjadi sukun sementara.",
    guidance: "Saat waqaf, mad bisa 2, 4, atau 6 harakat. Saat wasal, mad alami dua harakat.",
    url: "/reading-guide/?surah=1&ayah=3&annotation=study%3A1%3A3%3Awaqaf",
  },
] as const;

export function HeroReadingDemo({ verses }: { verses: { "113:2": string; "1:3": string } }) {
  const [active, setActive] = useState(0);
  const reduced = useReducedMotion();
  const data = examples[active];
  return (
    <div className="demo-shell" aria-label="Pratinjau interaktif cara kerja TajwidLens">
      <div className="demo-chrome"><div className="demo-chrome-label"><span className="demo-live-dot" /> CONTOH INTERAKTIF</div><span>01 — 02</span></div>
      <div className="demo-switch" role="group" aria-label="Pilih contoh bacaan">
        {examples.map((item, index) => <button key={item.tab} type="button" aria-pressed={active === index} className={active === index ? "is-active" : ""} onClick={() => setActive(index)}>{item.tab}</button>)}
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={active} initial={reduced ? false : {opacity: 0, y: 7}} animate={{opacity: 1, y: 0}} exit={reduced ? undefined : {opacity: 0, y: -5}} transition={{duration: .19, ease: "easeOut"}}>
          <div className="demo-reading"><div className="demo-reference"><BookOpenText size={15}/> {data.reference}</div><p dir="rtl" lang="ar">{verses[data.verseId]}</p><div className="demo-reading-hint"><Check size={14}/> Teks KFGQPC · Hafs</div></div>
          <div className="demo-explanation"><div className="demo-explanation-index">PANDUAN BACAAN <span>↗</span></div><h3>{data.label}</h3><p className="demo-reason">{data.reason}</p><div className="demo-guide"><span>CARA MEMBACA</span><p>{data.guidance}</p></div><Link href={data.url}>Buka penjelasan lengkap <ArrowUpRight size={16}/></Link></div>
        </motion.div>
      </AnimatePresence>
      <div className="demo-bottom"><span>TAJWIDLENS / READING GUIDE</span><MoveUpRight size={15}/></div>
    </div>
  );
}
