# Perbaikan MCQ Option Attachment (Gambar Pilihan Ganda)

## Masalah yang Ditemukan

User melaporkan bahwa:
1. Upload gambar pada pilihan ganda (MCQ) dapat dilakukan
2. Gambar muncul di preview editor
3. **TETAPI** saat preview ujian, gambar tidak ditampilkan
4. Saat save, data gambar hilang dan tidak tersimpan

## Root Cause Analysis

Masalah terjadi karena:

### 1. **Missing Type Definition** (types.ts)
- ExamEditor menggunakan field `optionAttachments` untuk menyimpan attachment per opsi MCQ
- **TETAPI** field `optionAttachments` tidak didefinisikan di interface `Question` di `types.ts`
- Akibatnya, data attachment hilang saat penyimpanan

### 2. **Incomplete Rendering Logic** (ExamRunner.tsx)
- ExamRunner hanya membaca dari `richOptions` untuk menampilkan option
- Data `optionAttachments` tidak ditampilkan di preview dan saat ujian
- Array `optionAttachments` juga tidak ter-shuffle saat opsi di-acak

## Solusi yang Diterapkan

### 1. Update `types.ts` - Tambah Field `optionAttachments`

```typescript
// Attachment untuk setiap opsi MCQ/Multiple Select
optionAttachments?: Array<{
  type?: 'image' | 'video' | 'audio';
  url?: string;
  caption?: string;
} | undefined>;
```

**Implikasi:**
- Data `optionAttachments` sekarang bagian dari interface `Question`
- Data akan tersimpan ke Supabase saat `handleExamSave` dipanggil
- Data akan direstore dari backup localStorage

### 2. Update `ExamRunner.tsx` - Render Attachment di MCQ/Multiple Select

#### Bagian MCQ (line ~454):
```typescript
const optionAttachment = currentQuestion.optionAttachments?.[idx];
const hasAttachment = optionAttachment?.url;
```

Menampilkan gambar jika ada:
```typescript
{hasAttachment && (
  <img 
    src={optionAttachment.url} 
    alt={`Option ${String.fromCharCode(65 + idx)}`}
    className="max-w-xs max-h-64 rounded-lg border border-gray-200 object-contain"
  />
)}
```

#### Bagian Multiple Select:
- Logic yang sama diterapkan untuk multiple select questions

### 3. Update Shuffle Logic di `ExamRunner.tsx`

```typescript
const sourceOptions: { html: string; attachment?: string; optionAttachment?: any; idx: number }[] 
  = q.richOptions
      ? q.richOptions.map((ro, idx) => ({ 
          html: ro.html, 
          attachment: ro.attachment, 
          optionAttachment: q.optionAttachments?.[idx],
          idx 
        }))
      : q.options?.map((opt, idx) => ({ 
          html: opt, 
          attachment: '', 
          optionAttachment: q.optionAttachments?.[idx],
          idx 
        })) || [];
```

**Benefit:**
- Ketika opsi di-shuffle, `optionAttachments` juga ter-shuffle dengan benar
- Mapping jawaban benar tetap akurat setelah shuffle

### 4. Fix `ExamEditor.tsx` - Handle Attachment State

Perbaikan di `handleOptionAttachmentChange()`:
- Ketika menghapus attachment: set ke `undefined` (bukan `{ url: undefined }`)
- Initialize array dengan `fill(undefined)` untuk konsistensi

## File yang Dimodifikasi

| File | Perubahan |
|------|-----------|
| **types.ts** | Tambah `optionAttachments` field ke interface `Question` |
| **ExamRunner.tsx** | <ul><li>Render attachment di MCQ options</li><li>Render attachment di Multiple Select options</li><li>Update shuffle logic untuk handle `optionAttachments`</li></ul> |
| **ExamEditor.tsx** | <ul><li>Fix `handleOptionAttachmentChange()` logic</li><li>Fix array initialization consistency</li></ul> |

## Testing Checklist

Untuk verifikasi sistem bekerja:

1. **Upload Gambar di Editor**
   - Debug: Periksa state `formData.questions[x].optionAttachments[y].url`
   - Harusnya berisi URL gambar dari Supabase

2. **Preview Ujian**
   - Debug: Periksa `currentQuestion.optionAttachments` di ExamRunner
   - Gambar harus muncul di setiap opsi MCQ/Multiple Select

3. **Acak Opsi**
   - Buat MCQ dengan "Acak Pilihan" = On
   - Upload gambar di beberapa opsi
   - Shuffle harus memindahkan gambar bersama dengan teksnya

4. **Simpan Ujian**
   - Klik Simpan setelah upload gambar
   - Cek Supabase: `exams` table, kolom `questions`
   - Data `optionAttachments` harus tersimpan

5. **Restore dari Backup**
   - Refresh halaman editor saat masih edit
   - Data gambar harus ter-restore dari localStorage

## Data Flow

```
User Upload Gambar
    ↓
handleOptionFileUpload()
    ↓
uploadImageToSupabase() → Return public URL
    ↓
handleOptionAttachmentChange(qIndex, oIndex, publicUrl)
    ↓
setFormData() → Update optionAttachments[oIndex]
    ↓
Auto-backup to localStorage (includes optionAttachments)
    ↓
User Click Simpan → handleExamSave()
    ↓
Save to Supabase (questions array dengan optionAttachments)
    ↓
Preview/Exam Session → ExamRunner membaca optionAttachments
    ↓
Render gambar di ExamRunner
```

## Backward Compatibility

Perubahan ini **backward compatible**:
- Existing exams tanpa `optionAttachments` tetap bekerja
- ExamRunner handle baik legacy `options` maupun baru `richOptions`
- Code mengecek `optionAttachments?.url` (safe optional chaining)

## Browser Console Debug

Untuk debug di browser console:

```javascript
// Lihat state question dengan attachments
console.log('Current Question:', currentQuestion);
console.log('Attachments:', currentQuestion.optionAttachments);

// Lihat URL gambar
currentQuestion.optionAttachments?.forEach((att, idx) => {
  console.log(`Option ${idx}:`, att?.url);
});
```

## Notes

- Attachment hanya support image type untuk sekarang (UI di ExamEditor hanya upload image)
- Gambar akan resize max-w-xs max-h-64 agar tidak menganggu layout
- Jika URL broken, fallback ke placeholder: `https://placehold.co/300x200?text=Error`
- LocalStorage backup akan compress dan remove attachments jika melebihi 4MB

---

**Status:** ✅ FIXED (Build success, no TypeScript errors)

**Version:** 1.0  
**Last Updated:** February 25, 2026
