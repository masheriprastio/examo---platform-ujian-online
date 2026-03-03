CREATE TABLE IF NOT EXISTS exam_realtime_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID NOT NULL,
  student_id UUID NOT NULL,
  current_question_index INTEGER NOT NULL DEFAULT 0,
  last_ping_at TIMESTAMPTZ DEFAULT NOW(),
  device_info TEXT,
  session_id UUID,
  FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_exam_realtime_unique ON exam_realtime_progress(exam_id, student_id);

ALTER TABLE exam_realtime_progress DISABLE ROW LEVEL SECURITY;
