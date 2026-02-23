# INSTALLATION & DEPLOYMENT NOTES

## 🚀 Quick Start

### 1. Install Dependencies (jika belum)
```bash
cd /Users/mac/Downloads/examo---platform-ujian-online
npm install
```

### 2. Run Development Server
```bash
npm run dev
# Server akan berjalan di http://localhost:3000
```

### 3. Test Features
```
1. Login sebagai Guru (auto-filled)
2. Buat ujian baru
3. Tambah soal (perhatikan smooth typing, no lag)
4. F12 → Application → LocalStorage → lihat exam_draft_*
5. Refresh halaman → soal harus tetap ada
6. Edit dan simpan → lihat timestamp di dashboard
```

---

## 📦 Build & Deploy

### Production Build
```bash
npm run build
# Output di: dist/

# Build successful jika output:
# ✓ built in 8.89s
```

### Type Checking
```bash
npm run lint
# Harus zero errors (no output = success)
```

### Deploy to Vercel
```bash
# vercel.json sudah ada
npx vercel
# atau:
git push # (jika linked dengan Vercel)
```

---

## 🗄️ Database Setup (Supabase)

### New Column untuk Timestamps
```sql
-- Jika menggunakan Supabase, jalankan di SQL Editor:
ALTER TABLE public.exams ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE;

-- Verify:
SELECT * FROM information_schema.columns WHERE table_name='exams';
-- Harus ada: created_at, updated_at
```

### Mapping di Code
```typescript
// Frontend sudah siap:
// - createdAt → created_at (snake_case di DB)
// - updatedAt → updated_at (snake_case di DB)

// Automatic conversion di App.tsx:
createdAt: e.created_at,      // Read
updatedAt: e.updated_at,      // Read
created_at: examWithTimestamp.createdAt,    // Write
updated_at: examWithTimestamp.updatedAt     // Write (NEW)
```

---

## ✅ Verification Checklist

### Before Deployment
```
[ ] npm run build → SUCCESS
[ ] npm run lint → NO ERRORS
[ ] Test on http://localhost:3000
    [ ] Add question → smooth (no lag)
    [ ] Drag question → safe (no data loss)
    [ ] Save → timestamp updates
    [ ] Refresh → questions recovered
[ ] localStorage backup working
    [ ] F12 → Application → LocalStorage
    [ ] Find: exam_draft_[ID]
[ ] Browser warning works
    [ ] Edit without save
    [ ] Try close tab → warning dialog
```

### Database Migration
```
[ ] If using Supabase:
    [ ] Run SQL: ALTER TABLE exams ADD COLUMN updated_at
    [ ] Test save to DB
    [ ] Verify columns exist
[ ] If using mock data:
    [ ] No changes needed (works with fallback)
```

### Testing
```
[ ] All test scenarios passed (see TEST_CHECKLIST.md)
[ ] No console errors (F12 → Console)
[ ] Responsive on mobile (F12 → Device Toolbar)
[ ] Timestamps display correctly
```

---

## 🔧 Configuration

### Backup Frequency (optional)
Edit `ExamEditor.tsx`:
```typescript
setTimeout(() => {
  localStorage.setItem(`exam_draft_${exam.id}`, JSON.stringify(formData));
}, 2000); // Change 2000 to adjust (milliseconds)
```

Recommended values:
- 500 = very frequent (may lag)
- 1000 = every 1 second
- 2000 = every 2 seconds (default, balanced)
- 3000 = every 3 seconds
- 5000+ = infrequent (may lose data)

### Timestamp Format (optional)
Edit `App.tsx`:
```typescript
new Date(e.createdAt).toLocaleDateString('id-ID', { 
  day: 'numeric', 
  month: 'short', 
  year: 'numeric', 
  hour: '2-digit', 
  minute: '2-digit' 
})
```

Current format: "23 Feb 2025 10:30"
Change 'id-ID' to other locales:
- 'en-US' = "Feb 23, 2025, 10:30 AM"
- 'de-DE' = "23.02.2025, 10:30"
- 'fr-FR' = "23 février 2025 10:30"

---

## 📊 Monitoring & Support

### Check Logs
```bash
# Development:
npm run dev
# Watch console for warnings/errors

# Production:
# Check Vercel dashboard for logs
# Check browser console (F12 → Console)
```

### localStorage Issues
```
# If backup not working:
1. Check: localStorage tidak disabled
2. Check: Not in private/incognito mode
3. Check: ~5MB available space
4. Clear cache: Settings → Clear browsing data

# To debug:
F12 → Application → LocalStorage
Search: exam_draft_
Check size & content
```

