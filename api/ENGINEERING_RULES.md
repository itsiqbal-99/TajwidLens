# Engineering Rules

- Gunakan fitur bawaan NestJS dan TypeORM sebelum menambahkan library atau abstraction.
- Gunakan `Controller → Service → TypeORM Repository/Entity` sebagai pola default.
- Pisahkan business logic kompleks hanya jika memang diperlukan.
- Jangan membuat generic repository, CQRS, event bus, microservices, atau factory tanpa kebutuhan nyata.
- Gunakan nama class, method, dan variabel yang jelas.
- Hindari file raksasa, tetapi jangan memecah kode secara berlebihan.
- Jangan mengubah Quran Reader atau pipeline validasi tajwid tanpa alasan dan pengujian.
- Jangan membuat dummy data pada fitur production.
- Jangan menyimpan credentials, database URL, atau OAuth secrets dalam repository.
- Jangan melanjutkan tahap berikutnya sebelum mendapatkan persetujuan.