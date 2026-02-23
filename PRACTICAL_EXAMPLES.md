# 📚 PRACTICAL EXAMPLES & USE CASES

## Use Case 1: Siswa Login dari Device Berbeda

### Skenario
Siswa A login dari laptop di rumah, lalu mencoba login dari handphone sambil di perjalanan.

### Flow & Expected Behavior

```
1️⃣ LAPTOP LOGIN
   Login form → Input email & password
   → generateDeviceId() → "device_a1b2c3d4"
   → getClientIP() → "192.168.1.50"
   → validateDeviceLogin() → ALLOWED ✅
   → createSession() → Session ID: "sess_123"
   → logActivity('login') → Recorded
   → Navigate to STUDENT_DASHBOARD
   
2️⃣ PHONE LOGIN (5 menit kemudian)
   Login form → Input email & password
   → generateDeviceId() → "device_e5f6g7h8" (berbeda!)
   → getClientIP() → "180.241.123.45" (berbeda!)
   → validateDeviceLogin() → REJECTED ❌
   → Error: "Akun Anda sedang aktif dari device lain (IP: 192.168.1.50)"
   → Login form stays, user cannot proceed
   
3️⃣ LOGOUT DARI LAPTOP
   Sidebar → Keluar
   → logout(sessionId)
   → user_sessions.is_active = false
   → logActivity('logout')
   
4️⃣ PHONE LOGIN RETRY
   Login form → Input email & password
   → validateDeviceLogin() → ALLOWED ✅ (session lama sudah inactive)
   → createSession() → New Session ID: "sess_456"
   → Navigate to STUDENT_DASHBOARD
```

### Database State

```typescript
// Setelah step 1️⃣
user_sessions: {
  id: 'sess_123',
  user_id: 'siswa_a',
  device_id: 'device_a1b2c3d4',
  ip_address: '192.168.1.50',
  is_active: true,
  login_at: '2026-02-23T10:00:00Z'
}

user_activity_log: {
  activity_type: 'login',
  user_id: 'siswa_a',
  ip_address: '192.168.1.50',
  device_id: 'device_a1b2c3d4',
  timestamp: '2026-02-23T10:00:00Z'
}

// Setelah step 3️⃣
user_sessions: {
  id: 'sess_123',
  user_id: 'siswa_a',
  is_active: false, // ← Changed
  status: 'inactive'
}

user_activity_log: {
  activity_type: 'logout',
  user_id: 'siswa_a',
  timestamp: '2026-02-23T10:05:00Z'
}

// Setelah step 4️⃣
user_sessions: {
  id: 'sess_456',
  user_id: 'siswa_a',
  device_id: 'device_e5f6g7h8',
  ip_address: '180.241.123.45',
  is_active: true,
  login_at: '2026-02-23T10:10:00Z'
}
```

---

## Use Case 2: MCQ Shuffle Consistency

### Skenario
Siswa B mulai ujian Matematika, pertanyaan MCQ di-shuffle, kemudian refresh browser.

### Flow & Expected Behavior

```
1️⃣ START EXAM
   ExamRunner loads
   → LoadOrGenerateShuffledQuestions()
   → Check sessionStorage[`examo_shuffle_exam_math_siswa_b`] → NOT FOUND
   → Generate shuffle:
      Original: [Q1_Aljabar, Q2_Geometri, Q3_Kalkulus]
      Shuffled: [Q3_Kalkulus, Q1_Aljabar, Q2_Geometri]
   → For Q1 options: [A, B, C, D] → Shuffled: [C, A, D, B]
      Correct answer was A (index 0) → Now D (index 3)
   → Save to sessionStorage
   → Render shuffled questions
   
2️⃣ USER NAVIGATES BETWEEN QUESTIONS
   Click Soal 2 (Aljabar)
   → shuffledQuestions[1] loaded
   → Same options in same shuffle order
   → User answer selected
   → ExamRunner.autosave()
   
3️⃣ USER GOES BACK TO SOAL 3
   Click Soal 3 (Kalkulus)
   → shuffledQuestions[0] loaded
   → SAME shuffle order as before
   → User answer still selected
   
4️⃣ USER REFRESHES PAGE (F5)
   Page reloads
   → ExamRunner loads
   → LoadOrGenerateShuffledQuestions()
   → Check sessionStorage[`examo_shuffle_exam_math_siswa_b`] → FOUND ✅
   → Load dari sessionStorage (JANGAN generate ulang!)
   → Render exact same shuffled questions
   → Questions tetap di posisi yang sama
   → User answers restored dari ExamResult
   
5️⃣ USER SELESAI EXAM
   Click KIRIM
   → handleExamFinish()
   → shuffledQuestions saved ke ExamResult.questions
   → exampleResult.questions = [Q3, Q1, Q2] dengan shuffle detail
   → Save ke database exam_results
```

