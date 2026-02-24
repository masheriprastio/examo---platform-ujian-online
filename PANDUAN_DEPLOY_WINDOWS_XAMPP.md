# Panduan Deployment: React (SPA) di Windows Server (XAMPP/Apache)

Panduan ini menjelaskan cara melakukan deployment aplikasi React yang sudah ada ke server lokal Windows menggunakan **XAMPP/Apache**, tanpa perlu melakukan *rewrite* kode ke PHP Native.

Metode ini disebut **"Solusi Tengah"** karena menggabungkan performa modern aplikasi React (SPA) dengan kemudahan pengelolaan server Windows/XAMPP yang umum di sekolah.

---

## 1. Persiapan Server Windows (XAMPP)

Pastikan XAMPP sudah terinstall dan modul **Apache** berjalan.

1.  Buka **XAMPP Control Panel**.
2.  Start **Apache**.
3.  Pastikan tidak ada error di port 80/443.

---

## 2. Proses Build Aplikasi (Di Komputer Development)

Aplikasi React tidak bisa langsung ditaruh begitu saja. Kode harus di-*compile* (build) menjadi file statis (HTML, CSS, JS) agar bisa dibaca browser.

**Langkah-langkah:**

1.  Buka Terminal/Command Prompt di folder proyek `examo`.
2.  Pastikan file `.env` sudah berisi konfigurasi Supabase Production yang benar:
    ```env
    VITE_SUPABASE_URL=https://xyz.supabase.co
    VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
    ```
3.  Jalankan perintah build:
    ```bash
    npm run build
    ```
4.  Tunggu hingga selesai. Akan muncul folder baru bernama **`dist`**.
    *   Isi folder `dist` inilah yang akan kita copy ke server.

---

## 3. Upload ke Server Windows (XAMPP)

1.  Buka folder instalasi XAMPP, biasanya di `C:\xampp\htdocs`.
2.  Buat folder baru untuk aplikasi, misalnya `examo`.
    *   Path: `C:\xampp\htdocs\examo\`
3.  Copy **seluruh isi** folder `dist` (hasil build tadi) ke dalam folder `examo` tersebut.
    *   Struktur akhir harusnya seperti ini:
        ```text
        C:\xampp\htdocs\examo\
        ├── index.html
        ├── assets\
        │   ├── index-Dx8s...js
        │   └── index-Ab3d...css
        └── vite.svg
        ```

---

## 4. Konfigurasi Routing Apache (.htaccess) - **SANGAT PENTING**

Karena ini adalah Single Page Application (SPA), server Apache perlu dikonfigurasi agar **semua request** (seperti `/login`, `/dashboard`, `/ujian`) diarahkan kembali ke `index.html`. Tanpa ini, jika user me-refresh halaman, akan muncul **Error 404 Not Found**.

1.  Buka Notepad/Text Editor.
2.  Copy kode berikut:
    ```apache
    <IfModule mod_rewrite.c>
      RewriteEngine On
      RewriteBase /examo/
      RewriteRule ^index\.html$ - [L]
      RewriteCond %{REQUEST_FILENAME} !-f
      RewriteCond %{REQUEST_FILENAME} !-d
      RewriteRule . /examo/index.html [L]
    </IfModule>
    ```
    *   *Catatan:* Jika nama foldernya bukan `examo`, ganti `/examo/` sesuai nama folder Anda.
3.  Simpan file ini dengan nama **`.htaccess`** (tanpa ekstensi .txt) di dalam folder `C:\xampp\htdocs\examo\`.

---

## 5. Pengujian & Troubleshooting

1.  Buka browser di server atau klien (Lab Komputer).
2.  Akses alamat: `http://localhost/examo` atau `http://[IP-SERVER]/examo`.
3.  Coba login dan navigasi menu.
4.  **Tes Refresh:** Masuk ke halaman dashboard, lalu tekan F5 (Refresh). Jika tidak muncul 404, berarti konfigurasi `.htaccess` berhasil.

### Masalah Umum:
*   **Halaman Putih (Blank):**
    *   Cek Console Browser (F12). Jika ada error 404 pada file `.js` atau `.css`, kemungkinan path di `vite.config.ts` belum disesuaikan.
    *   **Solusi:** Edit `vite.config.ts`, tambahkan `base: '/examo/'` di dalam `defineConfig`, lalu `npm run build` ulang.

*   **Error Network Supabase:**
    *   Pastikan server sekolah memiliki koneksi internet untuk mengakses Supabase Cloud.
    *   Jika menggunakan proxy sekolah, pastikan domain `*.supabase.co` di-whitelist.

---

## 6. Analisis Performa 100 User (Solusi Tengah)

Dengan metode ini (React di XAMPP + Supabase Cloud):

| Aspek | Performa | Catatan |
| :--- | :--- | :--- |
| **Loading Awal** | **Sangat Cepat** (Lokal) | File JS/CSS diambil dari Server Lokal (LAN Sekolah). Tidak membebani internet. |
| **Pindah Halaman** | **Instan** (SPA) | Tidak ada reload halaman. UX sangat mulus. |
| **Simpan Jawaban** | Tergantung Internet | Tetap mengirim data JSON kecil ke Supabase Cloud. Gunakan Pooler (Port 6543) jika bisa. |
| **Gambar Soal** | **Cepat** (Jika Lokal) | Simpan gambar di folder `public/images` di project React, lalu build. Gambar akan diload dari LAN. |
| **Beban Server** | Sangat Ringan | XAMPP hanya melayani file statis. Komputasi berat ada di browser siswa (Client-Side). |

**Kesimpulan:**
Ini adalah solusi paling efisien. Anda mendapatkan aplikasi modern, cepat, dan ringan di sisi server, tanpa perlu menulis ulang kode.
