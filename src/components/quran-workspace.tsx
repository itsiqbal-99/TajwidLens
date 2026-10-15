"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpenText, Check, ChevronDown, Minus, Plus, Search, ShieldCheck, X } from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useRef, useState, type CSSProperties } from "react";
import type { TajweedAnnotation, TajweedRule, TajweedSurahPayload } from "@/data/tajweed-types";
import { loadTajweedSurah, tajweedIndex, tajweedRules } from "@/lib/tajweed-data";
import { getContextNote, getHukumColor, getHukumLabel, getRuleHelp } from "@/lib/tajweed-presentation";
import { TajweedText } from "./tajweed-text";

type WorkspaceProps = { mode?: "explore" | "guide" };
type SearchOption = { value: number; label: string; subtitle?: string; keywords?: string };
type AccentStyle = CSSProperties & { "--rule-accent": string; "--rule-bg": string };

const surahOptions: SearchOption[] = tajweedIndex.surahs.map((item) => ({
  value: item.number,
  label: `${item.number}. ${item.name}`,
  subtitle: `${item.arabicName} · ${item.ayahCount} ayat`,
  keywords: `${item.number} ${item.name} ${item.arabicName} ${item.meaning}`,
}));

function normalizeSearch(value: string) {
  return value.toLocaleLowerCase("id").normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/[^\p{Letter}\p{Number}]+/gu, " ").replace(/\s+/g, " ").trim();
}

