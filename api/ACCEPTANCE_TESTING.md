# Acceptance Testing

Dokumen ini menjelaskan automated testing dan manual acceptance test untuk setiap fase implementasi.

| Tahap | Automated Testing | Manual Acceptance Test |
|---|---|---|
| **01 — Authentication** | Unit auth, API integration, OAuth security, Playwright registration/login | Daftar manual dan Google, edit nama, logout/login |
| **02 — Learning** | Progress persistence, ownership, duplicate update, API contract | Selesaikan lesson dan cek progress lintas perangkat |
| **03 — Detective** | Answer validation, content integrity, duplicate submission, review scheduling | Jawab benar/salah dan coba Mistake Replay |
| **04 — Analytics** | Aggregation accuracy, RBAC, pagination, performance, full regression | Admin melihat data nyata, user biasa ditolak |