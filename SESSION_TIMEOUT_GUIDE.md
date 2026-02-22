# Session Timeout Implementation Guide

## Overview
Sistem otomatis logout untuk siswa yang tidak aktif selama 5 menit dengan peringatan 1 menit sebelumnya.

## Features

### 1. **5 Menit Inactivity Timeout**
- Sistem secara otomatis logout siswa jika tidak ada aktivitas selama 5 menit
- Status login disimpan di `localStorage` dengan key `examo_session`
- Logout otomatis menghapus session data

### 2. **Pre-logout Warning (4 menit)**
- Dialog warning muncul pada menit ke-4 (1 menit sebelum logout)
- Menampilkan countdown timer 60 detik
- User dapat klik "Lanjutkan Sesi" untuk reset timer dan melanjutkan

### 3. **Activity Tracking**
Aktivitas yang direset timer:
- Mouse movement (`mousedown`)
- Keyboard input (`keydown`)
- Page scroll (`scroll`)
- Touch events (`touchstart`)

### 4. **Student-Only**
- Hanya untuk role `student`
- Guru (teacher) tidak dikenai timeout otomatis

## Implementation Details

### Constants
```tsx
const SESSION_TIMEOUT_MS = 5 * 60 * 1000;      // 5 minutes
const WARNING_BEFORE_LOGOUT_MS = 60 * 1000;    // Warning at 4 minutes
```

### State Management
```tsx
const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
const [timeoutWarningSeconds, setTimeoutWarningSeconds] = useState(0);
```

### Flow
1. User logs in → Timer starts
2. User inactive 4 minutes → Warning dialog appears + countdown starts
3. User can:
   - Click "Lanjutkan Sesi" → Timer resets, dialog closes
   - Do any activity (click, type, scroll) → Timer resets silently
4. If inactive at 5 minutes → Auto logout + notification

### Warning Dialog Features
- **Title**: "Sesi Akan Berakhir"
- **Message**: Shows remaining seconds in large countdown
- **Button**: "Lanjutkan Sesi" to reset timer
- **Style**: Orange theme with clock icon

## Testing Guide

### Test Case 1: Basic Timeout (requires 5 minutes wait)
1. Login as student
2. Don't interact with page
3. At 4:00 - Dialog appears
4. At 5:00 - Auto logout

### Test Case 2: Reset via Activity
1. Login as student
2. At 3:00 - Move mouse/type (timer resets)
3. Timer should restart from 0
4. At 4:00 - Dialog appears again

### Test Case 3: Reset via Dialog Button
1. Login as student
2. Wait for dialog (at 4:00)
3. Click "Lanjutkan Sesi"
4. Dialog closes, timer resets
5. At 4:00 again - Dialog appears

### Test Case 4: Session Persistence
1. Login as student
2. Refresh page → Still logged in
3. Timer continues counting
4. Session lost only after 5 min inactivity or manual logout

### Test Case 5: Teacher Exception
1. Login as guru/teacher
2. Stay inactive for 10+ minutes
3. Should NOT logout automatically

## Browser Console Notifications
- "Sesi Anda telah berakhir karena tidak ada aktivitas selama 5 menit." (dismissible notification)
- Uses NotificationContext with key `session-timeout` for dedupe

## Files Modified
- `App.tsx` - Main timeout logic, warning modal
- `NotificationContext.tsx` - Already supports optional `key` param for deduplication

## Future Enhancements
- [ ] Extend timeout during exam session
- [ ] Different timeout for different views
- [ ] Sound notification before logout
- [ ] Session history log in database
- [ ] Configurable timeout via settings
