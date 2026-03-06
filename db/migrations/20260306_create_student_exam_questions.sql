-- Migration: create student_exam_questions table + helper functions
-- Creates table to store per-student assigned questions and a deterministic assignment function
-- Usage:
-- 1) Run this migration on your Postgres/Supabase DB
-- 2) To assign 5 essay questions deterministically and persist mapping:
--    SELECT assign_essay_questions('<student_exam_id>'::uuid, '<bank_id>'::uuid, '<student_id>'::uuid, 5);
-- 3) To get deterministic questions without inserting:
--    SELECT * FROM get_deterministic_essay_questions('<bank_id>'::uuid, '<student_id>'::uuid, 5);

-- Ensure pgcrypto for gen_random_uuid() (Supabase typically allows this)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Table to store assigned questions for each student exam instance
CREATE TABLE IF NOT EXISTS student_exam_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_exam_id uuid NOT NULL,
  question_id uuid NOT NULL,
  ordinal integer NOT NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_student_exam
    FOREIGN KEY(student_exam_id) REFERENCES student_exams(id) ON DELETE CASCADE,
  CONSTRAINT fk_question
    FOREIGN KEY(question_id) REFERENCES questions(id) ON DELETE RESTRICT,
  CONSTRAINT unique_student_exam_question UNIQUE(student_exam_id, question_id)
);

-- Function: assign questions deterministically (inserts mapping)
-- Assigns `p_count` essay questions from `p_bank_id` for `p_student_id` into `student_exam_questions`.
CREATE OR REPLACE FUNCTION assign_essay_questions(
  p_student_exam_id uuid,
  p_bank_id uuid,
  p_student_id uuid,
  p_count integer
) RETURNS void AS $$
BEGIN
  WITH chosen AS (
    SELECT q.id AS question_id,
           row_number() OVER (ORDER BY md5(q.id::text || '|' || p_student_id::text)) AS rn
    FROM questions q
    WHERE q.bank_id = p_bank_id AND q.type = 'essay'
    ORDER BY md5(q.id::text || '|' || p_student_id::text)
    LIMIT p_count
  )
  INSERT INTO student_exam_questions(student_exam_id, question_id, ordinal, assigned_at)
  SELECT p_student_exam_id, question_id, rn, now()
  FROM chosen
  ON CONFLICT (student_exam_id, question_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Function: get deterministic essay questions without persisting
CREATE OR REPLACE FUNCTION get_deterministic_essay_questions(
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
  FROM questions q
  WHERE q.bank_id = p_bank_id AND q.type = 'essay'
  ORDER BY md5(q.id::text || '|' || p_student_id::text)
  LIMIT p_count;
$$ LANGUAGE sql STABLE;

-- Optional: index to speed up selecting by bank_id and type
CREATE INDEX IF NOT EXISTS idx_questions_bank_type ON questions(bank_id, type);