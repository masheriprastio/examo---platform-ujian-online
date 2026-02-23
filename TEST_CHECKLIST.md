# TEST CHECKLIST: Save Delay & Disappearing Questions Fix

## ✅ Unit Tests (Manual)

### Test 1: Add Questions & Recovery
**Purpose**: Verify backup dan recovery functionality

```
STEPS:
1. npm run dev (start dev server)
2. Login as Teacher
3. Click "Buat Ujian Baru" → Manual
4. Type judul: "Test Ujian"
5. Click "Tambah Soal" 3 times
6. Edit masing-masing soal:
   - Soal 1: "2 + 2 = ?"
   - Soal 2: "Ibu kota Indonesia?"
   - Soal 3: "Bulan berapa sekarang?"
7. PENTING: DON'T SAVE YET
8. Open DevTools (F12) → Application → LocalStorage
9. Cari: exam_draft_[ID]
   Expected: Soal-soal tersimpan di backup ✅

10. Refresh halaman (Ctrl+R)
11. Verify: Soal-soal masih ada ✅
    (Should auto-recover dari backup)

12. Edit soal 1, ubah jadi: "3 + 3 = ?"
13. Tunggu 2 detik
14. Check localStorage lagi
    Expected: Updated dengan soal baru ✅

15. Click "Simpan"
16. Verify toast: "Ujian berhasil disimpan!" ✅
17. Check localStorage lagi
    Expected: exam_draft_[ID] DIHAPUS ✅
    (Cleanup setelah save sukses)

18. Go to Dashboard
    Expected: 
    - Ujian muncul di list ✅
    - Timestamp "Dibuat: [date] [time]" ✅
    - Timestamp "Terakhir diubah: [date] [time]" ✅
```

### Test 2: Drag & Drop Tidak Hilang
**Purpose**: Verify safe drag & drop logic

```
STEPS:
1. Buka exam sudah ada (dari test 1)
2. Click Edit
3. Ada 3 soal: A, B, C
4. Drag soal B ke posisi pertama
   Expected: Urutan jadi B, A, C ✅
5. Drag soal C ke posisi pertama
   Expected: Urutan jadi C, B, A ✅
6. Verify semua soal text masih intact (tidak hilang)
   Expected: Semua soal masih ada ✅
7. Click Simpan
8. Verify urutan tetap: C, B, A ✅
   (Dashboard harus show soal dalam urutan baru)
```

### Test 3: Unsaved Changes Warning
**Purpose**: Verify browser warning jika ada unsaved changes

```
STEPS:
1. Buka exam editor
2. Edit soal: ubah text
3. DON'T click Simpan
4. Coba close tab/browser (Ctrl+W atau close button)
   Expected: Browser show warning ✅
   "Apakah Anda ingin meninggalkan halaman ini?"
5. Click "Stay on this page" (Cancel)
   Expected: Kembali ke editor ✅
6. Click "Leave" (OK to close)
   Expected: Tab tertutup ✅
```

### Test 4: Timestamp Display Update
**Purpose**: Verify timestamps update correctly

```
STEPS:
1. Create exam baru: "Timestamp Test"
2. Go to Dashboard
   Expected: Timestamp "Dibuat: [time1]" muncul ✅
   Timestamp "Terakhir diubah: [time1]" atau tidak muncul
   (bisa jadi createdAt == updatedAt)

3. Wait 1 minute

4. Edit exam:
   - Click Edit
   - Change soal title/questions
   - Click Simpan

5. Go to Dashboard
   Expected: 
   - "Dibuat: [time1]" TETAP SAMA ✅
   - "Terakhir diubah: [time2]" UPDATED ✅
   (updatedAt > createdAt)

6. View dalam 24 jam:
   Expected: Timestamps format tetap readable ✅
   Example: "Dibuat: 23 Feb 2025 10:30"
```

### Test 5: Save Delay Performance
**Purpose**: Verify no UI freeze during typing

```
STEPS:
1. Buka exam editor
2. Click di question text field
3. Type panjang text (100+ karakter)
   While typing:
   - UI should NOT freeze ✅
   - Text should appear immediately ✅
   - Backup should NOT block typing ✅
4. Type fast (continuous typing)
   Expected: No lag, smooth input ✅
5. Wait 3 seconds after typing
   Expected: Backup saved silently ✅
```

### Test 6: Multiple Exams
**Purpose**: Verify backup works untuk multiple exams

```
STEPS:
1. Create Exam 1: "Math Test"
   - Add 2 questions
   - Wait 2 seconds (backup)

2. Create Exam 2: "Science Test"  
   - Add 2 questions
   - Wait 2 seconds (backup)

3. Go to dashboard, open Exam 1 editor
4. Check DevTools → LocalStorage
   Expected:
   - exam_draft_[ID_exam1] ada ✅
   - exam_draft_[ID_exam2] ada ✅
   (Both backups coexist)

5. Save Exam 1
   Expected:
   - exam_draft_[ID_exam1] DIHAPUS ✅
   - exam_draft_[ID_exam2] MASIH ADA ✅
```

---

## 🔍 Edge Cases

### Edge Case 1: Browser Crash/Kill
**Scenario**: Browser crash saat editing

```
EXPECTED BEHAVIOR:
1. User was editing exam, questions added
2. Browser crashed (developer closes it)
3. User opens browser again
4. Go to same exam editor
   Expected: Questions recovered from localStorage ✅
```

### Edge Case 2: Very Large Exam
**Scenario**: Exam dengan 100+ questions

