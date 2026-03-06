-- Combined migration: placeholder questions + student_exams + student_exam_questions + helper functions
-- Run this in Supabase SQL editor to ensure required relations and RPCs exist.
-- Note: Replace placeholder questions schema later with your real questions table.

-- 1) Ensure pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2) Minimal placeholder questions table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_id uuid,
  content text,
  type text,
  points integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_questions_bank_id ON public.questions(bank_id);

-- 3) student_exams table (represents a student's exam session)
CREATE TABLE IF NOT EXISTS public.student_exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  exam_id uuid NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'in_progress',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_student_exams_student_id ON public.student_exams(student_id);
CREATE INDEX IF NOT EXISTS idx_student_exams_exam_id ON public.student_exams(exam_id);

-- 4) student_exam_questions table (stores per-student assigned questions)
CREATE TABLE IF NOT EXISTS public.student_exam_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_exam_id uuid NOT NULL,
  question_id uuid NOT NULL,
  ordinal integer NOT NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_student_exam FOREIGN KEY(student_exam_id) REFERENCES public.student_exams(id) ON DELETE CASCADE,
  CONSTRAINT fk_question FOREIGN KEY(question_id) REFERENCES public.questions(id) ON DELETE RESTRICT,
  CONSTRAINT unique_student_exam_question UNIQUE(student_exam_id, question_id)
);
CREATE INDEX IF NOT EXISTS idx_student_exam_questions_student_exam_id ON public.student_exam_questions(student_exam_id);
CREATE INDEX IF NOT EXISTS idx_student_exam_questions_question_id ON public.student_exam_questions(question_id);

-- 5) Function: assign_essay_questions (inserts deterministic selection into student_exam_questions)
CREATE OR REPLACE FUNCTION public.assign_essay_questions(
  p_student_exam_id uuid,
  p_bank_id uuid,
  p_student_id uuid,
  p_count integer
) RETURNS void AS $$
BEGIN
  WITH chosen AS (
    SELECT q.id AS question_id,
           row_number() OVER (ORDER BY md5(q.id::text || '|' || p_student_id::text)) AS rn
    FROM public.questions q
    WHERE q.bank_id = p_bank_id AND q.type = 'essay'
    ORDER BY md5(q.id::text || '|' || p_student_id::text)
    LIMIT p_count
  )
  INSERT INTO public.student_exam_questions(student_exam_id, question_id, ordinal, assigned_at)
  SELECT p_student_exam_id, question_id, rn, now()
  FROM chosen
  ON CONFLICT (student_exam_id, question_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- 6) Function: get_deterministic_essay_questions (returns selection without persisting)
CREATE OR REPLACE FUNCTION public.get_deterministic_essay_questions(
  p_bank_id uuid,
  p_student_id uuid,
  p_count integer
) RETURNS TABLE (
  question_id uuid,
  content text,
  ordinal integer
) AS $$
  SELECT q.id,
         q.content,
         row_number() OVER (ORDER BY md5(q.id::text || '|' || p_student_id::text)) AS ordinal
  FROM public.questions q
  WHERE q.bank_id = p_bank_id AND q.type = 'essay'
  ORDER BY md5(q.id::text || '|' || p_student_id::text)
  LIMIT p_count;
$$ LANGUAGE sql STABLE;

-- 7) Safety: ensure privileges (optional, adjust roles as needed)
-- GRANT USAGE ON SCHEMA public TO public;
-- GRANT EXECUTE ON FUNCTION public.assign_essay_questions(uuid, uuid, uuid, integer) TO anon, authenticated;
-- GRANT EXECUTE ON FUNCTION public.get_deterministic_essay_questions(uuid, uuid, integer) TO anon, authenticated;

-- End of combined migration.