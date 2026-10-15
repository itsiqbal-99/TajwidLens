import type { TajweedRule } from "@/data/tajweed-types";

type BeginnerHelp = { summary: string; reading: string; trigger: string; lesson?: string };

const categoryHelp: Record<string, BeginnerHelp> = {
  "izhar-halqi": { summary: "Bunyi n dibaca jelas.", reading: "Bunyikan n dengan jelas, lalu lanjut ke huruf berikutnya. Tidak perlu didengungkan panjang.", trigger: "Ada nun mati atau tanwin yang bertemu salah satu huruf tenggorokan: ء ه ع ح غ خ.", lesson: "izhar-halqi" },
  "idgham-bi-ghunnah": { summary: "Bunyi n masuk ke huruf berikutnya sambil berdengung.", reading: "Jangan baca n secara terpisah. Langsung masuk ke huruf berikutnya sambil berdengung sekitar dua ketukan.", trigger: "Nun mati atau tanwin bertemu ي، ن، م، atau و pada dua kata yang disambung.", lesson: "idgham-bighunnah" },
  "idgham-bila-ghunnah": { summary: "Bunyi n masuk ke huruf berikutnya tanpa dengung.", reading: "Jangan baca n secara terpisah. Langsung masuk ke lam atau ra tanpa menahan dengung.", trigger: "Nun mati atau tanwin bertemu ل atau ر pada dua kata yang disambung.", lesson: "idgham-bilaghunnah" },
  "idgham-kamil": { summary: "Bunyi nun atau tanwin melebur seluruhnya ke huruf berikutnya.", reading: "Jangan bunyikan n secara terpisah. Bacalah huruf berikutnya seperti bertasydid; dengung hanya dipakai bila hukum utamanya memang memakai dengung.", trigger: "Ini adalah rincian lanjutan dari idgham: bunyi dan sifat nun melebur seluruhnya." },
  "idgham-naqis": { summary: "Bunyi nun melebur, tetapi dengungnya masih terdengar.", reading: "Masuk ke ya atau wau sambil mempertahankan dengung sekitar dua ketukan.", trigger: "Nun mati atau tanwin bertemu ي atau و. Ini adalah rincian lanjutan dari Idgham Bighunnah." },
  "izhar-mutlaq": { summary: "Nun mati tetap dibaca jelas walaupun berada sebelum huruf idgham.", reading: "Baca bunyi n dengan jelas tanpa dilebur. Hukum ini terjadi dalam satu kata.", trigger: "Nun mati bertemu ي، ن، م، atau و di dalam satu kata; karena masih satu kata, bacaan tidak diidghamkan." },
  iqlab: { summary: "Bunyi n berubah menjadi bunyi m yang samar.", reading: "Ubah bunyi n menjadi m yang ringan, rapatkan bibir, lalu dengungkan sekitar dua ketukan sebelum ba.", trigger: "Nun mati atau tanwin bertemu huruf ب.", lesson: "iqlab" },
  "ikhfa-haqiqi": { summary: "Bunyi n dibaca samar sambil berdengung.", reading: "Jangan baca n terlalu jelas dan jangan hilangkan seluruhnya. Dengungkan sekitar dua ketukan, lalu masuk ke huruf berikutnya.", trigger: "Nun mati atau tanwin bertemu salah satu dari 15 huruf ikhfa.", lesson: "ikhfa-haqiqi" },
  "idgham-shafawi": { summary: "Mim mati masuk ke mim berikutnya sambil berdengung.", reading: "Rapatkan bibir pada satu bunyi mim yang kuat dan dengungkan sekitar dua ketukan.", trigger: "Mim mati bertemu huruf م.", lesson: "idgham-mimi" },
  "ikhfa-shafawi": { summary: "Mim mati dibaca samar sambil berdengung.", reading: "Rapatkan bibir dengan ringan, dengungkan sekitar dua ketukan, lalu baca ba.", trigger: "Mim mati bertemu huruf ب.", lesson: "ikhfa-syafawi" },
  "izhar-shafawi": { summary: "Mim mati dibaca jelas.", reading: "Tutup bibir dengan jelas saat membaca mim, lalu lanjut ke huruf berikutnya tanpa dengung tambahan.", trigger: "Mim mati bertemu huruf selain م dan ب.", lesson: "izhar-shafawi" },
  mushaddadatan: { summary: "Nun atau mim bertasydid harus didengungkan.", reading: "Tahan bunyi dengung di hidung sekitar dua ketukan, lalu lanjutkan bacaan.", trigger: "Ada huruf نّ atau مّ.", lesson: "ghunnah" },
  "madd-tabee": { summary: "Vokal dibaca panjang dua ketukan.", reading: "Panjangkan suara a, i, atau u selama dua ketukan. Jangan terlalu pendek atau lebih dari dua ketukan.", trigger: "Ada huruf mad yang tidak langsung diikuti hamzah atau sukun tetap.", lesson: "mad-tabii" },
  "madd-far-hamz": { summary: "Bacaan dipanjangkan karena huruf mad bertemu hamzah.", reading: "Lihat nama mad pada label. Jaga panjangnya tetap rata dan praktikkan ukurannya bersama guru.", trigger: "Ada huruf mad yang bertemu hamzah, baik dalam satu kata maupun pada kata berikutnya." },
  "madd-lazim": { summary: "Bacaan wajib dipanjangkan enam ketukan.", reading: "Panjangkan suara enam ketukan secara rata sebelum masuk ke huruf berikutnya.", trigger: "Huruf mad bertemu sukun asli atau huruf bertasydid.", lesson: "mad-lazim" },
  "leen-letters": { summary: "Wau atau ya dibaca lembut, bukan seperti mad biasa.", reading: "Saat disambung, baca bunyinya dengan lembut dan singkat. Jika berhenti, panjang bacaan dapat berubah sesuai kaidah waqaf.", trigger: "Ada وْ atau يْ yang didahului fathah." },
  "qalqalah-ranks": { summary: "Huruf sukun dibaca dengan pantulan singkat.", reading: "Pantulkan suaranya dengan jelas, tetapi jangan menambahkan bunyi a, i, atau u.", trigger: "Salah satu huruf ق، ط، ب، ج، د berada dalam keadaan sukun.", lesson: "qalqalah" },
  "raa-rules": { summary: "Huruf ra dibaca tebal atau tipis.", reading: "Ikuti petunjuk pada nama hukum: tebal berarti suara ra lebih penuh; tipis berarti suara ra lebih ringan. Jangan mengubah harakatnya.", trigger: "Ketebalan ra ditentukan oleh harakat ra dan huruf di sekitarnya.", lesson: "tafkhim-tarqiq" },
  "lam-jalalah": { summary: "Lam pada lafaz Allah dibaca tebal atau tipis.", reading: "Baca tebal setelah fathah atau dammah, dan tipis setelah kasrah.", trigger: "Ada lafaz Allah; harakat sebelum lafaz menentukan tebal atau tipisnya lam.", lesson: "tafkhim-tarqiq" },
  "tafkheem-ranks": { summary: "Huruf ini dibaca tebal.", reading: "Baca dengan suara penuh sambil mengangkat bagian belakang lidah. Harakatnya tetap—jangan berubah menjadi bunyi o.", trigger: "Bagian ini memuat salah satu huruf tebal: خ، ص، ض، غ، ط، ق، ظ.", lesson: "tafkhim-tarqiq" },
  "mutamathilain-sagheer": { summary: "Dua huruf yang sama bertemu.", reading: "Jika labelnya idgham, leburkan menjadi satu huruf yang kuat seperti bertasydid. Jika labelnya izhar, baca keduanya dengan jelas.", trigger: "Huruf pertama sukun bertemu huruf kedua yang sama." },
  "mutajanisain-sagheer": { summary: "Dua huruf yang tempat keluarnya sama atau sangat dekat bertemu.", reading: "Ikuti labelnya: leburkan bila idgham, atau baca samar bila ikhfa. Jangan sisipkan vokal di antara keduanya.", trigger: "Dua huruf yang makhrajnya sama atau dekat bertemu, dan huruf pertama sukun." },
  "ikhfa-ghunnah-quality": { summary: "Dengung ikhfa mengikuti bunyi huruf sesudahnya.", reading: "Tetap dengungkan sekitar dua ketukan. Dengung terasa lebih tebal sebelum huruf tebal dan lebih ringan sebelum huruf tipis.", trigger: "Ini adalah rincian bunyi pada Ikhfa Haqiqi, mengikuti huruf setelah nun mati atau tanwin." },
};

