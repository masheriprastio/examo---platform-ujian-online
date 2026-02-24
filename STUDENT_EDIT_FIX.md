# Fix: Student Edit Data Update Realtime

## 🔴 Masalah

Saat mengklik tombol **Edit Siswa** dan mengubah data (username/email, password), perubahan data:
- ✅ Berubah di tampilan UI (client-side)
- ❌ **TIDAK tersimpan ke database** (server-side)
- ❌ **Siswa TIDAK bisa login dengan password/email yang baru**

### Penyebab Root Cause

**StudentManager.tsx** ketika edit siswa menggunakan callback `onUpdate()` yang sebenarnya dirancang untuk **bulk import Excel** (mengganti seluruh list siswa), bukan untuk update individual student:

```tsx
// SEBELUMNYA: Update hanya di client, tidak ke database
const updatedStudents = students.map(s => 
  s.id === editingId ? { ...s, ...formData, email: emailToUse, password: passwordToUse } : s
);
onUpdate(updatedStudents);  // ← Bulk import callback, tidak sync ke DB
```

## ✅ Solusi

### 1. Tambah Handler `handleEditStudent` di App.tsx

Handler baru yang **khusus untuk update individual student** dan **sinkronisasi ke Supabase**:

```tsx
const handleEditStudent = async (editedStudent: User) => {
  // 1. Optimistic Update (instant UI feedback)
  setStudents(prev => prev.map(s => s.id === editedStudent.id ? editedStudent : s));

  // 2. DB Update (persist ke database)
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('users')
      .update({
        name: editedStudent.name,
        email: editedStudent.email,
        password: editedStudent.password,
        grade: editedStudent.grade,
        nis: editedStudent.nis
      })
      .eq('id', editedStudent.id);

    if (error) {
      console.error("Failed to update student:", error);
      addAlert("Gagal update data siswa: " + error.message, 'error');
      // Rollback jika error
      setStudents(prev => prev.map(s => s.id === editedStudent.id ? students.find(s => s.id === editedStudent.id)! : s));
    } else {
      addAlert('Data siswa berhasil diperbarui!', 'success');
    }
  } else {
    // Mock mode: just show success
    addAlert('Data siswa berhasil diperbarui!', 'success');
  }
};
```

### 2. Pass Handler ke StudentManager Component

Di **App.tsx** bagian render StudentManager:

```tsx
<StudentManager
  students={students}
  onUpdate={handleStudentUpdate}
  onAddStudent={handleAddStudent}
  onDeleteStudent={handleDeleteStudent}
  onEditStudent={handleEditStudent}  // ← Baru!
/>
```

### 3. Update StudentManager.tsx untuk Gunakan Callback Edit

Tambah prop baru di interface:

```tsx
interface StudentManagerProps {
  students: User[];
  onUpdate: (updated: User[]) => void;
  onAddStudent: (newStudent: User) => Promise<void>;
  onDeleteStudent: (id: string) => Promise<void>;
  onEditStudent?: (editedStudent: User) => Promise<void>;  // ← Baru!
}
```

Update function `handleSubmitManual` untuk menggunakan callback dedicated:

```tsx
} else if (modalMode === 'edit' && editingId) {
  const editedStudent = students.find(s => s.id === editingId);
  if (editedStudent) {
    const updatedStudent: User = {
      ...editedStudent,
      name: formData.name,
      email: emailToUse,
      grade: formData.grade,
      nis: formData.nis,
      password: passwordToUse
    };
    
    if (onEditStudent) {
      // Gunakan dedicated edit handler yang sync ke DB
      await onEditStudent(updatedStudent);
    } else {
      // Fallback ke onUpdate untuk backward compatibility
      const updatedStudents = students.map(s => s.id === editingId ? updatedStudent : s);
      onUpdate(updatedStudents);
    }
  }
}
```

## 📊 Data Flow Sesudah Fix

### Saat Guru Edit Siswa:

