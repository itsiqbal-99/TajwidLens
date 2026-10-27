<!-- Historical UI revision documents referenced below are archived in Git commit 321ec250aede52e630992fa5e173b40bdcb21670. -->
# TajwidLens — checkpoint untuk melanjutkan dari rumah

## Dokumentasi teknikal dan transfer bank soal — 26 Oktober 2026

- [Technical flow](docs/TECHNICAL_FLOW.md) menjelaskan arsitektur, auth email/Google popup, reader/integritas corpus, progress/dashboard, quiz server grading, Detective, Replay, feedback, publikasi dan relasi data melalui diagram Mermaid.
- [Panduan transfer](api/docs/QUIZ_DATA_TRANSFER.md) dan [SQL siap impor](api/exports/quiz-development.sql) disiapkan dari database development aktual: **587 versi (394 PUBLISHED, 193 DRAFT, 0 suspended)**. Snapshot ini tidak menerbitkan kandidat revisi baru. Tidak berisi akun, sesi, progress, hasil attempt, laporan atau credentials; tetap berisi answer keys privat dan metadata moderasi konten.
- Dari `api`, `npm run questions:export-sql` memperbarui snapshot tanpa mutation database. Target berbeda wajib menjalankan migration skema terlebih dahulu dan memakai revision/registry/corpus yang sama. Database Neon yang sama antarperangkat tidak memerlukan impor.
- SQL transactional/idempotent, menolak konflik isi immutable, mempertahankan status/persetujuan existing dan tidak membuka karantina. Hold sumber dapat diterapkan satu arah. Bukan sinkronisasi seluruh aplikasi atau pengganti gate runtime.
- Typecheck API dan unit exporter PASS. Verifikasi PostgreSQL nyata pada tabel TEMP: impor 587, impor ulang tanpa duplikat, status/hold target tetap, konflik immutable ditolak PASS; seluruh writes uji di-rollback. Tidak menerapkan snapshot pada database tujuan atau mengubah publikasi/akun/data bank aplikasi.


## Status terbaru — aktivasi quiz otomatis development (26 Oktober 2026)

Bagian ini menggantikan batas konten historis Phase 03/03B di bawah. Pengguna meminta soal otomatis per materi dan Detective dari anotasi, lalu secara eksplisit menyetujui: **“Ya, izinkan publikasi otomatis ke development dengan batasan tersebut.”** Batasnya tepat 394 versi, kelulusan 6/7, label validasi otomatis/belum review ahli, tanpa reviewer palsu atau pelonggaran karantina. Peninjauan otomatis awal menolak perubahan kebijakan; jalur baru baru ditambahkan setelah persetujuan khusus ini, bukan dibypass. Tidak ada otorisasi production atau Phase 04.

- **394 PUBLISHED/eligible di Neon development: 240 MCQ dan 154 identifikasi, 24/24 materi siap.** Sebelas materi memiliki 14 identifikasi + 9–11 MCQ, tiga belas materi memiliki 9–11 MCQ teori karena taxonomy anotasi belum mencakupnya. Pemilihan tujuh soal mencakup kedua tipe ketika tersedia; materi teori tidak diberi anotasi buatan. Lulus tetap minimal 6/7; server grading, snapshot, ownership, CSRF dan histori tetap.
- Total versi aplikasi **587**: 193 DRAFT terdahulu tetap utuh dan 394 versi yang disetujui terpublikasi. Candidate JSON tetap DRAFT by design; state publikasi berada di PostgreSQL. SourceVersion/hash yang disetujui: `5323ec44afc8784a246084406b60e26ac04137ba688dc8d68becb91a5165d9cc`. Registry privat `source-approvals.json` mematok seluruh 394 questionHashes, hash sumber, jenis REPOSITORY_DETERMINISTIC, environment development, bukti serta waktu pencatatan otorisasi pemilik proyek. `reviewers.json`/curated bank tetap kosong, review null, tidak ada klaim SOURCE_VERIFIED/human scientific review. Runtime menolak jalur ini pada NODE_ENV=production.
- Generator sekarang memakai condition, pronunciation, commonMistake, kalimat detail, focus.formula/explanation/letters dan example.note dari materi existing. Semua 394 lulus teknis; 270 kemunculan iqlab-noon.1 dikecualikan karena deskripsi upstream menyebut mim dan bertentangan dengan materi pemicu ba. Anotasi ambigu tetap dikecualikan. Quran, rules, lesson content, corpus/index, catalogue dan navigasi Referensi tidak diubah.
- Publikasi batch mengambil row lock berurutan, memvalidasi seluruh versi sebelum satu update; satu soal held/invalid membatalkan seluruh batch. Larangan publikasi suspended dan release hanya dengan provenance publikasi valid tetap berlaku. Impor ulang tidak menghapus review, hold atau timestamp. Source berubah tidak mendapat persetujuan/publikasi baru otomatis. CLI tetap menolak production.
- Label batas validasi terlihat pada halaman quiz/Detective dan pembahasan generated questions. Quiz mengukur pemahaman materi tertulis, bukan pelafalan. Pelaporan kesalahan tetap tersedia sesudah feedback. Beberapa konsep MCQ hanya memiliki satu fakta, sehingga Mistake Replay dapat unavailable bila belum ada alternatif; tidak memalsukan variasi.
- **51 API PASS / 2 optional SKIP; 35 frontend PASS; API build, lint dan export 45 halaman PASS.** Real PostgreSQL existing PASS untuk migration, race, rollback, laporan dan karantina. Verifier `--generated` memakai sumber serta otorisasi asli pada schema run-owned: 394 versions, 24 availability, theory/mixed contracts, 6/7 completion, guest Detective stateless, immutable import dan strict atomic quarantine PASS. Edge `--generated --browser` PASS: entry materi, tujuh soal, 6/7 tersimpan, label otomatis, desktop/mobile, Detective anotasi tamu dan laporan NULL reporter. Seluruh schema fixture dibersihkan; tidak membuat akun/progress fixture di schema aplikasi.
- Pemeriksaan read-only aplikasi: pending migrations false, eligible394, identification154, ready24, human reviews0. API4000 sudah membaca registry/kode baru tanpa restart tambahan; seluruh24 availability HTTP200/available dan Detective available/highlight valid. Probe paralel24 mengenai limiter existing20/menit pada4terakhir; setelah jendela pulih empatnya HTTP200/available. Limiter dipertahankan, bukan dinonaktifkan untuk pengujian. Web3000/detective HTTP200 dengan disclosure baru.
- Recheck menemukan timeout Detective tamu: request sempat 28.314 ms, melampaui AbortSignal 10 detik frontend. Pemilihan kini mengambil indeks lessonId kecil lalu memvalidasi/deduplikasi satu pool materi melalui gate existing, bukan membaca seluruh bank. Tetap memeriksa versi lintas tipe dan menghindari previousId jika ada alternatif. Tidak memperpanjang timeout atau melemahkan gate. Sesudah optimasi: tiga sampel API 5.716/599/553 ms, live guest browser berhasil dengan highlight/tanpa overflow (whole-page 10.689 ms termasuk bootstrap), API build dan 15 focused tests PASS. Verifier generated PostgreSQL/browser final sesudah optimasi juga PASS dan schema dibersihkan. Screenshot live-detective-mobile.png adalah web3000; generated-* memakai schema fixture.