### Performance Issues
```
1. Check browser performance: F12 → Performance
2. Record 30 seconds of interaction
3. Look for:
   - Long tasks (>50ms)
   - FPS drops (<60fps)
   - Memory leaks
```

---

## 🔒 Security Notes

### localStorage Data
⚠️ IMPORTANT:
- localStorage is NOT encrypted
- Browser-local only (not shared)
- If user's computer compromised, data exposed
- Don't store sensitive data that needs encryption

✅ OK in localStorage:
- Exam drafts (auto-cleanup on save)
- UI state
- User preferences

❌ NOT OK in localStorage:
- Passwords
- API keys
- Personal identifiable info

### Database Security
- Supabase handles encryption
- Use Row Level Security (RLS) policies
- Verify: `created_by` matches `currentUser.id`

---

## 🐛 Troubleshooting

### Build Error
```
Error: npm run build fails

Solution:
1. npm install
2. npm run lint (check TypeScript)
3. Clear cache: rm -rf dist node_modules
4. npm install && npm run build
```

### Timestamps Not Showing
```
Error: Dashboard shows no timestamps

Solution:
1. Check database: updated_at column exists
2. Check App.tsx mapping: updatedAt field mapping
3. Check format: date conversion correct
4. Verify: e.updatedAt has value
```

### Backup Not Working
```
Error: localStorage backup not saving

Solution:
1. F12 → Console, check for errors
2. Check: localStorage not full
3. Check: Not in private mode
4. Verify: exam_draft_[id] key in localStorage
5. Check quota: try localStorage.setItem('test', 'data')
```

### Drag & Drop Issues
```
Error: Soal hilang saat drag

Solution:
1. This should be fixed now ✅
2. If still occurs:
   - Clear cache
   - Restart browser
   - Check browser console for errors
```

---

## 📚 File Structure After Changes

```
examo---platform-ujian-online/
├── types.ts                          (✅ Modified - added updatedAt)
├── App.tsx                           (✅ Modified - save logic + display)
├── components/
│   ├── ExamEditor.tsx                (✅ Modified - backup + recovery)
│   └── ... (other components)
├── lib/
│   ├── debounce.ts                   (✅ NEW - utility helper)
│   └── ... (other utilities)
├── services/
│   └── ... (unchanged)
├── COMPLETION_SUMMARY.md             (✅ NEW - this fix summary)
├── FIX_SUMMARY_LENGKAP.md            (✅ NEW - detailed explanation)
├── ARCHITECTURE_DIAGRAM.md           (✅ NEW - flow diagrams)
├── TEST_CHECKLIST.md                 (✅ NEW - test scenarios)
├── QUICK_START_TEST.md               (✅ NEW - 5-minute guide)
├── VISUAL_GUIDE.md                   (✅ NEW - visual examples)
├── INSTALLATION_NOTES.md             (✅ NEW - this file)
└── ... (other files unchanged)
```

---

## 🎯 Success Criteria

After deployment, verify:

```
✅ No console errors
✅ Auto-backup working (check localStorage)
✅ Auto-recovery working (refresh test)
✅ Timestamps display (check dashboard)
✅ Drag & drop safe (reorder questions)
✅ Typing smooth (no lag)
✅ Save to DB (async, non-blocking)
✅ Browser warning (unsaved changes)
```

---

## 📞 Support & Questions

### For Developers
- Code is TypeScript (npm run lint)
- Check `ARCHITECTURE_DIAGRAM.md` for flow
- See `TEST_CHECKLIST.md` for scenarios

### For Testers  
- Follow `QUICK_START_TEST.md` (5 minutes)
- Use `TEST_CHECKLIST.md` (comprehensive)
- Check browser DevTools (F12)

### For Deployment
- Build: `npm run build`
- Lint: `npm run lint`
- Database: Add `updated_at` column (if using Supabase)
- Monitor: Check logs & performance

---

## 🚀 Next Steps

1. **Test Locally**: Follow QUICK_START_TEST.md
2. **Run Full Tests**: Follow TEST_CHECKLIST.md
3. **Build**: npm run build
4. **Deploy**: Push to main branch / Vercel
5. **Monitor**: Check logs for issues
6. **Update Docs**: Inform team of changes

---

*Last Updated: 2025-02-23*
*Status: Ready for Production ✅*
