# 🚀 QUICK START - Setup dalam 10 Menit

Panduan ultra-cepat untuk setup EXAMO PHP Native.

## Step 1: Install Dependencies (2 menit)

```bash
cd php-backend
composer install
```

## Step 2: Setup Environment (2 menit)

```bash
cp .env.example .env
```

Edit `.env` dengan data Anda (untuk now, isi dummy):
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_key
JWT_SECRET=your_secret
```

## Step 3: Jalankan Server (1 menit)

```bash
php -S localhost:8000 -t public
```

## Step 4: Buka di Browser (1 menit)

```
http://localhost:8000
```

## Step 5: Test Login (4 menit)

Default credentials:
- Email: `teacher@examo.test`
- Password: `password123`

(Login sebenarnya membutuhkan Supabase - untuk sekarang gunakan browser console untuk set token manual)

---

## 3 Pilihan Lanjutan

### 1. Setup Database Supabase (Lakukan sekarang)
- Baca: `SETUP_SUPABASE.md`
- Setup database + SQL schema
- Alternatif: Skip dan gunakan mock data

### 2. Deploy ke Vercel (Lakukan nanti)
- Baca: `SETUP_VERCEL.md`
- Push ke GitHub
- Deploy dengan satu klik

### 3. Pahami Arsitektur (Opsional)
- Baca: `MIGRATION_GUIDE.md`
- Pelajari code structure
- Customize sesuai kebutuhan

---

## ✅ Done!

Sekarang Anda punya:
- ✅ PHP backend running
- ✅ Frontend UI accessible
- ✅ API endpoints ready

Langkah berikutnya:
- Setup database (Recommended)
- Deploy ke Vercel (Optional)
- Customize sesuai kebutuhan

---

**Perlu bantuan?** Lihat bagian Troubleshooting di README.md

**Siap deploy?** Lanjut ke SETUP_VERCEL.md
