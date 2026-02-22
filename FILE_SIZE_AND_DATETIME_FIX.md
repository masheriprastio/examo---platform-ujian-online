# Fix: File Size Limit & Datetime Picker Issue

## Masalah yang Diperbaiki

### 1. ✅ File Size Limit (5MB → 15MB)
**Dulu**: Aplikasi membatasi upload file hanya 5MB
**Sekarang**: Bisa upload file hingga 15MB

**File yang diubah**:
- `AIGenerator.tsx` - File upload dokumen untuk generate soal
- `ExamEditor.tsx` - Attachment/gambar pada soal ujian
- `QuestionBank.tsx` - Upload gambar soal di bank soal

### 2. ✅ Datetime Picker Bug (Waktu Ujian Tidak Bisa Diatur Maju)
**Dulu**: Saat mengatur waktu ujian "Mulai" dan "Selesai", terjadi bug:
- Jika maju waktu → tanggal mundur
- Input tidak bisa diketik dengan benar
- Format timezone tidak konsisten

**Penyebab**: Kode menggunakan `toISOString().slice(0, 16)` yang menghasilkan format salah untuk `datetime-local` input

**Sekarang**: Ditambahkan helper function `formatDateTimeLocal()` yang properly format timezone

---

## Detail Perubahan

### AIGenerator.tsx
```typescript
// BEFORE
if (file.size > 5 * 1024 * 1024) {
  setError('Ukuran file terlalu besar (Maksimal 5MB).');
  return;
}

// AFTER
if (file.size > 15 * 1024 * 1024) {
  setError('Ukuran file terlalu besar (Maksimal 15MB).');
  return;
}
```

### ExamEditor.tsx - Helper Function
```typescript
// NEW FUNCTION
const formatDateTimeLocal = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch {
    return '';
  }
};
```

### ExamEditor.tsx - Input Fields
```typescript
// BEFORE
<input 
  type="datetime-local" 
  value={formData.startDate ? new Date(formData.startDate).toISOString().slice(0, 16) : ''}
  onChange={(e) => handleExamChange('startDate', e.target.value ? new Date(e.target.value).toISOString() : undefined)}
/>

// AFTER
<input 
  type="datetime-local" 
  value={formData.startDate ? formatDateTimeLocal(formData.startDate) : ''}
  onChange={(e) => handleExamChange('startDate', e.target.value ? new Date(e.target.value).toISOString() : undefined)}
/>
```

### QuestionBank.tsx
```typescript
// BEFORE
if (file.size > 5 * 1024 * 1024) {
  alert("Ukuran file maksimal 5MB");

// AFTER
if (file.size > 15 * 1024 * 1024) {
  alert("Ukuran file maksimal 15MB");
```

---

## Testing Checklist

### File Size Limit
- [ ] Navigate to "Editor Ujian" → "Tambah Soal" → "LAMPIRAN GAMBAR"
- [ ] Try upload file 10MB (should succeed)
- [ ] Try upload file 20MB (should show error "Maksimal 15MB")
- [ ] Also test di AI Generator & Question Bank

### Datetime Picker
- [ ] Navigate to "Editor Ujian" → "Mulai Ujian" field
- [ ] Click on datetime picker
- [ ] Set date to Feb 25, 2026
- [ ] Set time to 14:30
- [ ] Verify: Date stays 25, doesn't go backward
- [ ] Try different times (earlier, later)
- [ ] Verify "Selesai Ujian" field also works correctly

### Integration
- [ ] Create exam with future start/end dates
- [ ] Save exam
- [ ] Reopen exam editor
- [ ] Verify dates/times are preserved correctly
- [ ] Publish exam
- [ ] Check if students can start/view exam

---

## Technical Details

### Why the Old Code Didn't Work
```typescript
// Problem code
new Date(formData.startDate).toISOString().slice(0, 16)
// ISO string: "2026-02-23T14:30:00.000Z"  
// After slice: "2026-02-23T14"  ❌ Missing minutes!
// Also: Converts to UTC, losing local timezone
```

### How the Fix Works
```typescript
// New formatDateTimeLocal function
const date = new Date(dateString);
const year = date.getFullYear();  // 2026
const month = String(date.getMonth() + 1).padStart(2, '0');  // 02
const day = String(date.getDate()).padStart(2, '0');  // 23
const hours = String(date.getHours()).padStart(2, '0');  // 14
const minutes = String(date.getMinutes()).padStart(2, '0');  // 30
return `${year}-${month}-${day}T${hours}:${minutes}`;  // ✅ "2026-02-23T14:30"
// Uses local timezone via getHours(), getMinutes()
```

### Timezone Handling
- Old: Uses UTC via `toISOString()` → Wrong timezone
- New: Uses local time via `getHours()`, `getMinutes()` → Correct timezone for user

---

## Commit Info
- **Commit**: `7204592`
- **Deployed**: Check Vercel build at https://vercel.com/masheriprastio/examo---platform-ujian-online/deployments
- **Build Status**: ✅ Passed (no TypeScript errors)

---

## FAQ

**Q: Kenapa maksimal 15MB, bukan lebih besar?**
A: 15MB adalah sweet spot untuk upload di production. Lebih besar perlu:
- Database dengan storage besar (Supabase charged)
- Network timeout setting
- Server-side file compression
Jika perlu lebih, ada opsi untuk implementasi.

**Q: Apakah fix ini breaking change?**
A: Tidak, ini purely additive:
- File size limit hanya naik (tidak ada file yang jadi invalid)
- Datetime picker fix tidak mengubah format storage (tetap ISO string)
- Existing exams tetap work

**Q: Bagaimana dengan mobile datetime picker?**
A: `datetime-local` HTML5 input otomatis menggunakan native picker di mobile:
- iOS: Uses Safari picker
- Android: Uses Android date/time picker
- All browser: Our helper format compatible

---

## Related Files Modified
1. [AIGenerator.tsx](AIGenerator.tsx#L33-L34)
2. [ExamEditor.tsx](ExamEditor.tsx#L17-L30) - Helper function
3. [ExamEditor.tsx](ExamEditor.tsx#L169-L188) - Input fields
4. [ExamEditor.tsx](ExamEditor.tsx#L338) - Help text
5. [QuestionBank.tsx](QuestionBank.tsx#L261-L262)
6. [QuestionBank.tsx](QuestionBank.tsx#L398)
