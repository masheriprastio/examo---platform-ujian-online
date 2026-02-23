-- Schema untuk Device/IP Tracking dan User Activity Management
-- Jalankan script ini di SQL Editor pada Dashboard Supabase Anda

-- 1. Tabel untuk tracking device dan IP login
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  device_id TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  login_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'active', -- 'active', 'inactive', 'rejected'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 2. Tabel untuk activity log dengan detail
CREATE TABLE IF NOT EXISTS user_activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  activity_type TEXT NOT NULL, -- 'login', 'logout', 'exam_start', 'exam_submit', 'page_view'
  activity_detail TEXT,
  ip_address TEXT,
  device_id TEXT,
  device_info TEXT, -- browser, os, screen resolution
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  exam_id UUID,
  session_id UUID,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES user_sessions(id) ON DELETE CASCADE
);

-- 3. Tabel untuk menyimpan riwayat pengerjaan ujian dengan detail
CREATE TABLE IF NOT EXISTS exam_submission_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_result_id UUID NOT NULL,
  exam_id UUID NOT NULL,
  student_id UUID NOT NULL,
  student_name TEXT,
  exam_title TEXT,
  score NUMERIC,
  total_points NUMERIC,
  status TEXT,
  submitted_at TIMESTAMPTZ,
  duration_taken_minutes INTEGER,
  violation_count INTEGER DEFAULT 0,
  ip_address TEXT,
  device_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (exam_result_id) REFERENCES exam_results(id) ON DELETE CASCADE,
  FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. Index untuk performa query
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_device_id ON user_sessions(device_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_ip ON user_sessions(ip_address);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_id ON user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_timestamp ON user_activity_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_exam_submission_student ON exam_submission_history(student_id);
CREATE INDEX IF NOT EXISTS idx_exam_submission_timestamp ON exam_submission_history(submitted_at);

-- 5. Disable RLS untuk tabel baru (sesuaikan dengan policy keamanan Anda)
ALTER TABLE user_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE exam_submission_history DISABLE ROW LEVEL SECURITY;

-- 6. Tambahkan kolom ke exam_results jika belum ada
ALTER TABLE exam_results ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE exam_results ADD COLUMN IF NOT EXISTS device_id TEXT;

-- 7. View untuk menampilkan data aktivitas user yang mudah diakses
CREATE OR REPLACE VIEW user_activity_summary AS
SELECT 
  u.id,
  u.email,
  u.name,
  u.role,
  COUNT(DISTINCT ual.id) as total_activities,
  MAX(ual.timestamp) as last_online,
  (SELECT ip_address FROM user_sessions WHERE user_id = u.id ORDER BY login_at DESC LIMIT 1) as current_ip,
  (SELECT device_id FROM user_sessions WHERE user_id = u.id ORDER BY login_at DESC LIMIT 1) as current_device,
  (SELECT COUNT(*) FROM user_sessions WHERE user_id = u.id AND is_active = true) as active_session_count
FROM users u
LEFT JOIN user_activity_log ual ON u.id = ual.user_id
GROUP BY u.id, u.email, u.name, u.role;

-- 8. View untuk riwayat pengerjaan ujian per siswa
CREATE OR REPLACE VIEW student_exam_history AS
SELECT 
  sh.student_id,
  sh.student_name,
  sh.exam_id,
  sh.exam_title,
  sh.score,
  sh.total_points,
  sh.status,
  sh.submitted_at,
  sh.duration_taken_minutes,
  sh.violation_count,
  sh.ip_address,
  sh.device_id,
  ROW_NUMBER() OVER (PARTITION BY sh.student_id ORDER BY sh.submitted_at DESC) as submission_order
FROM exam_submission_history sh
ORDER BY sh.student_id, sh.submitted_at DESC;
