# TajwidLens

TajwidLens adalah pendamping belajar tajwid Al-Qur'an berbahasa Indonesia. Aplikasi Next.js ini berjalan sebagai situs statis tanpa akun, server API, atau panggilan API Al-Qur'an saat digunakan.

## Cakupan

- Seluruh **114 surah dan 6.236 ayat** tersedia untuk dibaca dan dipilih per ayat.
- Setiap ayat dapat dipindai untuk beberapa pola tajwid. Hasilnya diberi label **"Hasil pemindaian otomatis"** dan **"Perlu verifikasi guru"**; penjelasan dan penanda kata dapat dibuka dari peta tajwid ayat.
- **39 anotasi yang disusun manual** untuk Al-Fatihah, Al-Ikhlas, Al-Falaq, dan An-Nas tetap tersedia dan didahulukan bila bertumpang tindih dengan hasil otomatis.
- **24 materi** tajwid, pustaka rujukan, pencarian lokal, penjelajah huruf hijaiyah, dan perbandingan waqaf/wasal pada contoh yang disiapkan.
- Tema terang/gelap dengan warna yang berbeda untuk jenis hukum, panel penjelasan, dan tata letak responsif.

Pemindai otomatis mengenali sebagian pola nun sukun/tanwin, mim sukun, ghunnah pada nun/mim bertasydid, qalqalah bertanda sukun, lam ta'rif, sebagian mad tabi'i, dan mad iwadh pada akhir ayat. **Ini bukan penetapan lengkap semua hukum pada setiap ayat.** Hasilnya belum ditinjau ahli, dan keputusan bacaan yang bergantung pada waqaf, riwayat, atau konteks tetap perlu diperiksa bersama guru. Jika tidak ada temuan, aplikasi menyatakan hal itu tanpa menganggap ayat bebas dari hukum tajwid.

## Menjalankan aplikasi

Memerlukan Node.js 22.13 atau lebih baru dan npm.

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`.

## Pemeriksaan dan build

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

`next build` menulis situs statis ke `out/`.

## Data dan arsitektur

Teks Uthmani v1.0.2 dari Tanzil disimpan verbatim di `sources/tanzil-uthmani-v1.0.2.txt`. Metadata surah ada di `sources/tanzil-quran-data.xml`. Jalankan `python scripts/generate-quran.py` untuk menghasilkan `src/data/quran-full.json`; skrip memeriksa urutan 114 surah, jumlah 6.236 ayat, dan bahwa teks yang ditampilkan, termasuk basmalah yang dipisah secara visual, dapat digabung kembali tepat seperti sumber.

`src/data/quran.ts` mengakses ayat. `src/data/annotations.ts` menyimpan anotasi terkurasi dan menggabungkan hasil dari `src/lib/tajwid-detector.ts`. Hukum otomatis dihasilkan dari pola huruf/harakat yang terbaca dan disimpan sementara per ayat selama sesi aplikasi. Sorotan tidak mengubah teks Al-Qur'an. Materi ada di `src/data/lessons.ts`, pencarian di `src/lib/search.ts`, dan antarmuka di `src/components/` serta `src/app/`.

Tidak ada berkas audio tilawah berlisensi yang dibundel; kontrol audio menampilkan status belum tersedia. Komponen pemutar siap dipakai setelah sumber dan atribusi audio yang sah ditambahkan.

## Deploy statis

Unggah isi `out/` ke host statis. Untuk GitHub Pages pada subpath repositori, atur `NEXT_PUBLIC_BASE_PATH` sebelum build, contohnya:

```powershell
$env:NEXT_PUBLIC_BASE_PATH = '/TajwidLens'
npm run build
```

## Sumber dan lisensi

Teks Arab: [Tanzil Quran Text](https://tanzil.net/docs/download) (Uthmani v1.0.2), © 2008–2010 Tanzil.net, CC BY 3.0. Berkas diambil dari [cermin distribusi Tanzil](https://github.com/gptforjoomla/Tanzil/blob/master/Packages/com_tanzil/site/resources/quran/quran-uthmani.txt). Lihat [ketentuan lisensi Tanzil](https://tanzil.net/docs/text_license) dan `THIRD_PARTY_NOTICES.md`. Penjelasan tajwid disusun dengan rujukan editorial *Reach the Goal via Tajweed Rule* dari Understand Quran Academy ([PDF](https://download.understandquran.com/fileadmin/user_upload/extras/tajweed/Tajweed_Rules.pdf)). Penjelasan bahasa Indonesia dan hasil deteksi belum mendapat telaah ahli independen.
