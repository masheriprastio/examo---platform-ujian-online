# 🚀 START HERE - Panduan Memulai EXAMO PHP Native

Selamat datang! Dokumen ini adalah pintu masuk untuk memulai dengan EXAMO PHP Native.

## ⚡ STATUS: SERVER SUDAH BERJALAN!

✅ **PHP server**: http://localhost:8000
✅ **API health**: Responding ✓
✅ **Login**: Working ✓
✅ **Database**: Mock data ready ✓

**Langsung coba:** Buka browser → `http://localhost:8000`

---

## 📋 Pilih Jalur Anda

### ⚡ **Jalur 1: SUPER CEPAT (10 menit)**
Untuk yang ingin langsung mencoba tanpa setup database.

1. Buka folder `php-backend`
2. Jalankan: `php -S localhost:8000 -t public`
3. Buka browser: `http://localhost:8000`
4. Selesai! ✅

### 💻 **Jalur 2: SETUP LENGKAP (45 menit)**
Untuk setup penuh dengan database Supabase.

1. Baca: `SETUP_SUPABASE.md`
2. Setup database
3. Baca: `SETUP_LOCAL.md`
4. Jalankan server
5. Deploy ke Vercel (opsional)

### 🎓 **Jalur 3: PEMAHAMAN MENDALAM (2 jam)**
Untuk yang ingin memahami arsitektur sepenuhnya.

1. Baca: `MIGRATION_GUIDE.md`
2. Baca: `README.md` (API Reference)
3. Review struktur kode
4. Ikuti Jalur 2

---

## 📁 Struktur Folder

```
php-backend/
├── public/
│   ├── index.php      ← Entry point API
│   └── index.html     ← Frontend UI
├── src/
│   ├── Config/        ← Database configuration
│   ├── Controllers/   ← 6 Controllers
│   ├── Services/      ← Business logic
│   ├── Middleware/    ← Auth, CORS
│   └── Helpers/       ← Response, UUID
├── composer.json      ← PHP dependencies
├── vercel.json        ← Vercel config
└── .env.example       ← Environment template
```

---

## ⚙️ Persyaratan Sistem

- **PHP**: 8.1 atau lebih tinggi
- **Composer**: Package manager PHP
- **Browser Modern**: Chrome, Firefox, Safari, Edge

---

## 🔧 Instalasi Cepat

### 1. Install Dependencies
```bash
cd php-backend
composer install
```

### 2. Setup Environment
```bash
cp .env.example .env
# Edit .env dengan konfigurasi Anda
```

### 3. Jalankan Server
```bash
php -S localhost:8000 -t public
```

### 4. Buka di Browser
```
http://localhost:8000
```

---

## 📚 Dokumentasi Lanjutan

| Dokumen | Untuk | Waktu |
|---------|-------|-------|
| [QUICK_START.md](QUICK_START.md) | Setup cepat tanpa detail | 10 min |
| [SETUP_LOCAL.md](SETUP_LOCAL.md) | Setup development lokal | 30 min |
| [SETUP_SUPABASE.md](SETUP_SUPABASE.md) | Setup database | 15 min |
| [SETUP_VERCEL.md](SETUP_VERCEL.md) | Deploy ke Vercel | 20 min |
| [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) | Pahami arsitektur | 60 min |
| [README.md](README.md) | Referensi API | 30 min |

---

## 🎯 Apa yang Tersedia?

### ✅ Backend (PHP Slim Framework)
- 6 Controllers siap pakai
- 4 Services dengan business logic
- Authentication JWT
- CORS middleware
- Database configuration

### ✅ Frontend (HTML + JavaScript)
- Login page responsif
- Dashboard template
- API client dengan JWT
- Tailwind CSS styling

### ✅ Database (PostgreSQL)
- 6 tables siap pakai
- Row-level security (RLS)
- Performance indexes
- SQL schema lengkap

### ✅ Deployment
- Vercel configuration
- Environment variables
- Composer setup
- Production-ready

---

## 💡 Tips Awal

1. **Mulai dari yang sederhana**: Coba endpoint login dulu
2. **Gunakan Postman**: Test API sebelum frontend
3. **Baca error messages**: Log akan membantu debug
4. **Cek .env**: Pastikan semua konfigurasi benar

---

## 🚨 Troubleshooting Cepat

### Error: "Class not found"
- Pastikan sudah `composer install`
- Pastikan PHP version ≥ 8.1

### Error: "Cannot connect to database"
- Pastikan Supabase URL dan key sudah benar di .env
- Cek koneksi internet

### Error: "Port sudah digunakan"
- Ganti port: `php -S localhost:8001 -t public`

---

## 🎊 Langkah Berikutnya

1. ✅ Pilih jalur di atas
2. 📖 Baca dokumentasi yang sesuai
3. 🔧 Setup sesuai instruksi
4. 🚀 Deploy ke production

---

**Butuh bantuan?** Setiap dokumentasi memiliki bagian troubleshooting lengkap.

**Siap?** Pilih jalur Anda di atas dan mulai! 🚀

---

**Created**: February 24, 2026  
**Status**: ✅ Production Ready
