# ARCHITECTURE: Save & Recovery Flow

## 1️⃣ EXAM EDITOR STATE FLOW

```
┌─────────────────────────────────────────────────────────────────┐
│                    EXAM EDITOR COMPONENT                         │
└─────────────────────────────────────────────────────────────────┘

    ┌──────────────────────┐
    │   INITIALIZATION     │
    └──────────────────────┘
            │
            ▼
    ┌──────────────────────────────────┐
    │ Try recoverBackup() from          │
    │ localStorage[exam_draft_{id}]     │
    └──────────────────────────────────┘
            │
    ┌───────┴────────┐
    │ Found?         │
    ├─────────┬──────┤
    │   YES   │  NO  │
    ▼         ▼
  [Backup]  [Original]
    │         │
    └────┬────┘
         │
         ▼
    ┌──────────────────────┐
    │   [formData State]   │ ← Loaded with recovered or original
    └──────────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│                  USER INTERACTIONS                               │
└─────────────────────────────────────────────────────────────────┘

Edit Question Text
    ▼
handleQuestionChange()
    ▼
setFormData(prev => { ... questions[i].text = newValue ... })
    ▼
[State Updated] ───────────────────────┐
                                       │
        ┌──────────────────────────────┘
        │
        ▼ (debounced 2s)
localStorage.setItem(`exam_draft_${id}`, JSON.stringify(formData))
    │
    ├─ SUCCESS ✅ Backup tersimpan
    │
    └─ FAIL ⚠️ Console warning (localStorage full?)


┌─────────────────────────────────────────────────────────────────┐
│                    SAVE BUTTON CLICKED                           │
└─────────────────────────────────────────────────────────────────┘

User clicks "Simpan"
    ▼
setIsSaving(true)
    ▼
onSave(formData) [Call parent App.tsx]
    ├─ Optimistic: setState(formData) immediately
    │              show success toast
    │
    └─ Background: Save to DB (async)
       ├─ If success:
       │  └─ localStorage.removeItem(`exam_draft_${id}`)
       │     Clear backup after save
       │
       └─ If fail:
          └─ Show warning toast
             Keep backup for recovery


┌─────────────────────────────────────────────────────────────────┐
│                   UNSAVED CHANGES WARNING                        │
└─────────────────────────────────────────────────────────────────┘

User tries to close tab/browser
    ▼
beforeunload event triggered
    ▼
Check: formData === lastSavedRef.current ?
    │
    ├─ YES (no changes) → Allow close ✅
    │
    └─ NO (has changes) → Prevent close ⚠️
       │
       ▼
    Browser shows: "Apakah Anda ingin meninggalkan halaman ini?"
```

---

## 2️⃣ APP.tsx SAVE FLOW

```
┌─────────────────────────────────────────────────────────────────┐
│            handleExamSave(updatedExam: Exam)                     │
│            Called from ExamEditor.tsx                            │
└─────────────────────────────────────────────────────────────────┘

Input: updatedExam
    │
    ├─ Check if exam exists in state
    │  exams.some(e => e.id === updatedExam.id)
    │
    ▼
┌──────────────────────────────────────────┐
│ Add timestamps:                          │
│ - createdAt: keep existing (don't change)│
│ - updatedAt: new Date().toISOString()    │ ✨ NEW
└──────────────────────────────────────────┘
    │
    ▼
[examWithTimestamp] ────────────┐
                                │
        ┌───────────────────────┘
        │
        ├─ OPTIMISTIC UPDATE (UI)
        │  setExams(prev => 
        │    prev.map(e => 
        │      e.id === id ? examWithTimestamp : e
        │    )
        │  )
        │  → UI updates immediately ⚡
        │
        └─ SHOW TOAST
           'Ujian berhasil disimpan!' ✅
    │
    ▼
┌──────────────────────────────────────────┐
│ BACKGROUND: Save to DB (Fire & Forget)   │
│ (Don't wait for response)                 │
└──────────────────────────────────────────┘
    │
    ▼
if (isSupabaseConfigured && supabase) {
    │
    ├─ Prepare dbExam object:
    │  {
    │    id, title, description,
    │    duration_minutes,
    │    category, status, questions,
    │    start_date, end_date,
    │    created_by,
    │    created_at: exists ? undefined : createdAt,
    │    updated_at: updatedAt ✨ NEW
    │  }
    │
    ├─ if (exists):
    │  │  supabase.from('exams')
    │  │    .update(dbExam)
    │  │    .eq('id', id)
    │  │
    │  └─ If error: show warning toast
    │
    └─ else:
       │  supabase.from('exams')
       │    .insert(dbExam)
       │
       └─ If error: rollback optimistic + show error
          setExams(prev => prev.filter(e => e.id !== id))
}

    │
    ▼
setTimeout(() => {
  setView('TEACHER_DASHBOARD')
}, 300)
    │
    ▼
EXIT EDITOR → Show Dashboard with updated timestamp
```

