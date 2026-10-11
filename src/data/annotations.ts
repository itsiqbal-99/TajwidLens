import { getWords, getVerse } from "./quran";
import { detectTajwid } from "@/lib/tajwid-detector";

export type ReadingVariant = { label: string; reading: string; explanation: string; harakat?: string };
export type Annotation = {
  id: string;
  surahNumber: number;
  ayahNumber: number;
  wordIndices: readonly number[];
  ruleIds: readonly string[];
  title: string;
  triggerLetters: string;
  explanation: string;
  pronunciationGuide: string;
  commonMistake: string;
  waqafVariant?: ReadingVariant;
  wasalVariant?: ReadingVariant;
  sourceReferences: readonly string[];
  reviewStatus: "editorial-unreviewed" | "automatic-unreviewed";
};

const sourceReferences = ["Tanzil Quran Text v1.0.2", "Understand Quran Academy, Reach the Goal via Tajweed Rule (1st ed.)"] as const;
const note = (surahNumber: number, ayahNumber: number, wordIndices: number[], ruleIds: string[], title: string, triggerLetters: string, explanation: string, pronunciationGuide: string, commonMistake: string, variants?: { waqafVariant?: ReadingVariant; wasalVariant?: ReadingVariant }): Annotation => ({
  id: `${surahNumber}-${ayahNumber}-${wordIndices.join("-")}-${ruleIds[0]}`,
  surahNumber, ayahNumber, wordIndices, ruleIds, title, triggerLetters, explanation, pronunciationGuide, commonMistake,
  sourceReferences, reviewStatus: "editorial-unreviewed", ...variants,
});

const ikhfa = (surah: number, ayah: number) => note(surah, ayah, [0, 1], ["ikhfa-haqiqi", "nun-tanwin"], "Nun sukun bertemu syin", "نْ + ش", "Nun sukun pada مِنْ bertemu syin pada شَرِّ ketika dua kata ini disambung. Karena syin termasuk huruf ikhfa, bunyi nun disamarkan dengan ghunnah.", "Tahan dengung sekitar dua harakat, lalu masuk ke bunyi syin. Jangan ucapkan nun terlalu jelas.", "Membaca 'min syarri' dengan n yang sepenuhnya jelas atau tanpa dengung.");
const izharTanwin = (surah: number, ayah: number, index: number) => note(surah, ayah, [index, index + 1], ["izhar-halqi", "nun-tanwin"], "Tanwin bertemu hamzah", "ـٍ + إ", "Tanwin pada kata sebelumnya bertemu hamzah pada إِذَا. Hamzah termasuk huruf halqi; bunyi n pada tanwin dibaca jelas saat wasal.", "Jelaskan bunyi n tanwin, lalu ucapkan hamzah dari tenggorokan tanpa menyamarkannya.", "Mendengungkan tanwin seperti ikhfa.");
const qalqalahStop = (surah: number, ayah: number, index: number, letter: string) => note(surah, ayah, [index], ["qalqalah", "waqaf-ibtida"], "Qalqalah saat berhenti", `${letter} menjadi sukun saat waqaf`, `Ketika berhenti pada akhir ayat ini, huruf ${letter} menjadi sukun sementara. Karena termasuk huruf qalqalah, bunyinya memantul ringan. Hukum ini bergantung pada pilihan waqaf.`, "Hentikan bunyi pada huruf akhir dengan pantulan singkat; jangan tambahkan vokal baru.", "Menambahkan bunyi a setelah huruf yang dipantulkan.", {
  waqafVariant: { label: "Berhenti", reading: "Huruf akhir disukunkan", explanation: `Huruf ${letter} dibaca sukun dengan pantulan qalqalah. Perhatikan juga kelayakan tempat berhenti menurut makna.`, harakat: "Sukun karena waqaf" },
  wasalVariant: { label: "Disambung", reading: "Harakat akhir tetap dibaca", explanation: `Jika disambung, huruf ${letter} mengikuti harakat tertulisnya; pantulan karena waqaf tidak muncul.`, harakat: "Harakat asal" },
});

