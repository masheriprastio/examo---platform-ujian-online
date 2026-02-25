# 📅 Exam Scheduling Best Practices Guide

**Untuk**: Teacher yang ingin menggunakan fitur penjadwalan ujian  
**Tanggal**: 25 Februari 2026  
**Status**: Siap digunakan

---

## 🎯 Tujuan Fitur Penjadwalan

Fitur penjadwalan memungkinkan teacher untuk:
1. **Set Start Date** - kapan siswa boleh mulai ujian
2. **Set End Date** - kapan ujian ditutup/deadline
3. **Auto Hide/Show** - exam otomatis hide/show berdasarkan waktu
4. **Display Status** - siswa bisa lihat kapan ujian dimulai

---

## 📋 Panduang Penggunaan

### Step 1: Buat Exam (Baru atau Edit Existing)

Buka **Exam Editor** dan isi form:

```
Judul Ujian: Ujian Akhir Semester 1
Kategori: Matematika
Durasi: 90 menit
---
Mulai Ujian: [26 Feb 2026, 08:00]  ← Jangan kosongkan
Selesai Ujian: [26 Feb 2026, 10:00]  ← Jangan kosongkan
---
Status: Published  ← HARUS publish!
```

### Step 2: Set Tanggal & Jam dengan Benar

**Important**: Gunakan format lokal browser Anda (id-ID):
- Misal: `26 Februari 2026, 08:00` (`datetime-local` HTML input)

**Tips**:
- Mulai ujian **15 menit lebih awal** sebelum kelas dimulai (buffer)
- End date **5-10 menit** setelah durasi ujian (buffer masalah network)

**Contoh yang BENAR**:
```
Durasi: 60 menit
Mulai: 26 Feb 2026, 08:00
Selesai: 26 Feb 2026, 10:00  ← 2 jam, lebih dari durasi (buffer)
```

**Contoh yang SALAH**:
```
Durasi: 60 menit
Mulai: 26 Feb 2026, 08:00
Selesai: 26 Feb 2026, 09:00  ← Tepat sama dengan durasi (no buffer!)
```

### Step 3: Publish Exam

Klik tombol **"Publish"** saat exam sudah siap:
- Status berubah dari `draft` → `published`
- Start date & end date tersimpan ke database
- Siswa akan melihat exam di dashboard mereka (sesuai jadwal)

### Step 4: Lihat Status di Dashboard

**Untuk Teacher**:
1. Go to **Dashboard** → **Buku Nilai**
2. Lihat exam dengan status "Published" + tanggal/jam

**Untuk Student**:
1. Go to **Dashboard**
2. Lihat tab "**Ujian Tersedia**" (hanya exam yang aktif)
3. Lihat tab "**Ujian Mendatang**" (exam yang belum dimulai)
4. Lihat tab "**Ujian Selesai**" (exam yang sudah berakhir)

---

## 🗓️ Senario Praktis

### Scenario 1: Ujian Reguler (Kelas Offline)

```
Siswa hadir kelas pada Senin, 26 Feb 2026, jam 08:00

Teacher setup:
- Mulai: 26 Feb 2026, 07:50 (10 menit sebelum)
- Selesai: 26 Feb 2026, 09:50 (durasi 60 menit + 50 menit buffer)

Behavior:
- Sebelum 07:50: Siswa lihat "Ujian Mendatang (XX jam lagi)"
- Jam 07:50-09:50: Siswa lihat "Ujian Tersedia [Mulai Sekarang]"
- Setelah 09:50: Siswa tidak bisa mulai, lihat "Ujian Selesai"
```

### Scenario 2: Ujian Online Asynchronous

```
Teacher ingin siswa bisa ujian kapan saja dalam 1 minggu

Teacher setup:
- Mulai: 26 Feb 2026, 00:00
- Selesai: 2 Maret 2026, 23:59

Behavior:
- Selama 1 minggu: Siswa lihat "Ujian Tersedia" dan bisa start kapan saja
- Setelah deadline: Siswa lihat "Ujian Selesai"
```

### Scenario 3: Multiple Batches (Beberapa Kelas)

```
3 kelas, berbeda jadwal:

Exam 1 (Kelas A pagi):
- Mulai: 26 Feb 2026, 08:00
- Selesai: 26 Feb 2026, 10:00

Exam 2 (Kelas B siang):
- Mulai: 26 Feb 2026, 12:00
- Selesai: 26 Feb 2026, 14:00

Exam 3 (Kelas C malam):
- Mulai: 26 Feb 2026, 18:00
- Selesai: 26 Feb 2026, 20:00

Cara:
1. Buat 3 exam terpisah (duplikat questions)
2. Ketiganya bisa have same title tapi jadwal berbeda
3. Assign siswa ke exam yang appropriate
```

---

## 🛠️ Troubleshooting

### Problem: "Ujian saya tidak tampil di dashboard siswa"

**Checklist**:
1. ✅ Exam status = "Published"?
   - Go to **Bank Soal** → cek status

2. ✅ Start date sudah lewat?
   - Buka **Exam Editor** → cek Mulai Ujian
   - Harus: `Mulai <= sekarang`

3. ✅ End date belum lewat?
   - Buka **Exam Editor** → cek Selesai Ujian
   - Harus: `Selesai >= sekarang`

