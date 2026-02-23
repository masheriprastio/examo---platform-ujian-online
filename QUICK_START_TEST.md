# QUICK START: Testing Save Delay Fix

Panduan cepat untuk test fitur yang baru saja di-fix.

## 🚀 1. Setup (2 menit)

```bash
# Terminal 1: Start dev server
cd /Users/mac/Downloads/examo---platform-ujian-online
npm install  # jika belum
npm run dev

# Server akan run di: http://localhost:3000
```

## 🎯 2. Test Cepat (5 menit)

### Scenario A: Soal Tidak Hilang
```
1. Open: http://localhost:3000
2. Login sebagai Guru (auto-fill)
3. Click "Buat Ujian Baru" → Manual
4. Type judul: "Test Soal Tidak Hilang"
5. Click "Tambah Soal" 3x
6. Di setiap soal:
   - Type pertanyaan
   - Set jawaban
   - Tunggu 2 detik (lihat localStorage)
7. JANGAN SAVE
8. Refresh halaman (F5)
9. Click "Edit" exam tadi
   ✅ HASIL: Soal masih ada (recovered)!
10. Click "Simpan"
11. Lihat timestamp "Terakhir diubah" di dashboard
    ✅ HASIL: Timestamp updated!
```

### Scenario B: Drag & Drop Aman  
```
1. Di editor (dari scenario A)
2. Ada 3 soal tersusun: 1, 2, 3
3. Drag soal #2 ke posisi #1
   ✅ HASIL: Jadi 2, 1, 3 (no data loss)
4. Drag soal #3 ke posisi #1
   ✅ HASIL: Jadi 3, 2, 1 (smooth)
5. Click "Simpan"
   ✅ HASIL: Urutan tetap di DB
```

### Scenario C: Timestamp
```
1. Buat ujian baru
2. Lihat dashboard
   ✅ HASIL: Show "Dibuat: [date time]"
3. Wait 1 menit
4. Edit ujian → ubah judul → Simpan
5. Lihat dashboard
   ✅ HASIL: 
      - "Dibuat: [time1]" tetap sama
      - "Terakhir diubah: [time2]" updated
```

## 🔍 3. Verify Backup (2 menit)

```
1. Buka exam editor
2. Edit soal (ubah text)
3. Tunggu 2-3 detik
4. Open DevTools: F12
5. Go to: Application → LocalStorage
6. Cari: exam_draft_[ID]
   ✅ HASIL: Backup file ada!
7. Click "Simpan"
8. Refresh DevTools
   ✅ HASIL: exam_draft_[ID] hilang (cleanup)
```

## ⚠️ 4. Test Unsaved Warning (1 menit)

```
1. Edit exam (ubah soal)
2. DON'T SAVE
3. Try close tab (Ctrl+W)
   ✅ HASIL: Browser warning dialog
4. Click "Cancel" (Stay)
   ✅ HASIL: Kembali ke editor
```

## 📊 5. Check Performance (2 menit)

```
1. Open exam editor
2. Click di question text field
3. Type cepat (20+ karakter)
   ✅ RESULT: UI tidak freeze
   ✅ Text appear instantly
   ✅ Typing is smooth (60fps)
```

---

## 📋 Files Modified

| File | Changes |
|------|---------|
| `types.ts` | ✅ Add `updatedAt` field |
| `App.tsx` | ✅ Update save logic + dashboard timestamps |
| `ExamEditor.tsx` | ✅ Auto-backup + recovery + safe drag |
| `lib/debounce.ts` | ✅ NEW utility (optional) |

---

## ✅ Expected Results Summary

| Test | Expected | Status |
|------|----------|--------|
| Questions saved to backup | ✅ Should find in localStorage | Auto-backup enabled |
| Recovery after refresh | ✅ Questions still there | Auto-recovery works |
| Drag & drop | ✅ No data loss | Safe logic applied |
| Timestamp display | ✅ Show create + last update | Display added |
| No UI freeze | ✅ Smooth typing | Debounced |
| Unsaved warning | ✅ Browser dialog | Hook added |
| Save to DB | ✅ Async, background | Fire & forget |

---

## 🐛 Troubleshooting

### Problem: Backup tidak muncul di localStorage
```
Solution:
1. Check browser: localStorage mungkin disabled
2. Check incognito mode: localStorage no available
3. Try regular browser, non-incognito
4. Check size: <5MB per domain
```

### Problem: Timestamp salah
```
Solution:
1. Check timezone: toLocaleDateString('id-ID')
2. Check client clock
3. Check browser console untuk errors
```

### Problem: Drag & drop masih lag
```
Solution:
1. Check: Ada banyak soal? (100+)
2. Chrome DevTools Perf tab untuk profile
3. May need further optimization untuk large dataset
```

### Problem: Build/Lint error
```
Solution:
npm run build  # Check output
npm run lint   # Check types
npm install    # Re-install if needed
```

---

## 📚 Documentation

- `FIX_SUMMARY_LENGKAP.md` - Complete explanation
- `ARCHITECTURE_DIAGRAM.md` - Visual flow diagrams
- `TEST_CHECKLIST.md` - Comprehensive test suite
- `SAVE_DELAY_AND_TIMESTAMP_FIX.md` - Technical details

---

## 🎓 Key Points

1. **Backup**: Auto-save every 2 seconds ke localStorage
2. **Recovery**: Auto-load backup saat buka editor
3. **Timestamps**: Display create & last update di dashboard
4. **Safe Drag**: Validated indices prevent data corruption
5. **No Delay**: Async backup doesn't block UI
6. **Warning**: Browser warn jika ada unsaved changes

---

## 📞 Support

Error atau issue? Check:
1. Browser console (`F12` → Console)
2. Network tab (`F12` → Network) saat save
3. localStorage content (`F12` → Application → LocalStorage)
4. Recent changes di Git

---

**Happy testing! 🚀**

Harusnya now soal tidak hilang dan ada timestamp untuk track kapan ujian diubah terakhir. 

Jika ada masalah atau mau ada improvement lebih lanjut, let me know!
