import type { Annotation } from "@/data/annotations";
import { getVerse, getWords } from "@/data/quran";

/** A deliberately limited, explainable scan of visible Uthmani signs (Hafs). */
type Letter = { base: string; marks: string };
const isBase = (value: string) => /[ء-غف-يٱ]/u.test(value);
const isMark = (value: string) => /\p{M}/u.test(value);
const hasSukun = (marks: string) => /[ْۡ]/u.test(marks);
const hasVowel = (marks: string) => /[ًٌٍَُِ]/u.test(marks);
const hasShadda = (marks: string) => marks.includes("ّ");
const tanwin = (marks: string) => /[ًٌٍ]/u.test(marks);
const pause = /[ۖۗۚۛۜۘۙ۞]/u;
const sun = new Set([..."تثدذرزسشصضطظلن"]);
const halqi = new Set([..."ءأإهعحغخ"]);
const ikhfa = new Set([..."تثجدذزسشصضطظفقك"]);
const qalqalah = new Set([..."قطبجد"]);
const hamza = new Set([..."ءأإؤئآ"]);

function letters(word: string): Letter[] {
  const result: Letter[] = [];
  for (const char of word) {
    if (isBase(char)) result.push({ base: char, marks: "" });
    else if (isMark(char) && result.length) result[result.length - 1].marks += char;
  }
  return result;
}

function nextLetter(groups: Letter[][], words: string[], wordIndex: number, letterIndex: number) {
  if (groups[wordIndex][letterIndex + 1]) return { letter: groups[wordIndex][letterIndex + 1], wordIndex };
  if (pause.test(words[wordIndex])) return null;
  for (let index = wordIndex + 1; index < groups.length; index++) {
    if (groups[index][0]) return { letter: groups[index][0], wordIndex: index };
    if (pause.test(words[index])) break;
  }
  return null;
}

function ruleForNun(next: string) {
  if (halqi.has(next)) return { id: "izhar-halqi", title: "Izhar halqi", action: "Baca bunyi n dengan jelas dari makhrajnya, tanpa menyamarkannya.", mistake: "Menyamarkan atau melebur bunyi n." };
  if (next === "ب") return { id: "iqlab", title: "Iqlab", action: "Ubah bunyi n menjadi mim samar dengan ghunnah sekitar dua harakat.", mistake: "Tetap mengucapkan n secara jelas sebelum ba." };
  if ("ينمو".includes(next)) return { id: "idgham-bighunnah", title: "Idgham bighunnah", action: "Leburkan bunyi n ke huruf berikutnya sambil berdengung sekitar dua harakat.", mistake: "Membaca n terpisah tanpa peleburan." };
  if ("لر".includes(next)) return { id: "idgham-bilaghunnah", title: "Idgham bila ghunnah", action: "Leburkan bunyi n ke lam atau ra tanpa menahan dengung.", mistake: "Menahan dengung sebelum lam atau ra." };
  if (ikhfa.has(next)) return { id: "ikhfa-haqiqi", title: "Ikhfa haqiqi", action: "Samarkan bunyi n dengan ghunnah sekitar dua harakat sebelum huruf berikutnya.", mistake: "Mengucapkan n terlalu jelas atau menghilangkan dengung." };
  return null;
}

function ruleForMim(next: string) {
  if (next === "ب") return { id: "ikhfa-syafawi", title: "Ikhfa syafawi", action: "Samarkan mim dengan ghunnah sekitar dua harakat sebelum ba.", mistake: "Membaca mim terlalu jelas atau tanpa dengung." };
  if (next === "م") return { id: "idgham-mimi", title: "Idgham mimi", action: "Leburkan mim pertama ke mim berikutnya dengan ghunnah.", mistake: "Memisahkan kedua mim seperti dua bunyi penuh." };
  return { id: "izhar-shafawi", title: "Izhar syafawi", action: "Baca mim dengan jelas sebelum huruf berikutnya.", mistake: "Menyamarkan mim atau menambahkan vokal setelahnya." };
}

function makeAnnotation(surah: number, ayah: number, index: number, occurrence: number, ruleId: string, title: string, trigger: string, explanation: string, guide: string, mistake: string, wordIndices: number[] = [index]): Annotation {
  return {
    id: `auto-${surah}-${ayah}-${index}-${occurrence}-${ruleId}`,
    surahNumber: surah, ayahNumber: ayah, wordIndices, ruleIds: [ruleId], title,
    triggerLetters: trigger, explanation, pronunciationGuide: guide, commonMistake: mistake,
    sourceReferences: ["Pemindaian tanda teks Utsmani Tanzil v1.0.2", "Understand Quran Academy, Reach the Goal via Tajweed Rule (1st ed.)"],
    reviewStatus: "automatic-unreviewed",
  };
}

