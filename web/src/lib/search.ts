import { lessons } from "@/data/lessons";
import { tajweedIndex, tajweedRules } from "./tajweed-data";
import { annotationForLesson, guideHref, indexedExamples, learningVerses, waqafStudy } from "./reading-navigation";
import { getHukumLabel, getRuleHelp } from "./tajweed-presentation";

export type SearchResult = { id: string; kind: "Materi" | "Contoh ayat" | "Surah"; title: string; description: string; href: string; score: number };
const clean = (value: string) => value.toLowerCase().normalize("NFKD").replace(/[\u064b-\u065f\u0670\u06d6-\u06ed]/g, "").replace(/[^\p{L}\p{N}:]+/gu, " ").trim();
const aliases: Record<string, string> = { dengung: "ghunnah ikhfa nun tanwin", "nun mati": "nun sukun", "mim mati": "mim sukun", panjang: "mad harakat", berhenti: "waqaf", stop: "waqaf", sambung: "wasal", menyambung: "wasal", pantul: "qalqalah", tebal: "tafkhim", tipis: "tarqiq", "huruf tidak dibaca": "lam syamsiyah hamzatul wasl", "berapa ketukan": "mad harakat", "n jadi m": "iqlab", "n ketemu b": "iqlab", "m ketemu b": "ikhfa syafawi" };

export function searchContent(query: string): SearchResult[] {
  const normalized = clean(query);
  if (!normalized) return [];
  const stopwords = new Set(["kenapa", "mengapa", "bagaimana", "gimana", "cara", "harus", "yang", "itu", "ini", "saya", "kok", "apa", "di", "bisa", "dibaca"]);
  const terms = normalized.split(" ").filter((term) => term.length > 1 && !stopwords.has(term));
  const expanded = `${normalized} ${Object.entries(aliases).filter(([key]) => normalized.includes(key)).map(([, value]) => value).join(" ")}`;
  const expandedTerms = [...new Set(clean(expanded).split(" ").filter((term) => term.length > 1 && !stopwords.has(term)))];
  const score = (value: string, title: string) => {
    const haystack = clean(value);
    const heading = clean(title);
    let result = haystack.includes(normalized) ? 12 : 0;
    for (const term of expandedTerms) if (haystack.includes(term)) result += terms.includes(term) ? 3 : 1;
    if (heading.includes(normalized)) result += 8;
    return result;
  };
  const results: SearchResult[] = [];
  const reference = normalized.match(/^(\d{1,3})\s*[: ]\s*(\d{1,3})$/);
  if (reference) {
    const surah = tajweedIndex.surahs.find((item) => item.number === Number(reference[1]));
    const ayah = Number(reference[2]);
    if (surah && ayah >= 1 && ayah <= surah.ayahCount) results.push({ id: "exact-ayah", kind: "Contoh ayat", title: `${surah.name} · Ayat ${ayah}`, description: "Buka ayat dan pilih hukum yang ingin dipahami.", href: guideHref(surah.number, ayah), score: 100 });
  }
  for (const lesson of lessons) {
    const found = score(`${lesson.title} ${lesson.summary} ${lesson.detail} ${lesson.keywords.join(" ")} ${lesson.condition} ${lesson.pronunciation}`, lesson.title);
    if (found > 0) results.push({ id: `lesson-${lesson.id}`, kind: "Materi", title: lesson.title, description: lesson.summary, href: `/learn/${lesson.id}/`, score: found });
  }
  const examples = [...indexedExamples];
  for (const lesson of lessons) {
    const verse = learningVerses[`${lesson.example.surah}:${lesson.example.ayah}`];
    const id = verse && annotationForLesson(verse, lesson.id, lesson.focus.wordIndices);
    const item = verse?.annotations.find((annotation) => annotation.id === id);
    if (item && !examples.some((candidate) => candidate.id === item.id)) examples.push({ ...item, surah: lesson.example.surah, ayah: lesson.example.ayah, words: lesson.focus.sample });
  }
  for (const item of examples) {
    const rule = tajweedRules[item.ruleId]; const help = getRuleHelp(rule);
    const title = `${tajweedIndex.surahs[item.surah - 1].name} ${item.ayah} · ${getHukumLabel(rule)}`;
    const found = score(`${title} ${item.surah}:${item.ayah} ${item.words} ${help.summary} ${help.trigger}`, title);
    if (found > 0) results.push({ id: item.id, kind: "Contoh ayat", title, description: `${item.words} — ${help.summary}`, href: guideHref(item.surah, item.ayah, item.id), score: found });
  }
  if (/waqaf|wasal/.test(expanded)) results.push({ id: waqafStudy.id, kind: "Contoh ayat", title: "Al-Fatihah 3 · Berhenti atau sambung", description: "Bandingkan bunyi mim akhir dan panjang mad dalam dua mode.", href: guideHref(1, 3, waqafStudy.id), score: 40 });
  for (const surah of tajweedIndex.surahs) {
    const found = score(`${surah.number} ${surah.name} ${surah.arabicName} ${surah.meaning}`, surah.name);
    if (found > 0) results.push({ id: `surah-${surah.number}`, kind: "Surah", title: `${surah.number}. ${surah.name}`, description: `${surah.arabicName} · ${surah.ayahCount} ayat tersedia`, href: `/explore/?surah=${surah.number}&ayah=1`, score: found });
  }
  return results.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title)).slice(0, 12);
}