---

## 3️⃣ DASHBOARD DISPLAY FLOW

```
┌──────────────────────────────────────────────────────────────────┐
│            Teacher Dashboard                                      │
│            "Ujian Terkini" Section                               │
└──────────────────────────────────────────────────────────────────┘

exams.map(e => (
    │
    ▼
<div className="bg-white p-8 rounded-[40px]">
    │
    ├─ Exam Title: "{e.title}"
    │
    ├─ Category + Question Count
    │  "{e.category}" | "{e.questions.length} Soal"
    │
    ├─ ✨ TIMESTAMPS (NEW):
    │  │
    │  ├─ "Dibuat: {createdAt formatted}"
    │  │  Example: "Dibuat: 23 Feb 2025 10:30"
    │  │
    │  └─ "Terakhir diubah: {updatedAt formatted}"
    │     Example: "Terakhir diubah: 23 Feb 2025 14:45"
    │     (Only shown if updatedAt exists)
    │
    └─ Edit Button
       onClick: setEditingExam(e); setView('EXAM_EDITOR')
))
```

Format date: `toLocaleDateString('id-ID', { day, month, year, hour, minute })`
- Example output: "23 Feb 2025 14:45"
- Timezone: User's local timezone

---

## 4️⃣ LOCALSTORAGE BACKUP STRUCTURE

```
Browser LocalStorage
├─ exam_draft_uuid-abc-123 (if editing)
│  │
│  └─ Content: JSON stringified Exam object
│     {
│       "id": "uuid-abc-123",
│       "title": "Matematika Kelas 10",
│       "description": "Ujian tengah semester",
│       "durationMinutes": 90,
│       "questions": [
│         {
│           "id": "q1",
│           "type": "mcq",
│           "text": "1 + 1 = ?",
│           "options": ["1", "2", "3", "4"],
│           "correctAnswerIndex": 1,
│           "points": 10
│         },
│         ... more questions
│       ],
│       "category": "UMUM",
│       "status": "published",
│       "createdAt": "2025-02-23T10:00:00.000Z",
│       "updatedAt": "2025-02-23T14:45:30.000Z"
│     }
│
├─ exam_draft_uuid-def-456
│  └─ (another exam draft if editing multiple)
│
└─ (other app data)

Lifecycle:
1. Created: saat user typing (every 2 seconds debounce)
2. Updated: setiap user ubah sesuatu (max setiap 2 seconds)
3. Deleted: setelah user click "Simpan" successfully
```

---

## 5️⃣ DRAG & DROP SAFE LOGIC

```
┌──────────────────────────────────────────────┐
│   onDragStart(e, index)                      │
│   User starts dragging question              │
└──────────────────────────────────────────────┘

setDraggedIndex(index)
e.dataTransfer.effectAllowed = 'move'


┌──────────────────────────────────────────────┐
│   onDragOver(e, index)                       │
│   User is dragging over another question     │
└──────────────────────────────────────────────┘

e.preventDefault()

┌─────────────────────────────────────┐
│ VALIDATION (NEW)                    │
├─────────────────────────────────────┤
│ if (draggedIndex == null):          │
│   return (nothing to drag)           │
│                                      │
│ if (draggedIndex == index):          │
│   return (same position)             │
│                                      │
│ if (draggedIndex < 0 ||             │
│     draggedIndex >= length):         │
│   setDraggedIndex(null)              │
│   return (index out of bounds)       │ ✨ NEW
│                                      │
│ if (index < 0 ||                    │
│     index >= length):                │
│   setDraggedIndex(null)              │
│   return (target out of bounds)      │ ✨ NEW
└─────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────────┐
│ SAFE REORDER (NEW)                       │
├──────────────────────────────────────────┤
│ const newQs = [...formData.questions]    │
│ const draggedItem = newQs[draggedIndex]  │ ✨ Don't splice yet
│                                          │
│ if (draggedItem) {                       │ ✨ Verify exists
│   newQs.splice(draggedIndex, 1)          │
│   newQs.splice(index, 0, draggedItem)    │
│   setDraggedIndex(index)                 │
│   setFormData(prev => {                  │
│     questions: newQs                     │
│   })                                     │
│ }                                        │
└──────────────────────────────────────────┘
    │
    ▼
Questions reordered safely ✅
No data corruption ✅
```

---

## 6️⃣ DATA FLOW SUMMARY

