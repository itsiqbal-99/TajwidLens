import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { annotations, getAnnotation, getAnnotationText, getAnnotations, getRelatedAnnotations } from "./annotations";
import { lessons } from "./lessons";
import { getVerse, getWords, surahs } from "./quran";
import { searchContent } from "../lib/search";
import { getHukumLabel, getRuleHelp } from "../lib/tajweed-presentation";
import tajweedIndex from "./tajweed-index.json";
import tajweedRules from "./tajweed-rules-generated.json";
import {
  IDGHAM_BIGHUNNAH_LETTERS,
  IDGHAM_BILAGHUNNAH_LETTERS,
  IKHFA_HAQIQI_LETTERS,
  IQLAB_LETTERS,
  IZHAR_HALQI_LETTERS,
  MOON_LETTERS,
  QALQALAH_LETTERS,
  SUN_LETTERS,
} from "./tajwid-rules";

describe("konten bacaan", () => {
  it("menyimpan 114 surah dan 6.236 ayat sesuai sumber Tanzil", () => {
    expect(surahs).toHaveLength(114);
    expect(surahs.reduce((sum, surah) => sum + surah.verses.length, 0)).toBe(6236);
    const source = readFileSync("sources/tanzil-uthmani-v1.0.2.txt", "utf8").split(/\r?\n/).slice(0, 6236);
    expect(surahs.flatMap((surah) => surah.verses.map((verse) => verse.number === 1 && surah.basmala ? `${surah.basmala} ${verse.text}` : verse.text))).toEqual(source);
    for (const surah of surahs) surah.verses.forEach((verse, index) => {
      expect(verse.number).toBe(index + 1);
      expect(verse.text.trim().length).toBeGreaterThan(0);
    });
  });

  it("menautkan setiap anotasi ke indeks kata dan materi yang ada", () => {
    expect(new Set(annotations.map((item) => item.id)).size).toBe(annotations.length);
    expect(annotations.length).toBeGreaterThanOrEqual(25);
    for (const item of annotations) {
      const verse = getVerse(item.surahNumber, item.ayahNumber);
      expect(verse, item.id).toBeDefined();
      const words = getWords(verse!.text);
      expect(item.wordIndices.length).toBeGreaterThan(0);
      for (const index of item.wordIndices) expect(index, item.id).toBeGreaterThanOrEqual(0);
      for (const index of item.wordIndices) expect(index, item.id).toBeLessThan(words.length);
      expect(getAnnotationText(item)).toBe(item.wordIndices.map((index) => words[index]).join(" "));
      for (const rule of item.ruleIds) expect(lessons.some((lesson) => lesson.id === rule), `${item.id}: ${rule}`).toBe(true);
    }
  });

  it("memberi setiap materi pola, huruf, contoh, dan sorotan ayat yang valid", () => {
    expect(lessons).toHaveLength(24);
    for (const lesson of lessons) {
      expect(lesson.focus.label.trim(), lesson.id).not.toBe("");
      expect(lesson.focus.formula.trim(), lesson.id).not.toBe("");
      expect(lesson.focus.letters.length, lesson.id).toBeGreaterThan(0);
      expect(lesson.focus.sample.trim(), lesson.id).not.toBe("");
      expect(lesson.focus.explanation.trim(), lesson.id).not.toBe("");
      const verse = getVerse(lesson.example.surah, lesson.example.ayah);
      expect(verse, lesson.id).toBeDefined();
      const words = getWords(verse!.text);
      expect(lesson.focus.wordIndices.length, lesson.id).toBeGreaterThan(0);
      for (const index of lesson.focus.wordIndices) {
        expect(index, lesson.id).toBeGreaterThanOrEqual(0);
        expect(index, lesson.id).toBeLessThan(words.length);
      }
    }
  });

  it("menjaga kelompok huruf utama sesuai pembagian tajwid", () => {
    const nunAndTanwinGroups = [
      ...IZHAR_HALQI_LETTERS,
      ...IDGHAM_BIGHUNNAH_LETTERS,
      ...IDGHAM_BILAGHUNNAH_LETTERS,
      ...IQLAB_LETTERS,
      ...IKHFA_HAQIQI_LETTERS,
    ];
    expect(nunAndTanwinGroups).toHaveLength(28);
    expect(new Set(nunAndTanwinGroups).size).toBe(28);
    expect(IKHFA_HAQIQI_LETTERS).toHaveLength(15);
    expect(QALQALAH_LETTERS).toEqual(["ق", "ط", "ب", "ج", "د"]);
    expect(SUN_LETTERS).toHaveLength(14);
    expect(MOON_LETTERS).toHaveLength(14);
    expect(new Set([...SUN_LETTERS, ...MOON_LETTERS]).size).toBe(28);
  });

  it("menemukan contoh inti dan pencarian bahasa sehari-hari", () => {
    const example = annotations.find((item) => item.surahNumber === 113 && item.ayahNumber === 2 && item.ruleIds.includes("ikhfa-haqiqi"));
    expect(example).toBeDefined();
    expect(getAnnotationText(example!)).toBe("مِن شَرِّ");
    expect(getRelatedAnnotations(example!).every((item) => item.ruleIds[0] === "ikhfa-haqiqi")).toBe(true);
    expect(searchContent("kenapa harus dengung").some((result) => result.href.includes("ikhfa-haqiqi"))).toBe(true);
    expect(searchContent("mad thabi'i").some((result) => result.href.includes("mad-tabii"))).toBe(true);
  });

  it("tidak lagi membuat anotasi otomatis di browser", () => {
    expect(getAnnotations(2, 2)).toEqual([]);
    expect(getAnnotation("auto-2-2-0-1-lam-tarif")).toBeUndefined();
  });

  it("mencatat korpus tajwid prahitung dan kebijakan penolakan secara eksplisit", () => {
    expect(tajweedIndex.counts.accepted).toBe(143049);
    expect(tajweedIndex.rejectedAyahs).toEqual(["11:41", "27:20", "36:22", "52:37"]);
    expect(tajweedIndex.surahs.reduce((sum, surah) => sum + surah.ayahCount, 0)).toBe(6236);
    expect(Object.keys(tajweedRules)).toHaveLength(152);
  });

  it("memberi semua hukum nama dan petunjuk yang ramah pemula Indonesia", () => {
    for (const rule of Object.values(tajweedRules)) {
      expect(getHukumLabel(rule)).not.toBe("Hukum Tajwid Lanjutan");
      expect(getRuleHelp(rule).summary.length).toBeGreaterThan(15);
      expect(getRuleHelp(rule).reading.length).toBeGreaterThan(20);
      expect(getRuleHelp(rule).trigger.length).toBeGreaterThan(15);
    }
  });
});
