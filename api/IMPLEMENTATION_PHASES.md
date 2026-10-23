# Implementation Phases

## 01 — Backend Foundation + Full Authentication

**Prioritas:** Pertama

Buat repository NestJS terpisah, integrasi Neon PostgreSQL + TypeORM, registrasi manual, Google OAuth, profil pengguna, login/logout, reset password, dan integrasi autentikasi pada frontend.

**Hasil yang bisa diuji:** Pengguna dapat membuat akun, login, mengedit profil, logout, dan login kembali dengan data yang tetap tersimpan.

---

## 02 — Learning Progress + Personal Dashboard

Implementasi penyimpanan progress lesson, status penyelesaian, ringkasan belajar, dan sinkronisasi antarperangkat. UI menampilkan progress secara sederhana tanpa grafik berlebihan.

**Hasil yang bisa diuji:** Selesaikan materi di laptop, lalu login di perangkat lain dan progress tetap tersedia.

---

## 03 — Tajwid Detective + Mistake Replay

Buat latihan tajwid interaktif berbasis contoh tervalidasi, server-side answer evaluation, pencatatan kesalahan, dan review otomatis menggunakan variasi soal.

**Hasil yang bisa diuji:** Pengguna menjawab salah, menerima pembahasan, kemudian mendapat latihan ulang yang relevan.

---

## 04 — Admin Analytics + Production Readiness

Implementasi event tracking, dashboard admin, statistik penggunaan, optimasi query, security hardening, serta pengujian end-to-end dan deployment.

**Hasil yang bisa diuji:** Administrator dapat melihat statistik nyata, seluruh fitur lolos pengujian, dan sistem siap digunakan secara publik.