const friendlyLabels: Record<string, string> = {
  "mutajanisain-idgham-naqis": "Idgham Mutajanisain",
  "mutajanisain-ikhfa-shafawi": "Ikhfa Syafawi",
  "mutamathilain-idgham-kamil": "Idgham Mutamatsilain",
  "mutamathilain-izhar": "Izhar Mutamatsilain",
  "leen-waw": "Huruf Lin — Wau",
  "leen-yaa": "Huruf Lin — Ya",
  "madd-badal": "Mad Badal",
  "madd-munfasil": "Mad Jaiz Munfasil",
  "madd-muttasil": "Mad Wajib Muttasil",
  "madd-iwad": "Mad Iwad",
  "madd-silah-sughra": "Mad Silah Pendek (Qasirah)",
  "madd-tabee-kalimi": "Mad Thabi’i",
  "seven-alefs": "Alif yang Dibaca Saat Berhenti",
  "seven-alefs-khulf": "Alif Khusus Saat Berhenti",
  "idgham-shafawi-meem": "Idgham Mimi",
  "ikhfa-shafawi-meem": "Ikhfa Syafawi",
  "izhar-shafawi-meem": "Izhar Syafawi",
  "meem-mushaddadah": "Dengung (Ghunnah) pada Mim Tasydid",
  "noon-mushaddadah": "Dengung (Ghunnah) pada Nun Tasydid",
  "idgham-bi-ghunnah-noon": "Idgham Bighunnah — Nun Mati",
  "idgham-bi-ghunnah-tanween": "Idgham Bighunnah — Tanwin",
  "idgham-bila-ghunnah-noon": "Idgham Bilaghunnah — Nun Mati",
  "idgham-bila-ghunnah-tanween": "Idgham Bilaghunnah — Tanwin",
  "idgham-kamil-noon": "Idgham Sempurna — Nun Mati",
  "idgham-kamil-tanween": "Idgham Sempurna — Tanwin",
  "idgham-naqis-noon": "Idgham dengan Sisa Dengung — Nun Mati",
  "idgham-naqis-tanween": "Idgham dengan Sisa Dengung — Tanwin",
  "ikhfa-haqiqi-noon": "Ikhfa Haqiqi — Nun Mati",
  "ikhfa-haqiqi-tanween": "Ikhfa Haqiqi — Tanwin",
  "iqlab-noon": "Iqlab — Nun Mati",
  "iqlab-tanween": "Iqlab — Tanwin",
  "izhar-halqi-noon": "Izhar Halqi — Nun Mati",
  "izhar-halqi-tanween": "Izhar Halqi — Tanwin",
  "izhar-mutlaq": "Izhar Mutlak",
  "ikhfa-ghunnah-tafkheem": "Dengung Ikhfa Dibaca Tebal",
  "ikhfa-ghunnah-tarqeeq": "Dengung Ikhfa Dibaca Tipis",
  "raa-either-permissible": "Ra Boleh Tebal atau Tipis",
  "raa-tafkheem": "Ra Dibaca Tebal",
  "raa-tarqeeq": "Ra Dibaca Tipis",
  "tafkheem-rank-1-jazari": "Huruf Tebal — Tingkat Paling Kuat",
  "tafkheem-rank-1-tahhan": "Huruf Tebal — Tingkat Paling Kuat",
  "tafkheem-rank-2-tahhan": "Huruf Tebal — Tingkat Kuat",
  "tafkheem-rank-3-jazari": "Huruf Tebal — Tingkat Sedang",
  "tafkheem-rank-3-relative-tahhan": "Huruf Tebal — Tingkat Sedang",
  "tafkheem-rank-4-jazari": "Huruf Tebal dalam Keadaan Sukun",
  "tafkheem-rank-5-relative-jazari": "Huruf Tebal Berkasrah — Lebih Ringan",
};