Baca [aktivasi, audit24materi dan bukti pengujian](api/docs/phase-03b/AUTOMATED_QUIZ_ACTIVATION.md) dan [workflow konten](api/content/README.md). Reproduksi: `npm run questions:publish -- --approval=owner-development-2026-10-26-5323ec44 --apply`. Verifier terisolasi: `npm run verify:assessment -- --approved-development --generated --browser`. Tidak ada dependency/migration baru, deployment production atau Phase 04. **NOT VERIFIED:** review ilmiah ahli, Google/SMTP nyata pada revisi ini, perangkat fisik/assistive technology, seluruh kombinasi tema/reader/audio dan production hosting.

## Status terbaru — Phase 03B, generator bank soal dan laporan pengguna (25 Oktober 2026)

Bagian ini menggantikan batas historis Phase 03 di bawah. Pengguna meminta menu **Referensi tetap ada**, lalu mengotorisasi prompt Phase 03B. Pekerjaan berhenti sesudah Phase 03B untuk review; **jangan mulai Phase 04 atau deploy/migrate production**.

- Referensi kembali di navbar desktop dan tetap di menu seluler/footer. Edge membuktikan link terlihat pada 1024/1280/1440 tanpa overflow dan halaman sumber bisa dibuka dari menu seluler. Responsive header mempertahankan semua navigasi; label aksesibilitas aksi panduan tetap ada ketika teksnya menjadi ikon.
- Generator deterministik menghasilkan **193 kandidat DRAFT** dari source existing: 72 MCQ kutipan field condition/pronunciation/commonMistake, 121 identifikasi anotasi. Sebelas materi punya 14 kandidat campuran; tiga belas materi punya 3 MCQ saja/CONTENT_GAP. **193 lolos teknis, SOURCE_VERIFIED 0, PUBLISHED 0, quiz siap 0/24**. Semua memerlukan review ahli; stable upstream tidak dianggap approval ilmiah.
- File privat di api/content: generated-candidates.json, generated-manifest.json, lesson-rule-map.json dan source-approvals.json kosong. Reviewers/curated bank tetap kosong. Manifest mematok hash seluruh input/code dan versi soal; kandidat tidak masuk bundle frontend. Source version saat ini: 2bfd244056e383b468c51260d021d0269cefb68805eafdd87c0b0c4a60e3889c. Generate ulang sumber sama mempertahankan ID/versi; perubahan isi mendapat versi immutable baru. Validasi menolak mismatch manifest/sumber/answer/options/mapping/explanation/ref/highlight dan duplikasi.
- Migration **QuestionFeedback1792915200000** sudah diterapkan hanya ke Neon development yang diizinkan. Menambah metadata generasi/persetujuan/karantina pada quiz_questions dan satu tabel question_feedback. Histori progress/attempt tetap utuh. Database aplikasi berisi tepat 193 DRAFT; impor kedua tidak mengubah baris/timestamp/review/hold. Pending migration false; tidak ada publikasi otomatis. Endpoint API4000 availability/Detective HTTP200 unavailable.
- UI “Laporkan kesalahan soal” tersedia sesudah hasil quiz, Detective dan Replay. Dialog native memakai kategori, deskripsi opsional, cancel/Escape/focus, pending/error/retry/success dan requestId tetap untuk retry. API hanya menerima konteks attempt SUBMITTED milik akun atau receipt HMAC sesudah jawaban tamu; rate limit lima/IP/endpoint/menit, CSRF/origin/DTO tetap. Laporan tamu menyimpan hanya row laporan dengan reporter null, tanpa akun/attempt/progress/Mistake Replay personal/IP/device fingerprint.
- Reports tidak mengubah key/nilai/completion atau otomatis menangguhkan soal. Kategori Quran/ref/highlight diprioritaskan HIGH. Review/status/karantina hanya CLI lokal berhak akses database, bukan endpoint admin publik. Status OPEN/IN_REVIEW/RESOLVED/REJECTED, operator/DB-role/catatan tersimpan. Hold mengecualikan soal baru namun menjaga snapshot historis; impor tidak membuka hold. Publikasi soal held tetap diblokir, release membutuhkan provenance publikasi valid. Koreksi yang tidak memenuhi gate memakai versi baru yang disetujui.
- Peninjauan otomatis menolak usulan pelonggaran aturan publikasi/release karantina; usulan itu tidak diterapkan atau dibypass. Kontrol ketat dipertahankan, seluruh fitur selesai dengan jalur yang aman.
- Bukti: 50 API PASS / 0 FAIL / 2 optional SKIP (52 termasuk parent); 35 web PASS; lint, build API dan export/typecheck 45 halaman PASS. Targeted generator rechecks lulus. Real PostgreSQL membuktikan migration up/down, laporan/duplikat concurrent, guest reporter null, review/hold/snapshot, impor DRAFT dan rollback refusal. Browser lulus Reference widths/mobile, quiz fail/retry/pass, laporan quiz/Replay/guest, cancel/reopen, simulasi gagal/retry, persistensi dan original score tetap. Screenshot dialog desktop/mobile telah ditinjau. Schema fixture dengan name/OID guard selalu dibersihkan.
- Generator lintas surah mengungkap guard filename adapter lama hanya menerima tiga digit; kini memeriksa nama tepat sesuai manifest sehingga surah 1–99 ikut valid. **Quran/annotations/rules/lesson source tidak diubah**; 114 hash / 6.236 ayat / 143.049 anotasi tetap valid. Satu wrapper prebuild terkena error open Windows sementara pada 33.json; validasi penuh sesudahnya PASS, build Next final dilakukan langsung tanpa regenerasi data yang tidak berubah.
- Baca lima laporan [implementation](api/docs/phase-03b/IMPLEMENTATION_REPORT.md), [tests](api/docs/phase-03b/TEST_REPORT.md), [generation audit](api/docs/phase-03b/QUESTION_GENERATION_AUDIT.md), [validation](api/docs/phase-03b/CONTENT_VALIDATION_REPORT.md), [checklist](api/docs/phase-03b/MANUAL_TEST_CHECKLIST.md). Operasi/publikasi/review dijelaskan di [content README](api/content/README.md).

Perintah dari api: questions:audit, questions:generate -- --dry-run, questions:generate -- --apply, questions:validate, questions:import-generated -- --apply. Default preview; --dry-run selalu mencegah write pada generator CLI. Publikasi terpisah memerlukan persetujuan manusia nyata pada versi cocok atau bukti source/transformation trusted yang mematok exact hashes. Jangan membuat reviewer palsu untuk mengaktifkan materi. questions:feedback mengelola review/karantina internal dengan explicit actor/note/--apply dan menolak production. Verifier development tetap --approved-development; --browser memakai fixture schema terpisah, bukan bank aplikasi.

**BLOCKED:** review ilmiah serta gap identifikasi pada 13 materi. **NOT VERIFIED:** Google/SMTP nyata, perangkat fisik/assistive technology, seluruh kombinasi tema/reader/audio dan production hosting/migration. Tidak ada dependency/paid AI/scheduler baru atau Phase 04.

## Status terbaru — Phase 03, Lesson Quiz / Detective / Mistake Replay (25 Oktober 2026)

Bagian ini menggantikan instruksi historis di bawah untuk menahan Phase 03. Pengguna meminta Phase 03 dan mengonfirmasi **belum ada bank soal/reviewer; bangun engine dan tampilkan quiz unavailable**. Scope berhenti di Phase 03 untuk review; **jangan mulai Phase 04 atau deploy/migrate production**.