function SearchPicker({ label, value, options, placeholder, compact = false, onSelect }: {
  label: string;
  value: number;
  options: SearchOption[];
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
  const filtered = useMemo(() => {
    const needle = normalizeSearch(query);
    if (!needle) return options;
    const compactNeedle = needle.replaceAll(" ", "");
    return options.filter((option) => {
      const haystack = normalizeSearch(option.keywords ?? `${option.value} ${option.label} ${option.subtitle ?? ""}`);
      return haystack.includes(needle) || haystack.replaceAll(" ", "").includes(compactNeedle);
    });
  }, [options, query]);

  useEffect(() => { if (open) requestAnimationFrame(() => inputRef.current?.focus()); }, [open]);
  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => { if (!rootRef.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  function choose(option: SearchOption) {
    onSelect(option.value); setOpen(false); setQuery("");
    requestAnimationFrame(() => triggerRef.current?.focus());
  }

  return <div className={`search-picker-field ${compact ? "search-picker-compact" : ""}`}>
    <span className="search-picker-label">{label}</span>
    <div ref={rootRef} className={`search-picker ${open ? "is-open" : ""}`}>
      <button ref={triggerRef} type="button" className="search-picker-trigger" aria-haspopup="listbox" aria-expanded={open} onClick={() => { setActiveIndex(0); setOpen(!open); }}>
        <span>{selected?.label}</span><ChevronDown size={16} aria-hidden="true" />
      </button>
      {open && <div className="search-picker-popover">
        <div className="search-picker-input-wrap"><Search size={15} aria-hidden="true" /><input ref={inputRef} type="search" value={query} placeholder={placeholder} aria-label={`Cari ${label.toLocaleLowerCase("id")}`} onChange={(event) => { setQuery(event.target.value); setActiveIndex(0); }} onKeyDown={(event) => {
          if (event.key === "ArrowDown") { event.preventDefault(); setActiveIndex((index) => Math.min(index + 1, filtered.length - 1)); }
          if (event.key === "ArrowUp") { event.preventDefault(); setActiveIndex((index) => Math.max(index - 1, 0)); }
          if (event.key === "Enter" && filtered[activeIndex]) { event.preventDefault(); choose(filtered[activeIndex]); }
          if (event.key === "Escape") { setOpen(false); triggerRef.current?.focus(); }
        }} /></div>
        <div id={listboxId} className="search-picker-options" role="listbox">
          {filtered.length ? filtered.map((option, index) => <button key={option.value} type="button" role="option" aria-selected={option.value === value} className={`search-picker-option ${index === activeIndex ? "keyboard-active" : ""}`} onMouseEnter={() => setActiveIndex(index)} onClick={() => choose(option)}>
            <span><strong>{option.label}</strong>{option.subtitle && <small>{option.subtitle}</small>}</span>{option.value === value && <Check size={15} aria-hidden="true" />}
          </button>) : <div className="search-picker-empty">Tidak ada hasil yang cocok.</div>}
        </div>
      </div>}
    </div>
  </div>;
}

function accentStyle(rule: TajweedRule): AccentStyle {
  const color = getHukumColor(rule);
  return { "--rule-accent": color, "--rule-bg": `color-mix(in srgb, ${color} var(--tajwid-panel-opacity), var(--surface))` };
}

export function QuranWorkspace({ mode = "explore" }: WorkspaceProps) {
  const searchParams = useSearchParams();
  const fallbackSurah = mode === "guide" ? 113 : 1;
  const requestedSurah = Number(searchParams.get("surah"));
  const initialSurah = tajweedIndex.surahs.some((item) => item.number === requestedSurah) ? requestedSurah : fallbackSurah;
  const requestedAyah = Number(searchParams.get("ayah"));
  const initialAyahCount = tajweedIndex.surahs.find((item) => item.number === initialSurah)?.ayahCount ?? 1;
  const initialAyah = requestedAyah >= 1 && requestedAyah <= initialAyahCount ? requestedAyah : mode === "guide" && initialSurah === 113 ? 2 : 1;
  const [surahNumber, setSurahNumber] = useState(initialSurah);
  const [ayahNumber, setAyahNumber] = useState(initialAyah);
  const [payload, setPayload] = useState<TajweedSurahPayload | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [overlapIds, setOverlapIds] = useState<string[]>([]);
  const [showHighlights, setShowHighlights] = useState(true);
  const [fontSize, setFontSize] = useState(40);
  const [mobile, setMobile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 900px)");
    const update = () => setMobile(media.matches);
    update(); media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    let current = true;
    loadTajweedSurah(surahNumber).then((data) => {
      if (!current) return;
      setPayload(data); setError(null);
      const requested = new URL(window.location.href).searchParams.get("annotation");
      const item = data.verses.find((candidate) => candidate.number === ayahNumber)?.annotations.find((candidate) => candidate.id === requested);
      if (item) { setSelectedId(item.id); setOverlapIds([item.id]); }
    }).catch((reason: unknown) => {
      if (current) setError(reason instanceof Error ? reason.message : "Data tajwid gagal dimuat.");
    });
    return () => { current = false; };
  }, [ayahNumber, surahNumber]);

  const summary = tajweedIndex.surahs.find((item) => item.number === surahNumber) ?? tajweedIndex.surahs[0];
  const activePayload = payload?.surah.number === surahNumber ? payload : null;
  const verse = activePayload?.verses.find((item) => item.number === ayahNumber) ?? null;
  const selected = verse?.annotations.find((item) => item.id === selectedId) ?? null;
  const selectedRule = selected ? tajweedRules[selected.ruleId] : null;
  const rejected = tajweedIndex.rejectedAyahs.includes(`${surahNumber}:${ayahNumber}`);
  const ayahOptions = useMemo(() => Array.from({ length: summary.ayahCount }, (_, index) => ({ value: index + 1, label: `Ayat ${index + 1}`, keywords: `${index + 1} ayat ${index + 1}` })), [summary.ayahCount]);
  const hukumGroups = useMemo(() => {
    const groups = new Map<string, TajweedAnnotation[]>();
    for (const item of verse?.annotations ?? []) groups.set(item.hukumId, [...(groups.get(item.hukumId) ?? []), item]);
    return [...groups.entries()];
  }, [verse]);

  const updateUrl = useCallback((surah: number, ayah: number, annotation?: string | null) => {
    const url = new URL(window.location.href);
    url.searchParams.set("surah", String(surah)); url.searchParams.set("ayah", String(ayah));
    if (annotation) url.searchParams.set("annotation", annotation); else url.searchParams.delete("annotation");
    window.history.replaceState({}, "", url);
  }, []);

  const chooseSurah = (number: number) => { setSurahNumber(number); setAyahNumber(1); setSelectedId(null); setOverlapIds([]); setError(null); updateUrl(number, 1); };
  const chooseAyah = (number: number) => { setAyahNumber(number); setSelectedId(null); setOverlapIds([]); updateUrl(surahNumber, number); };
  const go = (direction: -1 | 1) => {
    if (direction < 0 && ayahNumber > 1) return chooseAyah(ayahNumber - 1);
    if (direction > 0 && ayahNumber < summary.ayahCount) return chooseAyah(ayahNumber + 1);
    const nextSurah = surahNumber + direction;
    const next = tajweedIndex.surahs.find((item) => item.number === nextSurah);
    if (!next) return;
    const nextAyah = direction < 0 ? next.ayahCount : 1;
    setSurahNumber(nextSurah); setAyahNumber(nextAyah); setSelectedId(null); setOverlapIds([]); updateUrl(nextSurah, nextAyah);
  };

  const selectAnnotations = (items: TajweedAnnotation[]) => {
    const byHukum = new Map<string, TajweedAnnotation>();
    for (const item of items) if (!byHukum.has(item.hukumId)) byHukum.set(item.hukumId, item);
    const ordered = [...byHukum.values()].sort((a, b) => (a.end - a.start) - (b.end - b.start));
    setOverlapIds(ordered.map((item) => item.id));
    setSelectedId(ordered[0]?.id ?? null);
    if (ordered[0]) updateUrl(surahNumber, ayahNumber, ordered[0].id);
  };

  return <div className="workspace">
    <div className="workspace-toolbar">
      <div className="selectors">
        <SearchPicker label="Surah" value={surahNumber} options={surahOptions} placeholder="Nomor atau nama surah…" onSelect={chooseSurah} />
        <SearchPicker label="Ayat" value={ayahNumber} options={ayahOptions} placeholder="Nomor ayat…" compact onSelect={chooseAyah} />
      </div>
      <div className="reading-controls">
        <label className="highlight-toggle"><input type="checkbox" checked={showHighlights} onChange={(event) => setShowHighlights(event.target.checked)} /><span className="toggle-track"><span /></span>Warna tajwid</label>
        <div className="font-controls" aria-label="Ukuran teks"><button type="button" aria-label="Perkecil teks" disabled={fontSize <= 30} onClick={() => setFontSize((size) => size - 2)}><Minus size={15} /></button><span>ع</span><button type="button" aria-label="Perbesar teks" disabled={fontSize >= 58} onClick={() => setFontSize((size) => size + 2)}><Plus size={15} /></button></div>
      </div>
    </div>

    <div className="workspace-grid">
      <main className="reader" onTouchStart={(event) => { const touch = event.touches[0]; touchStart.current = { x: touch.clientX, y: touch.clientY }; }} onTouchEnd={(event) => {
        if (!mobile || !touchStart.current) return;
        const touch = event.changedTouches[0]; const dx = touch.clientX - touchStart.current.x; const dy = touch.clientY - touchStart.current.y;
        touchStart.current = null;
        if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.4) go(dx < 0 ? 1 : -1);
      }}>
        <div className="reader-topline"><div><span className="eyebrow">QURAN TAJWEED · HAFS &apos;AN &apos;ASIM</span><h2>{summary.name} <span className="surah-arabic" lang="ar">{summary.arabicName}</span></h2></div><span className="reader-counter">{ayahNumber}/{summary.ayahCount}</span></div>
        {activePayload?.surah.basmala && <p className="basmala" lang="ar" dir="rtl">{activePayload.surah.basmala}</p>}
        <div className="verse-box">
          <span className="verse-label">AYAT {ayahNumber}</span>
          {!activePayload && !error && <div className="tajweed-data-state">Memverifikasi dan memuat anotasi…</div>}
          {error && <div className="tajweed-data-state is-error"><strong>Data tidak dapat ditampilkan.</strong><span>{error}</span></div>}
          {verse && <TajweedText text={verse.text} annotations={verse.annotations} rules={tajweedRules} selectedId={selectedId} visible={showHighlights} fontSize={fontSize} onSelect={selectAnnotations} />}
          <p className="verse-hint">Ketuk bagian berwarna untuk melihat aturan sumber dan cara membacanya.</p>
        </div>

        <section className="verse-rule-overview" aria-label="Peta hukum tajwid ayat">
          <div className="verse-rule-heading"><span className="section-kicker">PETA RENTANG TAJWID</span><strong>{verse?.annotations.length ?? 0} rentang · {hukumGroups.length} hukum</strong></div>
          {hukumGroups.length ? <div className="verse-rule-chips">{hukumGroups.map(([hukumId, items]) => {
            const rule = tajweedRules[items[0].ruleId];
            return <button type="button" key={hukumId} style={accentStyle(rule)} onClick={() => selectAnnotations([items[0]])}><i style={{ background: getHukumColor(rule) }} />{getHukumLabel(rule)} <span>×{items.length}</span></button>;
          })}</div> : <p>{rejected ? "Anotasi ayat ini sengaja tidak dipindahkan karena teks referensi dan teks KFGQPC tidak dapat disejajarkan satu-per-satu dengan aman." : "Tidak ada rentang stabil dari korpus sumber untuk ayat ini."}</p>}
          <small>Pita bergaris menunjukkan lebih dari satu hukum pada rentang huruf yang sama. Setiap warna mewakili hukum berbeda, bukan hasil pemindaian browser.</small>
        </section>

        <nav className="verse-nav" aria-label="Navigasi ayat"><button type="button" disabled={surahNumber === 1 && ayahNumber === 1} onClick={() => go(-1)}><ArrowLeft size={16} />Ayat sebelumnya</button><span className="verse-nav-current">{summary.name} · {ayahNumber}</span><button type="button" disabled={surahNumber === 114 && ayahNumber === summary.ayahCount} onClick={() => go(1)}>Ayat berikutnya<ArrowRight size={16} /></button></nav>
        <p className="mobile-swipe-hint">Geser ke kiri/kanan untuk berpindah ayat.</p>
        <p className="editorial-note"><ShieldCheck size={13} aria-hidden="true" /> Teks: KFGQPC UthmanicHafs v3.0. Anotasi: Quran.ws Tajweed {tajweedIndex.source.release}; hanya aturan berstatus stabil dan tanpa needsReview.</p>
      </main>

      <aside className={`insight-panel ${selected && mobile ? "panel-open" : ""}`} aria-label="Detail hukum tajwid">
        {selected && selectedRule ? <>
          <div className="panel-head"><span className="eyebrow">PANDUAN KONTEKSTUAL</span><button type="button" className="icon-button panel-close" aria-label="Tutup panduan" onClick={() => { setSelectedId(null); setOverlapIds([]); updateUrl(surahNumber, ayahNumber); }}><X size={17} /></button></div>
          <span className="selected-arabic" dir="rtl" lang="ar" style={{ borderBottomColor: getHukumColor(selectedRule) }}>{selected.quote}</span>
          {overlapIds.length > 1 && <div className="overlap-notice"><strong>{overlapIds.length} hukum bertumpuk pada bagian ini</strong><span>Pilih masing-masing warna untuk membedakan penjelasannya.</span></div>}
          {overlapIds.length > 1 && <div className="overlap-switcher">{overlapIds.map((id) => {
            const item = verse?.annotations.find((candidate) => candidate.id === id); if (!item) return null;
            const rule = tajweedRules[item.ruleId];
            return <button type="button" key={id} className={id === selectedId ? "active" : ""} style={accentStyle(rule)} onClick={() => { setSelectedId(id); updateUrl(surahNumber, ayahNumber, id); }}><i style={{ background: getHukumColor(rule) }} />{getHukumLabel(rule)}</button>;
          })}</div>}
          <div className="insight-title" style={accentStyle(selectedRule)}><span className="rule-chip" style={accentStyle(selectedRule)}>{selectedRule.topic}</span><h3>{getHukumLabel(selectedRule)}</h3><p className="beginner-summary"><strong>Intinya:</strong> {getRuleHelp(selectedRule).summary}</p></div>
          <section className="insight-section"><span className="section-kicker">01 / CARA MEMBACANYA</span><p>{getRuleHelp(selectedRule).reading}</p></section>
          <section className="insight-section"><span className="section-kicker">02 / KENAPA BAGIAN INI DITANDAI?</span><p>{getRuleHelp(selectedRule).trigger}</p><div className="simple-example"><span>Bagian yang dibaca</span><strong lang="ar" dir="rtl">{selected.quote}</strong></div></section>
          <section className="insight-section"><span className="section-kicker">03 / JIKA BERHENTI ATAU DISAMBUNG</span><p>{getContextNote(selectedRule)}</p></section>
          <details className="advanced-rule"><summary>Lihat rincian teknis dan sumber</summary><div className="source-rule"><p className="arabic-rule" lang="ar" dir="rtl">{selectedRule.ruleAr}</p><dl><div><dt>Nama Arab</dt><dd lang="ar" dir="rtl">{selectedRule.hukumAr}</dd></div><div><dt>Kategori sumber</dt><dd>{selectedRule.category}</dd></div><div><dt>Pola sumber</dt><dd lang="ar" dir="rtl">{selectedRule.pattern}</dd></div><div><dt>Letak bagian</dt><dd>{selected.start}–{selected.end}; {selectedRule.scope === "across-words" ? "melintasi dua kata" : "di dalam satu kata"}</dd></div>{selectedRule.school && <div><dt>Rujukan ulama</dt><dd lang="ar" dir="rtl">{selectedRule.school.scholar}</dd></div>}<div><dt>ID aturan</dt><dd><code>{selectedRule.id}</code></dd></div></dl></div></details>
          {getRuleHelp(selectedRule).lesson && <Link className="lesson-link" href={`/learn/${getRuleHelp(selectedRule).lesson}/`}>Pelajari materi dasarnya <BookOpenText size={17} /></Link>}
          <div className="review-status"><ShieldCheck size={13} /> Anotasi prahitung · aturan stabil · hash diverifikasi</div>
        </> : <div className="panel-placeholder"><span className="panel-placeholder-icon"><BookOpenText size={23} /></span><h3>Detail pada tingkat huruf</h3><p>Pilih pita warna pada ayat. Panel akan menunjukkan potongan persis, hukum, pemicu, cara membaca, dan teks aturan sumber. Jika hukum bertumpuk, semuanya ditampilkan terpisah.</p><Link className="inline-link" href="/reference/">Baca metodologi dan batas cakupan <ArrowRight size={15} /></Link></div>}
      </aside>
    </div>
  </div>;
}