const hukumOverrides: Record<string, Partial<BeginnerHelp>> = {
  "madd-badal": { summary: "Bacaan dipanjangkan dua ketukan karena hamzah diikuti huruf mad.", reading: "Panjangkan suara dua ketukan.", trigger: "Hamzah berada sebelum huruf mad dalam satu kata." },
  "madd-munfasil": { summary: "Bacaan dipanjangkan karena huruf mad bertemu hamzah di kata berikutnya.", reading: "Saat disambung, panjangkan sesuai riwayat Hafs yang dipakai guru atau mushaf Anda; jaga ukurannya tetap sama.", trigger: "Huruf mad berada di akhir kata dan hamzah berada di awal kata berikutnya." },
  "madd-muttasil": { summary: "Bacaan wajib dipanjangkan karena huruf mad dan hamzah berada dalam satu kata.", reading: "Panjangkan lebih dari Mad Thabi’i dan jaga ukurannya tetap sama sesuai talaqqi.", trigger: "Huruf mad bertemu hamzah dalam satu kata." },
  "madd-iwad": { summary: "Saat berhenti, tanwin fathah berubah menjadi bunyi panjang dua ketukan.", reading: "Jika berhenti, hilangkan bunyi n pada tanwin lalu baca vokal a sepanjang dua ketukan. Tidak berlaku pada ta marbuthah.", trigger: "Kata berakhir dengan tanwin fathah dan bacaan dihentikan." },
  "madd-silah-sughra": { summary: "Ha dhamir dibaca panjang dua ketukan ketika disambung.", reading: "Saat disambung, panjangkan bunyi u atau i pada ha selama dua ketukan. Saat berhenti, panjang ini tidak dibaca.", trigger: "Ha kata ganti berada di antara dua huruf hidup dan tidak diikuti hamzah." },
  "seven-alefs": { summary: "Alif ini dibaca ketika berhenti, tetapi hilang ketika disambung.", reading: "Jika berhenti pada kata ini, baca alif panjang dua ketukan. Jika disambung, jangan bunyikan alifnya.", trigger: "Ini termasuk kata khusus yang diberi tanda alif kecil/bulat pada mushaf Madinah." },
  "seven-alefs-khulf": { summary: "Pada kata khusus ini terdapat pilihan bacaan ketika berhenti.", reading: "Ikuti cara baca yang diajarkan guru karena terdapat lebih dari satu cara yang sah pada posisi ini.", trigger: "Kata سَلَاسِلَا pada Al-Insan ayat 4 memiliki ketentuan khusus saat berhenti." },
  "raa-tafkheem": { summary: "Huruf ra dibaca tebal.", reading: "Baca ra dengan suara penuh. Jangan mengubah harakatnya menjadi bunyi o." },
  "raa-tarqeeq": { summary: "Huruf ra dibaca tipis.", reading: "Baca ra dengan suara ringan dan jelas, tanpa menebalkannya." },
  "raa-either-permissible": { summary: "Huruf ra boleh dibaca tebal atau tipis pada kondisi ini.", reading: "Gunakan salah satu cara yang sah dan ikuti bacaan guru agar konsisten." },
  "ikhfa-ghunnah-tafkheem": { summary: "Dengung Ikhfa Haqiqi dibaca lebih tebal.", reading: "Dengungkan sekitar dua ketukan sambil menyiapkan mulut untuk huruf tebal setelahnya." },
  "ikhfa-ghunnah-tarqeeq": { summary: "Dengung Ikhfa Haqiqi dibaca lebih ringan.", reading: "Dengungkan sekitar dua ketukan dengan suara ringan sebelum huruf berikutnya." },
};

