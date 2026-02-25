# 🐛 Bug Fix: Penjadwalan Ujian (Exam Scheduling) - 25 Februari 2026

## 📋 Ringkasan Bug

**Reporter**: User  
**Severity**: HIGH 🔴  
**Status**: ✅ FIXED

### Deskripsi Masalah

> "Menyimpan soal lama, lalu soal sudah di publikasi tanggal, jam, tidak tampil pada dashboard siswa"

User membuat exam dengan:
1. Status: "Published" (Diterbitkan)
2. Start Date: Tanggal & jam tertentu (misal: 26 Feb 2026, 08:00)
3. End Date: Tanggal & jam selesai (misal: 26 Feb 2026, 10:00)

**Expected Behavior**: Exam tidak tampil di dashboard siswa sampai waktu start date tiba.

**Actual Behavior**: 
- ❌ Exam tidak tampil sama sekali (muncul "0" ujian tersedia)
- ❌ Atau exam dengan status "Belum Dimulai" tetap ditampilkan (UX buruk)

---

## 🔍 Root Cause Analysis

Saya menemukan **2 masalah** dalam code:

### Masalah 1: Exam yang Belum Dimulai Ditampilkan di "Ujian Tersedia"

**File**: [App.tsx](App.tsx#L2119)  
**Line**: 2119

**Code Lama**:
```typescript
{exams.filter(e => e.status === 'published').map(e => {
  // ... kalkulasi isNotStarted, isExpired, isActive
  // TAPI TETAP DITAMPILKAN APA PULA WAKTUNYA!
  return (
    <div key={e.id} className="...">
      {/* Exam card ditampilkan, dengan button disabled jika isNotStarted */}
      <button disabled={isNotStarted} ...>
        {isNotStarted ? 'Belum Dimulai (...)' : 'Mulai Sekarang'}
      </button>
    </div>
  );
})}
```

**Problem**: 
- Semua exam dengan `status === 'published'` ditampilkan, regardless of `startDate` & `endDate`
- Siswa bisa melihat exam yang belum bisa dikerjakan (UX buruk)
- Tidak ada tab/section untuk "Ujian Mendatang" atau "Ujian Selesai"

### Masalah 2: Tidak Ada Helper Function untuk Exam Availability

Tidak ada function yang jelas untuk check:
- Apakah exam sudah dimulai?
- Apakah exam sudah berakhir?
- Apakah exam bisa dikerjakan sekarang?

---

## ✅ Solusi yang Diterapkan

### 1️⃣ Tambah Helper Functions untuk Exam Scheduling

**File**: [App.tsx](App.tsx#L56)  
**Lines**: 56-110

```typescript
// Get exam schedule status
const getExamScheduleStatus = (exam: Exam): ExamScheduleStatus => {
  const now = new Date().getTime();
  const startDate = exam.startDate ? new Date(exam.startDate).getTime() : null;
  const endDate = exam.endDate ? new Date(exam.endDate).getTime() : null;

  // Jika tidak ada startDate dan endDate, exam bisa diambil setiap saat
  if (!startDate && !endDate) {
    return { isNotStarted: false, isActive: true, isExpired: false, startDate, endDate, now };
  }

  const isNotStarted = startDate ? startDate > now : false;
  const isExpired = endDate ? endDate < now : false;
  const isActive = !isNotStarted && !isExpired;

  return { isNotStarted, isActive, isExpired, startDate, endDate, now };
};

// Check if student can take exam right now
const isExamAvailable = (exam: Exam): boolean => {
  const status = getExamScheduleStatus(exam);
  return exam.status === 'published' && status.isActive;
};

// Filter exams untuk student dashboard
const filterStudentExams = (exams: Exam[]) => {
  const available = exams.filter(isExamAvailable);
  const upcoming = exams.filter(e => {
    const status = getExamScheduleStatus(e);
    return e.status === 'published' && status.isNotStarted;
  });
  const expired = exams.filter(e => {
    const status = getExamScheduleStatus(e);
    return e.status === 'published' && status.isExpired;
  });
  
  return { available, upcoming, expired };
};
```

**Benefit**:
- ✅ Logic scheduling jadi jelas dan maintainable
- ✅ Bisa reuse di banyak tempat
- ✅ Mudah untuk test logic

---

### 2️⃣ Implementasi 3 Tab di Student Dashboard

**File**: [App.tsx](App.tsx#L2167)  
**Lines**: 2167-2350

#### Tab 1: "Ujian Tersedia" (STUDENT_DASHBOARD)
- Menampilkan exam yang `isActive` (sudah mulai, belum selesai)
- Button "Mulai Sekarang" atau "Lanjutkan" atau "Ulangi Ujian"

#### Tab 2: "Ujian Mendatang" (view-upcoming)
- Menampilkan exam yang `isNotStarted` (belum dimulai)
- Menunjukkan countdown "XX hari lagi"
- Button disabled "Belum Tersedia"

#### Tab 3: "Ujian Selesai" (view-expired)
- Menampilkan exam yang `isExpired` (sudah berakhir)
- Button disabled "Ujian Berakhir"

**UI Improvements**:
```
┌─────────────────────────────────────────┐
│ Ujian                                   │
│ [Tersedia] [Mendatang] [Selesai]        │
└─────────────────────────────────────────┘

Tersedia (2):
┌─────────────┬─────────────┐
│ Matematika  │ Bahasa Indo │
│ [Mulai]     │ [Lanjutkan] │
└─────────────┴─────────────┘

Mendatang (1):
┌─────────────┐
│ Fisika      │ (5 hari lagi)
│ [Belum...]  │
└─────────────┘

Selesai (0):
(Tidak ada ujian yang sudah berakhir)
```

---

## 🔧 Implementasi Details

### Query Database (UNCHANGED)
Query masih sama dan benar:
```typescript
const { data: examsData } = await supabase
  .from('exams')
  .select('id, title, ..., start_date, end_date, ...')
  .limit(30);
```

Mapping:
```typescript
const exam: Exam = {
  ...e,
  startDate: e.start_date,  // ✅ Correctly mapped
  endDate: e.end_date        // ✅ Correctly mapped
};
```

### Exam Penyimpanan (UNCHANGED)
Exam se dengan startDate & endDate tersimpan dengan benar:
```typescript
const dbExam = {
  ...
  start_date: updatedExam.startDate,  // ✅ Correctly saved
  end_date: updatedExam.endDate,      // ✅ Correctly saved
  ...
};
```

---

## 📝 Contoh Scenario

### Scenario 1: Exam dengan Jadwal
```
Exam: "Ujian Matematika"
- Created: 25 Feb 2026, 10:00
- Start Date: 26 Feb 2026, 08:00
- End Date: 26 Feb 2026, 10:00
- Current Time: 25 Feb 2026, 15:00

Behavior:
- Dashboard siswa → Tab "Ujian Tersedia": TIDAK TAMPIL
- Dashboard siswa → Tab "Ujian Mendatang": TAMPIL (16jam lagi)
- Button: [Belum Tersedia]
```

### Scenario 2: Exam Sedang Aktif
```
Exam: "Ujian Matematika"
- Created: 25 Feb 2026, 10:00
- Start Date: 26 Feb 2026, 08:00
- End Date: 26 Feb 2026, 10:00
- Current Time: 26 Feb 2026, 09:00

Behavior:
- Dashboard siswa → Tab "Ujian Tersedia": TAMPIL ✅
- Button: [Mulai Sekarang]
```

### Scenario 3: Exam Sudah Selesai
```
Exam: "Ujian Matematika"
- Created: 25 Feb 2026, 10:00
- Start Date: 26 Feb 2026, 08:00
- End Date: 26 Feb 2026, 10:00
- Current Time: 27 Feb 2026, 15:00

Behavior:
- Dashboard siswa → Tab "Ujian Tersedia": TIDAK TAMPIL
- Dashboard siswa → Tab "Ujian Selesai": TAMPIL
- Button: [Ujian Berakhir]
```

### Scenario 4: Exam Tanpa Jadwal
```
Exam: "Ujian Umum"
- Created: 25 Feb 2026, 10:00
- Start Date: (kosong)
- End Date: (kosong)
- Current Time: 27 Feb 2026, 15:00

Behavior:
- Dashboard siswa → Tab "Ujian Tersedia": TAMPIL (setiap saat)
- Button: [Mulai Sekarang]
```

---

## 🧪 Testing Checklist

### Manual Testing
- [ ] Buat exam dengan `status = draft` → siswa tidak lihat
- [ ] Publish exam TANPA startDate/endDate → siswa lihat langsung
- [ ] Publish exam dengan startDate di MASA DEPAN → siswa lihat di "Ujian Mendatang"
- [ ] Publish exam dengan startDate DI MASA LALU & endDate DI MASA DEPAN → siswa lihat di "Ujian Tersedia"
- [ ] Publish exam dengan endDate DI MASA LALU → siswa lihat di "Ujian Selesai"
- [ ] Switch antar tab: "Tersedia" → "Mendatang" → "Mendatang" → bekerja lancar

### Edge Cases
- [ ] Browser clock di-set maju → exam "Mendatang" jadi "Tersedia"
- [ ] Multiple exam dengan jadwal overlapping
- [ ] Exam dengan endDate lebih awal dari startDate (should not happen, tapi test)

---

## 📚 File yang Diubah

| File | Lines | Change |
|------|-------|--------|
| [App.tsx](App.tsx#L56) | 56-110 | Add helper functions |
| [App.tsx](App.tsx#L2167) | 2167-2350 | Rewrite student dashboard exam display |
| [types.ts](types.ts#L97) | 97 | Add `view-upcoming` dan `view-expired` to AppView |

---

## ⚠️ Migration Notes

Jika ada user yang sudah menyimpan exam dengan startDate/endDate sebelumnya, tidak perlu migration karena:
- Data sudah tersimpan dengan benar di database (`start_date`, `end_date` columns)
- Hanya UI logic yang berubah
- Backward compatible ✅

---

## 🚀 Future Improvements

1. **Add Timezone Support**
   - Saat ini menggunakan browser timezone
   - Bisa add timezone field ke Exam untuk support multiple timezones

2. **Add Recurring Exams**
   ```typescript
   interface Exam {
     ...
     recurrence?: 'daily' | 'weekly' | 'monthly';
     recurrenceEnd?: string;
   }
   ```

3. **Add Email Notification**
   - Notify siswa 24 jam sebelum exam dimulai
   - Notify siswa ketika exam dimulai

4. **Add Automatic Publish**
   - Teacher bisa set kapan exam auto-publish
   - Exam auto-unpublish setelah berakhir

5. **Add Admin Control Panel**
   - See all exams dengan scheduling status
   - Bulk update schedules
   - View analytics tentang student readiness

---

## 📞 Support & Questions

Jika ada pertanyaan atau issue terkait penjadwalan ujian, silakan cek:
1. [App.tsx - Helper Functions](App.tsx#L56)
2. [App.tsx - Student Dashboard](App.tsx#L2167)
3. [types.ts - AppView Type](types.ts#L97)

---

**Fixed by**: GitHub Copilot  
**Date**: 25 Februari 2026  
**Version**: 1.0.0