### SessionStorage State

```javascript
// After step 1️⃣
sessionStorage.getItem('examo_shuffle_exam_math_siswa_b')
// Returns:
[
  {
    id: 'q3',
    type: 'mcq',
    text: 'Apa itu kalkulus...',
    options: ['Option C', 'Option A', 'Option D', 'Option B'],
    correctAnswerIndex: 1, // Adjusted from original
    originalOptionsMapping: [2, 0, 3, 1]
  },
  // ... other questions
]

// After step 4️⃣ refresh
// Same data loaded, NOT regenerated
```

### Key Points
- ✅ Shuffle TIDAK berubah saat refresh
- ✅ Shuffle TIDAK berubah saat navigate between questions
- ✅ Shuffle BERUBAH saat exam ditutup dan dibuka lagi (new session)
- ✅ Setiap siswa punya shuffle berbeda (key includes userId)
- ✅ Jawaban yang benar di-adjust sesuai shuffle (correctAnswerIndex diubah)

---

## Use Case 3: Guru Lihat Riwayat Ujian Siswa

### Skenario
Guru Budi ingin melihat semua riwayat ujian dari Siswa Andi untuk monitoring.

### Flow & Expected Behavior

```
1️⃣ GURU BUKA BUKU NILAI
   Navigate to TEACHER_GRADES
   → gradeViewMode = 'summary' (default)
   → Render tabel siswa dengan riwayat ujian
   
2️⃣ GURU LIHAT DAFTAR SISWA
   Tabel students tampil
   → Siswa Andi tampil di baris pertama
   → Ada button "history" di setiap baris
   
3️⃣ GURU KLIK BUTTON HISTORY DI SISWA ANDI
   onClick={() => {
     setSelectedStudentForHistory({ 
       id: 'siswa_andi_id', 
       name: 'Andi' 
     });
     setShowStudentExamHistory(true);
   }}
   
4️⃣ MODAL OPENS - LOAD HISTORY
   StudentExamHistory component mounts
   → useEffect(() => {
       const history = await UserActivityService
         .getStudentExamHistory('siswa_andi_id');
       setExamHistory(history);
     })
   → Database query:
       SELECT * FROM exam_submission_history
       WHERE student_id = 'siswa_andi_id'
       ORDER BY submitted_at DESC
   
5️⃣ DISPLAY EXAM HISTORY
   Modal shows:
   
   ┌─ Ujian #3 ────────────────────┐
   │ Ujian Akhir Matematika  [SELESAI]
   │ 23 Feb 2026, 14:30      │
   │ ⏱️ 45 menit    🚨 2 pelanggaran  │
   │ Nilai: 85/100 (85%)              │
   │ [▼] Expand untuk lihat detail    │
   └─────────────────────────────────┘
   
   ┌─ Ujian #2 ────────────────────┐
   │ Quiz Aljabar            [SELESAI]
   │ 20 Feb 2026, 10:15              │
   │ ⏱️ 30 menit    🚨 0 pelanggaran  │
   │ Nilai: 95/100 (95%)              │
   │ [▼] Expand untuk lihat detail    │
   └─────────────────────────────────┘
   
6️⃣ GURU EXPAND UJIAN #3
   Click ▼ button
   → Modal expands to show:
   
   STATUS UJIAN: ✅ Selesai
   WAKTU PENGERJAAN: 45 menit
   TOTAL SOAL: 20
   
   IP ADDRESS: 192.168.1.101
   DEVICE ID: device_abc123xyz789
   
   PELANGGARAN: 2 kali keluar dari tab
   
   RINCIAN NILAI:
   ┌────────────────────────┐
   │ Perolehan: 85          │
   │ Total Poin: 100        │
   │ Persentase: 85%        │
   └────────────────────────┘
```

