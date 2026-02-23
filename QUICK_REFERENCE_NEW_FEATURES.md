# QUICK REFERENCE - Fitur-Fitur Baru Examo

## 1️⃣ Device/IP Login Validation

### Implementasi
```typescript
// App.tsx - handleLogin function
const validation = await UserActivityService.validateDeviceLogin(
  userId, email, currentDeviceId, currentIP
);

if (!validation.allowed) {
  return validation.message; // Reject login
}

const sessionId = await UserActivityService.createSession(
  userId, email, currentDeviceId, currentIP
);
```

### Error Message
```
"Akun Anda sedang aktif dari device lain (IP: 192.168.1.1). 
Logout terlebih dahulu atau hubungi admin."
```

### Database Tables
- `user_sessions` - Store active sessions
- `user_activity_log` - Log all activities

---

## 2️⃣ Shuffle MCQ (Persistent)

### Implementasi
```typescript
// ExamRunner.tsx
const getShuffleCacheKey = (): string => {
  return `examo_shuffle_${exam.id}_${userId}`;
};

const loadOrGenerateShuffledQuestions = (): Question[] => {
  const cacheKey = getShuffleCacheKey();
  
  // 1. Check existing progress
  if (existingProgress?.questions) return existingProgress.questions;
  
  // 2. Check session storage
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) return JSON.parse(cached);
  
  // 3. Generate & cache
  const shuffled = fisherYatesShuffle(questions);
  sessionStorage.setItem(cacheKey, JSON.stringify(shuffled));
  return shuffled;
};
```

### Flow
1. User start exam → Generate shuffle → Save to sessionStorage
2. User refresh → Load from sessionStorage
3. User kembali ke soal → Shuffle tetap sama
4. User selesai → Shuffle disimpan ke database

---

## 3️⃣ Essay Text Area

### Styling
```typescript
<textarea 
  className="w-full min-h-[500px] p-8 rounded-[40px] 
             border-2 border-gray-50 bg-white 
             focus:border-indigo-500 outline-none 
             font-medium text-gray-800 text-base 
             shadow-inner resize-vertical" 
  placeholder="Tulis jawaban lengkap Anda di sini..." 
/>
```

### Customization
- `min-h-[500px]` - Ubah height
- `p-8` - Ubah padding (32px)
- `rounded-[40px]` - Ubah border radius
- `resize-vertical` - Allow vertical resize

---

## 4️⃣ Student Exam History Modal

### Component
```typescript
// App.tsx
import StudentExamHistory from './components/StudentExamHistory';

// Usage
{showStudentExamHistory && selectedStudentForHistory && (
  <StudentExamHistory
    studentId={selectedStudentForHistory.id}
    studentName={selectedStudentForHistory.name}
    onClose={() => setShowStudentExamHistory(false)}
  />
)}
```

### State Management
```typescript
const [showStudentExamHistory, setShowStudentExamHistory] = useState(false);
const [selectedStudentForHistory, setSelectedStudentForHistory] = useState<{
  id: string;
  name: string;
} | null>(null);

// Open modal
onClick={() => {
  setSelectedStudentForHistory({ id: s.id, name: s.name });
  setShowStudentExamHistory(true);
}}
```

### Data Loading
```typescript
const history = await UserActivityService.getStudentExamHistory(studentId);
// Returns: ExamSubmissionRecord[]
```

---

## 5️⃣ User Activity Manager

### Component
```typescript
// App.tsx
import UserActivityManager from './components/UserActivityManager';

// Usage
{showUserActivityManager && (
  <UserActivityManager
    onClose={() => setShowUserActivityManager(false)}
  />
)}
```

### State
```typescript
const [showUserActivityManager, setShowUserActivityManager] = useState(false);

// Toggle button
onClick={() => setShowUserActivityManager(true)}
```

### Data Loading
```typescript
// Get all user summaries
const summary = await UserActivityService.getAllUserActivitySummary();

// Get activities for specific user
const logs = await UserActivityService.getUserActivityLog(userId, 100);

// Get in date range
const logs = await UserActivityService.getUserActivityInRange(
  userId, 
  startDate, 
  endDate
);
```

---

## 🗄️ Database Setup

### Run Script
```sql
-- Copy semua isi dari DEVICE_IP_TRACKING_SCHEMA.sql
-- Paste ke Supabase SQL Editor
-- Execute
```

### Tables Created
```
✅ user_sessions
✅ user_activity_log  
✅ exam_submission_history
✅ user_activity_summary (VIEW)
✅ student_exam_history (VIEW)
```

### Columns Reference

**user_sessions**
```
id (UUID)
user_id (UUID)
email (TEXT)
device_id (TEXT) ← Browser fingerprint
ip_address (TEXT) ← User IP
user_agent (TEXT)
login_at (TIMESTAMPTZ)
last_activity_at (TIMESTAMPTZ)
is_active (BOOLEAN)
status (TEXT) ← 'active', 'inactive', 'rejected'
```

**user_activity_log**
```
id (UUID)
user_id (UUID)
email (TEXT)
activity_type (TEXT) ← 'login', 'logout', 'exam_start', etc
activity_detail (TEXT)
ip_address (TEXT)
device_id (TEXT)
device_info (JSONB) ← Browser details
timestamp (TIMESTAMPTZ)
exam_id (UUID)
session_id (UUID)
```

