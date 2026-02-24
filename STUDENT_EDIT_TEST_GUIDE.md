# Testing Guide: Student Edit Data Update

## 📋 Setup Awal

1. **Jalankan aplikasi**:
   ```bash
   npm run dev
   # Aplikasi berjalan di http://localhost:3000
   ```

2. **Login sebagai Guru**:
   - Email: `guru@sekolah.id`
   - Password: `password`

3. **Navigasi ke Manajemen Siswa**:
   - Sidebar → "Manajemen Siswa"

---

## ✅ Test Case 1: Edit Email Siswa

### Steps:
1. Lihat daftar siswa di table
2. Cari siswa "Ada Tes" atau siswa lain yang ada
3. Klik tombol **Edit** (icon pensil)
4. Ubah **Email Access** menjadi email baru, contoh: `ada_baru@sekolah.id`
5. Klik tombol **Update Siswa** (biru)

### Expected Result:
- ✅ Dialog hilang
- ✅ Alert hijau: "Data siswa berhasil diperbarui!"
- ✅ Daftar siswa terupdate dengan email baru
- ✅ Jika refresh browser, email tetap berubah (persist di DB)

### Verification Login:
1. **Logout** (klik "Keluar" di sidebar)
2. Login dengan email baru: `ada_baru@sekolah.id`
3. Password: `password` (default)
4. ✅ Login **HARUS berhasil** (jika gagal, fix belum jalan)

---

## ✅ Test Case 2: Edit Password Siswa

### Steps:
1. Login sebagai Guru lagi
2. Buka **Manajemen Siswa**
3. Edit salah satu siswa
4. Ubah **Password** menjadi password baru: `password_baru123`
5. Klik **Update Siswa**

### Expected Result:
- ✅ Alert sukses muncul
- ✅ Data di-list terupdate

### Verification Login:
1. **Logout**
2. Login dengan email siswa
3. Masukkan password baru: `password_baru123`
4. ✅ Login **HARUS berhasil**

---

## ✅ Test Case 3: Edit Multiple Fields Sekaligus

### Steps:
1. Login sebagai Guru
2. Buka **Manajemen Siswa**
3. Edit siswa, ubah:
   - **Nama Lengkap**: `Budi Santoso New`
   - **NIS**: `9999`
   - **Kelas**: `XII-IPA-2`
   - **Email**: `budi_new@sekolah.id`
   - **Password**: `budipass123`
4. Klik **Update Siswa**

### Expected Result:
- ✅ Semua field terupdate di table
- ✅ Alert sukses
- ✅ Refresh browser → data tetap berubah

---

## ✅ Test Case 4: Edit dengan Data Kosong (Validasi)

### Steps:
1. Edit siswa
2. Kosongkan **Nama Lengkap**
3. Klik **Update Siswa**

### Expected Result:
- ⚠️ Alert error: "Nama dan salah satu dari Email atau NIS wajib diisi."
- ✅ Dialog tetap terbuka, data tidak ter-update

---

## ✅ Test Case 5: Test Rollback (Simulasi Error)

> **Note**: Test ini hanya bisa jika menggunakan mock DB (tanpa Supabase)

### Steps:
1. Ubah Supabase key di `vite.config.ts` menjadi invalid/kosong
2. Restart aplikasi: `npm run dev`
3. Login sebagai Guru
4. Edit siswa, ubah email
5. Klik **Update Siswa**

### Expected Result:
- ✅ Alert error muncul (atau warning di console)
- ✅ UI tidak berubah (rollback otomatis)

---

## 🔍 Console Debugging

Buka **Developer Tools** (F12) → **Console** tab untuk lihat:

### Saat Edit Berhasil:
```
[Supabase] Connected to: ...
```

### Jika Ada Error:
```
Failed to update student: {error_message}
```

---

## 📊 Checklist Verifikasi

| Test | Status | Note |
|------|--------|------|
| Edit email → login dengan email baru | ❓ | Cek di browser lain |
| Edit password → login dengan password baru | ❓ | Default password: `password` |
| Edit nama/kelas → terupdate di table | ❓ | Instant update |
| Refresh browser → data persist | ❓ | Cek localStorage/DB |
| Edit kosong email (error) | ❓ | Validasi form |
| Multiple edits sekaligus | ❓ | Cek semua field terupdate |

---

## 🚀 Kalau Semua Test Pass

✅ **Fix ini berhasil jalan!**

Data edit siswa sekarang:
- Terupdate realtime di UI
- Tersimpan ke database Supabase
- Dapat digunakan untuk login dengan password/email baru
- Tetap persist setelah refresh browser

---

## ❌ Troubleshooting Jika Ada Masalah

### Masalah 1: Edit berhasil di UI tapi tidak bisa login dengan data baru

**Solusi**:
1. Cek di Supabase dashboard → `users` table
2. Cek apakah data benar-benar terupdate di DB
3. Lihat console untuk error message
4. Restart aplikasi: `npm run dev`

### Masalah 2: Alert gagal update

**Solusi**:
1. Cek koneksi internet & Supabase status
2. Lihat error message di alert
3. Cek Supabase credentials di `vite.config.ts`

### Masalah 3: Data tidak persist (hilang saat refresh)

**Solusi**:
1. Cek apakah Supabase configured dengan benar
2. Lihat browser console untuk error
3. Cek Supabase `users` table apakah datanya ada
4. Mungkin menggunakan mock mode (fallback) - cek console warning

---

**Last Updated**: 2025-02-24
**Status**: Ready to Test ✅