```
EXPECTED BEHAVIOR:
1. Create exam dengan banyak soal
2. Add 100 questions
3. Edit soal #50
4. Backup should handle large data ✅
   - Tidak freeze
   - Tidak cause memory leak
5. Refresh page
   Expected: Semua 100 soal recovered ✅
```

### Edge Case 3: localStorage Full
**Scenario**: Browser localStorage penuh (5MB limit)

```
EXPECTED BEHAVIOR:
1. Fill localStorage dengan 5MB data
2. Open exam editor
3. Try to add backup
   Expected: Console warning ✅
   "Failed to backup exam draft"
4. Still can edit & save ✅
   (Backup fail, tapi main functionality OK)
```

### Edge Case 4: Rapid Saves
**Scenario**: User click save button multiple times

```
EXPECTED BEHAVIOR:
1. Edit exam
2. Click Simpan
3. Immediately click Simpan again
   Expected:
   - First save processed ✅
   - Second save should be ignored or re-save ✅
   - No duplicate data ✅
```

### Edge Case 5: Network Latency
**Scenario**: Slow internet connection

```
EXPECTED BEHAVIOR:
1. Edit exam
2. Click Simpan (slow network)
   Expected:
   - UI shows "Menyimpan..." ✅
   - Can navigate away (setTimeout) ✅
   - DB save still happens in background ✅
   - If fail, toast warning shown ✅
```

---

## 🗂️ File Changes Verification

### Check 1: types.ts
```bash
grep "updatedAt" types.ts
```
Expected output:
```
updatedAt?: string; // Waktu perubahan terakhir
```
✅ Presence confirmed

### Check 2: App.tsx - handleExamSave
```bash
grep -A5 "updatedAt: new Date" App.tsx
```
Expected: Should find line with `updatedAt: new Date().toISOString()`
✅ Present

### Check 3: App.tsx - Dashboard display
```bash
grep "Terakhir diubah" App.tsx
```
Expected: Should find timestamp display line
✅ Present

### Check 4: ExamEditor.tsx - Auto-backup
```bash
grep "localStorage.setItem.*exam_draft" components/ExamEditor.tsx
```
Expected: Should find backup logic
✅ Present

### Check 5: ExamEditor.tsx - Recovery
```bash
grep "recoverBackup" components/ExamEditor.tsx
```
Expected: Should find recovery function call
✅ Present

### Check 6: Build test
```bash
npm run build
```
Expected output: ✓ built in X.XXs
✅ No errors

### Check 7: Lint test
```bash
npm run lint
```
Expected output: No output (success)
✅ TypeScript OK

---

## 📋 Regression Tests

### Regression 1: Existing Features Still Work
```
✅ Create exam
✅ Delete exam
✅ Publish exam  
✅ Create question
✅ Delete question
✅ Edit question
✅ Save exam
✅ Preview exam
✅ Add to question bank
✅ AI Generate
```

### Regression 2: Dashboard Still Works
```
✅ Show all exams
✅ Show stat cards
✅ Create menu
✅ Edit button
✅ Filter/sort (if exists)
```

### Regression 3: ExamRunner Still Works
```
✅ Start exam
✅ Answer questions
✅ Timer works
✅ Submit exam
✅ Show results
```

---

## 🚀 Performance Benchmarks

### Before Fix (Approximate)
- Add question: 100ms delay
- Type in text: 50-200ms delay
- Save: 2-5s (blocking)
- Memory: ~10MB after 10 edits

### After Fix (Expected)
- Add question: <10ms delay ✨
- Type in text: <5ms delay ✨
- Save: <500ms UI + async DB ✨
- Memory: ~15MB (backup data) ✨

### Acceptable Performance
- Backup operation: <100ms
- Recovery on load: <500ms
- UI responsiveness: <16ms (60fps) ✨

---

## ✨ Sign-Off Checklist

### Development Team
- [ ] Code reviewed
- [ ] Tested locally
- [ ] Build successful
- [ ] Lint passed
- [ ] No console errors

### QA Team  
- [ ] Test 1-6 passed
- [ ] Edge cases checked
- [ ] Regression tests passed
- [ ] Performance acceptable
- [ ] Documentation clear

### Product Team
- [ ] Feature meets requirements ✅
- [ ] UX is intuitive ✅
- [ ] Timestamps display correctly ✅
- [ ] Recovery works as expected ✅
- [ ] No breaking changes ✅

### Deployment
- [ ] Ready for staging
- [ ] Ready for production
- [ ] Database migration planned (if needed)
- [ ] Rollback plan ready
- [ ] Monitoring alerts set

---

## 📞 Known Limitations

1. **localStorage dependency**
   - Not encrypted
   - ~5MB limit per domain
   - Cleared if user deletes browser data

2. **Browser specific**
   - Backup not synced across browsers
   - Backup not synced across devices

3. **No server-side backup**
   - Only local recovery
   - If all tabs closed, backup lost
   - (Future: add server auto-save)

4. **Timestamp accuracy**
   - Based on client clock
   - May vary across timezones
   - Not precise to milliseconds in display

---

## 🎓 Testing Tips

1. **Open DevTools**: F12 → Application → LocalStorage → search `exam_draft`
2. **Monitor Network**: F12 → Network tab → watch DB calls
3. **Check Console**: F12 → Console → look for warnings/errors
4. **Test Scenarios**: Use Chrome Incognito for clean state
5. **Slow Network**: DevTools → Network → Throttle to "Slow 3G"
6. **Mobile Test**: Chrome DevTools → Device Toolbar (Ctrl+Shift+M)

