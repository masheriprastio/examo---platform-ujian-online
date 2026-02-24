# Analisis Kelayakan & Performa: Migrasi ke PHP Native di Vercel dengan Supabase

Dokumen ini berisi analisis mendalam mengenai kelayakan (feasibility), estimasi performa, dan batasan penggunaan PHP Native yang di-deploy ke Vercel dengan database Supabase.

## 1. Kelayakan Teknis (Feasibility)

**Status:** **SANGAT MEMUNGKINKAN (FEASIBLE)**, namun dengan catatan arsitektur penting.

### Apakah bisa menggunakan PHP di Vercel?
**Ya, Bisa.** Vercel secara native mendukung JavaScript/TypeScript, Python, Go, dan Ruby. Untuk PHP, Anda dapat menggunakan **Community Runtime** seperti `vercel-php` (misalnya: `juicyfx/vercel-php`).

**Cara Kerja:**
- Setiap file PHP (misal `api/login.php` atau `index.php`) akan dijalankan sebagai **Serverless Function**.
- Serverless Function bersifat *stateless*. Artinya, tidak ada session file (`$_SESSION`) yang persisten secara default antar request kecuali Anda menggunakan database (Supabase) atau Redis untuk menyimpan session.

### Apakah bisa menggunakan Supabase?
**Ya, Sangat Bisa.**
- PHP dapat terhubung ke Supabase menggunakan driver `pgsql` atau `pdo_pgsql` standar.
- **PENTING:** Karena lingkungan Serverless (Vercel), setiap request PHP akan membuka koneksi baru ke database. Anda **WAJIB** menggunakan **Supabase Transaction Pooler (PgBouncer)** (port 6543) alih-alih koneksi langsung (port 5432) untuk menghindari error "Too many connections".

---

## 2. Analisis Performa (Lag & Delay)

Dalam arsitektur Serverless PHP + Vercel, "Lag" atau delay dapat terjadi karena dua faktor utama:

### A. Cold Start (Jeda Awal)
- **Apa itu?** Saat tidak ada user yang mengakses dalam beberapa menit, Vercel akan "menidurkan" fungsi PHP Anda.
- **Dampaknya:** User pertama yang mengakses setelah jeda akan mengalami **delay sekitar 1-3 detik** (Cold Start) saat server menyiapkan lingkungan PHP.
- **Solusi:** User berikutnya (Warm Start) akan merasakan akses cepat (< 200ms).

### B. Latency Database (Koneksi Berulang)
- **Masalah:** Aplikasi PHP tradisional biasanya berjalan di server yang koneksinya *persistent* (menetap). Di Vercel, setiap kali siswa klik tombol "Simpan Jawaban", script PHP baru menyala, konek ke DB, simpan, lalu mati.
- **Estimasi Delay Data:**
  - **Koneksi:** ~50-100ms (jika menggunakan Pooler & lokasi server sama, misal AWS Singapore & Supabase Singapore).
  - **Query:** ~20-50ms (untuk query ringan).
  - **Total Overhead:** Setiap request minimal memiliki overhead **~150ms** dibanding aplikasi yang berjalan terus-menerus (Node.js/Go).

### C. Real-time Features (Tantangan Terbesar)
- Aplikasi saat ini memiliki fitur **Live Monitoring** (Guru melihat status siswa secara real-time).
- **PHP Native:** Bersifat *Request-Response*. PHP **TIDAK BISA** melakukan push data ke dashboard guru secara native.
- **Dampak:** Dashboard Guru tidak akan update otomatis saat siswa curang/selesai ujian.
- **Solusi:** Anda harus menggunakan **Polling** (Dashboard guru me-refresh data setiap 5 detik via AJAX) atau tetap menggunakan sedikit **JavaScript (Supabase-JS)** di frontend hanya untuk fitur real-time.

---

## 3. Estimasi Kapasitas User (Concurrent Users)

Estimasi ini didasarkan pada **Supabase Free Tier** (gratis) yang memiliki batasan komputasi (2 CPU, 1GB RAM) dan koneksi database.

### Skenario: Ujian Serentak (Concurrent)

| Metrik | Supabase Free Tier (Direct) | Supabase Free Tier (Transaction Pooler) | Supabase Pro ($25/bln) |
| :--- | :--- | :--- | :--- |
| **Max Koneksi DB** | 60koneksi | ~500-1.000 koneksi semu | ~600-1.500+ |
| **User Aman (Tanpa Lag)** | **~50 User** | **~200-300 User** | **~1.000+ User** |
| **User Maksimal (Mulai Lag)** | > 60 User | > 500 User | > 2.000 User |

**Penjelasan:**
1.  **Tanpa Pooler (Direct Connection - Port 5432):** PHP di Vercel akan membuka 1 koneksi per user. Jika 61 siswa menekan tombol "Mulai" bersamaan, user ke-61 akan error atau loading sangat lama.
2.  **Dengan Pooler (Port 6543 - WAJIB):** Supabase mengantrikan request. 300 siswa bisa request bersamaan, tapi database memprosesnya bergantian dengan sangat cepat.
    - **Lag:** Pada 300 user serentak, mungkin ada delay **0.5 - 1 detik** saat menyimpan jawaban.
    - **Failure:** Di atas 500 user serentak pada Free Tier, CPU database akan spike 100% dan request mulai gagal (Time out).

---

## 4. Kesimpulan & Rekomendasi

### Jawaban Langsung:
1.  **Dapatkah dibuat dalam PHP Native?** **BISA.**
2.  **Deploy ke Vercel?** **BISA**, menggunakan runtime `vercel-php`.
3.  **Database Supabase?** **BISA**, wajib pakai Connection Pooler (Port 6543).
4.  **Perkiraan Performa (Lag)?**
    - **Cold Start:** 1-3 detik pertama kali akses.
    - **Normal:** Cepat (< 500ms).
    - **Heavy Load:** Akan terasa melambat jika > 200 user submit jawaban bersamaan.
5.  **Maksimal User (Concurrent)?**
    - **Aman:** 100-150 Siswa serentak (Free Tier + Optimasi).
    - **Batas Kritis:** 500 Siswa serentak (Potensi Down/Timeout di Free Tier).

### Rekomendasi Arsitektur PHP di Vercel:
Jika Anda memilih migrasi ke PHP Native:
1.  Gunakan library database ringan (PDO) dengan mode **Transaction Mode**.
2.  Simpan session di database (tabel `sessions`) atau cookie terenkripsi (JWT), jangan file system.
3.  Untuk fitur **Real-time Monitoring** (Cek Curang/Progress), tetap gunakan library **Supabase-JS di sisi Client (Frontend)** agar tidak membebani server PHP dengan polling terus-menerus.
