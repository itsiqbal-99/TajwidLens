import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { lessons } from "@/data/lessons";
import { TajweedText } from "@/components/tajweed-text";
import { WaqafComparison } from "@/components/waqaf-comparison";
import { tajweedRules } from "./tajweed-data";
import { getAnnotationHelp } from "./tajweed-presentation";
import { indexedExamples, learningVerses, lessonHref, primaryAnnotations, relatedWords, resolveAnnotation, waqafStudy } from "./reading-navigation";
import { searchContent } from "./search";
import type { TajweedSurahPayload } from "@/data/tajweed-types";

describe("reading links and verified examples", () => {
  it("resolves old links by law AND location, never selecting a different law", () => {
    const verse = learningVerses["113:2"];
    expect(resolveAnnotation(verse, "113-2-0-1-ikhfa-haqiqi", 113)).toBe("113:2:1");
    expect(resolveAnnotation(verse, "113-2-0-1-lam-tarif", 113)).toBeNull();
    expect(resolveAnnotation(verse, "112-2-0-1-ikhfa-haqiqi", 113)).toBeNull();
    expect(resolveAnnotation(verse, "113:2:2", 113)).toBe("113:2:2");
    expect(resolveAnnotation(learningVerses["1:3"], "1-3-1-mad-arid", 1)).toBe(waqafStudy.id);
  });

  it("links every supported lesson to an annotation in the actual displayed verse", () => {
    for (const lesson of lessons) {
      const url = new URL(lessonHref(lesson), "https://example.test");
      const surah = Number(url.searchParams.get("surah"));
      const ayah = Number(url.searchParams.get("ayah"));
      const annotation = url.searchParams.get("annotation");
      if (annotation) expect(resolveAnnotation(learningVerses[`${surah}:${ayah}`], annotation, surah), lesson.id).toBe(annotation);
      else expect(url.searchParams.get("lesson")).toBe(lesson.id);
    }
    expect(new URL(lessonHref(lessons.find((item) => item.id === "ikhfa-haqiqi")!), "https://example.test").searchParams.get("annotation")).toBe("113:2:1");
  });

  it("keeps the learning edition, quotes, basmala, and search IDs aligned with runtime data", () => {
    const payloads = new Map<number, TajweedSurahPayload>();
    const payload = (surah: number) => {
      if (!payloads.has(surah)) payloads.set(surah, JSON.parse(readFileSync(`public/data/tajweed/${surah}.json`, "utf8")));
      return payloads.get(surah)!;
    };
    for (const [ref, verse] of Object.entries(learningVerses)) {
      const [surah, ayah] = ref.split(":").map(Number);
      expect(verse).toEqual(payload(surah).verses[ayah - 1]);
    }
    for (const example of indexedExamples) {
      const verse = payload(example.surah).verses[example.ayah - 1];
      const annotation = verse.annotations.find((item) => item.id === example.id);
      expect(annotation?.quote).toBe(example.quote);
      expect(annotation?.ruleId).toBe(example.ruleId);
      expect(relatedWords(verse.text, annotation!)).toBe(example.words);
    }
    expect(payload(1).surah.basmala).toBeUndefined();
    expect(payload(9).surah.basmala).toBeUndefined();
    expect(payload(113).surah.basmala).toBe(payload(1).verses[0].text);
  });

  it("keeps interaction and exact Quran text when colors are off", () => {
    const verse = learningVerses["113:2"];
    const markup = (visible: boolean) => renderToStaticMarkup(createElement(TajweedText, { ...verse, rules: tajweedRules, selectedId: null, visible, fontSize: 40, onSelect: () => {} }));
    const colored = markup(true); const plain = markup(false);
    expect((plain.match(/role="button"/g) ?? []).length).toBe((colored.match(/role="button"/g) ?? []).length);
    expect(plain).not.toContain("linear-gradient");
    expect(plain).toContain('tabindex="0"');
    expect(plain).toContain('aria-label="ن شَ;');
    expect(plain.replace(/<[^>]*>/g, "")).toBe(verse.text);
  });

  it("prioritizes primary rules while retaining an explicitly selected advanced rule", () => {
    const verse = learningVerses["113:2"];
    expect(primaryAnnotations(verse.annotations).map((item) => item.id)).toContain("113:2:1");
    expect(primaryAnnotations(verse.annotations).map((item) => item.id)).not.toContain("113:2:0");
    expect(primaryAnnotations(verse.annotations, "113:2:0").map((item) => item.id)).toContain("113:2:0");
    const item = verse.annotations.find((item) => item.id === "113:2:1")!;
    expect(getAnnotationHelp(tajweedRules[item.ruleId], item).reason).toContain("bertemu ش");
  });

  it("finds conversational queries, exact references, and the explicit waqaf comparison", () => {
    expect(searchContent("kenapa harus dengung").some((item) => item.kind === "Contoh ayat")).toBe(true);
    expect(searchContent("n jadi m").some((item) => item.title.toLowerCase().includes("iqlab"))).toBe(true);
    expect(searchContent("2:255")[0].href).toBe("/reading-guide/?surah=2&ayah=255");
    expect(searchContent("berhenti di akhir ayat")[0].href).toContain("study%3A1%3A3%3Awaqaf");
    expect(searchContent("zzzzqwerty")).toEqual([]);
    const comparison = renderToStaticMarkup(createElement(WaqafComparison));
    expect(comparison).toContain(waqafStudy.source);
    expect(comparison).toContain("2, 4, atau 6 harakat");
    expect(waqafStudy.wasal.length).toBe("2 harakat");
  });
});