- Engine memilih tujuh soal unik campuran dari versi PUBLISHED dengan provenance reviewer tepercaya; 6/7 adalah batas lulus. Pemilihan/urutan opsi/snapshot/jawaban tersimpan, draft dapat dilanjutkan setelah refresh, masa attempt 24 jam. Kunci dan pembahasan hanya dikirim sesudah submit seluruh quiz. Transaksi dan row lock membuat submit idempotent/aman dari race; hanya LESSON_QUIZ yang lulus menulis completion.
- Endpoint manual PUT complete sekarang 403; tombol Tandai Selesai diganti Uji Pemahaman atau quiz belum tersedia. Histori lama tetap tersimpan sebagai LEGACY_SELF_REPORTED/AWAITING_QUIZ, terpisah dari QUIZ_VERIFIED. Dashboard menghitung kelulusan terverifikasi, empat status, histori tanggal lama, dan tautan Detective/Replay. Progres membaca tetap tersimpan.
- Empat tabel baru: quiz_questions, quiz_attempts, quiz_attempt_questions, mistake_reviews. Migration additive **QuizAssessment1792900800000 telah diterapkan hanya ke Neon development yang diizinkan**. Pending migration false; satu completion lama mempertahankan tanggal identik. Empat tabel assessment aplikasi tetap kosong. Tidak ada soal/reviewer sintetis di schema aplikasi.
- Actual bank `api/content/question-bank.json=[]`, trusted registry `api/content/reviewers.json=[]`: **0/24 quiz siap, Detective unavailable**. Jangan mengarang soal atau membuka manual completion sebagai pengganti. Fixture berlabel DATA UJI dan reviewer sintetis hanya untuk pengujian terisolasi; bukan bukti ilmiah.
- Route baru `/quiz/`, `/detective/` publik untuk tamu, `/reviews/` privat. Quiz satu soal per layar dengan penyimpanan pilihan, retry, hasil dan sumber pembahasan; Detective memakai challenge HMAC sepuluh menit dan tanpa penyimpanan tamu. Mistake Replay opsional, memprioritaskan konsep belum diperbaiki dan tidak mengubah nilai/kelulusan materi lama. Arabic/UTF-16/grapheme/hash diverifikasi terhadap corpus reader KFGQPC existing; jangan gunakan offset Tanzil quran-full.
- Tema existing termasuk Taman dipertahankan. Motion terbatas dan reduced-motion-aware; radio native/fokus/feedback tersedia. Hilangkan GET ulang yang tidak perlu setelah create attempt; refresh sebenarnya tetap memuat data server. Konfirmasi keluar berlaku pada link aplikasi dan full-document unload; navigasi SPA lewat history browser dapat keluar tanpa prompt khusus, tetapi pilihan tersimpan tetap dapat dilanjutkan.
- Hasil: API build PASS; 40 API tests PASS / 0 FAIL / 2 SKIP (42 termasuk parent), auth browser dijalankan terpisah **18 PASS / 0 FAIL / 0 SKIP**. Dua skip default adalah opt-in browser tersebut dan TEST_DATABASE_URL khusus yang belum tersedia. **35 unit web PASS**, lint dan export/typecheck **45 halaman PASS**. Corpus tetap 114 payload / 6.236 ayat / 143.049 anotasi. Real PostgreSQL menguji migration up/down, legacy, concurrent create/submit dua koneksi, constraint/FK/unique, rollback atomik; temporary schema diberi nama/OID guard dan dibersihkan. Browser Phase 03 menguji 5/7 gagal, retry, 6/7 lulus, resume, cross-device, legacy, guest tanpa writes, Replay, mobile/keyboard/reduced motion dan sesi kedaluwarsa dengan fixture terisolasi.
- Server existing tetap berjalan: API4000 health/availability/Detective HTTP200 dengan unavailable/eligibleCount0; web3000 `/quiz/`, `/detective/`, `/reviews/` HTTP200 sesudah cold compilation. Pemeriksaan DB/HTTP ini tidak membuat akun atau progress baru.
- Baca laporan lengkap: [implementation](api/docs/phase-03/IMPLEMENTATION_REPORT.md), [tests](api/docs/phase-03/TEST_REPORT.md), [manual checklist](api/docs/phase-03/MANUAL_TEST_CHECKLIST.md), [question bank audit](api/docs/phase-03/QUESTION_BANK_AUDIT.md). Alur publikasi: [content README](api/content/README.md).

Untuk verifikasi di komputer lain: build web/out dengan origin API lokal existing, lalu dari api jalankan `npm test`, `npm run questions:check`, dan hanya pada database development yang disetujui `npm run verify:assessment -- --approved-development --browser`. Verifier memakai schema temporary sendiri, bukan mengisi bank aplikasi. `verify-learning-neon.ts` kini meneruskan ke verifier assessment; harness completion manual lama telah diganti. API artifacts memerlukan api/shared sibling, registry, dan corpus reader yang sama atau konfigurasi QUIZ_CORPUS_INDEX/QUIZ_CORPUS_DIRECTORY. Detective production memerlukan QUIZ_CHALLENGE_SECRET stabil; tanpa itu tetap unavailable.

**BLOCKED:** konten dan review ilmiah berkualifikasi untuk membuka evaluasi materi. **NOT VERIFIED:** consent Google nyata, SMTP nyata, production hosting/migration, perangkat fisik/assistive technology dan seluruh kombinasi tema/reader/audio. Jangan mengubah status tersebut berdasarkan fixture. Tidak ada Phase 04, dependency baru, atau deployment production.

## Revisi Phase 02 — dashboard informatif, tema Taman, motion & latensi auth

- Permintaan review 25 Oktober 2026 dikerjakan dalam Phase 02. Dashboard kini menonjolkan ringkasan tiga status, completion ring, peta 24 materi yang dapat diklik, cakupan per topik, next lesson dan tanggal materi selesai. Semua memakai data akun; endpoint dashboard menambah pasangan ID/status dari query existing, tanpa query/tabel tracking baru.
- Pengguna memilih **putih + hijau daun + mint + kuning lembut**. Tema **Taman** ditambahkan ke picker dan tersimpan melalui preferensi existing; tiga tema/default sebelumnya dipertahankan. Penanda Selesai ditampilkan pada kartu materi dan learning path; in-progress/belum mulai punya teks/ikon berbeda. Guest tidak menerima penanda personal atau mutation.
- Feedback pending/success dengan spinner/check draw dipakai untuk progress, profil, proses akun dan loading; reduced motion mematikannya. Tidak menambahkan jeda minimum palsu, optimistic completion, library, atau ilustrasi bitmap baru.
- Penyebab jeda auth: refresh sesi menunggu capabilities, dua query sesi/user berurutan, save profil mengulang lookup, logout reload dokumen, dan fallback Google 12 detik. Kini capabilities terpisah, request sesi paralel dideduplikasi, verifikasi satu JOIN, profil memakai response PATCH, logout server-confirmed lalu client navigation dengan guard race, dan same-tab fallback Google 1,2 detik. Receipt bukan bukti auth; popup ditutup setelah verifikasi server. Recovery watchdog 8 detik hanya jika ack hilang. Respons sesi lama setelah login diabaikan melalui version guard.
- Final: 31 unit frontend PASS; lint/typecheck/export 42 halaman dan build API PASS; suite gabungan serial 34 PASS / 0 FAIL / 1 optional PostgreSQL SKIP. Google handoff provider uji 1.053ms; logout uji 269ms. Neon development verification terbaru PASS, logout 595ms tanpa reload, fixtures bersih. Angka tersebut bukan SLA atau bukti consent Google nyata.
- MIME `.txt` pada static test server diperbaiki ke text/plain agar benar-benar menguji client navigation; cleanup fixture async menunggu handler selesai. Screenshot desktop/mobile/theme/library ditinjau sesudah animasi finite selesai. API development existing sudah memuat lessonStates, web3000/API4000 HTTP200; tidak menghentikan proses yang sedang aktif.
- Detail: `api/docs/phase-02/EXPERIENCE_REVISION.md`. **Quiz per module untuk completion berikutnya hanya dicatat**, belum diimplementasikan. Consent Google nyata, perangkat fisik/assistive technology dan production tetap belum diverifikasi. Tetap berhenti pada Phase 02; tidak deploy atau memulai Phase 03.

