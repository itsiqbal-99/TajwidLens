"use client";

import Link from "next/link";
import { ArrowUpRight, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { lessons } from "@/data/lessons";

const categories = ["Semua", ...new Set(lessons.map((lesson) => lesson.category))];
export function LessonLibrary() {
  const [category, setCategory] = useState("Semua");
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => lessons.filter((lesson) => (category === "Semua" || lesson.category === category) && `${lesson.title} ${lesson.summary} ${lesson.keywords.join(" ")}`.toLowerCase().includes(query.toLowerCase().trim())), [category, query]);
  return <div className="library"><div className="library-tools"><div className="category-tabs" role="group" aria-label="Kategori materi">{categories.map((item) => <button type="button" key={item} className={item === category ? "active" : ""} onClick={() => setCategory(item)} aria-pressed={item === category}>{item}</button>)}</div><label className="library-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari materi…" aria-label="Cari materi tajwid" /></label></div>{filtered.length ? <div className="lesson-list">{filtered.map((lesson, index) => <Link key={lesson.id} href={`/learn/${lesson.id}/`} className="lesson-row"><span className="lesson-number">{String(index + 1).padStart(2, "0")}</span><div><span className="eyebrow">{lesson.category}</span><h2>{lesson.title}</h2><p>{lesson.summary}</p></div><ArrowUpRight size={21} /></Link>)}</div> : <div className="library-empty"><strong>Materi belum ditemukan.</strong><p>Coba istilah lain atau pilih kategori Semua.</p></div>}</div>;
}
