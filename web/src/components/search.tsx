"use client";

import Link from "next/link";
import { ArrowRight, Search, X } from "lucide-react";
import { useMemo, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { searchContent } from "@/lib/search";

const examples = ["kenapa harus dengung", "nun mati", "mad thabi'i", "berhenti di akhir ayat"];

export function ReadingSearch({ compact = false }: { compact?: boolean }) {
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(-1);
  const router = useRouter();
  const results = useMemo(() => searchContent(query), [query]);

  function onKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") { event.preventDefault(); setCursor((value) => Math.min(results.length - 1, value + 1)); }
    if (event.key === "ArrowUp") { event.preventDefault(); setCursor((value) => Math.max(0, value - 1)); }
    if (event.key === "Enter" && results.length) { event.preventDefault(); router.push(results[cursor >= 0 ? cursor : 0].href); }
    if (event.key === "Escape") { setQuery(""); setCursor(-1); }
  }

  return <div className={`search-module ${compact ? "search-compact" : ""}`}>
    <div className="search-field"><Search size={20} aria-hidden="true" /><input value={query} onChange={(event) => { setQuery(event.target.value); setCursor(-1); }} onKeyDown={onKey} placeholder="Cari hukum, surah, atau pertanyaan bacaan…" aria-label="Cari materi dan contoh ayat" aria-controls="search-results" aria-activedescendant={cursor >= 0 ? `search-result-${cursor}` : undefined} />{query && <button type="button" onClick={() => { setQuery(""); setCursor(-1); }} aria-label="Hapus pencarian"><X size={17} /></button>}</div>
    {query ? <div id="search-results" className="search-results" aria-live="polite">{results.length ? <><div className="search-results-head">{results.length} hasil untuk “{query}”</div>{results.map((result, index) => <Link key={result.id} id={`search-result-${index}`} href={result.href} className={`search-result ${cursor === index ? "keyboard-active" : ""}`}><span className="search-kind">{result.kind}</span><span><strong>{result.title}</strong><small>{result.description}</small></span><ArrowRight size={17} /></Link>)}</> : <div className="search-empty"><strong>Belum ada hasil yang cocok.</strong><p>Coba istilah seperti “ikhfa”, “dengung”, “Al-Falaq”, atau nomor ayat. Pencarian hanya mencakup materi dan ayat yang tersedia.</p></div>}</div> : !compact && <div className="search-suggestions"><span>Coba tanyakan</span>{examples.map((example) => <button type="button" key={example} onClick={() => setQuery(example)}>{example}</button>)}</div>}</div>;
}
