# Workflow: Draft vs Published Exams

## 📋 Penjelasan

Examo memiliki dua status untuk ujian:

### **DRAFT** (Kuning) 🟡
- Ujian yang sedang dibuat/diedit oleh guru
- **Tidak terlihat** oleh siswa
- Guru bisa menambah/mengubah soal
- Status default saat membuat ujian baru

### **PUBLISHED** (Hijau) 🟢
- Ujian yang sudah siap dan terlihat oleh siswa
- Siswa bisa memulai mengerjakan
- Guru masih bisa mengedit (tetapi tidak disarankan setelah siswa mulai)

---

## 🎓 Workflow Guru: Membuat & Publikasikan Ujian

### Step 1: Buat Ujian Baru
```
Dashboard Guru → Buat Ujian Baru → Buat Manual
```
- Status otomatis: **DRAFT** (kuning)
- Ujian hanya terlihat di dashboard guru, **TIDAK** di dashboard siswa

### Step 2: Edit & Tambah Soal
```
Ujian Tersedia → Klik Edit (icon pensil)
```
- Ubah judul, deskripsi, durasi
- Tambah pertanyaan dengan berbagai tipe:
  - Pilihan Ganda (MCQ)
  - Benar/Salah
  - Isian Singkat
  - Esai
  - Multiple Select

### Step 3: Publikasikan ke Siswa
```
Di Exam Editor → Cek checkbox "Publikasikan Ujian (Tampil ke Siswa)"
```
- Status berubah menjadi: **PUBLISHED** (hijau)
- Ujian sekarang terlihat oleh **semua siswa** di dashboard mereka
- Siswa bisa mulai mengerjakan

### Step 4: Simpan Ujian
```
Klik tombol "Simpan Ujian"
```
- Ujian disimpan ke database dengan status sesuai pilihan

---

## 👨‍🎓 Workflow Siswa: Lihat & Kerjakan Ujian

### Hanya Melihat Ujian Published
```
Dashboard Siswa → Ujian Tersedia
```
- Hanya ujian dengan status **PUBLISHED** (hijau) yang terlihat
- Draft ujian **TIDAK** ditampilkan

### Mulai Mengerjakan
```
Klik ujian → Klik "Mulai Ujian"
```
- Timer dimulai sesuai durasi ujian
- Jawaban otomatis disimpan setiap perubahan
- Status menjadi "In Progress"

### Kirim Ujian
```
Selesai → Klik "Kirim Ujian"
```
- Status menjadi "Completed"
- Nilai otomatis dihitung
- Hasil terlihat di "Riwayat Ujian"

---

## 📊 Status Badges di Dashboard Guru

| Status | Warna | Arti |
|--------|-------|------|
| **DRAFT** | 🟡 Kuning | Ujian belum siap, siswa tidak bisa lihat |
| **PUBLISHED** | 🟢 Hijau | Ujian siap, siswa bisa lihat dan kerjakan |

Contoh di dashboard:
```
Ujian Baru Tanpa Judul       [DRAFT]     ✏️
Matematika Kelas XII         [PUBLISHED] ✏️
```

---

## 🔄 Ubah Status Ujian Kapan Saja

### Publikasikan Draft Ujian
```
Edit ujian (status DRAFT) → Cek checkbox "Publikasikan Ujian" → Simpan
```
Status berubah: **DRAFT → PUBLISHED** ✅

### Tarik Balik Ujian yang Published
```
Edit ujian (status PUBLISHED) → Uncek checkbox "Publikasikan Ujian" → Simpan
```
Status berubah: **PUBLISHED → DRAFT** ✅
- Ujian hilang dari dashboard siswa
- Siswa yang sudah mulai bisa lanjutkan
- **Catatan**: Ini bisa membingungkan siswa, hindari jika bisa

---

## ✅ Checklist Membuat Ujian

- [ ] Klik "Buat Ujian Baru" → "Buat Manual"
- [ ] Isi judul, deskripsi, durasi
- [ ] Klik "Tambah Soal" → Tambah minimal 1 soal
- [ ] Edit setiap soal dengan benar (tipe, pilihan, kunci jawaban, poin)
- [ ] Atur kategori dan topik
- [ ] **Cek checkbox "Publikasikan Ujian"** ← PENTING!
- [ ] Klik "Simpan Ujian"
- [ ] Verifikasi di Dashboard: Status berubah ke **PUBLISHED**
- [ ] Logout → Login sebagai siswa
- [ ] Verifikasi ujian terlihat di "Ujian Tersedia"

---

## 🐛 Troubleshooting

### Siswa tidak bisa lihat ujian yang guru buat?
**Solusi:**
1. Pastikan status ujian adalah **PUBLISHED** (hijau)
2. Di Exam Editor, cek checkbox "Publikasikan Ujian"
3. Klik "Simpan Ujian"
4. Siswa logout dan login lagi agar data ter-refresh

### Guru lupa publikasikan ujian?
**Solusi:**
1. Di Dashboard Guru, lihat "Ujian Terkini"
2. Cari ujian dengan status **DRAFT** (kuning)
3. Klik edit (icon pensil)
4. Cek checkbox "Publikasikan Ujian"
5. Klik "Simpan Ujian"

### Ujian berubah dari published menjadi draft?
**Solusi:**
- Kemungkinan guru accidental uncek checkbox
- Edit ujian, cek ulang checkbox "Publikasikan Ujian"
- Simpan

---

## 📝 Tips Terbaik

1. **Selalu publikasikan sebelum kelas dimulai**
   - Ujian draft tidak terlihat siswa
   - Jangan menunggu saat pembelajaran dimulai

2. **Test ujian sebelum publikasikan**
   - Edit ujian → Klik "Preview" atau "Mulai Ujian"
   - Pastikan timer, soal, dan scoring bekerja benar

3. **Hati-hati tarik balik ujian published**
   - Jika siswa sudah mulai, mereka bisa confused
   - Lebih baik buat ujian baru daripada ubah yang existing

4. **Gunakan draft untuk mempersiapkan**
   - Buat ujian dengan status draft
   - Edit dan review berkali-kali
   - Publikasikan saat siap

---

**Status**: Updated  
**Date**: February 21, 2026
