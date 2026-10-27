export type Letter = { glyph: string; name: string; makhraj: string; instruction: string; sifat: string; compare?: string; example?: string };
const throatFar = "Tenggorokan bagian bawah";
const throatMid = "Tenggorokan bagian tengah";
const throatNear = "Tenggorokan bagian atas";
const tongue = "Lidah";
const lips = "Bibir";
const ordinary = "Perhatikan tempat keluar bunyinya; rincian sifat dipelajari bertahap bersama guru.";

export const letters: readonly Letter[] = [
  { glyph: "ء", name: "Hamzah", makhraj: throatFar, instruction: "Bunyi dimulai dari penutupan singkat di bagian bawah tenggorokan.", sifat: ordinary, example: "أَحَدٌ" },
  { glyph: "ا", name: "Alif mad", makhraj: "Rongga mulut dan tenggorokan", instruction: "Jika menjadi huruf mad setelah fathah, alirkan vokal a panjang tanpa titik sentuh lidah.", sifat: "Huruf mad; panjangnya ditentukan oleh hukum mad yang berlaku.", example: "مَا" },
  { glyph: "ب", name: "Ba", makhraj: lips, instruction: "Rapatkan kedua bibir, lalu lepaskan bunyinya.", sifat: "Termasuk huruf qalqalah ketika bersukun.", example: "بِرَبِّ" },
  { glyph: "ت", name: "Ta", makhraj: tongue, instruction: "Ujung lidah menyentuh pangkal gigi seri atas.", sifat: ordinary, compare: "ط" },
  { glyph: "ث", name: "Tsa", makhraj: tongue, instruction: "Ujung lidah mendekati ujung gigi seri atas.", sifat: ordinary, compare: "س" },
  { glyph: "ج", name: "Jim", makhraj: tongue, instruction: "Bagian tengah lidah bertemu langit-langit tengah.", sifat: "Termasuk huruf qalqalah ketika bersukun.", example: "ٱلْجِنَّةِ" },
  { glyph: "ح", name: "Ha tenggorokan", makhraj: throatMid, instruction: "Keluarkan bunyi dari bagian tengah tenggorokan tanpa mengubahnya menjadi ha ringan.", sifat: ordinary, compare: "ه", example: "أَحَدٌ" },
  { glyph: "خ", name: "Kha", makhraj: throatNear, instruction: "Keluarkan bunyi dari bagian atas tenggorokan.", sifat: "Huruf isti'la; bunyinya tebal.", example: "خَلَقَ" },
  { glyph: "د", name: "Dal", makhraj: tongue, instruction: "Ujung lidah menyentuh pangkal gigi seri atas.", sifat: "Termasuk huruf qalqalah ketika bersukun.", compare: "ض", example: "أَحَدٌ" },
  { glyph: "ذ", name: "Dzal", makhraj: tongue, instruction: "Ujung lidah mendekati ujung gigi seri atas.", sifat: ordinary, compare: "ز" },
  { glyph: "ر", name: "Ra", makhraj: tongue, instruction: "Ujung lidah mendekati gusi atas; kualitas tebal-tipis mengikuti konteks harakat.", sifat: "Dapat tafkhim atau tarqiq sesuai kaidah.", example: "شَرِّ" },
  { glyph: "ز", name: "Zai", makhraj: tongue, instruction: "Ujung lidah mendekati gigi seri bawah dengan aliran suara.", sifat: ordinary, compare: "ذ" },
  { glyph: "س", name: "Sin", makhraj: tongue, instruction: "Ujung lidah mendekati gigi seri bawah; alirkan bunyi desis tipis.", sifat: ordinary, compare: "ص" },
  { glyph: "ش", name: "Syin", makhraj: tongue, instruction: "Bagian tengah lidah mendekati langit-langit tengah; alirkan bunyi sy.", sifat: ordinary, example: "شَرِّ" },
  { glyph: "ص", name: "Sad", makhraj: tongue, instruction: "Ujung lidah mendekati gigi seri bawah dengan desis tebal.", sifat: "Huruf isti'la; bunyinya tebal.", compare: "س", example: "ٱلصَّمَدُ" },
  { glyph: "ض", name: "Dad", makhraj: tongue, instruction: "Sisi lidah menekan geraham atas; latih langsung bersama guru.", sifat: "Huruf isti'la; bunyinya tebal.", compare: "د", example: "ٱلضَّآلِّينَ" },
  { glyph: "ط", name: "Tha tebal", makhraj: tongue, instruction: "Ujung lidah menyentuh pangkal gigi seri atas dengan kualitas bunyi tebal.", sifat: "Huruf isti'la dan qalqalah ketika bersukun.", compare: "ت" },
  { glyph: "ظ", name: "Zha tebal", makhraj: tongue, instruction: "Ujung lidah mendekati gigi seri atas dengan kualitas bunyi tebal.", sifat: "Huruf isti'la; bunyinya tebal.", compare: "ذ" },
  { glyph: "ع", name: "Ain", makhraj: throatMid, instruction: "Keluarkan bunyi dari tengah tenggorokan; jangan menggantinya dengan hamzah.", sifat: ordinary, compare: "ء", example: "أَعُوذُ" },
  { glyph: "غ", name: "Ghain", makhraj: throatNear, instruction: "Keluarkan bunyi dari bagian atas tenggorokan dengan suara.", sifat: "Huruf isti'la; bunyinya tebal.", compare: "خ", example: "غَاسِقٍ" },
  { glyph: "ف", name: "Fa", makhraj: lips, instruction: "Bagian dalam bibir bawah mendekati ujung gigi seri atas.", sifat: ordinary, example: "ٱلْفَلَقِ" },
  { glyph: "ق", name: "Qaf", makhraj: tongue, instruction: "Pangkal lidah mendekati langit-langit belakang.", sifat: "Huruf isti'la dan qalqalah ketika bersukun.", compare: "ك", example: "قُلْ" },
  { glyph: "ك", name: "Kaf", makhraj: tongue, instruction: "Pangkal lidah mendekati langit-langit belakang, sedikit lebih depan daripada qaf.", sifat: ordinary, compare: "ق", example: "مَلِكِ" },
  { glyph: "ل", name: "Lam", makhraj: tongue, instruction: "Tepi depan lidah menyentuh gusi atas.", sifat: ordinary, example: "ٱلْفَلَقِ" },
  { glyph: "م", name: "Mim", makhraj: lips, instruction: "Rapatkan kedua bibir; ghunnah keluar melalui rongga hidung saat hukum menuntutnya.", sifat: "Memiliki ghunnah, terutama jelas saat tasydid.", example: "مِن" },
  { glyph: "ن", name: "Nun", makhraj: tongue, instruction: "Ujung lidah mendekati gusi atas; ghunnah keluar melalui rongga hidung.", sifat: "Memiliki ghunnah, terutama saat tasydid atau ikhfa.", example: "مِن" },
  { glyph: "ه", name: "Ha ringan", makhraj: throatFar, instruction: "Keluarkan bunyi ringan dari bagian bawah tenggorokan.", sifat: ordinary, compare: "ح", example: "هُوَ" },
  { glyph: "و", name: "Wau", makhraj: lips, instruction: "Bulatkan kedua bibir. Saat menjadi huruf mad, bunyi memanjang melalui rongga.", sifat: "Dapat berperan sebagai konsonan atau huruf mad.", example: "هُوَ" },
  { glyph: "ي", name: "Ya", makhraj: tongue, instruction: "Bagian tengah lidah mendekati langit-langit tengah. Saat menjadi huruf mad, bunyi i memanjang melalui rongga.", sifat: "Dapat berperan sebagai konsonan atau huruf mad.", example: "يَلِدْ" },
];
