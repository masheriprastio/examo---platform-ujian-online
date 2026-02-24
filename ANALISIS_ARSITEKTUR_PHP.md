# Analisis Arsitektur & Performa: Implementasi PHP (Vercel & Windows Server)

Dokumen ini berisi analisis mendalam mengenai kelayakan, struktur file, dan performa aplikasi ujian online berbasis PHP Native dengan database Supabase, baik untuk deployment Cloud (Vercel) maupun On-Premise (Windows Server).

---

## 1. Arsitektur 1: Cloud Deployment (Vercel + Supabase)

**Status:** **SANGAT MEMUNGKINKAN**, namun dengan catatan arsitektur penting.

### Analisis Performa (Lag & Delay)
Dalam arsitektur Serverless PHP + Vercel, "Lag" dapat terjadi karena:
1.  **Cold Start (1-3 detik):** Jeda awal saat server menyiapkan lingkungan PHP setelah tidak aktif.
2.  **Latency Database:** Setiap request PHP membuka koneksi baru. Overhead ~150ms per request.

### Estimasi Kapasitas User (Concurrent)
Estimasi berdasarkan **Supabase Free Tier**:

| Metrik | Tanpa Pooler (Direct) | Dengan Transaction Pooler (Port 6543) |
| :--- | :--- | :--- |
| **Max Koneksi** | 60 koneksi | ~500 koneksi semu |
| **User Aman** | **~50 User** | **~200-300 User** |
| **User Maksimal** | > 60 User (Error) | > 500 User (Timeout/Lambat) |

**PENTING:** Wajib menggunakan **Supabase Transaction Pooler (PgBouncer)** untuk menghindari error "Too many connections".

---

## 2. Arsitektur 2: Windows Server (Sekolah) + Supabase Cloud

**Skenario:** Aplikasi PHP diinstall di server lokal sekolah (Windows/XAMPP), database tetap di Cloud (Supabase), diakses oleh 100 siswa di lab komputer.

### A. Struktur Folder & Instalasi di Windows
Jika menggunakan **XAMPP**, folder proyek diletakkan di `htdocs`.

**Lokasi Folder:**
`C:\xampp\htdocs\examo\`

**Struktur File yang Disarankan (PHP Native):**
```text
C:\xampp\htdocs\examo\
├── index.php           (Router utama / Halaman Login)
├── config.php          (Koneksi Database ke Supabase Cloud)
├── assets\             (CSS, JS, Gambar)
│   ├── style.css
│   └── script.js
├── views\              (Tampilan HTML/PHP)
│   ├── dashboard_siswa.php
│   ├── ujian.php
│   └── dashboard_guru.php
├── api\                (Endpoint untuk AJAX/Fetch)
│   ├── simpan_jawaban.php
│   └── ambil_soal.php
└── vendor\             (Jika pakai Composer untuk library PDF/Excel)
```

**Konfigurasi Web Server (Apache/XAMPP):**
- Pastikan ekstensi `php_pgsql` atau `php_pdo_pgsql` aktif di `php.ini` (hapus tanda titik koma `;`).
- Restart Apache setelah edit `php.ini`.

### B. Analisis Performa: 100 User (Sekolah) -> Cloud DB

Ini adalah bagian **KRITIS**. Performa sangat bergantung pada **Koneksi Internet Sekolah**.

**Potensi Masalah (Lag/Delay):**
1.  **Bandwidth Bottleneck:**
    - 100 siswa memuat soal (misal ada gambar) secara bersamaan.
    - Jika 1 soal = 100KB, 50 soal = 5MB.
    - 100 siswa x 5MB = **500 MB** data ditarik serentak di awal ujian.
    - **Risiko:** Internet sekolah akan *choke* (macet total) selama 1-2 menit awal.

2.  **Latency Tinggi (Simpan Jawaban):**
    - Saat siswa menjawab soal no. 1, aplikasi mengirim request ke Supabase (Server di Singapura/US).
    - Jika ping internet sekolah ke Supabase tinggi (misal > 100ms), akan terasa delay setiap klik "Simpan".
    - **Autosave:** Jika autosave jalan tiap 30 detik untuk 100 siswa = 200 request per menit dari satu IP public sekolah.

3.  **IP Rate Limiting:**
    - Supabase (atau Cloud provider lain) mungkin membatasi jumlah koneksi dari **satu alamat IP Public** (IP Sekolah).
    - 100 koneksi database serentak dari 1 IP bisa dianggap serangan (DDoS) atau terkena limit koneksi.

### C. Solusi & Rekomendasi (Windows Server)

Agar 100 user lancar tanpa lag parah dengan database Cloud:

1.  **WAJIB Gunakan Transaction Pooler (Port 6543):**
    - Di file `config.php`, gunakan port 6543, bukan 5432. Ini wajib agar koneksi dari 100 siswa antri dengan rapi di sisi Cloud.

2.  **Caching Soal (Penting):**
    - Saat ujian dimulai, jangan biarkan 100 siswa *hit* database Supabase terus-menerus untuk setiap soal.
    - **Teknik:** Ambil *semua* soal di awal (sekali fetch), simpan di session PHP atau `localStorage` browser siswa. Kirim jawaban ke server hanya saat autosave (berkala) atau selesai.

3.  **Optimasi Bandwidth Gambar:**
    - Jika soal ada gambar, simpan gambar di folder lokal Windows (`C:\xampp\htdocs\examo\assets\soal\`), jangan ambil URL gambar dari Supabase Storage (Cloud). Ini menghemat bandwidth internet sekolah drastis.

4.  **Estimasi Delay Real:**
    - **Login:** Cepat (< 1 detik).
    - **Load Soal (Awal):** Agak lambat (5-10 detik) jika internet sekolah standar (Indihome 100Mbps dibagi 100 user).
    - **Pengerjaan:** Lancar jika soal sudah di-load di browser.
    - **Submit:** Cepat (karena hanya kirim teks jawaban JSON).

---

## 3. Kesimpulan Akhir

| Pertanyaan | Jawaban Singkat |
| :--- | :--- |
| **Dapatkah dibuat dalam PHP Native?** | **BISA.** Sangat fleksibel. |
| **Folder Instalasi Windows?** | `C:\xampp\htdocs\examo\` (XAMPP). |
| **Database Supabase?** | **BISA.** Wajib pakai Port 6543 (Pooler). |
| **Performa 100 User (Windows)?** | **LANCAR** *jika* gambar disimpan lokal & pakai Pooler. **LAG PARAH** jika semua aset ditarik dari Cloud. |
| **Rekomendasi Terbaik?** | Gunakan PHP di Windows Server, database Supabase Cloud (Port 6543), tapi **gambar/file soal disimpan di folder lokal Windows** untuk menghemat bandwidth. |
