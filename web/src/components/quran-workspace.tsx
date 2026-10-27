"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpenText, Check, ChevronDown, Minus, Plus, Search, ShieldCheck, X } from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useRef, useState, type CSSProperties } from "react";
import type { TajweedAnnotation, TajweedRule, TajweedSurahPayload } from "@/data/tajweed-types";
import { loadTajweedSurah, tajweedIndex, tajweedRules } from "@/lib/tajweed-data";
import { getAnnotationHelp, getContextNote, getHukumColor, getHukumLabel, getRuleHelp } from "@/lib/tajweed-presentation";
import { getLesson } from "@/data/lessons";
import { guideHref, indexedExamples, primaryAnnotations, relatedWords, resolveAnnotation, waqafStudy } from "@/lib/reading-navigation";
import { WaqafComparison } from "./waqaf-comparison";
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
  useEffect(() => { if (open) document.getElementById(`${listboxId}-${activeIndex}`)?.scrollIntoView({ block: "nearest", behavior: "instant" }); }, [open, activeIndex, listboxId]);
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
      <button ref={triggerRef} type="button" className="search-picker-trigger" aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? listboxId : undefined} onClick={() => { setActiveIndex(0); setOpen(!open); }}>
        <span>{selected?.label}</span><ChevronDown size={16} aria-hidden="true" />
      </button>
      {open && <div className="search-picker-popover">
        <div className="search-picker-input-wrap"><Search size={15} aria-hidden="true" /><input ref={inputRef} role="combobox" aria-expanded={open} aria-controls={listboxId} aria-activedescendant={filtered[activeIndex] ? `${listboxId}-${activeIndex}` : undefined} type="search" value={query} placeholder={placeholder} aria-label={`Cari ${label.toLocaleLowerCase("id")}`} onChange={(event) => { setQuery(event.target.value); setActiveIndex(0); }} onKeyDown={(event) => {
          if (event.key === "ArrowDown") { event.preventDefault(); setActiveIndex((index) => Math.max(0, Math.min(index + 1, filtered.length - 1))); }
          if (event.key === "ArrowUp") { event.preventDefault(); setActiveIndex((index) => Math.max(index - 1, 0)); }
          if (event.key === "Enter" && filtered[activeIndex]) { event.preventDefault(); choose(filtered[activeIndex]); }
          if (event.key === "Escape") { setOpen(false); triggerRef.current?.focus(); }
        }} /></div>
        <div id={listboxId} className="search-picker-options" role="listbox">
          {filtered.length ? filtered.map((option, index) => <button key={option.value} id={`${listboxId}-${index}`} type="button" role="option" aria-selected={option.value === value} className={`search-picker-option ${index === activeIndex ? "keyboard-active" : ""}`} onMouseEnter={() => setActiveIndex(index)} onClick={() => choose(option)}>
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
  const initialAyah = Number.isInteger(requestedAyah) && requestedAyah >= 1 && requestedAyah <= initialAyahCount ? requestedAyah : mode === "guide" && initialSurah === 113 ? 2 : 1;
  const surahNumber = initialSurah;
  const ayahNumber = initialAyah;
  const [payload, setPayload] = useState<TajweedSurahPayload | null>(null);
  const showHighlights = searchParams.get("colors") !== "off";
  const [fontSize, setFontSize] = useState(40);
  const [mobile, setMobile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const detail = searchParams.get("view") === "detail";
  const sequential = searchParams.get("verses") === "3";
  const requestedStart = Number(searchParams.get("from"));
  const readingStart = sequential && Number.isInteger(requestedStart) && requestedStart >= 1 && requestedStart <= ayahNumber && ayahNumber < requestedStart + 3 ? requestedStart : ayahNumber;
  const panelRef = useRef<HTMLElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 900px)");
    const update = () => setMobile(media.matches);
    update(); media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    let current = true;
    queueMicrotask(() => { if (current) setError(null); });
    loadTajweedSurah(surahNumber).then((data) => {
      if (!current) return;
      setPayload(data); setError(null);
    }).catch((reason: unknown) => {
      if (current) setError(reason instanceof Error ? reason.message : "Data tajwid gagal dimuat.");
    });
    return () => { current = false; };
  }, [surahNumber, retry]);

  useEffect(() => {
    queueMicrotask(() => {
      try { const saved = Number(localStorage.getItem("tajwidlens-font-size")); if (saved >= 30 && saved <= 58) setFontSize(saved); } catch { /* Storage is optional. */ }
    });
  }, []);
  function resizeFont(delta: number) {
    const next = Math.max(30, Math.min(58, fontSize + delta)); setFontSize(next);
    try { localStorage.setItem("tajwidlens-font-size", String(next)); } catch { /* Storage is optional. */ }
  }

  const summary = tajweedIndex.surahs.find((item) => item.number === surahNumber) ?? tajweedIndex.surahs[0];
  const activePayload = payload?.surah.number === surahNumber ? payload : null;
  const verse = activePayload?.verses.find((item) => item.number === ayahNumber) ?? null;
  const requestedId = searchParams.get("annotation");
  const selectedId = verse ? resolveAnnotation(verse, requestedId, surahNumber) : null;
  const isStudy = selectedId === waqafStudy.id;
  const selected = verse?.annotations.find((item) => item.id === selectedId) ?? null;
  const selectedRule = selected ? tajweedRules[selected.ruleId] : null;
  const help = selected && selectedRule ? getAnnotationHelp(selectedRule, selected) : null;
  const visibleAnnotations = detail ? verse?.annotations ?? [] : primaryAnnotations(verse?.annotations ?? [], selectedId);
  const overlapping = selected ? verse?.annotations.filter((item) => item.start < selected.end && item.end > selected.start) ?? [] : [];
  const overlapIds = [...new Map(overlapping.map((item) => [item.hukumId, item.id])).values()];
  const occurrences = verse?.annotations.filter((item) => item.hukumId === selected?.hukumId) ?? [];
  const occurrenceIndex = occurrences.findIndex((item) => item.id === selectedId);
  const similar = selected ? indexedExamples.filter((item) => item.hukumId === selected.hukumId && item.id !== selected.id).slice(0, 3) : [];
  const linkedLesson = getLesson(searchParams.get("lesson") ?? "");
  const panelOpen = Boolean(selected || isStudy);
  const rejected = tajweedIndex.rejectedAyahs.includes(`${surahNumber}:${ayahNumber}`);
  const ayahOptions = useMemo(() => Array.from({ length: summary.ayahCount }, (_, index) => ({ value: index + 1, label: `Ayat ${index + 1}`, keywords: `${index + 1} ayat ${index + 1}` })), [summary.ayahCount]);
  const groups = new Map<string, TajweedAnnotation[]>();
  for (const item of visibleAnnotations) groups.set(item.hukumId, [...(groups.get(item.hukumId) ?? []), item]);
  const hukumGroups = [...groups.entries()];

  const updateUrl = useCallback((surah: number, ayah: number, annotation?: string | null) => {
    const url = new URL(window.location.href);
    const previousAyah = Number(url.searchParams.get("ayah"));
    const previousStart = Number(url.searchParams.get("from")) || previousAyah;
    if (url.searchParams.get("verses") === "3" && surah === Number(url.searchParams.get("surah")) && ayah >= previousStart && ayah < previousStart + 3) url.searchParams.set("from", String(previousStart));
    else url.searchParams.delete("from");
    if (surah !== Number(url.searchParams.get("surah")) || ayah !== Number(url.searchParams.get("ayah"))) url.searchParams.delete("lesson");
    url.searchParams.set("surah", String(surah)); url.searchParams.set("ayah", String(ayah));
    if (annotation) url.searchParams.set("annotation", annotation); else url.searchParams.delete("annotation");
    if (url.href !== window.location.href) window.history.pushState(null, "", url);
  }, []);

  useEffect(() => {
    if (!selectedId || !requestedId || selectedId === requestedId) return;
    const url = new URL(window.location.href);
    if (url.searchParams.get("annotation") !== requestedId) return;
    url.searchParams.set("annotation", selectedId); window.history.replaceState(null, "", url);
  }, [selectedId, requestedId]);

  const chooseSurah = (number: number) => { updateUrl(number, 1); };
  const chooseAyah = (number: number) => { updateUrl(surahNumber, number); };
  const go = (direction: -1 | 1) => {
    if (direction < 0 && ayahNumber > 1) return chooseAyah(ayahNumber - 1);
    if (direction > 0 && ayahNumber < summary.ayahCount) return chooseAyah(ayahNumber + 1);
    const nextSurah = surahNumber + direction;
    const next = tajweedIndex.surahs.find((item) => item.number === nextSurah);
    if (!next) return;
    const nextAyah = direction < 0 ? next.ayahCount : 1;
    updateUrl(nextSurah, nextAyah);
  };

  const selectAnnotations = (items: TajweedAnnotation[], ayah = ayahNumber) => {
    const byHukum = new Map<string, TajweedAnnotation>();
    for (const item of items) if (!byHukum.has(item.hukumId)) byHukum.set(item.hukumId, item);
    const ordered = [...byHukum.values()].sort((a, b) => Number(!primaryAnnotations([a]).length) - Number(!primaryAnnotations([b]).length) || (a.end - a.start) - (b.end - b.start));
    if (ordered[0]) updateUrl(surahNumber, ayah, ordered[0].id);
  };

  function setOption(key: string, value: string) {
    const url = new URL(window.location.href); url.searchParams.set(key, value); window.history.pushState(null, "", url);
  }
  const closePanel = useCallback(() => updateUrl(surahNumber, ayahNumber), [updateUrl, surahNumber, ayahNumber]);
  useEffect(() => {
    if (!panelOpen || !mobile) return;
    returnFocus.current = document.activeElement as HTMLElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => { document.body.style.overflow = previousOverflow; if (returnFocus.current?.isConnected) returnFocus.current.focus(); };
  }, [panelOpen, mobile]);
  useEffect(() => {
    if (!panelOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); closePanel(); }
      if (event.key !== "Tab" || !mobile) return;
      const elements = panelRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], summary, [tabindex="0"]');
      const focusable = [...(elements ?? [])].filter((element) => element.getClientRects().length);
      const first = focusable[0]; const last = focusable.at(-1);
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener("keydown", onKey); return () => document.removeEventListener("keydown", onKey);
  }, [panelOpen, mobile, closePanel]);

  const displayedVerses = activePayload?.verses.slice(readingStart - 1, readingStart - 1 + (sequential ? 3 : 1)) ?? [];
  const contextParams = new URLSearchParams(searchParams.toString());
  contextParams.set("surah", String(surahNumber)); contextParams.set("ayah", String(ayahNumber));

  return <div className={`workspace workspace-${mode}`}>
    <div className="workspace-toolbar">
      <div className="selectors">
        <SearchPicker label="Surah" value={surahNumber} options={surahOptions} placeholder="Nomor atau nama surah…" onSelect={chooseSurah} />
        <SearchPicker label="Ayat" value={ayahNumber} options={ayahOptions} placeholder="Nomor ayat…" compact onSelect={chooseAyah} />
      </div>
      <div className="reading-controls">
        <label className="highlight-toggle"><input type="checkbox" checked={showHighlights} onChange={(event) => setOption("colors", event.target.checked ? "on" : "off")} /><span className="toggle-track"><span /></span>Warna tajwid</label>
        <div className="font-controls" aria-label="Ukuran teks"><button type="button" aria-label="Perkecil teks" disabled={fontSize <= 30} onClick={() => resizeFont(-2)}><Minus size={15} /></button><span aria-live="polite">{fontSize}</span><button type="button" aria-label="Perbesar teks" disabled={fontSize >= 58} onClick={() => resizeFont(2)}><Plus size={15} /></button></div>
      </div>
    </div>
    <div className="workspace-options">
      <div className="view-switch" role="group" aria-label="Kedalaman penjelasan"><button type="button" aria-pressed={!detail} onClick={() => setOption("view", "simple")}>Sederhana</button><button type="button" aria-pressed={detail} onClick={() => setOption("view", "detail")}>Detail</button></div>
      <div className="view-switch" role="group" aria-label="Jumlah ayat"><button type="button" aria-pressed={!sequential} onClick={() => setOption("verses", "1")}>Satu ayat</button><button type="button" aria-pressed={sequential} onClick={() => setOption("verses", "3")}>3 ayat berurutan</button></div>
      <Link href={`${mode === "guide" ? "/explore/" : "/reading-guide/"}?${contextParams}`}>{mode === "guide" ? "Lanjut membaca" : "Buka panduan bacaan"}<ArrowRight size={14}/></Link>
    </div>
    {linkedLesson && <div className="reader-notice"><strong>Fokus materi: {linkedLesson.title}</strong><p>{selectedId ? "Contoh yang sesuai sudah dipilih." : "Sorotan hukum ini belum tersedia di pembaca. Lihat pola dan contoh yang dijelaskan dalam materi."}</p><Link href={`/learn/${linkedLesson.id}/`}>Baca materi terkait</Link></div>}
    {verse && requestedId && !selectedId && <p className="reader-notice" role="status">Contoh dari tautan ini belum tersedia sebagai anotasi. Pilih hukum di bawah atau kembali ke materi terkait.</p>}

    <div className="workspace-grid">
      <section className="reader" aria-label="Pembaca ayat" onTouchStart={(event) => { const touch = event.touches[0]; touchStart.current = { x: touch.clientX, y: touch.clientY }; }} onTouchEnd={(event) => {
        if (!mobile || !touchStart.current) return;
        const touch = event.changedTouches[0]; const dx = touch.clientX - touchStart.current.x; const dy = touch.clientY - touchStart.current.y;
        touchStart.current = null;
        if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.4) go(dx < 0 ? 1 : -1);
      }}>
        <div className="reader-topline"><div><span className="eyebrow">QURAN TAJWEED · HAFS &apos;AN &apos;ASIM</span><h2>{summary.name} <span className="surah-arabic" lang="ar">{summary.arabicName}</span></h2></div><span className="reader-counter">{ayahNumber}/{summary.ayahCount}</span></div>
        {ayahNumber === 1 && activePayload?.surah.basmala && <p className="basmala" lang="ar" dir="rtl">{activePayload.surah.basmala}</p>}
          {!activePayload && !error && <div className="tajweed-data-state">Memverifikasi dan memuat anotasi…</div>}
          {error && <div className="tajweed-data-state is-error"><strong>Ayat belum dapat dimuat.</strong><span>Periksa koneksi, lalu coba lagi.</span><button type="button" onClick={() => setRetry((value) => value + 1)}>Coba lagi</button><details><summary>Rincian masalah</summary>{error}</details></div>}
          {displayedVerses.map((item) => <div className={`verse-box ${item.number === ayahNumber ? "active-verse" : ""}`} key={item.number}>
            <span className="verse-label">AYAT {item.number}{sequential && item.number === ayahNumber ? " · AKTIF" : ""}</span>
            <TajweedText text={item.text} annotations={detail ? item.annotations : primaryAnnotations(item.annotations, selectedId)} rules={tajweedRules} selectedId={selectedId} visible={showHighlights} fontSize={fontSize} onSelect={(items) => selectAnnotations(items, item.number)} />
            {item.number !== ayahNumber && <button type="button" className="text-link" onClick={() => chooseAyah(item.number)}>Fokus ayat {item.number}</button>}
          </div>)}
          <p className="verse-hint">Ketuk bagian ayat atau pilih nama hukum di bawah. Tetap bisa dipilih saat warna dimatikan.</p>
          {surahNumber === 1 && ayahNumber === 3 && <button className="study-launch" type="button" onClick={() => updateUrl(1, 3, waqafStudy.id)}>Bandingkan waqaf &amp; wasal pada akhir ayat <ArrowRight size={16}/></button>}

        <section className="verse-rule-overview" aria-label="Peta hukum tajwid ayat">
          <div className="verse-rule-heading"><span className="section-kicker">{mode === "guide" ? "BAGIAN MANA YANG MEMBUAT RAGU?" : `HUKUM PADA AYAT ${ayahNumber}`}</span><strong>{hukumGroups.length} hukum{detail ? ` · ${visibleAnnotations.length} anotasi` : " utama"}</strong></div>
          {hukumGroups.length ? <div className="verse-rule-chips">{hukumGroups.map(([hukumId, items]) => {
            const rule = tajweedRules[items[0].ruleId];
            return <button type="button" key={hukumId} style={accentStyle(rule)} onClick={() => selectAnnotations([items[0]])}><i style={{ background: getHukumColor(rule) }} />{getHukumLabel(rule)} <span>×{items.length}</span></button>;
          })}</div> : <p>{!verse ? "Hukum muncul setelah ayat dimuat." : rejected ? "Teks ayat tersedia. Penanda tajwid belum ditampilkan karena kecocokannya masih perlu diperiksa." : "Belum ada penanda untuk tampilan ini. Ini tidak berarti ayat ini tanpa hukum tajwid."}</p>}
          <small>{detail ? "Pita bergaris berarti ada beberapa hukum pada bagian yang sama." : "Tampilan Sederhana mengutamakan hukum dasar. Pilih Detail untuk melihat seluruh anotasi."}</small>
        </section>

        <nav className="verse-nav" aria-label="Navigasi ayat"><button type="button" disabled={surahNumber === 1 && ayahNumber === 1} onClick={() => go(-1)}><ArrowLeft size={16} />Ayat sebelumnya</button><span className="verse-nav-current">{summary.name} · {ayahNumber}</span><button type="button" disabled={surahNumber === 114 && ayahNumber === summary.ayahCount} onClick={() => go(1)}>Ayat berikutnya<ArrowRight size={16} /></button></nav>
        <p className="mobile-swipe-hint">Geser ke kiri/kanan untuk berpindah ayat.</p>
        <p className="editorial-note"><ShieldCheck size={13} aria-hidden="true" /> Teks KFGQPC · riwayat Hafs. Penanda belum mencakup semua hukum. <Link href="/reference/">Sumber dan cakupan</Link></p>
      </section>

      {panelOpen && mobile && <button type="button" className="sheet-backdrop" aria-label="Tutup panel panduan" tabIndex={-1} onClick={closePanel}/>}
      <aside ref={panelRef} tabIndex={-1} role={mobile && panelOpen ? "dialog" : undefined} aria-modal={mobile && panelOpen ? true : undefined} className={`insight-panel ${panelOpen && mobile ? "panel-open" : ""}`} aria-label="Detail hukum tajwid">
        {panelOpen && <div className="panel-head"><span className="eyebrow">{summary.name} · AYAT {ayahNumber}</span><button type="button" className="icon-button panel-close" aria-label="Tutup panduan" onClick={closePanel}><X size={17} /></button></div>}
        {isStudy ? <WaqafComparison/> : selected && selectedRule && help ? <>
          <span className="selected-arabic" dir="rtl" lang="ar" style={{ borderBottomColor: getHukumColor(selectedRule) }}>{selected.quote}</span>
          {overlapIds.length > 1 && <div className="overlap-notice"><strong>{overlapIds.length} hukum bertumpuk pada bagian ini</strong><span>Pilih masing-masing warna untuk membedakan penjelasannya.</span></div>}
          {overlapIds.length > 1 && <div className="overlap-switcher">{overlapIds.map((id) => {
            const item = verse?.annotations.find((candidate) => candidate.id === id); if (!item) return null;
            const rule = tajweedRules[item.ruleId];
            return <button type="button" key={id} aria-pressed={id === selectedId} className={id === selectedId ? "active" : ""} style={accentStyle(rule)} onClick={() => updateUrl(surahNumber, ayahNumber, id)}><i style={{ background: getHukumColor(rule) }} />{getHukumLabel(rule)}</button>;
          })}</div>}
          <div className="insight-title" style={accentStyle(selectedRule)}><span className="rule-chip" style={accentStyle(selectedRule)}>{selectedRule.topic}</span><h3>{getHukumLabel(selectedRule)}</h3><p className="beginner-summary"><strong>Intinya:</strong> {getRuleHelp(selectedRule).summary}</p></div>
          <div className="simple-example"><span>Kata terkait</span><strong lang="ar" dir="rtl">{verse && relatedWords(verse.text, selected)}</strong></div>
          <section className="insight-section"><span className="section-kicker">CARA MEMBACANYA</span><p>{help.reading}</p></section>
          <section className="insight-section"><span className="section-kicker">HURUF &amp; ALASANNYA</span><p lang="ar" dir="rtl" className="context-letters">{help.letters}</p><p>Pada <b lang="ar" dir="rtl">{verse && relatedWords(verse.text, selected)}</b>: {help.reason}</p>{help.mistake && <p className="common-mistake"><strong>Hindari:</strong> {help.mistake}</p>}</section>
          {occurrences.length > 1 && <nav className="occurrence-nav" aria-label="Kemunculan hukum yang sama"><button type="button" disabled={occurrenceIndex <= 0} onClick={() => updateUrl(surahNumber, ayahNumber, occurrences[occurrenceIndex - 1].id)} aria-label="Kemunculan sebelumnya"><ArrowLeft size={16}/></button><span>Kemunculan {occurrenceIndex + 1} dari {occurrences.length}</span><button type="button" disabled={occurrenceIndex >= occurrences.length - 1} onClick={() => updateUrl(surahNumber, ayahNumber, occurrences[occurrenceIndex + 1].id)} aria-label="Kemunculan berikutnya"><ArrowRight size={16}/></button></nav>}
          {detail && <section className="insight-section"><span className="section-kicker">JIKA BERHENTI ATAU DISAMBUNG</span><p>{getContextNote(selectedRule)}</p><Link href={guideHref(1, 3, waqafStudy.id)}>Coba contoh waqaf / wasal yang tersedia</Link></section>}
          <details className="advanced-rule"><summary>Lihat rincian teknis dan sumber</summary><div className="source-rule"><p className="arabic-rule" lang="ar" dir="rtl">{selectedRule.ruleAr}</p><dl><div><dt>Nama Arab</dt><dd lang="ar" dir="rtl">{selectedRule.hukumAr}</dd></div><div><dt>Kategori sumber</dt><dd>{selectedRule.category}</dd></div><div><dt>Pola sumber</dt><dd lang="ar" dir="rtl">{selectedRule.pattern}</dd></div><div><dt>Letak bagian</dt><dd>{selected.start}–{selected.end}; {selectedRule.scope === "across-words" ? "melintasi dua kata" : "di dalam satu kata"}</dd></div>{selectedRule.school && <div><dt>Rujukan ulama</dt><dd lang="ar" dir="rtl">{selectedRule.school.scholar}</dd></div>}<div><dt>ID aturan</dt><dd><code>{selectedRule.id}</code></dd></div></dl></div></details>
          {getRuleHelp(selectedRule).lesson && <Link className="lesson-link" href={`/learn/${getRuleHelp(selectedRule).lesson}/`}>Pelajari materi dasarnya <BookOpenText size={17} /></Link>}
          {similar.length > 0 && <section className="similar-examples"><h4>Coba hukum yang sama</h4>{similar.map((item) => <Link key={item.id} href={guideHref(item.surah, item.ayah, item.id)}>{tajweedIndex.surahs[item.surah - 1].name} · {item.ayah}<span lang="ar" dir="rtl">{item.words}</span></Link>)}</section>}
          <div className="review-status"><ShieldCheck size={13} /> Penanda dari korpus sumber. Latih bunyinya bersama guru.</div>
        </> : <div className="panel-placeholder"><span className="panel-placeholder-icon"><BookOpenText size={23} /></span><h3>{mode === "guide" ? "Mulai dari bagian yang terasa sulit." : "Baca dengan tenang."}</h3><p>{mode === "guide" ? "Ketuk potongan ayat atau nama hukum untuk melihat huruf pemicu dan cara membacanya." : "Pilih surah dan ayat, lalu baca satu atau tiga ayat sekaligus. Penjelasan muncul saat Anda memilih bagian ayat."}</p><Link className="inline-link" href={guideHref(1, 3, waqafStudy.id)}>Coba berhenti atau sambung <ArrowRight size={15} /></Link></div>}
      </aside>
    </div>
  </div>;
}
