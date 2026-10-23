/**
 * Complete Uthmani text from Tanzil Quran Text v1.0.2, CC BY 3.0.
 * Generated from the verbatim source in sources/ with scripts/generate-quran.py.
 * Basmala is displayed separately where Tanzil prefixes it to ayah 1;
 * the generator verifies that joining it reproduces the source line exactly.
 * Copyright notice and license: https://tanzil.net/docs/text_license.
 */
import quran from "./quran-full.json";

export type Verse = { number: number; text: string };
export type Surah = { number: number; name: string; arabicName: string; meaning: string; verses: readonly Verse[]; basmala?: string };

export const surahs: readonly Surah[] = quran;
export const getSurah = (number: number) => surahs[number - 1]?.number === number ? surahs[number - 1] : undefined;
export const getVerse = (surahNumber: number, ayahNumber: number) => getSurah(surahNumber)?.verses[ayahNumber - 1];
export const getWords = (value: string) => value.split(" ").filter(Boolean);
