import { annotations, getAnnotationText } from "@/data/annotations";
import { lessons } from "@/data/lessons";
import { getSurah, surahs } from "@/data/quran";

export type SearchResult = { id: string; kind: "Materi" | "Contoh ayat" | "Surah"; title: string; description: string; href: string; score: number };
const clean = (value: string) => value.toLowerCase().normalize("NFKD").replace(/[\u064b-\u065f\u0670\u06d6-\u06ed]/g, "").replace(/[^\p{L}\p{N}:]+/gu, " ").trim();
const aliases: Record<string, string> = { dengung: "ghunnah ikhfa nun tanwin", "nun mati": "nun sukun", "mim mati": "mim sukun", panjang: "mad harakat", berhenti: "waqaf", sambung: "wasal", "huruf tidak dibaca": "lam syamsiyah hamzatul wasl" };

export function searchContent(query: string): SearchResult[] {
  const normalized = clean(query);
  if (!normalized) return [];
  const terms = normalized.split(" ").filter((term) => term.length > 1);
  const expanded = `${normalized} ${Object.entries(aliases).filter(([key]) => normalized.includes(key)).map(([, value]) => value).join(" ")}`;
  const expandedTerms = [...new Set(clean(expanded).split(" ").filter((term) => term.length > 1))];
  const score = (value: string, title: string) => {
    const haystack = clean(value);
    const heading = clean(title);
    let result = haystack.includes(normalized) ? 12 : 0;
    for (const term of expandedTerms) if (haystack.includes(term)) result += terms.includes(term) ? 3 : 1;
    if (heading.includes(normalized)) result += 8;
    return result;
  };
  const results: SearchResult[] = [];
  for (const lesson of lessons) {
    const found = score(`${lesson.title} ${lesson.summary} ${lesson.detail} ${lesson.keywords.join(" ")} ${lesson.condition} ${lesson.pronunciation}`, lesson.title);
    if (found > 0) results.push({ id: `lesson-${lesson.id}`, kind: "Materi", title: lesson.title, description: lesson.summary, href: `/learn/${lesson.id}/`, score: found });
  }
  for (const item of annotations) {
    const title = `${getSurah(item.surahNumber)?.name} ${item.ayahNumber} · ${item.title}`;
    const found = score(`${title} ayat ${item.ayahNumber} ${item.surahNumber}:${item.ayahNumber} ${getAnnotationText(item)} ${item.explanation} ${item.pronunciationGuide}`, title);
    if (found > 0) results.push({ id: item.id, kind: "Contoh ayat", title, description: item.explanation, href: `/reading-guide/?surah=${item.surahNumber}&ayah=${item.ayahNumber}&annotation=${item.id}`, score: found });
  }
  for (const surah of surahs) {
    const found = score(`${surah.number} ${surah.name} ${surah.arabicName} ${surah.meaning}`, surah.name);
    if (found > 0) results.push({ id: `surah-${surah.number}`, kind: "Surah", title: `${surah.number}. ${surah.name}`, description: `${surah.arabicName} · ${surah.verses.length} ayat tersedia`, href: `/explore/?surah=${surah.number}&ayah=1`, score: found });
  }
  return results.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title)).slice(0, 12);
}