## Status terbaru — Phase 02 Learning Progress + Personal Dashboard, 25 Oktober 2026

Bagian ini menggantikan instruksi historis untuk menahan Phase 02. Pengguna meminta implementasi Phase 02 dan secara eksplisit mengonfirmasi api/.env khusus development serta mengizinkan migration penambahan tabel progress. Tetap berhenti untuk review sesudah fase ini; **jangan memulai Phase 03 atau deploy/migration production**.

- Dashboard privat `/dashboard/` menjadi tujuan default login email/Google dan pemulihan sesi di `/`; safe next existing tetap dihormati. Popup Google menyerahkan sesi ke halaman asal sebelum ditutup, tanpa onboarding profil wajib; profil tetap dapat diedit dari navbar. Guest tetap ke `/home/` dan seluruh materi/Quran publik.
- Satu catalogue metadata ringan di `shared/lesson-catalog.json` menyatukan 24 ID/slug/order/title/category/summary web dan API. ID existing dipertahankan; isi materi, Quran, anotasi dan tiga dokumen utama API tidak diubah. Backend artifact wajib mempertahankan `api/` dan `shared/` sebagai sibling; frontend tetap static export.
- Migration additive LearningProgress1792886400000 sudah diterapkan hanya pada Neon development yang diizinkan, pending false. Satu tabel user_lesson_progress dengan unique user/lesson, FK/cascade/check/index; absent = NOT_STARTED, buka = IN_PROGRESS, selesai hanya lewat Tandai Selesai. Upsert atomic mempertahankan COMPLETED dan timestamp pertama; rollback nonempty ditolak dan pemeriksaan dilakukan dengan exclusive lock dalam transaksi migration.
- Dashboard berisi sapaan, Continue/Mulai/Ulangi, hitungan/persentase/progressbar, completed list ringkas dan link katalog existing. Resume deterministic mengikuti last access/urutan lalu wrap. Loading, partial data, API gagal, retry, session expiry dan all-complete eksplisit; tidak memakai fallback 0% saat request gagal. Guest tidak membuat progress atau local persistence. Tema/reduced motion dipertahankan.
- Verifikasi Neon development sudah lulus untuk up/down/reapply/lock/penolakan rollback nonempty pada schema sementara yang di-rollback, race dua koneksi, timestamp/idempotence, serta alur browser login→mulai→complete→browser baru→ownership→guest→error/retry→expired→100%. Fixture pengujian milik run dibersihkan dengan ID/email tepat. Export 42 halaman, 29 unit frontend, lint/typecheck dan build API lulus. Regresi gabungan final dijalankan serial: 34 PASS / 0 FAIL / 1 SKIP (opsional database PostgreSQL _test; Neon diuji terpisah). Bukti ada di `api/docs/phase-02/TEST_REPORT.md`.
- Server review development aktif lagi: web3000 dashboard HTTP200, API4000 memuat 5 learning routes dan menolak guest dengan 401. API sebelumnya tidak berjalan; hanya proses frontend TajwidLens yang terverifikasi tidak merespons yang direstart. Build API berjalan tanpa migration startup. Log runtime di node_modules/.cache/phase02-review masing-masing aplikasi; script dev milik pengguna tidak diubah.
- Laporan implementasi dan checklist manual ada di `api/docs/phase-02/`. Google regression memakai identity double; consent Google nyata terbaru, SMTP, perangkat fisik/assistive technology dan production deployment tetap belum diverifikasi. Tidak mengganti auth Phase 01, menambah analytics/quiz/gamification atau memulai Phase 03.

## Revisi terbaru — konfirmasi registrasi manual

- Setelah respons registrasi sukses, form di-reset lalu diganti panel **Pendaftaran diterima.** dengan ikon, pesan server, fokus aksesibel/live region, CTA ke login (safe next dipertahankan) dan opsi Daftar akun lain dengan field kosong. Error tetap mempertahankan input untuk retry.
- Jika capabilities menunjukkan verifikasi email diperlukan, panel menjelaskan kotak masuk/spam dan verifikasi sebelum login. Tidak mengklaim email terverifikasi atau membocorkan apakah email sudah terdaftar; kebijakan respons generik backend tidak diubah.
- UI fixture tanpa akun live lulus: error input retention, fokus/status sukses, form hilang, reset kosong, password kembali tersembunyi, link next dan tanpa submit ulang otomatis pada lebar 1440/768/390/320. Screenshot desktop/mobile di `api/docs/phase-01/registration-complete-*.png` ditinjau. Export web 41 halaman lulus; hasil integrasi akhir dicatat di TEST_REPORT.
- Lint dan acceptance API/browser terisolasi final lulus: 18 PASS / 1 SKIP / 0 gagal, termasuk konfirmasi/reset untuk mode email dan CTA login mode pengujian. Tidak menguji pengiriman SMTP live atau membuat akun live; backend/Google/profil tidak diubah oleh revisi ini.

## Revisi terbaru — wallpaper tajam, popup Google, navbar & profil

- Wallpaper memenuhi panel kiri, tanpa blur, opacity gambar .94 dan overlay terarah agar heading/hadis tetap terbaca. Aset ilustrasi existing dipakai ulang; tidak ada bitmap/dependency baru.
- Callback Google sukses biasa sekarang ke `/auth-complete/`. Popup mengirim notifikasi same-origin tanpa token/kode/credential; halaman asal memeriksa sesi server, menerima onboarding profil atau safe return path, lalu memberi ack untuk menutup popup. `noopener/noreferrer` tetap aktif. Tanpa ack, tersedia tautan lanjut dan fallback lokal 12 detik.
- Navbar memakai avatar inisial, sapaan Welcome/nama dan link profil. Halaman profil punya banner ilustrasi, ringkasan identitas/metode masuk dan panel edit. Tetap mengikuti tema aplikasi; layout diuji sampai 320px, nama panjang, keyboard dan reduced motion. Auth tetap independen dari tema reader.
- Revisi penautan dari giliran terinterupsi diselesaikan: profil menyediakan Hubungkan Google dengan sesi + konfirmasi password + identitas Google email sama. Intent sekali pakai 10 menit menggunakan auth_tokens existing. Tidak ada migration/auto-merge/manual edit akun live; profil/password/user ID dipertahankan. Pengguna melaporkan daftar/login Google live sudah berhasil, namun handoff popup terbaru perlu retry pengguna.
- Build web 41 halaman, build API, lint dan 25 unit test PASS. Detail keputusan, mekanisme dan provenance di `api/docs/phase-01/ACCOUNT_EXPERIENCE.md`; hasil acceptance final ada di TEST_REPORT. Tidak melanjutkan fase lain.
- Acceptance export final: 18 PASS / 1 SKIP / 0 gagal; onboarding pengguna Google baru di halaman asal, pengguna lama ke beranda asal dan popup tertutup otomatis tanpa menekan Periksa status login. Profil/save, penautan Google, recovery/logout, guest dan keamanan tetap lulus. Visual profil/navbar enam lebar, nama panjang, dark theme, fokus, serta wallpaper auth enam lebar juga PASS. Tes PostgreSQL nyata tetap dilewati.

