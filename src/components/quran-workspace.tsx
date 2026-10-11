"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, BookOpenText, Check, ChevronDown, Minus, Plus, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { annotations, getAnnotation, getAnnotations, getAnnotationText, getRelatedAnnotations, type Annotation } from "@/data/annotations";
import { getLesson } from "@/data/lessons";
import { getSurah, getVerse, getWords, surahs } from "@/data/quran";
import { AudioPlayer } from "./audio-player";

type Selection = { ayah: number; word: number };
type WorkspaceProps = { mode?: "explore" | "guide" };

export function QuranWorkspace({ mode = "explore" }: WorkspaceProps) {
  const searchParams = useSearchParams();
  const defaultSurah = mode === "guide" ? 113 : 1;
  const defaultAyah = mode === "guide" ? 2 : 1;
  const [surahNumber, setSurahNumber] = useState(defaultSurah);
  const [ayahNumber, setAyahNumber] = useState(defaultAyah);
  const [selection, setSelection] = useState<Selection | null>(mode === "guide" ? { ayah: 2, word: 0 } : null);
  const [activeId, setActiveId] = useState<string | null>(mode === "guide" ? "113-2-0-1-ikhfa-haqiqi" : null);
  const [showHighlights, setShowHighlights] = useState(true);
  const [fontSize, setFontSize] = useState(38);
  const [readingMode, setReadingMode] = useState<"waqaf" | "wasal">("waqaf");
  const [mobile, setMobile] = useState(false);
  const [ready, setReady] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const lastWordRef = useRef<HTMLButtonElement | null>(null);
  const reducedMotion = useReducedMotion();

  const surah = getSurah(surahNumber) ?? surahs[0];
  const verse = getVerse(surah.number, ayahNumber) ?? surah.verses[0];
  const words = getWords(verse.text);
  const verseAnnotations = getAnnotations(surah.number, verse.number);
  const ruleOverview = [...new Map(verseAnnotations.map((item) => [item.title, item])).values()];
  const matches = selection?.ayah === verse.number ? verseAnnotations.filter((item) => item.wordIndices.includes(selection.word)) : [];
  const active = matches.find((item) => item.id === activeId) ?? matches[0] ?? null;

  useEffect(() => {
    const update = () => setMobile(window.matchMedia("(max-width: 900px)").matches);
    update(); window.addEventListener("resize", update);
    const size = Number(window.localStorage.getItem("tajwidlens-arabic-size"));
    if (size >= 30 && size <= 52) queueMicrotask(() => setFontSize(size));
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    const syncLocation = () => {
      const params = new URLSearchParams(window.location.search);
      const requestedSurah = Number(params.get("surah"));
      const foundSurah = getSurah(requestedSurah);
      if (!foundSurah) { setReady(true); return; }
      const requestedAyah = Number(params.get("ayah"));
      const foundVerse = foundSurah.verses.find((item) => item.number === requestedAyah) ?? foundSurah.verses[0];
      setSurahNumber(foundSurah.number); setAyahNumber(foundVerse.number);
      const annotation = getAnnotation(params.get("annotation") ?? "");
      if (annotation && annotation.surahNumber === foundSurah.number && annotation.ayahNumber === foundVerse.number) {
        setSelection({ ayah: foundVerse.number, word: annotation.wordIndices[0] }); setActiveId(annotation.id);
      } else {
        const wordValue = params.get("word");
        const word = wordValue === null ? NaN : Number(wordValue);
        setSelection(Number.isInteger(word) && word >= 0 && word < getWords(foundVerse.text).length ? { ayah: foundVerse.number, word } : null);
        setActiveId(null);
      }
      setReady(true);
    };
    queueMicrotask(syncLocation);
    window.addEventListener("popstate", syncLocation);
    return () => window.removeEventListener("popstate", syncLocation);
  }, [searchParams]);

  const writeUrl = useCallback((nextSurah: number, nextAyah: number, nextId?: string, push = false, word?: number) => {
    const url = new URL(window.location.href);
    url.searchParams.set("surah", String(nextSurah)); url.searchParams.set("ayah", String(nextAyah));
    if (nextId) url.searchParams.set("annotation", nextId); else url.searchParams.delete("annotation");
    if (word !== undefined) url.searchParams.set("word", String(word)); else url.searchParams.delete("word");
    if (push) window.history.pushState(null, "", url); else window.history.replaceState(null, "", url);
  }, []);

  function changeLocation(nextSurah: number, nextAyah: number) {
    const target = getSurah(nextSurah) ?? surahs[0];
    const targetAyah = target.verses.find((item) => item.number === nextAyah) ?? target.verses[0];
    setSurahNumber(target.number); setAyahNumber(targetAyah.number);
    setSelection(null); setActiveId(null); setReadingMode("waqaf");
    writeUrl(target.number, targetAyah.number, undefined, true);
  }

  function chooseWord(index: number, element: HTMLButtonElement) {
    lastWordRef.current = element;
    const item = verseAnnotations.find((annotation) => annotation.wordIndices.includes(index));
    setSelection({ ayah: verse.number, word: index }); setActiveId(item?.id ?? null); setReadingMode("waqaf");
    writeUrl(surah.number, verse.number, item?.id, false, item ? undefined : index);
  }

  function chooseAnnotation(item: Annotation) {
    const target = document.querySelector<HTMLButtonElement>(`[data-word-index="${item.wordIndices[0]}"]`);
    if (target) lastWordRef.current = target;
    setSelection({ ayah: verse.number, word: item.wordIndices[0] }); setActiveId(item.id); setReadingMode("waqaf");
    writeUrl(surah.number, verse.number, item.id, false);
  }

  function closePanel() {
    const target = lastWordRef.current ?? document.querySelector<HTMLButtonElement>(".arabic-word.word-selected");
    setSelection(null); setActiveId(null); writeUrl(surah.number, verse.number);
    requestAnimationFrame(() => target?.focus());
  }
  useEffect(() => { if (mobile && selection) closeRef.current?.focus(); }, [mobile, selection]);
  useEffect(() => {
    if (!selection) return;
    const key = (event: KeyboardEvent) => { if (event.key === "Escape") closePanel(); };
    window.addEventListener("keydown", key); return () => window.removeEventListener("keydown", key);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selection, surah.number, verse.number]);
  useEffect(() => { panelRef.current?.scrollTo({ top: 0 }); }, [activeId]);

  function updateSize(next: number) { setFontSize(next); window.localStorage.setItem("tajwidlens-arabic-size", String(next)); }
  const selectedText = active ? getAnnotationText(active) : selection ? words[selection.word] : "";

  if (!ready) return <div className="workspace-loading">Menyiapkan pembaca ayat…</div>;

  return <div className="workspace">
    <div className="workspace-toolbar">
      <div className="selectors"><label>Surah<span className="select-wrap"><select value={surah.number} onChange={(event) => changeLocation(Number(event.target.value), 1)}>{surahs.map((item) => <option key={item.number} value={item.number}>{item.number}. {item.name}</option>)}</select><ChevronDown size={16} aria-hidden="true" /></span></label><label>Ayat<span className="select-wrap"><select value={verse.number} onChange={(event) => changeLocation(surah.number, Number(event.target.value))}>{surah.verses.map((item) => <option key={item.number} value={item.number}>Ayat {item.number}</option>)}</select><ChevronDown size={16} aria-hidden="true" /></span></label></div>
      <div className="reading-controls"><label className="highlight-toggle"><input type="checkbox" checked={showHighlights} onChange={(event) => setShowHighlights(event.target.checked)} /><span className="toggle-track" aria-hidden="true"><span /></span> Warna tajwid</label><div className="font-controls" aria-label="Ukuran teks Arab"><button type="button" onClick={() => updateSize(Math.max(30, fontSize - 4))} disabled={fontSize <= 30} aria-label="Perkecil teks Arab"><Minus size={16} /></button><span>Aa</span><button type="button" onClick={() => updateSize(Math.min(50, fontSize + 4))} disabled={fontSize >= 50} aria-label="Perbesar teks Arab"><Plus size={16} /></button></div></div>
    </div>
    <div className="workspace-grid">
      <section className="reader" aria-label={`Surah ${surah.name} ayat ${verse.number}`}>
        <div className="reader-topline"><div><span className="eyebrow">{String(surah.number).padStart(3, "0")} / {surah.meaning}</span><h2>{surah.name} <span className="surah-arabic" lang="ar">{surah.arabicName}</span></h2></div><span className="reader-counter">{verse.number} / {surah.verses.length}</span></div>
        {surah.basmala && <p className="basmala" lang="ar" dir="rtl">{surah.basmala}</p>}
        <div className="verse-box"><span className="verse-label">AYAT {String(verse.number).padStart(2, "0")}</span><div className="arabic-verse" dir="rtl" lang="ar" style={{ fontSize: `${fontSize}px` }}>{words.map((word, index) => {
          if (!/[ء-غف-يٱ]/u.test(word)) return <span key={`${verse.number}-${index}`} className="arabic-pause" aria-label="Tanda waqaf">{word}</span>;
          const items = verseAnnotations.filter((item) => item.wordIndices.includes(index));
          const marked = showHighlights && items.length > 0;
          const selected = selection?.ayah === verse.number && (active?.wordIndices.includes(index) ?? selection.word === index);
          return <button key={`${verse.number}-${index}`} data-word-index={index} type="button" className={`arabic-word ${marked ? `word-marked rule-${items[0].ruleIds[0]}` : ""} ${selected ? "word-selected" : ""}`} onClick={(event) => chooseWord(index, event.currentTarget)} aria-label={`${word}, ${items.length ? items.map((item) => item.title).join(", ") : "panduan detail belum tersedia"}`} aria-pressed={selected}>{word}</button>;
        })}</div><p className="verse-hint">Ketuk kata berwarna atau kata lain untuk melihat panduan yang tersedia.</p></div>
        <div className="verse-rule-overview"><div className="verse-rule-heading"><span className="section-kicker">PETA TAJWID AYAT</span><strong>{verseAnnotations.length} temuan</strong></div>{ruleOverview.length ? <div className="verse-rule-chips">{ruleOverview.map((item) => <button key={item.id} type="button" onClick={() => chooseAnnotation(item)}><i className={item.reviewStatus === "automatic-unreviewed" ? "auto-dot" : "curated-dot"} />{item.title}</button>)}</div> : <p>Belum ada hukum yang terdeteksi oleh aturan terbatas kami pada ayat ini. Baca bersama guru untuk pemeriksaan menyeluruh.</p>}<small>Titik hijau: contoh disusun manual. Titik emas: hasil pemindaian otomatis, perlu verifikasi guru. Daftar ini belum mencakup seluruh hukum tajwid.</small></div>
        <div className="verse-nav"><button type="button" onClick={() => changeLocation(surah.number, verse.number - 1)} disabled={verse.number === 1}><ArrowLeft size={17} /> Ayat sebelumnya</button><span className="verse-nav-current">{surah.name} · {verse.number}</span><button type="button" onClick={() => changeLocation(surah.number, verse.number + 1)} disabled={verse.number === surah.verses.length}>Ayat berikutnya <ArrowRight size={17} /></button></div>
        <div className="legend"><span className="legend-title">Penanda bacaan</span><span><i className="legend-dot legend-green" /> Pertemuan huruf</span><span><i className="legend-dot legend-gold" /> Panjang bacaan</span><span><i className="legend-dot legend-blue" /> Waqaf &amp; sifat</span><small>Warna adalah bantuan visual; label hukum tetap tersedia dalam panel.</small></div>
        <p className="editorial-note">Teks ayat: Tanzil Project. Pemindaian tajwid otomatis bersifat terbatas dan belum ditinjau ahli independen.</p>
      </section>
      {mobile && selection && <button type="button" className="sheet-backdrop" onClick={closePanel} tabIndex={-1} aria-label="Tutup panel panduan" />}
      <aside ref={panelRef} className={`insight-panel ${selection && mobile ? "panel-open" : ""}`} role={selection && mobile ? "dialog" : undefined} aria-modal={selection && mobile ? true : undefined} aria-label="Panduan bacaan kontekstual">
        <div className="panel-head"><span className="eyebrow">PANDUAN KONTEKSTUAL</span>{selection && <button ref={closeRef} type="button" className="icon-button panel-close" onClick={closePanel} aria-label="Tutup panduan"><X size={19} /></button>}</div>
        <AnimatePresence mode="wait" initial={false}><motion.div key={active?.id ?? (selection ? "unavailable" : "prompt")} initial={reducedMotion ? false : { opacity: 0, y: 9 }} animate={{ opacity: 1, y: 0 }} exit={reducedMotion ? undefined : { opacity: 0, y: -5 }} transition={{ duration: 0.2 }}>
          {!selection ? <div className="panel-placeholder"><span className="panel-placeholder-icon"><BookOpenText size={26} /></span><h3>Setiap bacaan punya alasan.</h3><p>Pilih kata atau frasa pada ayat untuk melihat cara membaca, alasan hukumnya, dan contoh serupa.</p><Link className="inline-link" href="/reading-guide/?surah=113&ayah=2&annotation=113-2-0-1-ikhfa-haqiqi">Lihat contoh Ikhfa di Al-Falaq 2 <ArrowRight size={16} /></Link></div> : !active ? <div className="panel-placeholder"><span className="selected-arabic" dir="rtl" lang="ar">{selectedText}</span><h3>Panduan detail belum tersedia</h3><p>Teks ayat tetap dapat dibaca. Kami belum menyiapkan anotasi yang dapat dipertanggungjawabkan untuk bagian ini.</p><Link className="inline-link" href="/learn/">Jelajahi materi tajwid <ArrowRight size={16} /></Link></div> : <InsightContent item={active} matches={matches} onSelect={(id) => { setActiveId(id); writeUrl(surah.number, verse.number, id); }} selectedText={selectedText} readingMode={readingMode} onModeChange={setReadingMode} />}
        </motion.div></AnimatePresence>
      </aside>
    </div>
    <span className="sr-only">Seluruh 114 surah tersedia. {annotations.length} anotasi disusun manual, ditambah pemindaian aturan pada ayat yang dibuka.</span>
  </div>;
}

