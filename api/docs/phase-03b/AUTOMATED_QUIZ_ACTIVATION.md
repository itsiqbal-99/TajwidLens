# Aktivasi quiz otomatis — 26 Oktober 2026

Status: **AKTIF DI DEVELOPMENT — 394 PUBLISHED, 24/24 MATERI SIAP, DETECTIVE TERSEDIA**.

Permintaan terbaru: melanjutkan pembuatan soal otomatis sesuai masing-masing materi dan anotasi, lalu mengaktifkan Quiz serta Tajwid Detective. Navigasi Referensi dipertahankan.

## Hasil yang dapat ditinjau

- 394 kandidat DRAFT dalam `api/content/generated-candidates.json`; manifest mematok sourceVersion, hash sumber dan versi setiap soal.
- 240 pilihan ganda dari condition, pronunciation, commonMistake, kalimat detail, focus.formula, focus.explanation, focus.letters dan example.note. Jawaban dan pembahasan mengutip isi sumber, bukan pengetahuan yang ditambahkan model.
- 154 identifikasi dari anotasi reader existing; 14 ayat berbeda pada masing-masing 11 materi dengan mapping yang didukung. Teks, hash payload/edisi/ayat, rentang UTF-16, grapheme dan identitas anotasi diperiksa.
- Seluruh 24 materi memiliki 9–25 kandidat. Sebelas materi mendukung soal campuran. Tiga belas materi memakai soal teori karena taxonomy anotasi tidak mencakup materinya. Generator tidak mengarang anotasi qalqalah, lam ta'rif, mad arid/lazim, waqaf atau hamzatul wasl.
- Pemilihan tetap tujuh soal unik, mengutamakan variasi retry; kedua tipe disertakan ketika tersedia. Ambang lulus tetap enam dari tujuh, dinilai server. Hasil lama dan completion terdahulu tetap utuh.
- 270 kemunculan aturan `iqlab-noon.1` dikecualikan: deskripsi upstream menyebut mim, sedangkan materi menyebut ba. Sumber Quran/anotasi tidak diubah diam-diam. Anotasi ambigu tetap dikecualikan.
- Pemeriksaan sumber/struktur seluruh 394 kandidat lulus. Setelah persetujuan khusus di bawah, seluruh 394 versi terpublikasi di development. Tidak ada review ahli nyata. File kandidat tetap DRAFT sebagai input generator; state publikasi berada di PostgreSQL.

## Persetujuan publikasi

Kebijakan lama mensyaratkan bukti review ahli untuk publikasi. Peninjauan persetujuan otomatis menolak penambahan jalur publikasi sumber repository karena perubahan kebijakan tersebut belum disetujui secara khusus. Patch yang ditolak tidak diterapkan atau dibypass.

Pemilik proyek kemudian menjawab secara eksplisit: **“Ya, izinkan publikasi otomatis ke development dengan batasan tersebut.”** Otorisasi itu mencakup **394 versi yang hash-nya dipatok ini**, **development saja**, setelah validasi deterministik, dengan provenance otomatis yang terpisah dari review ahli. Jalur tersebut baru ditambahkan setelah persetujuan ini; penolakan sebelumnya tidak dibypass. UI menyatakan validasi otomatis belum setara review ahli. Kelulusan quiz menghitung pemahaman materi tertulis; tidak membuktikan kemampuan melafalkan bacaan.

Persetujuan tersebut tidak boleh membuat identitas reviewer palsu, mengubah Quran/anotasi, mengizinkan publikasi soal suspended, membuka karantina tanpa provenance valid, mengubah snapshot/nilai lama, atau melakukan deployment production. Versi atau sumber yang berubah memerlukan validasi dan persetujuan versi baru. Risiko: kekeliruan pada materi atau anotasi existing dapat terbawa ke jawaban dan memengaruhi kelulusan materi; laporan pengguna serta karantina tetap tersedia.

Registry privat menyimpan jenis `REPOSITORY_DETERMINISTIC`, environment development, waktu pencatatan otorisasi, kutipan persetujuan, bukti pengujian, hash sumber dan seluruh 394 hash versi. `reviewers.json` tetap kosong, `review` soal tetap null. Jalur source/expert-reviewed lama tetap terpisah. Runtime menolak otorisasi repository development ketika NODE_ENV=production.

SourceVersion yang disetujui: `5323ec44afc8784a246084406b60e26ac04137ba688dc8d68becb91a5165d9cc`.