## Revisi terbaru — Architectural Light (24 Oktober 2026)

- Pengguna memilih **Architectural Light**. Login/daftar kini framed split-screen: panel sage terang, ilustrasi arsitektur/buku/lensa baru, form putih terfokus, logo PNG resmi dan hadis lengkap. Mobile form dahulu; tema reader tidak mengubah palet auth. Motion masuk 420ms, feedback 140ms dan pointer depth hanya pada ilustrasi; reduced motion mematikannya.
- JSX AccountForm yang terpotong/berpindah serta submit handler yang hilang telah diperbaiki. Heading ganda, akses `location` saat render server dan logo buatan pada shell dihapus. Styling auth dipusatkan pada account.css. Snapshot sumber sebelum perbaikan ada di `api/node_modules/.cache/auth-redesign-82d44af5`.
- Web typecheck/lint, 24 unit test dan production export 40 halaman PASS. Acceptance terisolasi pg-mem/browser: 17 PASS / 1 SKIP / 0 gagal, termasuk daftar, login, profil, recovery, logout dan popup/fallback Google. Tidak mengubah akun live atau backend pada revisi visual ini.
- Pada pengecekan aktual, port4000 menolak koneksi; jangan menyamakan fixture visual dan acceptance terisolasi dengan ketersediaan API/Neon live. Preview web3000 yang lambat/tidak responsif direstart hanya proses TajwidLens yang terverifikasi.
- Pengguna **sudah mengonfirmasi** email Google sama dengan akun manual. Pernyataan lama bahwa jawaban belum tersedia sudah kedaluwarsa. Auto-link tetap ditolak dengan aman; secure account linking belum diotorisasi/diimplementasikan. Revisi ini khusus visual, tidak lanjut fase lain.
- Detail keputusan dan prompt/provenance aset: `api/docs/phase-01/ARCHITECTURAL_LIGHT.md`. Ilustrasi baru WebP 1200×800 / 113.590 byte; PNG original dan aset sebelumnya dipertahankan.
- Visual login/daftar enam lebar 1440/1024/850/768/390/320px PASS dengan fixture eksplisit karena API aktual offline; pointer/reset, reduced motion, logo/hadis, kontrol dan password reveal teruji. Empat screenshot desktop/mobile ditinjau. Export final dibangun ulang setelah penyempurnaan crop/blending ilustrasi.

## Revisi terbaru — callback Google setelah pemilihan akun

- Laporan pengguna: setelah memilih akun Google kembali ke pesan generik. Kegagalan lampau tidak dapat diidentifikasi dari pesan itu karena semua exception ditelan. Jangan mengklaim login live sudah berhasil.
- Bug konkret direproduksi sebelum perbaikan: dua GET start pada satu cookie jar saling menimpa cookie OAuth tetap, lalu callback pertama gagal. GET dan POST start kini memakai cookie binding unik per state; callback hanya membaca/menghapus cookie percobaannya sendiri. HttpOnly/SameSite/PKCE/nonce/expiry/replay tetap dipertahankan; tidak ada migration.
- Error callback kini dipetakan secara aman: sesi/cookie, kode kedaluwarsa, benturan akun, konfigurasi, koneksi, validasi identitas, pembatalan. Logger hanya mencetak tahap/kategori terkontrol, bukan raw respons provider, kode, token, secret atau email. Pesan frontend allowlist, tidak memantulkan input URL.
- Koneksi token Google dan pengambilan sertifikat berhasil. Dua percobaan diagnostik pada API/Neon aktual sama-sama lolos state binding lalu ditolak Google sebagaimana diharapkan karena sengaja menggunakan kode tidak valid (`google_code`). Tidak ada akun atau credential pengguna dimodifikasi/dipakai.
- Uji final: API build, web lint/build 40 halaman, 24 unit frontend PASS; acceptance API/browser 17 PASS / 1 SKIP, termasuk cookie paralel, replay, expired/missing cookie, benturan akun tanpa menautkan akun, pembatalan, redaksi log, dan pesan UI.
- Pengguna ditanya apakah email Google sama dengan akun email/password yang sudah didaftarkan; jawaban belum tersedia saat penulisan. Akun manual tidak ditautkan otomatis. Harus mulai login baru (tutup jendela Google lama) karena binding cookie lama tidak kompatibel. Jika gagal lagi, minta hanya pesan error baru, bukan URL callback/kode/token. Login Google live penuh masih perlu verifikasi pengguna.

## Revisi terbaru — auth terang, ilustrasi & Google launch

- Panel hadis hitam diganti permukaan terang dengan ilustrasi buku/lensa dari ImageGen, terinspirasi logo resmi. Asset final `web/public/auth-study-illustration.webp` berukuran 24.520 byte; logo/hadis/terjemahan/sumber tetap utuh. Desktop dua sisi, mobile form dahulu. Motion sekali masuk 360 ms, interaksi 140 ms, reduced motion mematikan animasi.
- Handler lama melakukan POST fetch lintas-origin lalu redirect asynchronous, bukan popup. Pada browser pengguna teramati timeout dan tab lama tetap memakai handler lama sesudah revisi. Handler baru membuka GET OAuth langsung dalam jendela/tab terpisah pada klik pengguna, dengan noopener/noreferrer, fallback tab yang sama, dan pemeriksaan sesi ketika kembali/fokus atau melalui tombol. Form email tidak terkunci. State/nonce/PKCE/browser-bound cookie tetap sama; POST JSON tetap kompatibel bagi caller lain.
- Cache-first service worker dapat mempertahankan bundle Next development yang mutable. Bootstrap sebelum hydration, hanya `NODE_ENV=development`, melepas worker dengan scriptURL aplikasi yang tepat dan cache `tajwidlens-pwa-*`; worker/cache aplikasi lain serta akun/preferensi tidak disentuh. Versi cache PWA menjadi v4. Empat unit test memeriksa scope, basePath, reload sekali, dan browser tanpa SW.
- Bukti langsung: halaman Google **Sign in → to continue to tajwidlens** berhasil tampil lewat fallback di browser yang sedang dibuka. Tidak ada kredensial dimasukkan atau consent disetujui. Login Google penuh/identity/session live tetap belum diverifikasi.
- Web 23 unit test, lint, typecheck/build statis 40 halaman, API build, layout login/daftar enam ukuran layar, dan acceptance API/browser 14 PASS / 1 SKIP lulus. Popup login/daftar, callback/profil dengan identity double, serta popup diblokir telah diuji. Detail desain/prompt aset dan bukti terbaru di `api/docs/phase-01/DESIGN_REVISION.md` dan laporan Phase01. Tetap tidak melanjutkan fase berikutnya.

## Revisi terbaru — redesign auth & perbaikan server aktual

