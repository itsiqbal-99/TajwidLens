# TajwidLens — checkpoint untuk melanjutkan dari rumah

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
