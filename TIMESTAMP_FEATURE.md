# Fitur Timestamp pada Gambar dan Soal

## Ringkasan Perubahan

Telah ditambahkan fitur timestamp (waktu pembuatan dan pembaruan) untuk melacak kapan soal dan materi dibuat/diubah. Juga tersedia fitur hapus soal untuk mencegah penumpukan.

## Perubahan Kode

### 1. types.ts
Menambahkan dua field baru pada interface `Question`:
- `createdAt?: string` - Timestamp ketika soal dibuat
- `updatedAt?: string` - Timestamp terakhir soal diperbarui

```typescript
export interface Question {
  // ... field lainnya
  createdAt?: string; // Timestamp ketika soal dibuat
  updatedAt?: string; // Timestamp terakhir soal diperbarui
  // ...
}
```

### 2. services/MaterialService.ts
Update fungsi `uploadMaterial()` untuk otomatis menambahkan timestamp:
```typescript
uploaded_at: new Date().toISOString(), // Timestamp upload
```

### 3. components/ExamEditor.tsx

#### a. Penambahan Helper Function
Ditambahkan fungsi `formatQuestionTimestamp()` untuk format waktu yang readable:
- "Baru saja" untuk < 1 menit
- "X menit lalu" untuk < 1 jam
- "X jam lalu" untuk < 1 hari
- "X hari lalu" untuk < 7 hari
- Format tanggal lengkap untuk tanggal yang lebih lama

#### b. Update pada `addQuestion()`
Setiap soal baru dibuat dengan:
```typescript
createdAt: now,  // Timestamp saat dibuat
updatedAt: now   // Timestamp awal
```

#### c. Update pada `handleQuestionChange()`
Setiap kali soal diubah, `updatedAt` otomatis diperbarui:
```typescript
updatedAt: new Date().toISOString()
```

#### d. Fitur Hapus Soal (Delete Question)
Fungsi menghapus soal dengan konfirmasi:
```typescript
// Dialog konfirmasi muncul
// Saat soal dihapus, updatedAt juga diperbarui
const handleDeleteQuestion = () => {
  setFormData(prev => ({ 
    ...prev, 
    questions: prev.questions.filter(q => q.id !== questionToDelete),
    updatedAt: new Date().toISOString() // Update timestamp
  })); 
  setQuestionToDelete(null); 
};
```

**Fitur:**
- ✅ Dialog konfirmasi mencegah penghapusan tidak sengaja
- ✅ Pesan warning: "Soal yang dihapus tidak dapat dikembalikan"
- ✅ Update timestamp saat soal dihapus
- ✅ Tombol Batal dan Hapus dengan styling yang jelas
- ✅ Tidak ada penumpukan soal sampah

#### d. Tampilan Timestamp di Header Soal
Tambahan info di bawah judul soal menunjukkan:
- "Dibuat {formatQuestionTimestamp(q.createdAt)}"

#### e. Tampilan Timestamp di Detail Soal
Pada bagian detail soal yang aktif ditampilkan:
- Timestamp dibuat dengan icon jam biru
- Timestamp perubahan terakhir dengan icon jam kuning (jika ada perubahan)

#### f. Informasi Soal Terakhir di Header Editor
Di bawah judul "Editor Ujian" ditampilkan:
- "Soal terakhir dibuat: {formatQuestionTimestamp}"

## Fitur-Fitur

1. **Tracking Otomatis**: Timestamp dibuat dan diperbarui secara otomatis
2. **Format Readable**: Waktu ditampilkan dalam format yang mudah dipahami (mis: "5 menit lalu")
3. **Visibilitas**: Timestamp ditampilkan di:
   - Header list soal (subtitle di bawah judul soal)
   - Detail soal saat sedang diedit
   - Header editor (soal terakhir dibuat)
4. **Dua Timestamp**: Membedakan antara waktu pembuatan dan perubahan terakhir

## Testing

### Untuk mencoba fitur:
1. Buka Editor Ujian
2. Tambahkan soal baru → lihat timestamp "Dibuat: Baru saja"
3. Edit soal → lihat timestamp berubah ke "Diubah: Baru saja"
4. Lihat header editor untuk info soal terakhir dibuat
5. Lihat setiap soal di list menampilkan timestamp dibuat

## Browser Compatibility
- Menggunakan `Intl.DateTimeFormat` untuk formatting lokal (id-ID)
- `Date.now()` dan `new Date()` yang didukung semua browser modern