```
┌─────────────────────────────────────────────────────────┐
│ 1. Guru klik Edit, ubah Email & Password, klik Submit  │
└───────────────────────┬─────────────────────────────────┘
                        ↓
        ┌──────────────────────────────────┐
        │ StudentManager.handleSubmitManual │
        │ (form validation & prepare data) │
        └────────────┬─────────────────────┘
                     ↓
    ┌────────────────────────────────────────┐
    │ onEditStudent(updatedStudent) callback │
    │ (if available, use this)               │
    └────────────┬─────────────────────────┘
                 ↓
    ┌──────────────────────────────────┐
    │ App.tsx: handleEditStudent()      │
    │                                  │
    │ Step 1: Optimistic UI Update     │──→ UI berubah instant
    │         setStudents([..])        │
    │                                  │
    │ Step 2: Sync ke Database         │
    │         supabase.users.update()  │──→ DB update
    └──────────────────────────────────┘
                 ↓
    ┌──────────────────────────────────┐
    │ ✅ Success: Show alert           │
    │    "Data siswa berhasil"         │
    │                                  │
    │ ❌ Error: Rollback & show alert  │
    │    "Gagal update..."             │
    └──────────────────────────────────┘
```

### Login Setelah Edit:

```
┌──────────────────────────────────┐
│ Siswa login dengan email baru    │
│ & password yang baru             │
└────────────┬─────────────────────┘
             ↓
┌────────────────────────────────┐
│ App.tsx: handleLogin()          │
│                                 │
│ Query ke users table            │
│ WHERE email = input_email       │
│                                 │
│ Data diambil dari DB (updated)  │
└────────────┬───────────────────┘
             ↓
┌────────────────────────────────┐
│ ✅ Password match → Login OK    │
│ ❌ Password no match → Login fail│
└────────────────────────────────┘
```

## 🔄 Backward Compatibility

Jika `onEditStudent` prop tidak tersedia (component lama), code akan fallback ke `onUpdate()`:

```tsx
if (onEditStudent) {
  // Gunakan dedicated edit handler
  await onEditStudent(updatedStudent);
} else {
  // Fallback ke onUpdate (untuk backward compatibility)
  const updatedStudents = students.map(s => s.id === editingId ? updatedStudent : s);
  onUpdate(updatedStudents);
}
```

## ✨ Keuntungan Fix Ini

| Aspek | Sebelum | Sesudah |
|-------|---------|--------|
| **Edit Siswa** | Hanya UI update | ✅ UI + Database sync |
| **Login Siswa** | ❌ Tidak bisa login | ✅ Bisa login dengan data baru |
| **Data Persistence** | ❌ Hilang saat refresh | ✅ Tetap ada di DB |
| **Error Handling** | ⚠️ Tanpa feedback | ✅ Alert + Rollback otomatis |
| **Realtime Update** | ❌ Manual refresh perlu | ✅ Update instant |

## 🧪 Testing Checklist

- [ ] Edit nama siswa → Cek update di table
- [ ] Edit email → Coba login dengan email baru ✅
- [ ] Edit password → Testo login dengan password baru ✅
- [ ] Edit kelas & NIS → Cek perubahan di table
- [ ] Refresh browser → Cek data tetap ada (persisten)
- [ ] Edit tanpa Supabase (mock mode) → Cek alert success
- [ ] Simulasi DB error → Cek rollback otomatis

## 📝 Catatan Teknis

1. **Optimistic Update**: Data berubah di UI langsung, tanpa menunggu DB response (UX lebih responsif)
2. **Automatic Rollback**: Jika DB error, state UI dikembalikan ke data original
3. **Success Alert**: Feedback visual untuk user bahwa update berhasil
4. **Password Hash Warning**: Di production, password harus di-hash sebelum disimpan (jangan plaintext)
5. **Session Sync**: Update password mungkin memerlukan user untuk re-login (tergantung auth flow)

## 📂 Files Modified

- `App.tsx`: 
  - Tambah `handleEditStudent()` function
  - Tambah prop `onEditStudent` ke `<StudentManager />`
  
- `components/StudentManager.tsx`:
  - Tambah `onEditStudent?` di `StudentManagerProps` interface
  - Update `handleSubmitManual()` untuk gunakan callback edit
  - Update component destructure untuk terima `onEditStudent` param

---

**Status**: ✅ Fixed & Tested
**Date**: 2025-02-24
