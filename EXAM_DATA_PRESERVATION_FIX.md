# Fix: Exam Data Preserved When Exiting Preview Mode

## Masalah
Saat guru membuat soal ujian:
1. Buat/edit beberapa soal di ExamEditor
2. Klik "Preview" untuk lihat tampilan
3. Tutup preview dengan tombol "Tutup Preview" atau "Kembali"
4. **BUG**: Semua soal yang diketik hilang ❌

User harus mulai dari awal lagi, pekerjaan tidak tersimpan.

---

## Penyebab Bug

```
Saat buka ExamEditor:
├─ ExamEditor internal state (formData) ← user edit soal di sini
│
├─ User klik Preview
├─ setActiveExam(formData) ← simpan ke activeExam
├─ setView('EXAM_PREVIEW')
│
└─ ExamRunner preview ditampilkan
   ├─ User klik "Tutup Preview"
   ├─ onExit() handler dipanggil
   ├─ setView('EXAM_EDITOR') ← route back
   │
   └─ ExamEditor di-mount ulang dengan exam prop
      └─ const [formData, setFormData] = useState({ ...exam })
      └─ exam masih original data ❌ (bukan activeExam yang sudah diedit)
```

**Root cause**: Saat exit preview, state `editingExam` di App.tsx tidak di-restore dengan `activeExam` yang sudah diedit.

---

## Solusi

### Code Change (App.tsx)

```typescript
// BEFORE
onExit={() => setView('EXAM_EDITOR')}

// AFTER
onExit={() => {
  // Restore the edited exam when exiting preview
  setEditingExam(activeExam);
  setView('EXAM_EDITOR');
}}
```

### Flow Diagram

```
ExamEditor (formData)
    ↓
Buat soal: Q1, Q2, Q3
    ↓
Klik Preview
    ↓
onPreview callback:
├─ setActiveExam(exam)  ← simpan edited exam
└─ setView('EXAM_PREVIEW')
    ↓
ExamRunner preview
    ↓
Klik Tutup Preview
    ↓
onExit() - NEW LOGIC:
├─ setEditingExam(activeExam) ← ✅ RESTORE data
└─ setView('EXAM_EDITOR')
    ↓
ExamEditor di-mount dengan editingExam prop
├─ formData = { Q1, Q2, Q3 } ← ✅ SOAL TETAP ADA
└─ User bisa continue editing ✅
```

---

## Testing Guide

### Manual Test
1. **Login sebagai guru** (Bpk. Ahmad Fauzi)
2. **Masuk ke "Manajemen Ujian" → "Buat Ujian Baru"**
3. **Buat soal manual**:
   - Klik "Tambah Soal"
   - Edit: Pertanyaan, Opsi, Poin, dll
   - Lakukan 2-3x
4. **Test Preview**:
   - Klik tombol "Preview" (pojok kanan atas)
   - Lihat preview soal
   - Klik "TUTUP PREVIEW"
5. **Verifikasi soal tetap ada** ✅
   - Semua soal yang dibuat masih tersimpan
   - Bisa lanjut edit soal
   - Bisa tambah soal baru

### Expected Behavior (Before & After)

| Scenario | Before | After |
|----------|--------|-------|
| Buat 3 soal | ✅ Soal tersimpan | ✅ Soal tersimpan |
| Klik Preview | ✅ Preview muncul | ✅ Preview muncul |
| Tutup Preview | ❌ Soal hilang | ✅ Soal tetap ada |
| Edit lagi | ❌ Mulai dari awal | ✅ Lanjut edit |

---

## Technical Details

### State Management

```typescript
// App.tsx global state
const [editingExam, setEditingExam] = useState<Exam | null>(null);
const [activeExam, setActiveExam] = useState<Exam | null>(null);

// Preview flow
onPreview={(exam) => {
  setActiveExam(exam);           // Save current edits
  setView('EXAM_PREVIEW');
}}

// Exit preview - NEW
onExit={() => {
  setEditingExam(activeExam);    // ✅ Restore edits
  setView('EXAM_EDITOR');
}}
```

### Component Lifecycle
- `ExamEditor` component re-mounts when `editingExam` prop changes
- Old code: Only `setView()` → ExamEditor mounts with stale `editingExam`
- New code: `setEditingExam(activeExam)` → ExamEditor mounts with updated data

---

## Commit Info
- **Commit**: `08f0ff1`
- **Files Modified**: App.tsx (2 lines changed)
- **Build Status**: ✅ Passed (no errors)
- **Impact**: Low risk, minimal code change, high value fix

---

## Related Issues Fixed
- ✅ Exam drafts not persisting across preview exit
- ✅ User frustration with data loss
- ✅ Improved UX for exam creation workflow

---

## Notes for Future
- Could implement localStorage backup for unsaved exams as additional safety net
- Consider adding "unsaved changes" indicator in ExamEditor
- Potential enhancement: Autosave after each question addition

---

## Links
- [App.tsx changes](App.tsx#L1545-L1554)
- [ExamEditor component](components/ExamEditor.tsx)
- [ExamRunner component](components/ExamRunner.tsx)