### Database Query

```sql
-- Query yang dijalankan
SELECT 
  id,
  exam_result_id,
  exam_id,
  exam_title,
  score,
  total_points,
  status,
  submitted_at,
  duration_taken_minutes,
  violation_count,
  ip_address,
  device_id
FROM exam_submission_history
WHERE student_id = 'siswa_andi_id'
ORDER BY submitted_at DESC;

-- Result:
[
  {
    id: 'history_3',
    exam_result_id: 'result_85',
    exam_id: 'exam_math_final',
    exam_title: 'Ujian Akhir Matematika',
    score: 85,
    total_points: 100,
    status: 'completed',
    submitted_at: '2026-02-23T14:45:00Z',
    duration_taken_minutes: 45,
    violation_count: 2,
    ip_address: '192.168.1.101',
    device_id: 'device_abc123xyz789'
  },
  {
    id: 'history_2',
    exam_result_id: 'result_95',
    exam_id: 'exam_aljabar_quiz',
    exam_title: 'Quiz Aljabar',
    score: 95,
    total_points: 100,
    status: 'completed',
    submitted_at: '2026-02-20T10:20:00Z',
    duration_taken_minutes: 30,
    violation_count: 0,
    ip_address: '192.168.1.101',
    device_id: 'device_abc123xyz789'
  }
]
```

---

## Use Case 4: Admin Monitor Aktivitas User

### Skenario
Admin monitoring ingin melihat siapa saja yang login pagi ini dan apa aktivitas mereka.

### Flow & Expected Behavior

```
1️⃣ GURU/ADMIN BUKA BUKU NILAI
   Navigate to TEACHER_GRADES
   
2️⃣ KLIK TOMBOL "AKTIVITAS USER"
   onClick={() => setShowUserActivityManager(true)}
   
3️⃣ MODAL OPENS - LOAD USER SUMMARY
   UserActivityManager component mounts
   → useEffect(() => {
       const summary = await UserActivityService
         .getAllUserActivitySummary();
       setActivitySummary(summary);
     })
   
4️⃣ QUERY DATABASE
   SELECT * FROM user_activity_summary
   
   Result:
   user_activity_summary (VIEW) mengaggregate dari:
   - users table
   - user_activity_log
   - user_sessions
   
   Output:
   [
     {
       id: 'user_1',
       email: 'guru@sekolah.id',
       name: 'Bpk Ahmad',
       role: 'teacher',
       total_activities: 15,
       last_online: '2026-02-23T10:30:00Z',
       current_ip: '192.168.1.100',
       current_device: 'device_guru_001',
       active_session_count: 1
     },
     {
       id: 'user_2',
       email: 'siswa1@sekolah.id',
       name: 'Andi',
       role: 'student',
       total_activities: 8,
       last_online: '2026-02-23T09:45:00Z',
       current_ip: '192.168.1.101',
       current_device: 'device_andi_mobile',
       active_session_count: 1
     }
   ]

5️⃣ DISPLAY USER LIST
   Modal shows semua users dengan cards:
   
   ┌─────────────────────────────────────────┐
   │ 👤 Bpk Ahmad (guru@sekolah.id)          │
   │ [GURU]                                   │
   │ Total Aktivitas: 15                      │
   │ Terakhir Online: 10:30                   │
   │ IP Saat Ini: 192.168.1.100               │
   │ ► Expand untuk lihat detail              │
   └─────────────────────────────────────────┘
   
   ┌─────────────────────────────────────────┐
   │ 👤 Andi (siswa1@sekolah.id)              │
   │ [SISWA]                                  │
   │ Total Aktivitas: 8                       │
   │ Terakhir Online: 09:45                   │
   │ IP Saat Ini: 192.168.1.101               │
   │ ► Expand untuk lihat detail              │
   └─────────────────────────────────────────┘

6️⃣ FILTER BY DATE RANGE
   Select "Hari Ini" (default is "Minggu Ini")
   → Query updated:
   
   SELECT * FROM user_activity_log
   WHERE DATE(timestamp) = TODAY
   ORDER BY timestamp DESC
   
   Result akan difilter hanya hari ini saja

7️⃣ ADMIN EXPAND USER "ANDI"
   Click expand button
   → Load activity log untuk Andi
   
   getUserActivityLog('user_2', 100)
   
   Result:
   [
     {
       id: 'log_8',
       activity_type: 'login',
       timestamp: '2026-02-23T08:00:00Z',
       ip_address: '192.168.1.101',
       device_id: 'device_andi_mobile',
       activity_detail: 'Login dari siswa'
     },
     {
       id: 'log_7',
       activity_type: 'exam_start',
       timestamp: '2026-02-23T08:15:00Z',
       exam_id: 'exam_math_final',
       activity_detail: 'Ujian Akhir Matematika started'
     },
     {
       id: 'log_6',
       activity_type: 'exam_submit',
       timestamp: '2026-02-23T09:00:00Z',
       exam_id: 'exam_math_final',
       activity_detail: 'Ujian Akhir Matematika submitted'
     },
     {
       id: 'log_5',
       activity_type: 'logout',
       timestamp: '2026-02-23T09:45:00Z',
       activity_detail: 'User logout'
     }
   ]
   
8️⃣ DISPLAY ACTIVITY TIMELINE
   Modal shows timeline:
   
   08:00 ✅ LOGIN
        Dari IP: 192.168.1.101
        Device: device_andi_mobile
   
   08:15 📝 EXAM_START
        Ujian: Ujian Akhir Matematika
        Dari IP: 192.168.1.101
   
   09:00 ✔️ EXAM_SUBMIT
        Ujian: Ujian Akhir Matematika
        Dari IP: 192.168.1.101
   
   09:45 🚪 LOGOUT
        Dari IP: 192.168.1.101
```

