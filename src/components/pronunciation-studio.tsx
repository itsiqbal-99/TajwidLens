"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { letters } from "@/data/letters";
import { AudioPlayer } from "./audio-player";

export function PronunciationStudio() {
  const [selected, setSelected] = useState("ق");
  const letter = letters.find((item) => item.glyph === selected) ?? letters[0];
  return <div className="pronunciation-layout"><div className="letter-grid" role="group" aria-label="Pilih huruf hijaiyah">{letters.map((item) => <button type="button" key={item.glyph} onClick={() => setSelected(item.glyph)} className={selected === item.glyph ? "active" : ""} aria-pressed={selected === item.glyph}><span lang="ar">{item.glyph}</span><small>{item.name}</small></button>)}</div><section className="letter-detail" aria-live="polite"><div className="letter-detail-head"><span className="eyebrow">HURUF TERPILIH</span><span className="letter-big" lang="ar">{letter.glyph}</span><h2>{letter.name}</h2></div><div className="letter-detail-content"><div><span className="section-kicker">MAKHRAJ / TEMPAT KELUAR</span><strong>{letter.makhraj}</strong><p>{letter.instruction}</p></div><div><span className="section-kicker">SIFAT YANG PERLU DIPERHATIKAN</span><p>{letter.sifat}</p></div>{letter.example && <div><span className="section-kicker">CONTOH KATA</span><p className="letter-example" dir="rtl" lang="ar">{letter.example}</p></div>}{letter.compare && <div><span className="section-kicker">BANDINGKAN BUNYINYA</span><button className="compare-link" type="button" onClick={() => setSelected(letter.compare!)}>Lihat huruf <span lang="ar">{letter.compare}</span> <ArrowRight size={16} /></button></div>}<div><span className="section-kicker">DENGARKAN CONTOH</span><AudioPlayer /></div><Link className="text-link" href="/learn/makhraj/">Pelajari makharijul huruf <ArrowRight size={17} /></Link></div></section></div>;
}