```
                    ┌─────────────────┐
                    │ User Types in   │
                    │   Question      │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │ handleQuestion  │
                    │ Change()        │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │ setFormData()   │
                    │ (local state)   │
                    └────────┬────────┘
                             │
                    ┌────────▼────────────────────┐
                    │ UI Re-renders immediately ⚡│
                    │ (user sees typed text)       │
                    └────────┬────────────────────┘
                             │
          ┌──────────────────┴──────────────────┐
          │                                     │
    ┌─────▼──────────────┐          ┌──────────▼────────┐
    │ After 2 seconds:   │          │ User clicks Simpan│
    │                    │          │ (Save button)     │
    │ Backup to          │          └──────────┬────────┘
    │ localStorage       │                     │
    │ (if changed)       │          ┌──────────▼────────┐
    │                    │          │ onSave(formData)  │
    │ Key:               │          │                   │
    │ exam_draft_{id}    │          │ 1. Add timestamp  │
    │                    │          │ 2. Optimistic UI  │
    │ ✅ Recovery ready  │          │ 3. Toast message  │
    │                    │          │ 4. Navigate away  │
    └────────────────────┘          │ 5. Background DB  │
                                    │    save           │
                                    │ 6. Delete backup  │
                                    │    (if success)   │
                                    └──────────┬────────┘
                                              │
                                    ┌─────────▼────────┐
                                    │ Go to Dashboard  │
                                    │ with timestamps  │
                                    │ displayed        │
                                    └──────────────────┘
```

---

## 7️⃣ ERROR HANDLING

```
SCENARIO: User refresh browser while editing

Before Fix:
  Typing → No backup → Refresh → Lost data ❌

After Fix:
  Typing → Auto-backup every 2s → Refresh
    ▼
  ExamEditor loads
    ▼
  recoverBackup() → Find in localStorage
    ▼
  Restore previous state
    ▼
  Continue from where left off ✅


SCENARIO: Save to DB fails

handleExamSave():
  ├─ Optimistic update (state updated immediately)
  │
  ├─ Background DB save async
  │  └─ If error:
  │     ├─ Show warning toast
  │     ├─ Keep backup in localStorage
  │     ├─ User can retry (click Simpan again)
  │     └─ Backup will recover if browser crash


SCENARIO: localStorage is full

Auto-backup tries to save:
  ├─ Try: localStorage.setItem(...)
  │
  ├─ Catch error:
  │  └─ console.warn('Failed to backup...')
  │     User can continue, just no local backup
  │
  └─ Still safe:
     ├─ Optimistic update still works
     ├─ DB save still works
     └─ Just no recovery for this session
```

---

## 📊 State Diagram

```
┌─────────────────────────────────────┐
│  EXAM STATES & TIMESTAMPS           │
└─────────────────────────────────────┘

State 1: CREATE
┌───────────────────────────────────┐
│ new Exam {                        │
│   id: generated-uuid              │
│   title: "Ujian Baru"             │
│   questions: []                   │
│   createdAt: NOW                  │ ← Set once
│   updatedAt: NOW                  │ ← Initial value
│ }                                 │
└───────────────────────────────────┘

State 2: EDIT
┌───────────────────────────────────┐
│ edit question, add questions      │
│                                   │
│ createdAt: (unchanged)            │
│ updatedAt: (still NOW)            │
│                                   │
│ (Backup every 2s)                 │
└───────────────────────────────────┘

State 3: SAVE (After 30 minutes of editing)
┌───────────────────────────────────┐
│ User clicks "Simpan"              │
│                                   │
│ createdAt: (original timestamp)   │
│ updatedAt: NEW DATE               │ ← Updated on save
│                                   │
│ Example:                          │
│ createdAt: "2025-02-23T10:00:00Z" │
│ updatedAt: "2025-02-23T10:30:00Z" │
└───────────────────────────────────┘

State 4: EDIT AGAIN
┌───────────────────────────────────┐
│ Edit more questions               │
│ (Backup continues)                │
│                                   │
│ createdAt: (still original)       │
│ updatedAt: (from previous save)   │
└───────────────────────────────────┘

State 5: SAVE AGAIN (After 2 hours)
┌───────────────────────────────────┐
│ User clicks "Simpan" again        │
│                                   │
│ createdAt: (still original)       │
│ updatedAt: NEW DATE               │ ← Updated again
│                                   │
│ Example:                          │
│ createdAt: "2025-02-23T10:00:00Z" │
│ updatedAt: "2025-02-23T12:30:00Z" │
└───────────────────────────────────┘
```

---

## ✨ Key Improvements Summary

| Aspect | Before | After |
|--------|--------|-------|
| **Save Delay** | ❌ UI blocks every keystroke | ✅ Batched every 2s |
| **Data Loss** | ❌ No recovery | ✅ Auto-backup + recover |
| **Drag & Drop** | ❌ Can corrupt state | ✅ Safe with validation |
| **Timestamp** | ❌ No info when changed | ✅ Display create & last update |
| **Unsaved Warning** | ❌ Silent data loss | ✅ Browser warning on leave |
| **Performance** | ❌ Freezes on type | ✅ Smooth & responsive |

