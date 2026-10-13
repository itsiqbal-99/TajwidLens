"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, BookOpenText, Check, ChevronDown, Minus, Plus, Search, X } from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { annotations, getAnnotation, getAnnotations, getAnnotationText, getRelatedAnnotations, type Annotation } from "@/data/annotations";
import { getLesson } from "@/data/lessons";
import { getSurah, getVerse, getWords, surahs } from "@/data/quran";
import { AudioPlayer } from "./audio-player";

type Selection = { ayah: number; word: number };
type WorkspaceProps = { mode?: "explore" | "guide" };
type RuleTone = "meeting" | "length" | "waqaf";
type SearchOption = { value: number; label: string; subtitle?: string; keywords?: string };

const surahSearchOptions: readonly SearchOption[] = surahs.map((item) => ({
  value: item.number,
  label: `${item.number}. ${item.name}`,
  subtitle: `${item.arabicName} · ${item.meaning}`,
  keywords: `${item.number} ${item.name} ${item.arabicName} ${item.meaning}`,
}));

function normalizeSearch(value: string) {
  return value.toLocaleLowerCase("id").normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/[^\p{Letter}\p{Number}]+/gu, " ").replace(/\s+/g, " ").trim();
}

function SearchPicker({ label, value, options, placeholder, compact = false, onSelect }: {
  label: string;
  value: number;
  options: readonly SearchOption[];
  placeholder: string;
  compact?: boolean;
  onSelect: (value: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();
  const selected = options.find((option) => option.value === value) ?? options[0];
  const filteredOptions = useMemo(() => {
    const needle = normalizeSearch(query);
    if (!needle) return options;
    const compactNeedle = needle.replaceAll(" ", "");
    return options
      .map((option) => {
        const searchable = normalizeSearch(option.keywords ?? `${option.value} ${option.label} ${option.subtitle ?? ""}`);
        const compactSearchable = searchable.replaceAll(" ", "");
        const number = String(option.value);
        const score = number === needle ? 0 : number.startsWith(needle) ? 1 : searchable.startsWith(needle) || compactSearchable.startsWith(compactNeedle) ? 2 : 3;
        return { option, matches: searchable.includes(needle) || compactSearchable.includes(compactNeedle), score };
      })
      .filter(({ matches }) => matches)
      .sort((a, b) => a.score - b.score || a.option.value - b.option.value)
      .map(({ option }) => option);
  }, [options, query]);

  useEffect(() => {
    if (!open) return;
    setActiveIndex(0);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, [open]);

  function choose(option: SearchOption) {
    onSelect(option.value);
    setQuery("");
    setOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, filteredOptions.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter" && filteredOptions[activeIndex]) {
      event.preventDefault();
      choose(filteredOptions[activeIndex]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    }
  }

  return <div className={`search-picker-field ${compact ? "search-picker-compact" : ""}`}>
    <span className="search-picker-label">{label}</span>
    <div ref={rootRef} className={`search-picker ${open ? "is-open" : ""}`} onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
    }}>
      <button ref={triggerRef} type="button" className="search-picker-trigger" aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? listboxId : undefined} onClick={() => setOpen((current) => !current)}>
        <span>{selected?.label}</span><ChevronDown size={16} aria-hidden="true" />
      </button>
      {open && <div className="search-picker-popover">
        <div className="search-picker-input-wrap"><Search size={15} aria-hidden="true" /><input ref={inputRef} type="search" role="combobox" aria-label={`Cari ${label.toLocaleLowerCase("id")}`} aria-autocomplete="list" aria-controls={listboxId} aria-expanded="true" aria-activedescendant={filteredOptions[activeIndex] ? `${listboxId}-${filteredOptions[activeIndex].value}` : undefined} value={query} placeholder={placeholder} autoComplete="off" onChange={(event) => { setQuery(event.target.value); setActiveIndex(0); }} onKeyDown={handleKeyDown} /></div>
        <div id={listboxId} className="search-picker-options" role="listbox" aria-label={`Pilihan ${label.toLocaleLowerCase("id")}`}>
          {filteredOptions.length ? filteredOptions.map((option, index) => <button id={`${listboxId}-${option.value}`} key={option.value} type="button" role="option" aria-selected={option.value === value} className={`search-picker-option ${index === activeIndex ? "keyboard-active" : ""}`} onMouseEnter={() => setActiveIndex(index)} onClick={() => choose(option)}>
            <span><strong>{option.label}</strong>{option.subtitle && <small>{option.subtitle}</small>}</span>{option.value === value && <Check size={15} aria-hidden="true" />}
          </button>) : <div className="search-picker-empty">Tidak ada hasil yang cocok.</div>}
        </div>
      </div>}
    </div>
  </div>;
}

function getRuleTone(item: Annotation): RuleTone {
  if (item.ruleIds.some((ruleId) => ruleId.startsWith("mad-"))) return "length";
  if (item.ruleIds.some((ruleId) => ruleId === "qalqalah" || ruleId === "waqaf-ibtida")) return "waqaf";
  return "meeting";
}

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
  const ayahSearchOptions = useMemo<readonly SearchOption[]>(() => surah.verses.map((item) => ({ value: item.number, label: `Ayat ${item.number}`, keywords: String(item.number) })), [surah]);

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
      <div className="selectors"><SearchPicker label="Surah" value={surah.number} options={surahSearchOptions} placeholder="Cari nama, arti, atau nomor…" onSelect={(number) => changeLocation(number, 1)} /><SearchPicker label="Ayat" value={verse.number} options={ayahSearchOptions} placeholder={`Cari 1–${surah.verses.length}…`} compact onSelect={(number) => changeLocation(surah.number, number)} /></div>
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
        <div className="verse-rule-overview"><div className="verse-rule-heading"><span className="section-kicker">PETA TAJWID AYAT</span><strong>{verseAnnotations.length} temuan</strong></div>{ruleOverview.length ? <div className="verse-rule-chips">{ruleOverview.map((item) => <button key={item.id} type="button" className={`rule-tone-${getRuleTone(item)}`} onClick={() => chooseAnnotation(item)}><i className={item.reviewStatus === "automatic-unreviewed" ? "auto-dot" : "curated-dot"} />{item.title}</button>)}</div> : <p>Belum ada hukum yang terdeteksi oleh aturan terbatas kami pada ayat ini. Baca bersama guru untuk pemeriksaan menyeluruh.</p>}<small>Titik hijau: contoh disusun manual. Titik emas: hasil pemindaian otomatis, perlu verifikasi guru. Daftar ini belum mencakup seluruh hukum tajwid.</small></div>
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
  const activeTone = getRuleTone(item);
  return <div className="insight-content">
    <span className={`selected-arabic rule-tone-${activeTone}`} dir="rtl" lang="ar">{selectedText}</span>
    <div className="insight-title"><span className={`rule-chip rule-tone-${activeTone}`}>{item.reviewStatus === "automatic-unreviewed" ? "Hasil pemindaian otomatis" : lesson?.category ?? "Kaidah bacaan"}</span><h3>{item.title}</h3><p>{item.explanation}</p></div>
    {matches.length > 1 && <div className="other-rules"><span>Aspek lain pada bagian ini</span><div>{matches.map((match) => {
      const isActive = match.id === item.id;
      return <button key={match.id} type="button" className={`rule-option rule-tone-${getRuleTone(match)} ${isActive ? "active" : ""}`} aria-pressed={isActive} onClick={() => onSelect(match.id)}><i className="rule-option-dot" aria-hidden="true" />{match.title}{isActive && <span className="sr-only"> (dipilih)</span>}</button>;
    })}</div></div>}
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
