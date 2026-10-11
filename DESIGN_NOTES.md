# TajwidLens — Reading-first redesign

## Arah desain

Desain baru mengikuti prinsip **editorial minimalism**: permukaan ivory, typography Inter dan Noto Naskh Arabic, forest green sebagai warna merek, emas sebagai aksen minimal, layout asimetris, divider halus, dan penggunaan kartu hanya ketika membantu struktur informasi.

Tidak ada gradient neon, bayangan berlebihan, statistik fiktif, pola dekoratif, atau animasi loop yang tidak relevan.

## Perubahan utama

- **Beranda:** layout editorial baru; hero dua kolom, demo bacaan terkurasi yang interaktif (Ikhfa vs Mad ‘Aridh), alur tiga langkah, penjelasan waqaf/wasal, daftar jalur belajar berbasis baris, CTA terarah.
- **Navigasi:** brandmark SVG flat, menu desktop lebih ringkas, CTA panduan bacaan jelas, navigasi mobile dengan ikon, theme toggle dengan state aksesibel.
- **Pembaca:** workspace lebih ringan; kontrol lebih rapi; penanda tajwid hijau / emas / biru; panel modal seluler diberi backdrop dan tombol tutup; pesan status anotasi tetap transparan.
- **Koleksi materi, halaman detail, pelafalan, referensi:** perubahan visual terpusat pada design system; data dan logic lama tidak diganti.
- **Icon pack:** favicon `.ico` dan PNG dibuat ulang secara lokal berdasarkan brandmark flat, dalam warna forest / ivory / warm gold.
- **Kompatibilitas:** static export Next.js dan workflow GitHub Pages tetap tersedia. Gunakan branch `main`.

## File desain

- `src/app/globals.css`: gaya komponen existing; menghapus override lama `Colorful learning palette`.
- `src/app/reading-first.css`: design system redesign baru, pemolesan halaman dan breakpoint responsif.
- `src/components/hero-reading-demo.tsx`: demo client-side, menerima teks ayat terverifikasi dari server page agar dataset penuh tidak dibundel ulang ke browser.
- `src/components/shell.tsx`: navigasi, branding, footer.
- `src/app/page.tsx`: home baru.
- `scripts/generate-brand-icons.py`: regenerasi aset favicon flat.

## Batasan penting

**Konten asli tidak diubah:** teks mushaf, kaidah manual, rule detector, dan metadata tetap milik versi sebelumnya. Akurasi anotasi otomatis perlu audit lebih lanjut dengan guru ahli. Tidak ada audio tilawah yang dibuat atau diklaim tersedia.

**Validasi lingkungan:** file TypeScript dapat diperiksa secara sintaksis, tetapi instalasi dependensi / production build pada lingkungan penyusunan ini terkendala DNS registry npm (EAI_AGAIN). Lakukan `npm ci && npm run typecheck && npm run lint && npm run test && npm run build` sebelum push production. Tidak ada klaim pengujian browser yang belum berhasil dijalankan.

## Deployment

Di repository GitHub → Settings → Secrets and variables → Actions → Variables, definisikan `NEXT_PUBLIC_REPO_NAME=TajwidLens` (opsional; workflow akan memakai nama repo GitHub jika tidak diisi).

Pastikan Settings → Pages → Build and deployment → GitHub Actions. Push ke branch `main` untuk deploy.