export const annotations: readonly Annotation[] = [
  note(1, 1, [2], ["lam-tarif"], "Lam syamsiyah", "ال + ر", "Lam pada ٱلرَّحْمَٰنِ melebur ke ra yang bertasydid.", "Mulai dari ra bertasydid setelah hamzatul wasl bila memulai dari kata ini.", "Membunyikan lam secara jelas."),
  note(1, 1, [3], ["mad-arid", "waqaf-ibtida"], "Mad saat akhir ayat", "ي mad + mim akhir", "Pada akhir ayat, mim pada ٱلرَّحِيمِ menjadi sukun saat waqaf sehingga muncul mad 'aridh lissukun.", "Saat waqaf pilih panjang 2, 4, atau 6 harakat secara konsisten; saat wasal baca mad alami dua harakat.", "Menganggap panjang waqaf berlaku juga saat menyambung.", {
    waqafVariant: { label: "Berhenti", reading: "ar-raḥīm", explanation: "Mim akhir menjadi sukun; ya mad sebelum mim dapat dipanjangkan 2, 4, atau 6 harakat.", harakat: "2 / 4 / 6" },
    wasalVariant: { label: "Disambung", reading: "ar-raḥīmi", explanation: "Kasrah mim tetap dibaca dan mad kembali ke panjang alami dua harakat.", harakat: "2" },
  }),
  note(1, 2, [0], ["lam-tarif"], "Lam qamariyah", "ال + ح", "Huruf ha (ح) setelah ال termasuk huruf qamariyah sehingga lam dibaca jelas.", "Ucapkan lam sebelum masuk ke ha tenggorokan.", "Menghilangkan bunyi lam."),
  note(1, 2, [3], ["mad-arid"], "Mad ketika waqaf", "ي mad + nun akhir", "Nun akhir ٱلْعَٰلَمِينَ menjadi sukun saat berhenti, sehingga mad sebelum nun dapat dipanjangkan 2, 4, atau 6 harakat.", "Saat berhenti, panjangkan vokal i dengan panjang yang dipilih secara konsisten.", "Membaca panjang waqaf secara acak."),
  note(1, 3, [0], ["lam-tarif"], "Lam syamsiyah", "ال + ر", "Lam pada ٱلرَّحْمَٰنِ melebur ke ra yang bertasydid.", "Baca ra bertasydid; lam tidak dibunyikan terpisah.", "Membaca lam secara jelas."),
  note(1, 3, [1], ["mad-arid", "waqaf-ibtida"], "Berhenti atau sambung pada ٱلرَّحِيمِ", "ي mad + mim akhir", "Mim akhir memperoleh sukun sementara saat waqaf. Ini mengubah mad alami menjadi mad 'aridh lissukun.", "Saat waqaf pilih 2, 4, atau 6 harakat; saat disambung baca kasrah mim dengan mad dua harakat.", "Menghilangkan kasrah mim ketika menyambung.", {
    waqafVariant: { label: "Berhenti", reading: "ar-raḥīm", explanation: "Mim akhir disukunkan; ya mad dapat dipanjangkan 2, 4, atau 6 harakat.", harakat: "2 / 4 / 6" },
    wasalVariant: { label: "Disambung", reading: "ar-raḥīmi", explanation: "Mim tetap berkasrah ketika ayat disambung. Panjang ya mad kembali dua harakat.", harakat: "2" },
  }),
  note(1, 4, [0], ["mad-tabii"], "Mad alami pada مَٰلِكِ", "fathah + alif kecil", "Alif kecil setelah mim menandai vokal a panjang alami; tidak ada hamzah atau sukun setelah huruf mad pada bagian ini.", "Panjangkan ma dua harakat.", "Membaca ma pendek atau terlalu panjang."),
  note(1, 4, [2], ["lam-tarif"], "Lam syamsiyah", "ال + د", "Dal sesudah ال adalah huruf syamsiyah; lam melebur ke dal bertasydid.", "Baca dal bertasydid tanpa lam yang terpisah.", "Membunyikan lam sebelum dal."),
  note(1, 5, [3], ["mad-tabii"], "Mad alami", "ي mad", "Pada نَسْتَعِينُ, ya mad memanjangkan bunyi i secara alami dua harakat saat disambung.", "Jaga bunyi i panjang dua harakat.", "Memendekkan ya mad."),
  note(1, 6, [1], ["lam-tarif"], "Lam syamsiyah", "ال + ص", "Lam pada ٱلصِّرَٰطَ melebur ke sad yang bertasydid.", "Baca sad bertasydid dengan kualitas tebalnya.", "Membunyikan lam atau menipiskan sad."),
  note(1, 7, [8], ["mad-lazim"], "Mad lazim kalimi mutsaqqal", "ا mad + لّ", "Dalam ٱلضَّآلِّينَ, alif mad diikuti lam bertasydid di satu kata. Panjangnya enam harakat.", "Tahan mad enam harakat sebelum lam bertasydid.", "Membacanya hanya dua harakat."),
  qalqalahStop(112, 1, 3, "د"),
  note(112, 2, [1], ["lam-tarif"], "Lam syamsiyah", "ال + ص", "Lam pada ٱلصَّمَدُ melebur ke sad bertasydid.", "Baca sad tebal dengan tasydid; tidak ada bunyi lam tersendiri.", "Membunyikan lam sebelum sad."),
  qalqalahStop(112, 2, 1, "د"),
  note(112, 3, [0, 1], ["izhar-shafawi", "mim-sukun"], "Mim sukun bertemu ya", "مْ + ي", "Mim sukun pada لَمْ bertemu ya pada يَلِدْ. Karena bukan ba atau mim, mim dibaca jelas (izhar syafawi).", "Tutup kedua bibir untuk mim, lalu beralih ke ya tanpa menambah vokal.", "Menyamarkan mim atau menambah bunyi 'e'."),
  note(112, 3, [2, 3], ["izhar-shafawi", "mim-sukun"], "Mim sukun bertemu ya", "مْ + ي", "Mim sukun pada وَلَمْ bertemu ya pada يُولَدْ dan dibaca jelas.", "Ucapkan mim dengan kedua bibir sebelum ya.", "Menambah vokal setelah mim."),
  note(112, 3, [1], ["qalqalah"], "Dal sukun", "دْ", "Dal pada يَلِدْ bersukun dan termasuk huruf qalqalah.", "Pantulkan dal singkat tanpa menambah vokal.", "Membaca 'yalida'."),
  note(112, 4, [1, 2], ["idgham-bilaghunnah", "nun-tanwin"], "Nun sukun bertemu lam", "نْ + ل", "Nun sukun pada يَكُن bertemu lam pada لَّهُۥ. Bunyi nun melebur ke lam tanpa ghunnah dua harakat.", "Masuk langsung ke lam bertasydid tanpa menahan dengung nun.", "Mendengungkan nun dua harakat."),
  qalqalahStop(112, 4, 4, "د"),
  note(113, 1, [3], ["lam-tarif"], "Lam qamariyah", "ال + ف", "Fa sesudah ال adalah huruf qamariyah; lam pada ٱلْفَلَقِ dibaca jelas.", "Jelaskan lam sebelum fa.", "Meleburkan lam ke fa."),
  qalqalahStop(113, 1, 3, "ق"),
  ikhfa(113, 2),
  qalqalahStop(113, 2, 3, "ق"),
  ikhfa(113, 3),
  izharTanwin(113, 3, 2),
  qalqalahStop(113, 3, 4, "ب"),
  ikhfa(113, 4),
  note(113, 4, [2], ["ghunnah"], "Nun bertasydid", "نّ", "Nun bertasydid pada ٱلنَّفَّٰثَٰتِ dibaca dengan ghunnah dua harakat.", "Tahan dengung melalui rongga hidung sebelum meneruskan kata.", "Membaca nun bertasydid terlalu cepat."),
  qalqalahStop(113, 4, 4, "د"),
  ikhfa(113, 5),
  izharTanwin(113, 5, 2),
  qalqalahStop(113, 5, 4, "د"),
  note(114, 1, [3], ["lam-tarif", "hamzatul-wasl"], "Lam syamsiyah pada ٱلنَّاسِ", "ال + ن", "Lam ال melebur ke nun bertasydid. Hamzatul wasl di awal kata dibaca ketika memulai, dan gugur ketika disambung dari kata sebelumnya.", "Baca nun bertasydid dengan ghunnah yang tepat; jangan ucapkan lam secara terpisah.", "Membunyikan lam saat membaca an-nas."),
  note(114, 2, [1], ["lam-tarif"], "Lam syamsiyah", "ال + ن", "Lam pada ٱلنَّاسِ melebur ke nun bertasydid.", "Baca nun dengan tasydid dan ghunnah.", "Membunyikan lam."),
  note(114, 3, [0], ["mad-tabii"], "Mad alami", "alif kecil", "Alif kecil pada إِلَٰهِ menandai panjang a alami.", "Panjangkan la dua harakat.", "Memendekkan alif kecil."),
  ikhfa(114, 4),
  note(114, 4, [3], ["ghunnah"], "Ghunnah nun tasydid", "نّ", "Nun bertasydid dalam ٱلْخَنَّاسِ dibaca dengan dengung dua harakat.", "Tahan dengung melalui rongga hidung secara stabil.", "Melewati nun tasydid tanpa dengung."),
  note(114, 5, [4], ["lam-tarif"], "Lam syamsiyah", "ال + ن", "Lam pada ٱلنَّاسِ melebur ke nun yang bertasydid.", "Baca nun bertasydid tanpa mengucapkan lam.", "Membunyikan lam secara terpisah."),
  note(114, 6, [1], ["lam-tarif"], "Lam qamariyah", "ال + ج", "Jim sesudah ال pada ٱلْجِنَّةِ termasuk huruf qamariyah; lam dibaca jelas.", "Jelaskan lam sebelum jim.", "Meleburkan lam ke jim."),
];

