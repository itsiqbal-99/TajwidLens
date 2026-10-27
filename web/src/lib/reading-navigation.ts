import learningJson from "@/data/learning-verses.json";
import examplesJson from "@/data/tajweed-examples.json";
import rulesJson from "@/data/tajweed-rules-generated.json";
import type { TajweedAnnotation, TajweedRule, TajweedVerse } from "@/data/tajweed-types";

export const learningVerses = learningJson as Record<string, TajweedVerse>;
export const indexedExamples = examplesJson;
const rules = rulesJson as Record<string, TajweedRule>;
const lessonCategories: Record<string, string[]> = {
  "nun-tanwin": ["ikhfa-haqiqi", "izhar-halqi", "idgham-bi-ghunnah", "idgham-bila-ghunnah", "iqlab"],
  "ikhfa-haqiqi": ["ikhfa-haqiqi"], "izhar-halqi": ["izhar-halqi"],
  "idgham-bighunnah": ["idgham-bi-ghunnah"], "idgham-bilaghunnah": ["idgham-bila-ghunnah"],
  iqlab: ["iqlab"], "mim-sukun": ["izhar-shafawi", "ikhfa-shafawi", "idgham-shafawi"],
  "ikhfa-syafawi": ["ikhfa-shafawi"], "idgham-mimi": ["idgham-shafawi"], "izhar-shafawi": ["izhar-shafawi"],
  ghunnah: ["mushaddadatan"], "mad-tabii": ["madd-tabee"], "mad-lazim": ["madd-lazim"],
  "tafkhim-tarqiq": ["raa-rules", "tafkheem-ranks"], qalqalah: ["qalqalah-ranks"],
};

export function relatedWords(text: string, annotation: TajweedAnnotation) {
  return [...text.matchAll(/\S+/gu)].filter((word) => word.index < annotation.end && word.index + word[0].length > annotation.start).map((word) => word[0]).join(" ");
}

export function annotationForLesson(verse: TajweedVerse, lesson: string, wordIndices?: readonly number[]) {
  // A teaching comparison has its own explicit ID; it is never relabelled as a corpus ruling.
  if ((lesson === "mad-arid" || lesson === "waqaf-ibtida") && verse === learningVerses["1:3"]) return "study:1:3:waqaf";
  const words = [...verse.text.matchAll(/\S+/gu)];
  return verse.annotations.find((item) => lessonCategories[lesson]?.includes(rules[item.ruleId]?.categoryId)
    && (!wordIndices || wordIndices.some((index) => words[index] && words[index].index < item.end && words[index].index + words[index][0].length > item.start)))?.id;
}

export function guideHref(surah: number, ayah: number, annotation?: string, lesson?: string) {
  const params = new URLSearchParams({ surah: String(surah), ayah: String(ayah) });
  if (annotation) params.set("annotation", annotation);
  if (lesson) params.set("lesson", lesson);
  return `/reading-guide/?${params}`;
}

export function lessonHref(lesson: { id: string; example: { surah: number; ayah: number }; focus: { wordIndices: readonly number[] } }) {
  if (lesson.id === "waqaf-ibtida") return guideHref(1, 3, "study:1:3:waqaf", lesson.id);
  const { surah, ayah } = lesson.example;
  const verse = learningVerses[`${surah}:${ayah}`];
  return guideHref(surah, ayah, verse ? annotationForLesson(verse, lesson.id, lesson.focus.wordIndices) : undefined, lesson.id);
}

export function resolveAnnotation(verse: TajweedVerse, requested: string | null, surah: number) {
  if (!requested) return null;
  if (verse.annotations.some((item) => item.id === requested)) return requested;
  if (surah === 1 && verse.number === 3 && ["study:1:3:waqaf", "1-3-1-mad-arid"].includes(requested)) return "study:1:3:waqaf";
  const legacy = requested.match(/^(\d+)-(\d+)-([\d-]+)-(.+)$/);
  if (!legacy || Number(legacy[1]) !== surah || Number(legacy[2]) !== verse.number) return null;
  return annotationForLesson(verse, legacy[4], legacy[3].split("-").map(Number)) ?? null;
}

export function primaryAnnotations(annotations: TajweedAnnotation[], selectedId?: string | null) {
  const advanced = ["ikhfa-ghunnah-quality", "idgham-kamil", "idgham-naqis", "tafkheem-ranks"];
  return annotations.filter((item) => item.id === selectedId || !advanced.includes(rules[item.ruleId]?.categoryId));
}

export const waqafStudy = {
  id: "study:1:3:waqaf",
  source: "https://download.understandquran.com/fileadmin/user_upload/courses/tajweed/english/Tajweed_Text_Book.pdf#page=24",
  sourceLabel: "Understand Al-Qur’an Academy · Learn Tajweed (2020), pelajaran 54a, hlm. 24",
  waqaf: { label: "Waqaf · berhenti", reading: "ar-raḥīm", hukum: "Mad ‘aridh lissukun", length: "2, 4, atau 6 harakat", explanation: "Saat berhenti dengan sukun penuh, mim akhir tidak dibaca dengan kasrah. Ya mad sebelum mim dapat dipanjangkan 2, 4, atau 6 harakat.", mistake: "Jangan menambahkan bunyi i setelah mim saat berhenti dengan sukun penuh." },
  wasal: { label: "Wasal · sambung", reading: "ar-raḥīmi māliki…", hukum: "Mad thabi’i", length: "2 harakat", explanation: "Saat menyambung ke مَٰلِكِ pada ayat berikutnya, kasrah mim tetap berbunyi. Ya mad pada الرَّحِيمِ dibaca dua harakat.", mistake: "Jangan menghilangkan kasrah mim saat menyambung ke ayat berikutnya." },
} as const;
