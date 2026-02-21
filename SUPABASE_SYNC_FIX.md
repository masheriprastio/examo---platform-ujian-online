# Supabase Exam Sync Fix - Debugging Guide

## Problem Identified

When a teacher created or added questions to an exam using Supabase, students couldn't see the exams after logging in. This was caused by:

1. **Missing error handling** in `handleExamCreate` - database operations weren't awaited or checked for errors
2. **Weak update logic** in `handleExamSave` - used `upsert` which requires the record to exist
3. **Missing `created_at` field** in exam creation - some exams weren't being saved with proper timestamps
4. **No data refetch** after successful saves - optimistic updates weren't being verified

## Changes Made

### 1. Fixed `handleExamSave` (Lines ~504-551)

**Before:**
- Used `upsert` without distinguishing new vs existing exams
- Didn't handle errors properly

**After:**
- Checks if exam exists locally
- Uses `update()` for existing exams
- Uses `insert()` for new exams
- Always calls `fetchData()` after success to verify persistence
- Rolls back optimistic updates on error

```typescript
if (exists) {
    const { error } = await supabase.from('exams').update(dbExam).eq('id', updatedExam.id);
    if (error) {
        console.error("Failed to update exam:", error);
        alert("Gagal menyimpan ujian ke database: " + error.message);
        await fetchData(); // Rollback
    }
} else {
    const { error } = await supabase.from('exams').insert(dbExam);
    if (error) {
        console.error("Failed to create exam:", error);
        alert("Gagal membuat ujian di database: " + error.message);
        setExams(prev => prev.filter(e => e.id !== updatedExam.id)); // Rollback
    }
}
```

### 2. Fixed `handleExamCreate` (Lines ~553-577)

**Before:**
- Didn't await the insert operation
- No error checking or alerts
- Missing `created_at` field

**After:**
- Properly awaits the insert
- Catches and reports errors to user
- Includes `created_at` timestamp
- Calls `fetchData()` to verify the save succeeded
- Shows rollback behavior on error

```typescript
const { error } = await supabase.from('exams').insert(dbExam);
if (error) {
    console.error("Failed to create exam in database:", error);
    alert("Gagal menyimpan ujian ke database: " + error.message);
    setExams(prev => prev.filter(e => e.id !== newExam.id)); // Rollback
} else {
    await fetchData(); // Verify save was successful
}
```

## Testing Guide

### Prerequisites
1. Ensure you have Supabase credentials configured:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

2. Ensure your Supabase `exams` table has:
   - `id` (uuid, primary key)
   - `title` (text)
   - `description` (text)
   - `duration_minutes` (integer)
   - `category` (text)
   - `status` (text: 'draft' or 'published')
   - `questions` (jsonb)
   - `created_by` (uuid, foreign key to users)
   - `created_at` (timestamp with timezone)

### Test Case 1: Create Exam via Manual Editor

1. **Login as teacher** using your Supabase credentials
2. **Click "Buat Ujian Baru" → "Buat Manual"**
3. **Add exam details:**
   - Title: "Test Exam 1"
   - Category: "Testing"
   - Duration: 30 minutes
   - Add 2-3 questions
4. **Click "Simpan Ujian"**
5. **Check browser console** - should see:
   - No errors
   - Network request to `exams` table (insert)
   - Success message or redirect to dashboard
6. **Logout and login as student**
7. **Verify** the exam appears in student dashboard
8. **Check Supabase** - the exam should be in the `exams` table with:
   - All details saved
   - `status = 'draft'` or `'published'`
   - `created_at` timestamp populated

### Test Case 2: Create Exam via AI Generator

1. **Login as teacher**
2. **Click "Generator AI"**
3. **Enter topic:** "Photosynthesis"
4. **Select question type:** "Campuran"
5. **Click "Buat Soal"**
6. **Wait for AI to generate** (may take 10-30 seconds)
7. **Once generated, click "Gunakan Ujian Ini"**
8. **Verify in browser console:**
   - Should see insert success
   - No error messages
9. **Logout, login as student, verify exam appears**

### Test Case 3: Edit Existing Exam