export function detectTajwid(surah: number, ayah: number): Annotation[] {
  const verse = getVerse(surah, ayah);
  if (!verse) return [];
  const words = getWords(verse.text);
  const groups = words.map(letters);
  const result: Annotation[] = [];
  for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
    const group = groups[wordIndex];
    if (!group.length) continue;
    for (let letterIndex = 0; letterIndex < group.length; letterIndex++) {
      const current = group[letterIndex];
      let next = nextLetter(groups, words, wordIndex, letterIndex);
      const hasBareSukun = !hasVowel(current.marks) && !hasShadda(current.marks);
      const nSukun = current.base === "ن" && (hasSukun(current.marks) || hasBareSukun);
      const mSukun = current.base === "م" && (hasSukun(current.marks) || hasBareSukun);
      const isTanwin = tanwin(current.marks);
      // The final alif after fathatan is a spelling carrier, not the next
      // pronounced consonant in wasal (e.g. عُذْرًا أَوْ).
      if (isTanwin && next?.wordIndex === wordIndex && "اى".includes(next.letter.base) && !next.letter.marks && letterIndex + 2 === group.length) {
        next = nextLetter(groups, words, wordIndex, letterIndex + 1);
      }
      if ((nSukun || isTanwin || mSukun) && next) {
        const rule = mSukun ? ruleForMim(next.letter.base) : ruleForNun(next.letter.base);
        if (rule && !(next.wordIndex === wordIndex && rule.id.startsWith("idgham-"))) {
          const context = next.wordIndex === wordIndex ? "dalam kata ini" : "ketika disambung dengan kata berikutnya";
          const trigger = `${nSukun ? "نْ" : mSukun ? "مْ" : "tanwin"} + ${next.letter.base}`;
          result.push(makeAnnotation(surah, ayah, wordIndex, letterIndex, rule.id, rule.title, trigger,
            `${trigger} membentuk ${rule.title.toLowerCase()} ${context}. Hasil otomatis ini bergantung pada pembacaan bersambung dan tanda yang tertulis.`,
            rule.action, rule.mistake, next.wordIndex === wordIndex ? [wordIndex] : [wordIndex, next.wordIndex]));
        }
      }
      if (isTanwin && current.marks.includes("ً") && wordIndex === words.length - 1 && letterIndex + 2 === group.length && group[letterIndex + 1].base === "ا") {
        const item = makeAnnotation(surah, ayah, wordIndex, 300 + letterIndex, "waqaf-ibtida", "Mad iwadh saat waqaf", "fathatan + alif akhir",
          "Jika berhenti pada akhir ayat ini, bunyi tanwin fathah diganti dengan panjang a sekitar dua harakat. Jika disambung, bunyi n tanwin tetap mengikuti huruf sesudahnya.",
          "Saat waqaf, hilangkan bunyi n tanwin dan baca a sepanjang dua harakat.", "Tetap membunyikan n tanwin ketika berhenti.");
        item.waqafVariant = { label: "Berhenti", reading: "a panjang", explanation: "Tanwin fathah berubah menjadi mad iwadh.", harakat: "2" };
        item.wasalVariant = { label: "Disambung", reading: "tanwin dibaca", explanation: "Bunyi n tanwin mengikuti hukum pertemuan dengan huruf berikutnya." };
        result.push(item);
      }
      if ((current.base === "ن" || current.base === "م") && hasShadda(current.marks)) {
        result.push(makeAnnotation(surah, ayah, wordIndex, letterIndex, "ghunnah", "Ghunnah tasydid", `${current.base}ّ`,
          `${current.base} bertasydid dibaca dengan dengung sekitar dua harakat.`,
          "Tahan dengung dengan stabil melalui rongga hidung sebelum meneruskan bunyi.", "Melewati tasydid terlalu cepat tanpa dengung."));
      }
      if (qalqalah.has(current.base) && hasSukun(current.marks)) {
        result.push(makeAnnotation(surah, ayah, wordIndex, letterIndex, "qalqalah", "Qalqalah sukun", `${current.base}ْ`,
          `Huruf ${current.base} termasuk huruf qalqalah dan bertanda sukun.`,
          "Pantulkan bunyi singkat tanpa menambah vokal baru.", "Menambahkan bunyi a atau e setelah huruf sukun."));
      }
    }
    const bases = group.map((letter) => letter.base).join("");
    const alIndex = bases.indexOf("ٱل");
    if (alIndex >= 0 && group[alIndex + 2] && !bases.includes("ٱلله")) {
      const following = group[alIndex + 2].base;
      const isSun = sun.has(following);
      result.push(makeAnnotation(surah, ayah, wordIndex, 100, "lam-tarif", isSun ? "Lam syamsiyah" : "Lam qamariyah", `ٱل + ${following}`,
        isSun ? `Huruf ${following} termasuk huruf syamsiyah; lam pada ال melebur ke huruf sesudahnya.` : `Huruf ${following} termasuk huruf qamariyah; lam pada ال dibaca jelas.`,
        isSun ? "Baca huruf setelah lam dengan tasydid tanpa memisahkan bunyi lam." : "Jelaskan lam sebelum huruf berikutnya.",
        isSun ? "Membunyikan lam terpisah." : "Menghilangkan bunyi lam."));
    }
    for (let index = 0; index < group.length; index++) {
      const current = group[index];
      const previous = group[index - 1];
      const following = group[index + 1];
      const dagger = current.marks.includes("ٰ");
      const regular = previous && ((current.base === "ا" && previous.marks.includes("َ")) || (current.base === "و" && previous.marks.includes("ُ")) || ("يى".includes(current.base) && previous.marks.includes("ِ")));
      if (!dagger && !regular) continue;
      if (current.marks.includes("ٓ") || previous?.marks.includes("ٓ") || (following && (hamza.has(following.base) || hasSukun(following.marks) || hasShadda(following.marks)))) continue;
      const after = nextLetter(groups, words, wordIndex, index);
      if (after && after.wordIndex !== wordIndex && hamza.has(after.letter.base)) continue;
      result.push(makeAnnotation(surah, ayah, wordIndex, 200 + index, "mad-tabii", "Mad thabi'i", dagger ? "alif kecil" : `${previous?.base ?? ""} + ${current.base}`,
        "Tanda panjang alami tampak pada kata ini dan tidak langsung diikuti pemicu mad far'i yang terdeteksi oleh pemindai.",
        "Panjangkan vokal sekitar dua harakat saat disambung.", "Memendekkan vokal panjang atau memanjangkannya tanpa sebab."));
      break;
    }
  }
  return result;
}