const detectedCache = new Map<string, readonly Annotation[]>();
export const getAnnotations = (surah: number, ayah: number): readonly Annotation[] => {
  const curated = annotations.filter((item) => item.surahNumber === surah && item.ayahNumber === ayah);
  const key = `${surah}:${ayah}`;
  let detected = detectedCache.get(key);
  if (!detected) {
    detected = detectTajwid(surah, ayah);
    detectedCache.set(key, detected);
  }
  return [...curated, ...detected.filter((candidate) => !curated.some((item) => item.ruleIds[0] === candidate.ruleIds[0] && item.wordIndices.some((index) => candidate.wordIndices.includes(index))))];
};
export const getAnnotation = (id: string) => {
  const curated = annotations.find((item) => item.id === id);
  if (curated) return curated;
  const match = /^auto-(\d+)-(\d+)-\d+-\d+-[\w-]+$/.exec(id);
  return match ? getAnnotations(Number(match[1]), Number(match[2])).find((item) => item.id === id) : undefined;
};
export const getAnnotationText = (item: Annotation) => {
  const verse = getVerse(item.surahNumber, item.ayahNumber);
  return verse ? item.wordIndices.map((index) => getWords(verse.text)[index]).join(" ") : "";
};
export const getRelatedAnnotations = (item: Annotation, count = 3) => annotations.filter((candidate) => candidate.id !== item.id && candidate.ruleIds[0] === item.ruleIds[0]).slice(0, count);