- API port4000 yang masih berjalan ternyata versi lama: source memiliki `/auth/status`, tetapi runtime/Swagger belum. Proses TajwidLens yang tepat sudah diganti; endpoint aktual kini 200. `api/npm run dev` memakai native Node watch + ts-node agar perubahan source termuat otomatis.
- Probe capabilities tidak lagi mengunci form/session. Pemeriksaan sesi terpisah; form email/password tetap bisa dikirim saat status tidak tersedia. Pembatasan registrasi tetap mengikuti keputusan backend, bukan asumsi frontend.
- Revisi desain terakhir mengikuti permintaan pengguna: logo resmi PNG, dua sisi pada login/daftar (panel hadis charcoal di kiri, form putih di kanan). Hadis Arab, terjemahan dan sumber Bukhari 5027/Utsman bin 'Affan tampil lengkap. Pada mobile panel berpindah ke bawah form, bukan disembunyikan. Auth tetap independen dari tema aplikasi existing.
- `node scripts/check-auth-layout.cjs` lulus untuk login/daftar pada 1440/1024/850/768/390/320px: logo, konten hadis persis, layout/overflow, kontrol aktif, password reveal dan reduced motion. Screenshot desktop/mobile ditinjau. Typecheck/lint serta build 40 halaman lulus; logika auth tidak diubah oleh revisi visual terakhir.
- Uji browser **pada web aktual dan Neon** lulus: daftar, persistence akun belum verified, login, refresh, profil, logout. Regresi status404 juga lulus dengan login nyata. Semua akun uji milik run dibersihkan; data pengguna lain tidak diubah.
- Detail bukti dan screenshot redesign ada di laporan Phase01. Tetap belum memverifikasi Google consent live/production; SMTP tetap deferred dan tidak memulai fase berikutnya.

## Status terbaru — Phase 01 auth UX, 24 Oktober 2026 (Asia/Jakarta)

Bagian ini menggantikan asumsi konfigurasi/provider pada checkpoint historis di bawah. Tetap Phase 01; SMTP sengaja ditunda sesuai instruksi terbaru. Baca laporan terbaru di `api/docs/phase-01/` untuk bukti pengujian dan blocker.

- Akar masalah: frontend tidak memiliki `NEXT_PUBLIC_API_URL` dan layout terbaru tidak memasang AuthProvider. File lokal ignored `web/.env.local` sekarang berisi origin API lokal; provider tunggal dipasang kembali. Restart server development setelah perubahan environment. Static deploy perlu rebuild dan repository variable publik `NEXT_PUBLIC_API_URL`; tidak ada secret di browser.
- Credentials database/Google sudah tersedia di `api/.env` lokal. Neon verified TLS, schema dan migration existing sudah diverifikasi; Nest startup nyata tanpa SMTP, health/capabilities/401/deferred recovery lulus. Tidak ada migration atau user uji dibuat di database live.
- `AUTH_ALLOW_UNVERIFIED_EMAIL=true` telah diaktifkan eksplisit pada `api/.env` development lokal. Hanya development/test yang mengizinkannya; production menolak startup jika flag true. Akun tetap belum verified dan tidak ada email dikirim. Di luar mode ini, password login memerlukan email terverifikasi dan registrasi email memerlukan delivery.
- `/` mengarah ke login setelah pemeriksaan sesi, atau `/home/` jika sudah login. Homepage lama dipertahankan pada `/home/`; guest langsung menuju sana. Tidak memakai fake anonymous user atau browser flag sebagai authorization. URL Quran Reader dan materi publik tetap sama.
- Layout `(auth)` terpisah dari `(app)`; login/registrasi tidak menampilkan navigasi utama. Ketiga tema existing tetap tersedia. New Google user mengonfirmasi nama di `/profile/?welcome=1`; returning user menuju `/home/`. Guard profile dan return URL internal tersedia.
- Google live consent hingga session **belum diverifikasi**. Daftarkan callback lokal tepat `http://localhost:4000/api/v1/auth/google/callback`. Jangan mengklaim berhasil dari redirect/credentials saja. SMTP delivery DEFERRED; production domain/cookie dan PostgreSQL concurrency tetap NOT VERIFIED.
- Harness browser memakai frontend 3101 dan API uji 4101, tidak menghentikan API development pada 4000. Smoke startup memakai 4102 lalu menghentikan child-nya sendiri.
- Hasil terbaru: API build PASS; acceptance API/browser 14 PASS, 1 SKIP, 0 FAIL; web 19 tes PASS, lint PASS, static build 40 halaman PASS; corpus tetap 114 payload/6.236 ayat/143.049 anotasi. Screenshot login/register desktop dan mobile serta profile mobile diperiksa. Detail status live/double ada di laporan.
- Tes menemukan benturan redirect logout guard/form; diperbaiki dengan revoke cookie lalu document replacement ke login, serta revalidasi sesi pada halaman yang dipulihkan dari cache Back/Forward. Mode unverified juga diperiksa saat autentikasi sesi, sehingga menonaktifkan flag tidak mempertahankan akses sesi akun belum verified.

Bagian lama berikut merupakan riwayat, bukan instruksi untuk memasang SMTP atau memulai fase baru.

## Perbaikan terbatas — 24 Oktober 2026 (Asia/Jakarta)

- Tetap Phase 01; tidak melanjutkan Phase 02–04.
- Error integritas disebabkan akhir baris CRLF pada seluruh 114 payload. Dipulihkan ke LF dengan memastikan SHA-256 tetap sama dengan manifest asli; teks dan anotasi tidak diubah. `web/.gitattributes` mempertahankan LF untuk payload dan sumber terkunci.
- Loader memakai versi hash pada URL dan revalidasi cache; pemeriksaan ukuran, checksum, dan rentang anotasi tetap aktif.
- Tombol tema terang/gelap existing diberi border/latar agar lebih terlihat; area aksi header tidak menyusut. Browser memverifikasi tombol terlihat pada 1440/1024/390/320 px dan klik mengaktifkan tema gelap.
- Verifikasi: 11 tes frontend PASS, TypeScript PASS, corpus PASS (114 payload, 6.236 ayat, 143.049 anotasi). Tes regresi mencakup penolakan payload CRLF dan pemuatan ulang data valid.
- Browser: preview beranotasi 1:1, 2:2, 114:2 PASS; preferensi tema bertahan setelah reload. Pemeriksaan awal 2:1 menunggu elemen anotasi yang tidak muncul, sehingga pemeriksaan rendering anotasi dialihkan ke 2:2.
- Integrasi Neon, Google OAuth, SMTP live dan deployment tetap belum diverifikasi.

Tanggal: **23 Oktober 2026 (Asia/Bangkok)**  
Posisi terakhir: **Phase 01 — Backend Foundation + Full Authentication**  
Workspace asal: `C:\Users\Iqbal Digi\Documents\projects\TajwidLens`

## 1. Mulai dari sini

Implementasi backend dan frontend Phase 01 sudah dibuat dan diuji secara lokal. **Jangan membuat ulang scaffold atau mengulang implementasi autentikasi.** Pekerjaan berikutnya adalah mengonfigurasi dan memverifikasi integrasi nyata, lalu menyelesaikan checklist penerimaan.

Phase 01 **belum dinyatakan selesai produksi**: Neon, Google OAuth live, SMTP live, dan deployment belum diverifikasi. Phase 02–04 belum dimulai dan tidak boleh dimulai tanpa persetujuan eksplisit.

Dokumen ini adalah handoff, bukan backup source code. Bawa seluruh source yang dijelaskan di bagian berikut.

## 2. Kondisi Git dan cara membawa pekerjaan

Pemeriksaan saat checkpoint dibuat:

