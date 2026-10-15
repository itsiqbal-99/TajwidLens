import indexJson from "@/data/tajweed-index.json";
import rulesJson from "@/data/tajweed-rules-generated.json";
import type { TajweedIndex, TajweedRule, TajweedSurahPayload } from "@/data/tajweed-types";
import { assetPath } from "@/lib/asset-path";

export const tajweedIndex = indexJson as TajweedIndex;
export const tajweedRules = rulesJson as Record<string, TajweedRule>;

const cache = new Map<number, Promise<TajweedSurahPayload>>();

async function sha256(bytes: ArrayBuffer) {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, "0")).join("");
}

function validatePayload(payload: TajweedSurahPayload, surah: number) {
  const summary = tajweedIndex.surahs.find((item) => item.number === surah);
  if (!summary || payload.surah.number !== surah || payload.verses.length !== summary.ayahCount) {
    throw new Error("Payload surah tidak sesuai dengan indeks sumber.");
  }

  for (const verse of payload.verses) {
    for (const annotation of verse.annotations) {
      if (!tajweedRules[annotation.ruleId]
        || annotation.start < 0
        || annotation.end > verse.text.length
        || annotation.start >= annotation.end
        || verse.text.slice(annotation.start, annotation.end) !== annotation.quote) {
        throw new Error(`Rentang anotasi tidak valid pada ${surah}:${verse.number}.`);
      }
    }
  }
  return payload;
}

export function loadTajweedSurah(surah: number): Promise<TajweedSurahPayload> {
  const existing = cache.get(surah);
  if (existing) return existing;

  const manifest = tajweedIndex.files.find((item) => item.surah === surah);
  if (!manifest) return Promise.reject(new Error("Surah tidak ditemukan pada indeks tajwid."));

  // Tie the browser cache key to the exact manifest entry. This prevents an
  // older, valid payload from being compared with a newly generated manifest.
  const payloadUrl = `${assetPath(`/data/tajweed/${manifest.file}`)}?v=${manifest.sha256.slice(0, 16)}`;
  const request = fetch(payloadUrl, { cache: "force-cache" })
    .then(async (response) => {
      if (!response.ok) throw new Error(`Gagal memuat data tajwid (${response.status}).`);
      const bytes = await response.arrayBuffer();
      if (bytes.byteLength !== manifest.bytes || await sha256(bytes) !== manifest.sha256) {
        throw new Error("Integritas data tajwid tidak cocok dengan manifest.");
      }
      return validatePayload(JSON.parse(new TextDecoder().decode(bytes)) as TajweedSurahPayload, surah);
    });

  cache.set(surah, request);
  request.catch(() => cache.delete(surah));
  return request;
}
