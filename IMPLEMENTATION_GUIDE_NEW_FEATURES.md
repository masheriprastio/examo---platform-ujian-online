# Dokumentasi Fitur-Fitur Baru Examo Platform

## 1. Login dengan Validasi Device & IP (Satu Device, Satu IP)

### Deskripsi
Sistem ini memastikan bahwa setiap user (khususnya siswa) hanya dapat login dari satu device dan IP address pada satu waktu. Jika user mencoba login dari device atau IP yang berbeda, sistem akan menolak login.

### Implementasi

#### File-File yang Dimodifikasi:
- **App.tsx**: Menambahkan device tracking logic pada handleLogin
- **types.ts**: Menambahkan field untuk ExamResult
- **lib/supabase.ts**: Sudah ada, tidak ada perubahan

#### File-File Baru:
- **services/UserActivityService.ts**: Service untuk device/IP tracking dan activity logging
- **DEVICE_IP_TRACKING_SCHEMA.sql**: Schema database untuk tracking

### Cara Kerja

1. **Inisialisasi Device ID**: Saat app load, generate unique device ID berdasarkan browser fingerprint
2. **Get IP Address**: Fetch IP address dari public API (ipify.org)
3. **Login Validation**: Saat user login, validasi apakah device/IP sudah aktif untuk user lain
4. **Session Creation**: Jika valid, buat session baru dan deactivate session lama
5. **Activity Logging**: Catat semua login/logout activity

### Setup Database

Jalankan script SQL berikut di Supabase:

```sql
-- Import dari DEVICE_IP_TRACKING_SCHEMA.sql
-- Atau copy-paste script tersebut ke SQL Editor Supabase
```

### Cara Menggunakan

**Untuk Developer**:
```typescript
// Validate device login (di handleLogin)
const validation = await UserActivityService.validateDeviceLogin(
  userId,
  email,
  currentDeviceId,
  currentIP
);

if (!validation.allowed) {
  return validation.message; // Error message
}

// Create session
const sessionId = await UserActivityService.createSession(
  userId,
  email,
  currentDeviceId,
  currentIP
);

// Log activity
await UserActivityService.logActivity(
  userId,
  email,
  'login',
  'Detail aktivitas',
  currentIP,
  currentDeviceId
);
```

**Untuk User**:
- User akan mendapat error message jika mencoba login dari device/IP lain
- Message: "Akun Anda sedang aktif dari device lain (IP: xxx.xxx.xxx.xxx). Logout terlebih dahulu atau hubungi admin."

### Catatan Penting
- Device ID bersifat unik per browser/device
- IP address yang diperoleh dari public API mungkin tidak akurat untuk jaringan private
- Session otomatis expired jika user tidak aktif dalam waktu yang ditentukan

---

## 2. Shuffle Jawaban MCQ Sekali Per Session

### Deskripsi
Jawaban untuk soal pilihan ganda (MCQ) dan multiple select akan di-shuffle (acak) satu kali pada awal ujian. Shuffle ini akan tetap konsisten jika user merefresh halaman atau kembali ke soal yang sama dalam session ujian yang sama.

### Implementasi

#### File-File yang Dimodifikasi:
- **components/ExamRunner.tsx**: Menambahkan logika shuffle yang persistent
- **types.ts**: Menambahkan field `questions` di ExamResult untuk menyimpan shuffled questions

### Cara Kerja

1. **Initialize Shuffle**: Saat exam dimulai, generate shuffle untuk semua soal MCQ
2. **Session Storage**: Simpan shuffled questions di sessionStorage dengan key `examo_shuffle_{examId}_{userId}`
3. **Reuse on Refresh**: Jika user refresh, load shuffled questions dari sessionStorage daripada generate ulang
4. **Persistent in State**: Shuffled questions juga disimpan di ExamResult untuk persistensi data

### Kode Implementasi

```typescript
// Fungsi shuffle yang persistent
const loadOrGenerateShuffledQuestions = (): Question[] => {
  const cacheKey = getShuffleCacheKey(); // examo_shuffle_{examId}_{userId}
  
  // Load dari existing progress jika ada
  if (existingProgress?.questions) {
    return existingProgress.questions;
  }

  // Load dari session storage
  const cachedData = sessionStorage.getItem(cacheKey);
  if (cachedData) {
    return JSON.parse(cachedData);
  }

  // Generate shuffle baru
  let questionsToRun = [...exam.questions];
  if (exam.randomizeQuestions) {
    questionsToRun = fisherYatesShuffle(questionsToRun);
  }
  
  // Shuffle options untuk setiap MCQ
  questionsToRun = questionsToRun.map(q => {
    if ((q.type === 'mcq' || q.type === 'multiple_select') && q.randomizeOptions) {
      // Shuffle options
      // ...
    }
    return q;
  });

  // Save ke session storage
  sessionStorage.setItem(cacheKey, JSON.stringify(questionsToRun));
  return questionsToRun;
};
```