| Lokasi | Git root yang terdeteksi | Branch | Commit / remote |
|---|---|---|---|
| `web/` | Folder utama `TajwidLens/` | `master` | Belum ada commit; tidak ada remote |
| `api/` | `TajwidLens/api/` | `master` | Belum ada commit; tidak ada remote |

Ini berbeda dari konteks awal implementasi yang memperlakukan web sebagai repository tersendiri. **Gunakan kondisi filesystem/Git terbaru sebagai fakta.** Tidak ada perubahan struktur Git, commit, push, atau publikasi yang dilakukan saat pembuatan checkpoint ini.

**Jangan mengandalkan `git pull`, `git clone`, atau backup berbasis tracked files saja.** Source saat ini belum tersimpan dalam commit. Ada nested repository `api/.git`; jangan melakukan `git add .` dari root tanpa memutuskan struktur repository karena isi API bisa diperlakukan sebagai embedded repository.

Untuk pindah komputer, salin folder `TajwidLens` ke media pribadi yang aman, terutama:

- `CHECKPOINT.md` ini.
- Seluruh `api/src/`, `api/test/`, `api/docs/`, ketiga dokumen aturan, `README.md`, `package.json`, `package-lock.json`, `tsconfig.json`, `.gitignore`, `.env.example`.
- Seluruh `web/src/`, `web/public/`, **`web/sources/`**, `web/scripts/`, `web/.github/`, `AGENTS.md`, dokumen, konfigurasi dan kedua file package/lockfile.
- Metadata `.git` jika ingin mempertahankan keadaan repository lokal. Metadata saja tidak menggantikan source yang belum di-commit.
- Bila ada `.env` atau `.env.local` yang dibuat setelah sesi ini, transfer hanya melalui media pribadi yang aman; jangan masukkan ke repository publik. Saat implementasi terakhir, credentials live belum tersedia.

Tidak perlu membawa `node_modules/`, `.next/`, `out/`, `dist/`, atau cache; semuanya dapat dibuat ulang. Jangan mengandalkan ZIP lama seperti `web/tajwidlens.zip`: belum diverifikasi memuat perubahan Phase 01 terbaru.

## 3. Yang sudah diimplementasikan

### Backend (`api/`)

- NestJS 11 + TypeScript, modular monolith Auth/Users, TypeORM dan driver PostgreSQL.
- Konfigurasi Neon dengan validasi sertifikat TLS; `synchronize: false`; migration tidak otomatis dijalankan saat startup.
- Migration `src/database/1760000000000-InitialAuth.ts`: tabel `users`, `sessions`, `auth_tokens`, `oauth_attempts`; constraints/index/FK; rollback destruktif dinonaktifkan.
- Registrasi email/password dengan normalisasi email, nama panggilan wajib dan profil tambahan opsional; password Argon2id.
- Login, logout, session opaque dengan hash di database, expiry tujuh hari, cookie HttpOnly dan Secure di production.
- Verifikasi email/resend, forgot/reset password, token berumur terbatas dan sekali pakai. Reset mencabut seluruh session user.
- Google Authorization Code Flow + PKCE, state terikat browser, nonce, validasi ID token melalui library Google. Email sama tidak otomatis menautkan akun.
- Profil milik user yang sedang login, validasi DTO, guard, CORS allowlist, pemeriksaan Origin/custom header CSRF, rate limit dan respons error aman.
- SMTP dapat dikonfigurasi. Provider tidak tersedia menghasilkan 503; tidak ada klaim pengiriman email nyata.
- Swagger `/api/docs`, JSON `/api/docs-json`; health `/api/v1/health`.

### Frontend (`web/`)

- Next.js tetap **static export**; lockfile terakhir teruji menggunakan Next.js **16.4.2**.
- Halaman `/login/`, `/register/`, `/forgot-password/`, `/reset-password/`, `/verify-email/`, `/profile/`.
- `src/lib/auth-api.ts`: client API dengan cookie credentials dan header CSRF.
- `src/components/auth-provider.tsx`: status akun; `account-form.tsx`: form dan alur akun.
- Header menampilkan Masuk/Profil; tema existing dan guest access tetap dipertahankan.
- Tidak ada token autentikasi di localStorage. Token tautan email memakai URL fragment dan dibuang dari address bar setelah dibaca.
- Quran Reader, audio, rendering ayat dan pipeline corpus tidak diubah untuk menambahkan auth.
- Workflow yang ditemukan adalah GitHub Pages, **bukan Cloudflare Pages**. Konfigurasi production tidak diubah.

## 4. Bukti pengujian terakhir — jangan salah mengartikan status

Hasil berikut berasal dari sesi implementasi sebelumnya, **bukan pengujian ulang saat checkpoint dibuat**.

| Pemeriksaan | Hasil terakhir |
|---|---|
| API build dan strict typecheck | PASS |
| API/browser `E2E=true npm test` | 13 PASS, 1 SKIP, 0 FAIL (14 reported tests, termasuk parent test) |
| Real PostgreSQL test | SKIP karena `TEST_DATABASE_URL` belum tersedia |
| Web unit tests | 10 PASS |
| Web lint/typecheck | PASS |
| Web production static build | PASS, 38 halaman |
| Corpus | PASS: 114 payload, 6.236 ayat, 143.049 anotasi |
| Audit dependency API | 0 advisory pada pemeriksaan terakhir |
| Audit dependency produksi web | 0 advisory pada pemeriksaan terakhir |
| Full audit web | 8 advisory development tooling masih tersisa |

Pengujian API menggunakan **pg-mem**, migration asli, Nest HTTP, Argon2 asli, mailer double dan identitas Google double. Itu **bukan bukti live Neon, delivery SMTP, consent Google, race/locking PostgreSQL nyata, atau deployment**.

Playwright Edge headless menguji daftar, verifikasi, login salah/benar, profil tersimpan setelah reload, logout, forgot/reset dan guest access. Screenshot light/dark desktop dan mobile ada di `api/docs/phase-01/` dan telah diperiksa. Smoke guest access tidak menggantikan seluruh uji interaksi reader/audio.

Rincian: [TEST_REPORT](api/docs/phase-01/TEST_REPORT.md).

## 5. Menyiapkan komputer rumah

Gunakan Node.js 22.13+ dan npm. Jalankan dari folder hasil salinan, tidak harus path komputer asal. Pertahankan lockfile; gunakan **`npm ci`**, bukan pembaruan dependency tanpa kebutuhan.

```powershell
# Dari root TajwidLens
Set-Location api
npm ci
Set-Location ../web
npm ci
Set-Location ..
```

Tidak perlu langsung mengulang semua pengujian. Untuk meneruskan pekerjaan, baca checkpoint dan laporan lalu kerjakan blocker berikut. Pengujian dijalankan ketika memverifikasi komputer baru, setelah perubahan relevan, atau setelah konfigurasi provider tersedia.

### Menjalankan aplikasi dengan database development/staging

Jika file belum ada, salin `api/.env.example` menjadi `api/.env` dan `web/.env.example` menjadi `web/.env.local`. **Jangan menimpa konfigurasi yang sudah ada.**

Isi `api/.env` secara lokal:

| Variabel | Isi / catatan |
|---|---|
| `DATABASE_URL` | Neon development/staging; bukan database production untuk pengujian |
| `NODE_ENV` | `development` untuk lokal |
| `PORT` | `4000` |
| `FRONTEND_URL` | `http://localhost:3000` |
| `API_URL` | `http://localhost:4000` |
| `COOKIE_SAME_SITE` | `lax` untuk lokal/same-site |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | OAuth Web client dari Google Cloud |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | SMTP yang valid; verified sender |