| Materi | Teori | Identifikasi | Jumlah | Jenis quiz |
|---|---:|---:|---:|---|
| pengantar | 9 | 0 | 9 | Teori |
| huruf-hijaiyah | 10 | 0 | 10 | Teori |
| harakat | 10 | 0 | 10 | Teori |
| makhraj | 10 | 0 | 10 | Teori |
| sifat-huruf | 10 | 0 | 10 | Teori |
| nun-tanwin | 10 | 0 | 10 | Teori |
| ikhfa-haqiqi | 11 | 14 | 25 | Campuran |
| izhar-halqi | 10 | 14 | 24 | Campuran |
| idgham-bilaghunnah | 10 | 14 | 24 | Campuran |
| idgham-bighunnah | 10 | 14 | 24 | Campuran |
| iqlab | 10 | 14 | 24 | Campuran |
| mim-sukun | 9 | 0 | 9 | Teori |
| ikhfa-syafawi | 10 | 14 | 24 | Campuran |
| idgham-mimi | 9 | 14 | 23 | Campuran |
| izhar-shafawi | 10 | 14 | 24 | Campuran |
| ghunnah | 10 | 14 | 24 | Campuran |
| qalqalah | 11 | 0 | 11 | Teori |
| lam-tarif | 10 | 0 | 10 | Teori |
| mad-tabii | 10 | 14 | 24 | Campuran |
| mad-arid | 10 | 0 | 10 | Teori |
| mad-lazim | 10 | 0 | 10 | Teori |
| waqaf-ibtida | 10 | 0 | 10 | Teori |
| hamzatul-wasl | 10 | 0 | 10 | Teori |
| tafkhim-tarqiq | 11 | 14 | 25 | Campuran |

## Hasil pengujian dan penggunaan

- Build API PASS; 51 tes API PASS / 2 optional SKIP; 35 tes frontend PASS; lint dan export/typecheck 45 halaman PASS.
- Verifier PostgreSQL existing PASS untuk migration, transaksi bersamaan, rollback, laporan dan karantina, pada schema terisolasi.
- `npm run verify:assessment -- --approved-development --generated`: PASS memakai 394 versi sumber dan otorisasi asli pada schema sementara run-owned. Membuktikan 24 availability, theory/mixed contracts, kunci tidak bocor sebelum submit, 6/7 completion tersimpan, provenance otomatis tanpa reviewer, Detective tamu stateless, repeat import identik dan strict batch quarantine. Schema dibersihkan.
- `npm run verify:assessment -- --approved-development --generated --browser`: Edge PASS untuk masuk dari materi ke quiz, menjawab tujuh soal, kelulusan6/7 tersimpan, disclosure otomatis, desktop1440/mobile390 tanpa overflow, Detective dari anotasi, jawaban tamu tanpa hasil personal dan guest report dengan reporter null. Screenshot ada pada generated-quiz-desktop.png, generated-quiz-mobile.png dan generated-detective-mobile.png. Fixture user/session/progress/report hanya di schema sementara yang dibersihkan.
- Pemeriksaan read-only database aplikasi: pending migrations false; total587versions =193DRAFT lama +394PUBLISHED; 394eligible, 154identification, 24ready, human reviews0. Tidak menghapus versi atau histori lama. Tidak ada migration baru.
- APIlocalhost4000 sudah memuat kode/registry baru. Semua24 materi dibuktikan HTTP200/available, dan Detective HTTP200/available dengan highlight. Probe24 sekaligus sempat terkena limiter existing20/menit pada4terakhir; setelah jendela pulih, empat materi itu HTTP200/available. Limiter dipertahankan. Weblocalhost3000/detective HTTP200 dengan disclosure baru.

Pengujian ulang menemukan timeout nyata pada Detective tamu: endpoint sempat membutuhkan 28.314 ms, sedangkan frontend membatalkan request setelah 10 detik. Pemilihan Detective sebelumnya memuat seluruh bank. Sekarang query awal hanya mengambil lessonId dari versi identifikasi yang published/tidak held, lalu mengacak materi dan menjalankan validasi serta deduplikasi existing pada satu materi sebelum memilih identifikasi. Versi terbaru tetap diperiksa lintas tipe, previous question dihindari ketika ada alternatif, dan pool invalid tetap dilewati. Tidak memperpanjang timeout frontend atau meniadakan pemeriksaan kualitas.

Tiga pengukuran endpoint sesudah optimasi: 5.716 ms, 599 ms dan 553 ms. Browser tamu terhadap web localhost sebenarnya berhasil memuat highlight tanpa overflow; waktu muat seluruh halaman pada sampel itu 10.689 ms, termasuk web/auth bootstrap. Angka ini sampel development, bukan SLA. Build API dan 15 tes terfokus tentang penilaian, guest selection, laporan dan karantina lulus setelah optimasi. Verifier PostgreSQL dan browser bank asli juga dijalankan lagi sesudah optimasi dan PASS; schema fixture dibersihkan. Screenshot live-detective-mobile.png menunjukkan web yang sebenarnya; screenshot generated-* memakai fixture terisolasi.

Untuk mencoba, buka materi di http://localhost:3000/learn/ lalu pilih **Uji Pemahaman**, atau buka http://localhost:3000/detective/ untuk latihan tamu. Quiz membutuhkan akun; Detective tetap bisa dipakai tanpa akun. Semua laporan dan karantina tetap tersedia. Beberapa konsep MCQ hanya punya satu fakta sehingga Replay tetap unavailable ketika belum ada alternatif sah.

Belum diverifikasi: validasi ilmiah ahli tajwid, Google/SMTP live pada revisi ini, perangkat fisik/assistive technology, seluruh kombinasi tema/reader/audio, dan production. Tidak ada Phase04 atau deployment production. Kesalahan sumber masih mungkin terbawa ke penilaian; gunakan laporan pengguna dan review ahli berikutnya untuk memperbaiki versi soal.