4. ✅ Siswa sudah di-assign?
   - Di beberapa sistem, perlu assign siswa ke exam
   - Check dengan admin

**Solution**:
```
Klik "Segarkan" di dashboard siswa
(System akan re-fetch data dari database)
```

---

### Problem: "Ujian sudah selesai tapi siswa bisa masih masuk"

**Mungkin Penyebab**:
1. Browser siswa sudah load halaman → perlu refresh
2. Clock browser siswa tidak sinkron dengan server
3. Ada delay dalam sync database

**Solution**:
1. Minta siswa **refresh page** (Ctrl+R / Cmd+R)
2. Atau teacher **reset exam** untuk siswa tersebut
3. Check timezone browser vs database

---

### Problem: "Timer exam sudah selesai tapi siswa belum submit"

Sistem Examo memiliki **auto-submit** jika:
- Timer habis
- Siswa click "Submit"
- Tab di-blur 3x (cheating detection)

**Jika siswa belum submit ketika time's up**:
- Exam otomatis submit dengan answers terakhir
- Mark sebagai `completed` di database
- Siswa bisa tidak lihat score kalau belum refresh

---

## 📊 Monitoring Status

### Teacher Dashboard Stats

```
Dashboard menampilkan:
- "Ujian Aktif": Exam yang sedang berlangsung (dalam jadwal)
- "Ujian Mendatang": Exam yang akan dimulai
- "Ujian Selesai": Exam yang deadline-nya lewat
```

### View All Exams

Go to **Bank Soal** → lihat kolom:
- Mulai: [tanggal jam]
- Selesai: [tanggal jam]
- Status: [draft|published]

---

## 🔔 Notifikasi & Alerts

### Untuk Siswa

Sistem akan menampilkan:
```
✅ "Ujian Tersedia (3)"
   - Ujian siap dikerjakan sekarang

⏳ "Ujian Mendatang (2)"
   - Ujian akan dimulai dalam XX hari

❌ "Ujian Selesai (1)"
   - Deadline sudah lewat, tidak bisa dikerjakan
```

### Untuk Teacher

Recommendations untuk implementasi di masa depan:
- [ ] Email notif 24 jam sebelum ujian
- [ ] Slack/Discord webhook saat ada exam mulai
- [ ] SMS reminder untuk siswa yang belum ujian

---

## 🎓 Contoh Use Case Sekolah

### SMA Negeri 1 - Ujian Akhir Semester

```
Kelas: XII-IPA-1, XII-IPA-2, XII-IPS-1, XII-IPS-2

Timeline:
Senin 26 Feb:
- 08:00-10:00: XII-IPA-1 Ujian Matematika
- 10:15-12:15: XII-IPA-2 Ujian Matematika
- 13:00-15:00: XII-IPS-1 Bahasa Indonesia
- 15:15-17:15: XII-IPS-2 Bahasa Indonesia

Teacher lakukan:
1. Buat 4 exam dengan questions sama
2. Set jadwal unik untuk setiap kelas
3. Assign siswa ke exam mereka
4. Publish semua pada hari H-1

Result:
- Ujian berjalan terstruktur
- Siswa tidak bisa lihat exam kelas lain
- Teacher bisa monitor progress real-time
```

---

## 📱 Browser & Device Compatibility

| Browser | Support | Note |
|---------|---------|------|
| Chrome  | ✅ | Recommended, full support |
| Firefox | ✅ | Full support |
| Safari  | ✅ | Full support |
| Edge    | ✅ | Full support |
| Mobile Safari (iOS) | ⚠️ | May have timezone issues |

**Tips untuk Mobile**:
- Recommend browser Chrome untuk Android
- iOS user: use Safari dalam dalam Web View
- Always test datetime dialogs di browser target

---

## 🔐 Security Notes

### Important

1. **Start time dapat di-manipulasi** jika user:
   - Buka DevTools dan ubah `new Date()`
   - Set clock browser mundur

   **Mitigation**: Server-side validation (implement di backend)

2. **Siswa bisa lihat exam yang akan datang**
   - Ini features, bukan bug
   - Siswa bisa prepare
   - Jika ingin hide, implementasi "hidden mode"

3. **No timezone conversion**
   - Menggunakan browser timezone user
   - Jika lintas timezone, set timezone di database (future)

---

## 📚 Related Documentation

- [App.tsx Helper Functions](../App.tsx#L56)
- [Student Dashboard Implementation](../App.tsx#L2167)
- [Exam Scheduling Bug Fix](./EXAM_SCHEDULING_BUG_FIX.md)
- [Database Schema - start_date, end_date columns](../SUPABASE_SCHEMA.sql)

---

## 🎯 Summary

**Key Takeaways**:
1. ✅ Set **Start Date** = kapan siswa mulai ujian
2. ✅ Set **End Date** = deadline/kapan ujian ditutup
3. ✅ **PUBLISH** exam untuk make it visible
4. ✅ Siswa lihat tiga tab: Tersedia, Mendatang, Selesai
5. ✅ Gunakan timezone lokal browser (sekarang)

**Next Steps**:
- [ ] Test dengan 1 exam sederhana
- [ ] Monitor bahwa schedule bekerja dengan benar
- [ ] Use untuk ujian production

---

**Created by**: GitHub Copilot  
**Last Updated**: 25 Februari 2026