Isi `web/.env.local`: `NEXT_PUBLIC_API_URL=http://localhost:4000`. Variabel ini hanya URL publik, bukan secret. Perubahan URL ini perlu rebuild untuk static export.

**Periksa target database sebelum migration.** Gunakan role migration dengan hak DDL, lalu role runtime terbatas untuk menjalankan aplikasi. Tidak ada migration production yang pernah dijalankan dalam sesi ini.

```powershell
# Terminal API, dari folder api
npm run migration:run
npm run build
npm start
```

```powershell
# Terminal frontend, dari folder web
npm run dev
```

Buka frontend `http://localhost:3000`, health `http://localhost:4000/api/v1/health`, Swagger `http://localhost:4000/api/docs`.

Registrasi dan recovery memerlukan SMTP. Google login memerlukan client nyata. Tanpa konfigurasi tersebut, 503 adalah perilaku yang disengaja, bukan alasan mengganti provider dengan dummy production.

### Jika hanya ingin membuktikan ulang slice lokal tanpa credentials

```powershell
# Dari root, buat static output untuk harness
Set-Location web
$env:NEXT_PUBLIC_API_URL = 'http://localhost:4000'
npm run build
Set-Location ../api
$env:E2E = 'true'
npm test
Remove-Item Env:E2E -ErrorAction SilentlyContinue
Set-Location ..
```

Harness memerlukan **Microsoft Edge** terpasang (`channel: msedge`), port **3101** untuk static frontend dan **4000** untuk API. Hentikan API development yang memakai port 4000 sebelum menjalankan harness. Jangan menjalankan server frontend terpisah untuk tes ini. Tanpa `E2E=true`, browser test dilewati.

Untuk tes PostgreSQL nyata, set `TEST_DATABASE_URL` pada environment proses test ke database terpisah dengan nama berakhiran **`_test`**, berbeda dari `DATABASE_URL`. Tes menjalankan forward migration dan persistence check yang di-rollback. Jangan arahkan ke production. Tes ini belum pernah dijalankan.

## 6. Urutan pekerjaan berikutnya

1. Pastikan seluruh source dan lockfile terbawa. Cek struktur Git terbaru; tentukan repository/remote jika ingin sinkronisasi, tanpa menghapus source atau nested repository secara otomatis.
2. Sediakan Neon development/staging dan database testing terpisah. Verifikasi TLS, migration, role runtime, persistensi setelah restart dan transaksi/concurrency nyata.
3. Konfigurasikan SMTP; uji delivery verifikasi/resend/reset, expiry dan single-use melalui email nyata.
4. Konfigurasikan OAuth Google Web client. Redirect URI harus persis **`API_URL/api/v1/auth/google/callback`** (lokal: `http://localhost:4000/api/v1/auth/google/callback`). Uji consent, cancel/error, user baru dan benturan email akun lama.
5. Jalankan item manual yang relevan di [MANUAL_TEST_CHECKLIST](api/docs/phase-01/MANUAL_TEST_CHECKLIST.md). Jangan mengubah NOT TESTED menjadi PASS tanpa bukti.
6. Putuskan hosting/domain frontend/API sebelum penerimaan production. Disarankan subdomain same-site; domain GitHub Pages dan API yang tidak satu site bisa terkena pemblokiran third-party cookies. Jangan deploy atau mengubah konfigurasi production tanpa persetujuan.
7. Catat hasil baru dan blocker tersisa di laporan. Tetap di Phase 01 sampai acceptance terpenuhi.

## 7. Batasan yang harus tetap diingat

- Rate limiter saat ini per-process; sebelum multi-replica perlu shared storage. Proxy trust belum diaktifkan; backend di belakang proxy dapat membatasi semua user berdasarkan IP proxy yang sama.
- Cleanup baris session/token/OAuth yang expired belum dijadwalkan. Expired rows tidak bisa dipakai autentikasi.
- SMTP send dan commit database tidak atomik; commit gagal setelah send dapat menghasilkan tautan yang tidak valid, perlu retry. Tidak ada queue mail.
- Masih ada 8 advisory **development tooling web** (Vitest/mocker/tinypool dan ESLint/glob/braces). Audit produksi terakhir bersih; nilai ini adalah snapshot, bukan jaminan audit masa depan. Jangan expose dev/test server ke publik.
- Backend belum punya ESLint tersendiri; yang telah dijalankan adalah strict typecheck/build dan tes integrasi.
- Akun Google tidak ditautkan otomatis berdasarkan email; jangan melemahkan aturan ini agar login terlihat berhasil.
- Tidak ada progress dashboard, Phase 02, admin, atau sinkronisasi belajar yang perlu dilanjutkan sekarang.
- Refero live tidak tersedia karena subscription; visual dikunci pada existing design TajwidLens, tidak perlu mengulang riset/redesign.

## 8. Dokumen dan file untuk dibaca secara terarah

1. [IMPLEMENTATION_REPORT](api/docs/phase-01/IMPLEMENTATION_REPORT.md), [TEST_REPORT](api/docs/phase-01/TEST_REPORT.md), [MANUAL_TEST_CHECKLIST](api/docs/phase-01/MANUAL_TEST_CHECKLIST.md).
2. [API README](api/README.md) untuk konfigurasi dan operasi.
3. `api/IMPLEMENTATION_PHASES.md`, `api/ACCEPTANCE_TESTING.md`, `api/ENGINEERING_RULES.md` adalah sumber scope; jangan dihapus.
4. Sebelum edit web: `web/AGENTS.md` dan panduan Next.js terpasang yang relevan. Ikuti existing design di `web/DESIGN_NOTES.md`.
5. Baca file implementasi hanya yang terkait pekerjaan berikutnya; tidak perlu audit seluruh repo ulang.

## 9. Prompt siap tempel untuk sesi Codex di rumah

```text
Lanjutkan TajwidLens dari CHECKPOINT.md di root workspace. Baca checkpoint,
api/docs/phase-01/IMPLEMENTATION_REPORT.md dan TEST_REPORT.md terlebih dahulu.
Jangan membuat ulang backend/auth atau mengulang pekerjaan yang sudah selesai.
Gunakan Ponytail full: perubahan terkecil yang lengkap, aman, dan teruji.

Phase 01 sudah diimplementasikan dan diuji lokal dengan pg-mem, mock email/Google
dan Playwright. Belum terverifikasi pada Neon, Google OAuth live, SMTP live,
dan deployment. Lanjutkan dari blocker dan checklist yang belum selesai.
Periksa konfigurasi yang tersedia tanpa menampilkan secret. Bila credentials
belum ada, jelaskan kebutuhan yang spesifik dan lanjutkan pekerjaan independen.

Git saat checkpoint: root dan api adalah repository tanpa commit/remote;
web mengikuti root. Periksa ulang kondisi terbaru, jangan menghapus atau
merestrukturisasi Git otomatis dan jangan menganggap source sudah di-push.

Pertahankan static export, guest access, Quran Reader dan pipeline tajwid.
Jangan deploy/mengubah production tanpa persetujuan. Jangan mulai Phase 02.
Pisahkan IMPLEMENTED, TESTED, NOT VERIFIED, BLOCKED; update laporan dan
checkpoint dengan bukti baru. Tes ulang hanya bila perubahan atau lingkungan
baru memang memerlukan verifikasi, bukan mengulang semuanya dari nol.
```