**exam_submission_history**
```
id (UUID)
exam_result_id (UUID) ← FK
exam_id (UUID)
student_id (UUID)
student_name (TEXT)
exam_title (TEXT)
score (NUMERIC)
total_points (NUMERIC)
status (TEXT)
submitted_at (TIMESTAMPTZ)
duration_taken_minutes (INTEGER)
violation_count (INTEGER)
ip_address (TEXT)
device_id (TEXT)
```

---

## 🔄 Integration Points

### handleLogin (App.tsx)
```typescript
// 1. Validate device
const validation = await UserActivityService.validateDeviceLogin(...);

// 2. Create session
const sessionId = await UserActivityService.createSession(...);

// 3. Log activity
await UserActivityService.logActivity(userId, email, 'login', ...);

// 4. Store in localStorage
localStorage.setItem('examo_session', JSON.stringify({
  user, view, sessionId, deviceId, ip
}));
```

### handleLogout (Sidebar)
```typescript
// 1. Log activity
await UserActivityService.logActivity(..., 'logout', ...);

// 2. Deactivate session
await UserActivityService.logout(currentSessionId, currentUser.id);

// 3. Clear state
setCurrentUser(null);
localStorage.removeItem('examo_session');
```

### handleExamFinish (ExamRunner)
```typescript
// Setelah exam submit, bisa tambah:
await UserActivityService.recordExamSubmission(
  result.id,
  exam.id,
  userId,
  userName,
  exam.title,
  score,
  totalPoints,
  'completed',
  new Date().toISOString(),
  durationMinutes,
  violationCount,
  currentIP,
  currentDeviceId
);
```

---

## 🎨 UI Components New

### StudentExamHistory
```typescript
interface StudentExamHistoryProps {
  studentId: string;
  studentName: string;
  onClose: () => void;
}

// Features
- Expandable exam cards
- Status badges (completed/disqualified)
- IP & Device info
- Violation count
- Score breakdown
```

### UserActivityManager
```typescript
interface UserActivityManagerProps {
  onClose?: () => void;
}

// Features
- All users list with stats
- Filter by date range
- Activity log timeline
- Session info
- Device tracking
```

---

## 📊 Key Interfaces

```typescript
// User Session
interface UserSession {
  id: string;
  user_id: string;
  email: string;
  device_id: string;
  ip_address: string;
  login_at: string;
  last_activity_at: string;
  is_active: boolean;
  status: 'active' | 'inactive' | 'rejected';
}

// Activity Log
interface ActivityLog {
  id: string;
  user_id: string;
  email: string;
  activity_type: string;
  activity_detail?: string;
  ip_address?: string;
  device_id?: string;
  device_info?: string;
  timestamp: string;
  exam_id?: string;
  session_id?: string;
}

// Exam Submission Record
interface ExamSubmissionRecord {
  id: string;
  exam_result_id: string;
  exam_id: string;
  student_id: string;
  student_name: string;
  exam_title: string;
  score: number;
  total_points: number;
  status: string;
  submitted_at: string;
  duration_taken_minutes: number;
  violation_count: number;
  ip_address?: string;
  device_id?: string;
}
```

---

## 🧪 Testing Commands

```bash
# Build
npm run build

# Dev server
npm run dev

# Lint check
npm run lint
```

---

## 💡 Tips & Tricks

### Generate Device ID untuk Testing
```typescript
const deviceId = UserActivityService.generateDeviceId();
// Returns: 'device_' + hash
```

### Get Client IP
```typescript
const ip = await UserActivityService.getClientIP();
// Returns: 'xxx.xxx.xxx.xxx' or 'unknown'
```

### Clear Session Cache
```typescript
sessionStorage.removeItem(`examo_shuffle_${examId}_${userId}`);
```

### View All Sessions for User
```typescript
const sessions = await UserActivityService.getUserSessions(userId);
```

---

## ⚠️ Common Pitfalls

1. **Forget to run DB migration** → Features won't work
   - Solution: Run DEVICE_IP_TRACKING_SCHEMA.sql

2. **sessionStorage cleared** → Shuffle resets
   - Solution: Check browser settings, disable cache clear

3. **IP API down** → getClientIP fails
   - Solution: Add try-catch, use fallback IP

4. **RLS blocks insert/update** → Activity log fails silently
   - Solution: Disable RLS or create proper policies

5. **Wrong date filter format** → Activity search returns empty
   - Solution: Use ISO string format (YYYY-MM-DDTHH:mm:ss.SSSZ)

---

## 🔗 Related Files

- `IMPLEMENTATION_GUIDE_NEW_FEATURES.md` - Full documentation
- `IMPLEMENTATION_SUMMARY.md` - High-level overview
- `DEVICE_IP_TRACKING_SCHEMA.sql` - Database schema
- `services/UserActivityService.ts` - Core service
- `components/StudentExamHistory.tsx` - Exam history UI
- `components/UserActivityManager.tsx` - Activity management UI

---

**Last Updated**: Feb 23, 2026 | **Version**: 1.0
