# SIKAKU — Next.js + SQLite

Migrasi aplikasi SIKAKU dari PHP/MySQL ke Next.js App Router + SQLite lokal (`better-sqlite3`). Implementasi mengacu pada project PHP v16 dan ERD SIKAKU v14.

## Setup lokal

```bash
npm install
copy .env.example .env.local   # Windows CMD; PowerShell: Copy-Item .env.example .env.local
npm run db:init
npm run dev
```

Buka `http://localhost:3000`, lalu buat akun melalui halaman pendaftaran. Tidak ada akun demo; akun pertama menjadi admin. Isi `AUTH_SECRET` (minimal 32 karakter) dan `PRIVATE_TOTP_SECRET` pada `.env.local`. Secret TOTP dapat dibuat dengan `node scripts/generate-totp-secret.cjs`.

Database lokal disimpan di `data/sikaku.db`. File database dan dokumen upload dikecualikan dari Git. Impor data MySQL lama tersedia melalui `npm run db:import-mysql` setelah mengisi variabel `MYSQL_*` pada `.env.local` dan membuat backup terlebih dahulu.

## Modul inti yang sudah dipindahkan

- Multi-account: registrasi, login, session cookie HttpOnly, dan role admin/operator/viewer.
- Dashboard pagu, realisasi yang disetujui, sisa anggaran, dan persentase.
- Master program, kegiatan, sub kegiatan, rekening, dan pegawai/PPTK.
- Input anggaran, transaksi, rincian belanja, dan pembuatan kwitansi otomatis.
- Persetujuan kwitansi melalui PDF. Validasi pagu tetap menghitung transaksi posted yang menunggu persetujuan, sedangkan laporan realisasi hanya menghitung yang disetujui.
- Kartu kendali, monitoring, realisasi fisik bulanan, dan gerbang TOTP SIKAKU Private.

Ini merupakan migrasi fondasi dan alur utama, belum seluruh fitur PHP v16 direplikasi 1:1. Format cetak rinci, beberapa CRUD edit/hapus, foto profil, reset password, dan laporan A3 masih memerlukan pengembangan/validasi lanjutan.

## GitHub dan Vercel

Source lengkap dikemas dalam beberapa bagian base64 di folder `source/` supaya pengiriman Git lebih ringkas. Script `postinstall` menggabungkan dan mengekstrak source ke root project secara otomatis. GitHub Actions menjalankan typecheck dan build Next.js.

**Penting:** file SQLite lokal tidak cocok sebagai database operasional persisten di Vercel Functions. Filesystem deployment bersifat read-only kecuali `/tmp` yang sementara dan per-instance. Untuk preview/demo aplikasi memakai `/tmp/sikaku.db`; data dapat hilang atau tidak konsisten antar-instance. Upload PDF lokal juga tidak didukung pada Vercel. Untuk operasional gunakan VPS/server Node dengan disk persisten, atau migrasikan database ke layanan persisten/SQLite remote dan file upload ke object storage. Lihat `docs/DEPLOYMENT-VERCEL.md`.

## Environment

Salin `.env.example` ke `.env.local`. Untuk Vercel preview/demo atur `AUTH_SECRET` dan `PRIVATE_TOTP_SECRET` di Project Settings → Environment Variables. Jangan commit secret, database, PDF kwitansi, atau foto profil.