function InsightContent({ item, matches, onSelect, selectedText, readingMode, onModeChange }: { item: Annotation; matches: Annotation[]; onSelect: (id: string) => void; selectedText: string; readingMode: "waqaf" | "wasal"; onModeChange: (mode: "waqaf" | "wasal") => void }) {
  const related = getRelatedAnnotations(item, 3);
  const lesson = getLesson(item.ruleIds[0]);
  const hasComparison = item.waqafVariant && item.wasalVariant;
  const variant = readingMode === "waqaf" ? item.waqafVariant : item.wasalVariant;
  return <div className="insight-content">
    <span className="selected-arabic" dir="rtl" lang="ar">{selectedText}</span>
    <div className="insight-title"><span className="rule-chip">{item.reviewStatus === "automatic-unreviewed" ? "Hasil pemindaian otomatis" : lesson?.category ?? "Kaidah bacaan"}</span><h3>{item.title}</h3><p>{item.explanation}</p></div>
    {matches.length > 1 && <div className="other-rules"><span>Aspek lain pada bagian ini</span><div>{matches.map((match) => <button key={match.id} type="button" className={match.id === item.id ? "active" : ""} onClick={() => onSelect(match.id)}>{match.title}</button>)}</div></div>}
    <div className="insight-section"><span className="section-kicker">01 / CARA MEMBACA</span><p>{item.pronunciationGuide}</p></div>
    <div className="insight-section"><span className="section-kicker">02 / MENGAPA DEMIKIAN?</span><p><strong>Pemicu: {item.triggerLetters}.</strong> {item.explanation}</p></div>
    {hasComparison && <div className="insight-section comparison"><span className="section-kicker">03 / BERHENTI ATAU DISAMBUNG</span><div className="segmented" role="group" aria-label="Mode bacaan"><button type="button" className={readingMode === "waqaf" ? "active" : ""} aria-pressed={readingMode === "waqaf"} onClick={() => onModeChange("waqaf")}>Berhenti</button><button type="button" className={readingMode === "wasal" ? "active" : ""} aria-pressed={readingMode === "wasal"} onClick={() => onModeChange("wasal")}>Disambung</button></div><div className="variant-result"><strong>{variant?.reading}</strong><p>{variant?.explanation}</p>{variant?.harakat && <span>Panjang / kondisi: {variant.harakat}</span>}</div><small>Pilih tempat waqaf dengan memperhatikan makna ayat.</small></div>}
    <div className="insight-section"><span className="section-kicker">{hasComparison ? "04" : "03"} / DENGARKAN BACAAN</span><AudioPlayer /></div>
    <div className="insight-section mistake"><span className="section-kicker">PERLU DIWASPADAI</span><p>{item.commonMistake}</p></div>
    {related.length > 0 && <div className="insight-section"><span className="section-kicker">CONTOH SERUPA</span><div className="related-list">{related.map((other) => <Link key={other.id} href={`/reading-guide/?surah=${other.surahNumber}&ayah=${other.ayahNumber}&annotation=${other.id}`}><span>{getSurah(other.surahNumber)?.name} {other.ayahNumber}<small>{other.title}</small></span><span className="related-arabic" dir="rtl" lang="ar">{getAnnotationText(other)}</span><ArrowRight size={16} /></Link>)}</div></div>}
    {lesson && <Link className="lesson-link" href={`/learn/${lesson.id}/`}>Pelajari {lesson.title} <ArrowRight size={16} /></Link>}
    <p className="review-status"><Check size={14} /> {item.reviewStatus === "automatic-unreviewed" ? "Deteksi berbasis tanda teks · Perlu verifikasi guru" : "Sumber dicatat · Belum ditinjau ahli independen"}</p>
  </div>;
}