### Database Query

```sql
-- View: user_activity_summary
SELECT 
  u.id,
  u.email,
  u.name,
  u.role,
  COUNT(DISTINCT ual.id) as total_activities,
  MAX(ual.timestamp) as last_online,
  (SELECT ip_address FROM user_sessions 
   WHERE user_id = u.id 
   ORDER BY login_at DESC LIMIT 1) as current_ip,
  (SELECT device_id FROM user_sessions 
   WHERE user_id = u.id 
   ORDER BY login_at DESC LIMIT 1) as current_device,
  (SELECT COUNT(*) FROM user_sessions 
   WHERE user_id = u.id AND is_active = true) as active_session_count
FROM users u
LEFT JOIN user_activity_log ual ON u.id = ual.user_id
GROUP BY u.id, u.email, u.name, u.role;
```

---

## Use Case 5: Guru Eksport Data Aktivitas

### Future Enhancement (Not Yet Implemented)

```typescript
// Potential button di Activity Manager
<button onClick={exportActivityToCSV}>
  <FileSpreadsheet /> Export as CSV
</button>

// Would generate CSV like:
// timestamp,user_id,email,activity_type,ip_address,device_id
// 2026-02-23T08:00:00Z,user_2,siswa@sekolah.id,login,192.168.1.101,device_abc
// 2026-02-23T08:15:00Z,user_2,siswa@sekolah.id,exam_start,192.168.1.101,device_abc
```

---

## 🔍 Debugging & Troubleshooting Examples

### Example 1: Shuffle Not Persisting

```javascript
// Check di browser console:
sessionStorage.getItem('examo_shuffle_exam_math_siswa_1')
// If returns null → Shuffle not cached

// Check if loadOrGenerateShuffledQuestions is called:
console.log('Cache key:', getShuffleCacheKey());
console.log('From cache?', cachedData ? 'YES' : 'NO');
console.log('Shuffled questions:', questionsToRun);
```

### Example 2: Activity Log Not Recording

```javascript
// Check if UserActivityService methods are called:
await UserActivityService.logActivity(
  userId, email, 'login', ...
);

// Check database directly:
SELECT * FROM user_activity_log 
WHERE user_id = 'siswa_1' 
ORDER BY timestamp DESC LIMIT 5;

// If empty → logActivity not called atau failed silently
```

### Example 3: Device ID Mismatch

```javascript
// Get actual device IDs:
const deviceId1 = UserActivityService.generateDeviceId();
sessionStorage.getItem('examo_device_id')
// device_abc123 should match

// If different → Something wrong dengan init
```

---

**Version**: 1.0
**Last Updated**: Feb 23, 2026
