"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { letters } from "@/data/letters";
import { AudioPlayer } from "./audio-player";

function LetterComparison({ glyph }: { glyph: string }) {
  const first = letters.find((item) => item.glyph === glyph);
  const second = letters.find((item) => item.glyph === first?.compare);
  if (!first || !second) return null;
  return <section className="letter-comparison"><span className="section-kicker">JANGAN TERTUKAR</span><div>{[first, second].map((item) => <article key={item.glyph}><h3><span lang="ar">{item.glyph}</span> {item.name}</h3><strong>{item.makhraj}</strong><p>{item.instruction}</p></article>)}</div><p>Ucapkan bergantian dengan harakat yang sama. Minta guru memeriksa perbedaan tempat keluarnya.</p></section>;
}

export function PronunciationStudio() {
  const [selected, setSelected] = useState("ق");
  const letter = letters.find((item) => item.glyph === selected) ?? letters[0];
  return <div className="pronunciation-layout"><div className="letter-grid" role="group" aria-label="Pilih huruf hijaiyah">{letters.map((item) => <button type="button" key={item.glyph} onClick={() => setSelected(item.glyph)} className={selected === item.glyph ? "active" : ""} aria-pressed={selected === item.glyph}><span lang="ar">{item.glyph}</span><small>{item.name}</small></button>)}</div><section className="letter-detail" aria-live="polite"><div className="letter-detail-head"><span className="eyebrow">HURUF TERPILIH</span><span className="letter-big" lang="ar">{letter.glyph}</span><h2>{letter.name}</h2></div><div className="letter-detail-content"><div className="studio-steps"><span className="section-kicker">LATIH PERLAHAN</span><ol><li>Baca petunjuk tempat keluar bunyi.</li><li>Ucapkan huruf berharakat, lalu bersukun bersama guru.</li><li>Bandingkan dengan huruf yang mirip di bawah.</li></ol></div><LetterComparison glyph={letter.glyph}/><div><span className="section-kicker">MAKHRAJ / TEMPAT KELUAR</span><strong>{letter.makhraj}</strong><p>{letter.instruction}</p></div><div><span className="section-kicker">SIFAT YANG PERLU DIPERHATIKAN</span><p>{letter.sifat}</p></div>{letter.example && <div><span className="section-kicker">CONTOH KATA</span><p className="letter-example" dir="rtl" lang="ar">{letter.example}</p></div>}{letter.compare && <div><span className="section-kicker">BANDINGKAN BUNYINYA</span><button className="compare-link" type="button" onClick={() => setSelected(letter.compare!)}>Lihat huruf <span lang="ar">{letter.compare}</span> <ArrowRight size={16} /></button></div>}<div><span className="section-kicker">DENGARKAN CONTOH</span><p>Audio ini adalah contoh bacaan yang tersedia, bukan rekaman khusus huruf yang dipilih.</p><AudioPlayer /></div><Link className="text-link" href="/learn/makhraj/">Pelajari makharijul huruf <ArrowRight size={17} /></Link><a className="studio-source" href="https://download.understandquran.com/fileadmin/user_upload/courses/tajweed/english/Tajweed_Text_Book.pdf#page=6" target="_blank" rel="noreferrer">Rujukan makhraj: Understand Al-Qur’an Academy, pelajaran 1–4</a></div></section></div>;
}