### Fitur yang Dihindarkan
- **No Auto-Reshuffle**: Soal tidak akan otomatis di-shuffle ulang saat refresh
- **No Page Reload Shuffle**: Shuffle tetap konsisten meskipun user refresh berkali-kali
- **Session-Based**: Shuffle hanya berlaku untuk session ujian yang sama

---

## 3. Text Area Essay Uniform & Larger

### Deskripsi
Text area untuk soal essay dibuat lebih besar dan seragam untuk kenyamanan siswa menulis jawaban panjang.

### Implementasi

#### File-File yang Dimodifikasi:
- **components/ExamRunner.tsx**: Update styling textarea essay

### Styling

```typescript
<textarea 
  value={answers[currentQuestion.id] || ''} 
  onChange={(e) => setAnswers(prev => ({ ...prev, [currentQuestion.id]: e.target.value }))} 
  className="w-full min-h-[500px] p-8 rounded-[40px] border-2 border-gray-50 bg-white focus:border-indigo-500 outline-none font-medium text-gray-800 text-base shadow-inner resize-vertical" 
  placeholder="Tulis jawaban lengkap Anda di sini..." 
/>
```

### Spesifikasi
- **Min Height**: 500px (cukup untuk jawaban panjang)
- **Padding**: 8 (32px) untuk kenyamanan typing
- **Font Size**: Base (16px)
- **Resize**: Vertical (user bisa expand lebih besar)
- **Border Radius**: 40px (rounded corners yang elegant)

---

## 4. Detail Riwayat Pengerjaan Ujian di Buku Nilai

### Deskripsi
Guru dapat melihat detail riwayat lengkap pengerjaan ujian setiap siswa, termasuk informasi device, IP address, waktu pengerjaan, dan semua soal yang dikerjakan.

### Implementasi

#### File-File Baru:
- **components/StudentExamHistory.tsx**: Component modal untuk menampilkan riwayat ujian siswa

#### File-File yang Dimodifikasi:
- **App.tsx**: Menambahkan button "Riwayat Ujian" dan modal integration

### Cara Menggunakan

1. **Buka Buku Nilai** (TEACHER_GRADES)
2. **Mode Summary**: Klik icon history button di baris siswa
3. **Modal terbuka**: Menampilkan semua riwayat ujian siswa dengan detail

### Informasi yang Ditampilkan

- **Status Ujian**: Selesai / Diskualifikasi / Dalam Proses
- **Tanggal & Waktu**: Kapan siswa menyelesaikan ujian
- **Waktu Pengerjaan**: Berapa menit siswa mengerjakan
- **Total Soal**: Jumlah soal di ujian
- **IP Address**: IP yang digunakan saat ujian
- **Device ID**: Identifikasi device yang digunakan
- **Pelanggaran**: Jumlah kali keluar dari tab
- **Rincian Nilai**: Perolehan, total poin, dan persentase

### Screenshot/UI
- Modal dengan ekspanding rows
- Setiap riwayat ujian ditampilkan sebagai card yang dapat di-expand
- Informasi detail tersembunyi sampai user klik expand button

---

## 5. Management Aktivitas User

### Deskripsi
Guru/Admin dapat melihat dan memonitor aktivitas semua user di sistem, termasuk:
- Waktu login/logout
- IP address
- Device yang digunakan
- Aktivitas dalam sistem (exam start, submit, dll)
- Last online time
- Total aktivitas

### Implementasi

#### File-File Baru:
- **components/UserActivityManager.tsx**: Component untuk management aktivitas user

#### File-File yang Dimodifikasi:
- **App.tsx**: Menambahkan button "Aktivitas User" dan modal integration
- **services/UserActivityService.ts**: Sudah ada semua method yang dibutuhkan

### Cara Menggunakan

1. **Buka Buku Nilai** (TEACHER_GRADES)
2. **Klik tombol "Aktivitas User"** di toolbar
3. **Modal terbuka**: Menampilkan semua user dengan statistik aktivitas
4. **Expand user**: Klik baris untuk melihat detail aktivitas user

### Filter yang Tersedia

- **Hari Ini**: Aktivitas hari ini saja
- **Minggu Ini**: Aktivitas 7 hari terakhir
- **Bulan Ini**: Aktivitas 30 hari terakhir
- **Semua**: Semua aktivitas (dapat sangat banyak)

### Informasi yang Ditampilkan

**Per User**:
- Nama dan email
- Role (Guru/Siswa)
- Total aktivitas
- Terakhir online
- IP address saat ini
- Device ID saat ini
- Jumlah active session

**Per Aktivitas**:
- Jenis aktivitas (Login, Logout, Exam Start, Exam Submit, dll)
- Waktu aktivitas
- IP address
- Device ID
- Detail aktivitas (jika ada)

### Database Schema