1. **Login as teacher**
2. **Find an exam in dashboard**
3. **Click edit icon**
4. **Modify:**
   - Change title
   - Add a question
   - Change status to published
5. **Click "Simpan Ujian"**
6. **Verify:**
   - Console shows update success
   - No errors
   - Changes persist after reload
7. **Logout, login as student**
8. **Verify changes are visible**

### Test Case 4: Error Handling

1. **Disconnect internet** or use browser DevTools to throttle network
2. **Login as teacher**
3. **Try to create/save an exam**
4. **Verify:**
   - User sees error alert: "Gagal menyimpan ujian ke database: ..."
   - Exam is rolled back from local state
   - Can retry after connectivity restored

## Database Schema Check

Run this SQL in Supabase to verify your exams table:

```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'exams'
ORDER BY ordinal_position;
```

Expected output:
```
id              | uuid          | NO
title           | text          | NO
description     | text          | YES
duration_minutes | integer      | NO
category        | text          | YES
status          | text          | NO
questions       | jsonb         | NO
created_by      | uuid          | YES
created_at      | timestamp     | NO
```

## Common Issues & Solutions

### Issue 1: "Exam created but student can't see it"
**Solution:**
1. Check student's dashboard - does `fetchData()` get called on login?
2. Verify exam `status = 'published'` (students filter by this in some views)
3. Check browser console for fetch errors
4. Manually query Supabase: `SELECT * FROM exams WHERE id = 'xxx';`

### Issue 2: "Exam saved but changes disappeared after reload"
**Solution:**
1. Check that `fetchData()` is called after save
2. Verify Supabase INSERT/UPDATE completed without errors
3. Check if optimistic update was rolled back
4. Look at network tab in DevTools - see the response status

### Issue 3: "Created exams have null/missing fields"
**Solution:**
1. Ensure all required fields are included in `dbExam` object
2. Check Supabase table constraints
3. Verify `created_at` is being set for new exams
4. Run: `SELECT * FROM exams WHERE created_at IS NULL;`

### Issue 4: "User sees error alert but exam was actually saved"
**Solution:**
1. This is a false negative - the rollback removed valid data
2. Add a manual refetch after error alert
3. Consider longer timeout before declaring failure
4. Check Supabase logs for actual errors vs network timeouts

## Monitoring & Debugging

### Enable Console Logging

All key operations now log to console:
```
Failed to create exam: {error details}
Failed to update exam: {error details}
Failed to save exam: {error details}
```

### Check Network Tab

Open DevTools → Network tab and filter by "exams":
- **POST** `/exams` - create operation
- **PATCH** `/exams` - update operation
- **GET** `/exams` - fetch all exams

Look for:
- Status 200-201: Success
- Status 400-500: Error from Supabase
- Timeout: Network issue

### Verify Data in Supabase

```sql
-- Check all exams
SELECT id, title, status, created_by, created_at 
FROM exams 
ORDER BY created_at DESC;

-- Check specific user's exams
SELECT * FROM exams 
WHERE created_by = 'user_id_here'
ORDER BY created_at DESC;

-- Count by status
SELECT status, COUNT(*) 
FROM exams 
GROUP BY status;
```

## Performance Notes

After fixing, the flow is:
1. **Optimistic update** - shows immediately in UI
2. **Database insert/update** - 100-500ms typically
3. **fetchData()** - refetches all exams from Supabase (500-1000ms)

Total: ~1-2 seconds for a full sync cycle.

If this feels slow, consider:
- Only refetching the specific exam instead of all exams
- Debouncing multiple rapid saves
- Using Supabase real-time subscriptions (advanced)

## Summary of Fixes

| Issue | Fixed In | Solution |
|-------|----------|----------|
| Missing await on insert | `handleExamCreate` | Added `await` and error handling |
| Wrong update method | `handleExamSave` | Use insert() for new, update() for existing |
| Missing created_at | Both handlers | Added `created_at: newExam.createdAt` |
| No error feedback | Both handlers | Show alert and rollback on error |
| Unverified saves | Both handlers | Call `fetchData()` after success |
| No student visibility | App.tsx | `fetchData()` called on login and view changes |

---

**Version:** 1.0  
**Date:** February 21, 2026  
**Status:** Ready for Testing
