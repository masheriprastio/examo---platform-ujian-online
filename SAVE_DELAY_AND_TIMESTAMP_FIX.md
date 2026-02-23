# Fix: Save Delay & Disappearing Questions + Timestamp Display

## Masalah yang Diselesaikan

1. **Delay saat Menyimpan Soal**: Ketika guru menambah/mengedit soal, ada delay yang membuat UI terasa lambat
2. **Soal Hilang**: Kadang soal yang baru diketik hilang setelah save/reload
3. **Tidak Ada Informasi Waktu**: Dashboard tidak menampilkan kapan ujian dibuat dan terakhir diubah

## Solusi yang Diimplementasikan

### 1. **Timestamp Field di Exam Model** (`types.ts`)
```typescript
export interface Exam {
  // ... existing fields
  updatedAt?: string; // Waktu perubahan terakhir
}
```

### 2. **Auto-Backup State ke localStorage** (`ExamEditor.tsx`)
- Setiap 2 detik, state form di-backup ke `localStorage`
- Key: `exam_draft_${examId}`
- Jika terjadi crash/reload, soal bisa di-recover dari backup
- Backup dihapus setelah successful save

```typescript
useEffect(() => {
  // Auto-backup every 2 seconds
  const timeout = setTimeout(() => {
    localStorage.setItem(`exam_draft_${exam.id}`, JSON.stringify(formData));
  }, 2000);
  
  return () => clearTimeout(timeout);
}, [formData, exam.id]);
```

### 3. **Recovery Function**
- Saat ExamEditor di-load, otomatis recover backup jika ada
- User tidak perlu melakukan apa-apa, soal secara otomatis di-restore

```typescript
const recoverBackup = (examId: string, fallback: Exam): Exam => {
  try {
    const backup = localStorage.getItem(`exam_draft_${examId}`);
    if (backup) return JSON.parse(backup);
  } catch (e) {
    console.warn('Failed to recover backup:', e);
  }
  return fallback;
};
```

### 4. **Improved Drag & Drop Logic** (`ExamEditor.tsx`)
- Tambah validasi index sebelum splice
- Prevent state corruption saat drag soal
- Safe array manipulation untuk avoid undefined items

```typescript
const onDragOver = (e: React.DragEvent, index: number) => {
  // Validate indices first
  if (draggedIndex < 0 || draggedIndex >= formData.questions.length || 
      index < 0 || index >= formData.questions.length) {
    setDraggedIndex(null);
    return;
  }
  
  const newQs = [...formData.questions];
  const draggedItem = newQs[draggedIndex];
  
  if (draggedItem) {
    newQs.splice(draggedIndex, 1);
    newQs.splice(index, 0, draggedItem);
    setDraggedIndex(index);
    setFormData(prev => ({ ...prev, questions: newQs }));
  }
};
```

### 5. **Warning Unsaved Changes**
- Browser warn user jika ada unsaved changes saat close tab
- `beforeunload` event listener

```typescript
useEffect(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (JSON.stringify(formData) !== lastSavedRef.current) {
      e.preventDefault();
      e.returnValue = '';
    }
  };
  
  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [formData]);
```

### 6. **Updated Timestamps di Save** (`App.tsx`)
- `createdAt`: Waktu ujian dibuat (tidak berubah)
- `updatedAt`: Waktu terakhir diubah (update setiap save)

```typescript
const handleExamSave = async (updatedExam: Exam) => {
  const examWithTimestamp: Exam = {
    ...updatedExam,
    updatedAt: new Date().toISOString()
  };
  
  // ... save logic
  
  const dbExam = {
    // ... other fields
    updated_at: examWithTimestamp.updatedAt
  };
};
```

### 7. **Dashboard Display** (`App.tsx`)
Tampilkan waktu dibuat dan terakhir diubah:

```tsx
<div className="text-[10px] text-gray-400 mt-3 space-y-0.5">
  <p>Dibuat: {new Date(e.createdAt).toLocaleDateString('id-ID', { ... })}</p>
  {e.updatedAt && <p>Terakhir diubah: {new Date(e.updatedAt).toLocaleDateString('id-ID', { ... })}</p>}
</div>
```

## Database Migration (Supabase)

Jika menggunakan Supabase, tambahkan kolom di tabel `exams`:

```sql
ALTER TABLE public.exams ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE;
```

## Testing

### Scenario 1: Add Questions
1. Buka exam editor
2. Tambah 5 soal
3. Lihat localStorage backup di DevTools → Application → LocalStorage
4. Refresh halaman → soal harus tetap ada (recovered from backup)

### Scenario 2: Drag Questions
1. Tambah 3 soal
2. Drag soal #2 ke posisi #1
3. Lihat soal berpindah tanpa error
4. Save → Soal harus tersimpan dengan urutan baru

### Scenario 3: Timestamp Display
1. Buat ujian baru
2. Lihat dashboard → "Dibuat: [timestamp]"
3. Edit ujian, tekan save
4. Lihat dashboard → "Terakhir diubah: [timestamp baru]"

### Scenario 4: Unsaved Changes Warning
1. Edit ujian, ubah judul
2. Coba close tab tanpa save
3. Browser harus show warning dialog

## Performance Notes

- **Backup frequency**: 2 detik (adjustable via timeout)
- **Storage**: LocalStorage ~5MB per browser
- **Cleanup**: Backup dihapus setelah successful save
- **No impact**: Backup hanya di-load saat init, tidak mempengaruhi runtime performance

## Future Improvements

1. Add "Recover Draft" button jika backup ditemukan
2. Versioning history (show previous edits)
3. Server-side auto-save (tidak hanya localStorage)
4. Collaborative editing support