Jalankan script di DEVICE_IP_TRACKING_SCHEMA.sql yang mencakup:
- `user_sessions`: Tracking setiap session
- `user_activity_log`: Detail log aktivitas
- `user_activity_summary`: View untuk ringkasan aktivitas

---

## Setup Checklist

### 1. Database Setup
- [ ] Jalankan script SQL di DEVICE_IP_TRACKING_SCHEMA.sql
- [ ] Verify tabel berhasil dibuat
- [ ] Disable RLS untuk tabel baru (optional tapi recommended)

### 2. Environment Variables
Tidak ada env baru yang dibutuhkan, menggunakan existing Supabase config

### 3. Dependencies
Semua dependencies sudah ada:
- @supabase/supabase-js
- lucide-react
- React 19+

### 4. Testing

**Test Device/IP Login**:
```bash
1. Login dari browser A
2. Coba login dari browser B (atau incognito) - harus ditolak
3. Logout dari browser A
4. Login lagi dari browser B - harus diterima
```

**Test Shuffle Persistence**:
```bash
1. Mulai ujian, lihat urutan soal
2. Pergi ke soal lain, kembali ke soal pertama
3. Urutan soal harus sama
4. Refresh halaman, urutan harus sama
```

**Test Exam History**:
```bash
1. Submit ujian sebagai siswa
2. Buka Buku Nilai sebagai guru
3. Klik history button di siswa
4. Verify detail riwayat muncul
```

**Test Activity Manager**:
```bash
1. Login/logout beberapa kali
2. Buka Activity Manager
3. Verify login/logout tercatat
4. Filter by date range
```

---

## Troubleshooting

### Device Login Ditolak Padahal Ingin Login Ulang

**Solusi**: 
- Pastikan user logout dulu sebelum login di device lain
- Atau tunggu session expired (~5 menit untuk students)
- Admin bisa manually delete session dari database

### Shuffle Terjadi Ulang Saat Refresh

**Solusi**:
- Cek sessionStorage tidak dikosihkan browser
- Verify `loadOrGenerateShuffledQuestions` function terpanggil

### IP Address Tidak Akurat

**Solusi**:
- Normal untuk jaringan private/VPN
- Gunakan IP untuk identifikasi umum saja
- Device ID lebih reliable untuk tracking

### Exam History Tidak Muncul

**Solusi**:
- Verify `exam_submission_history` table sudah ada
- Check apakah siswa benar-benar submit ujian
- Verify recordExamSubmission dipanggil saat submit

---

## Future Improvements

1. **Geo-Location Tracking**: Track lokasi fisik user
2. **Browser Fingerprinting**: Lebih accurate device identification
3. **Activity Analytics**: Dashboard untuk analytics aktivitas
4. **Alerts & Notifications**: Real-time alert untuk suspicious activity
5. **Audit Trail**: Comprehensive audit trail untuk compliance
6. **Device Management**: Admin bisa manage device registrations

---

## API Reference

### UserActivityService Methods

```typescript
// Get device ID
static generateDeviceId(): string

// Get client IP
static async getClientIP(): Promise<string>

// Get device info (browser, OS, dll)
static getDeviceInfo(): string

// Validate device login
static async validateDeviceLogin(
  userId: string,
  email: string,
  currentDeviceId: string,
  currentIP: string
): Promise<{ allowed: boolean; message?: string }>

// Create new session
static async createSession(
  userId: string,
  email: string,
  deviceId: string,
  ipAddress: string
): Promise<string | null>

// Update session activity
static async updateSessionActivity(sessionId: string | null): Promise<void>

// Log activity
static async logActivity(
  userId: string,
  email: string,
  activityType: string,
  activityDetail?: string,
  ipAddress?: string,
  deviceId?: string,
  examId?: string,
  sessionId?: string
): Promise<void>

// Logout
static async logout(sessionId: string | null, userId: string): Promise<void>

// Record exam submission
static async recordExamSubmission(
  examResultId: string,
  examId: string,
  studentId: string,
  studentName: string,
  examTitle: string,
  score: number,
  totalPoints: number,
  status: string,
  submittedAt: string,
  durationMinutes: number,
  violationCount: number,
  ipAddress?: string,
  deviceId?: string
): Promise<void>

// Get user activity log
static async getUserActivityLog(userId: string, limit?: number): Promise<ActivityLog[]>

// Get user sessions
static async getUserSessions(userId: string): Promise<UserSession[]>

// Get activity summary
static async getAllUserActivitySummary(): Promise<any[]>

// Get student exam history
static async getStudentExamHistory(studentId: string): Promise<ExamSubmissionRecord[]>

// Get activity in date range
static async getUserActivityInRange(
  userId: string,
  startDate: string,
  endDate: string
): Promise<ActivityLog[]>
```

---

## License

Semua fitur baru adalah bagian dari Examo Platform dan mengikuti license yang sama.
