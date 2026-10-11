import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { annotations, getAnnotation, getAnnotationText, getAnnotations, getRelatedAnnotations } from "./annotations";
import { lessons } from "./lessons";
import { getVerse, getWords, surahs } from "./quran";
import { searchContent } from "../lib/search";

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

  it("menemukan contoh inti dan pencarian bahasa sehari-hari", () => {
    const example = annotations.find((item) => item.surahNumber === 113 && item.ayahNumber === 2 && item.ruleIds.includes("ikhfa-haqiqi"));
    expect(example).toBeDefined();
    expect(getAnnotationText(example!)).toBe("مِن شَرِّ");
    expect(getRelatedAnnotations(example!).every((item) => item.ruleIds[0] === "ikhfa-haqiqi")).toBe(true);
    expect(searchContent("kenapa harus dengung").some((result) => result.href.includes("ikhfa-haqiqi"))).toBe(true);
    expect(searchContent("mad thabi'i").some((result) => result.href.includes("mad-tabii"))).toBe(true);
  });

  it("memindai hukum pada ayat di luar contoh manual dengan tautan yang dapat dibuka", () => {
    const results = getAnnotations(2, 2);
    expect(results.some((item) => item.reviewStatus === "automatic-unreviewed")).toBe(true);
    expect(results.some((item) => item.ruleIds[0] === "lam-tarif")).toBe(true);
    expect(results.some((item) => item.ruleIds[0] === "idgham-bilaghunnah" && item.wordIndices.includes(7))).toBe(true);
    for (const item of results) {
      expect(getAnnotation(item.id)).toEqual(item);
      for (const index of item.wordIndices) expect(index).toBeLessThan(getWords(getVerse(2, 2)!.text).length);
    }
  });

  it("memindai seluruh ayat tanpa indeks kata yang keluar batas", () => {
    let scanned = 0;
    let withoutFinding = 0;
    for (const surah of surahs) for (const verse of surah.verses) {
      const results = getAnnotations(surah.number, verse.number);
      const words = getWords(verse.text);
      if (!results.length) withoutFinding++;
      for (const item of results) for (const index of item.wordIndices) expect(index).toBeLessThan(words.length);
      scanned++;
    }
    expect(scanned).toBe(6236);
    expect(withoutFinding).toBeLessThan(50);
  }, 15000);
});
