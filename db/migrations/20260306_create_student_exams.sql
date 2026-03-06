-- Migration: create student_exams table
-- Minimal table to represent a student's exam session (used as parent for student_exam_questions)
-- Usage:
-- INSERT INTO public.student_exams (id, student_id, exam_id, started_at, status)
-- VALUES (gen_random_uuid(), '<student_id>'::uuid, '<exam_id>'::uuid, now(), 'in_progress');

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS student_exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  exam_id uuid NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'in_progress',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_student
    FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_exam
    FOREIGN KEY(exam_id) REFERENCES exams(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_student_exams_student_id ON student_exams(student_id);
CREATE INDEX IF NOT EXISTS idx_student_exams_exam_id ON student_exams(exam_id);