// Keep every rule distinguishable while staying inside the Cloud Blue +
// Dusty Coral family. The small deterministic shift gives related rules a
// shared visual family without collapsing them into one identical color.
const topicHues: Record<string, number> = {
  "noon-tanween": 205,
  "meem-sakinah": 345,
  mushaddadatan: 282,
  madd: 39,
  qalqalah: 12,
  "tafkheem-tarqeeq": 260,
  "letter-relations": 216,
};

function hash(value: string) {
  let result = 0;
  for (let index = 0; index < value.length; index++) result = ((result << 5) - result + value.charCodeAt(index)) | 0;
  return Math.abs(result);
}

export function getHukumColor(rule: TajweedRule) {
  const base = topicHues[rule.topicId] ?? 210;
  const hue = (base + (hash(rule.hukumId) % 25) - 12 + 360) % 360;
  return `hsl(${hue} var(--tajwid-saturation) var(--tajwid-lightness))`;
}

export function getRuleHelp(rule: TajweedRule): BeginnerHelp {
  const base = categoryHelp[rule.categoryId] ?? { summary: "Bagian ini memiliki aturan bacaan khusus.", reading: "Baca perlahan dan ikuti petunjuk guru agar bunyinya tepat.", trigger: "Kombinasi huruf dan harakat pada bagian ini memenuhi aturan tajwid dari sumber." };
  return { ...base, ...hukumOverrides[rule.hukumId] };
}

export function getHukumLabel(rule: TajweedRule) {
  return friendlyLabels[rule.hukumId] ?? "Hukum Tajwid Lanjutan";
}

export function getContextNote(rule: TajweedRule) {
  if (rule.hukumId === "madd-iwad" || rule.hukumId.startsWith("seven-alefs")) return getRuleHelp(rule).reading;
  if (rule.hukumId === "madd-silah-sughra") return "Hukum ini dibaca ketika ayat atau kata disambung. Jika berhenti pada ha, tambahan panjangnya tidak dibaca.";
  if (rule.ruleAr.includes("الوقف")) return "Keterangan ini berlaku ketika berhenti. Jika bacaan disambung, ikuti harakat asli yang tertulis.";
  return "Hukum yang ditampilkan berlaku pada bacaan sambung biasa. Jika Anda memilih berhenti di bagian ini, cara baca dapat berubah; ikuti tanda waqaf dan bimbingan guru.";
}
