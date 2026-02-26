-- Insert a sample exam_result using an existing exam and an existing student.
-- Run this in Supabase SQL editor. It enables pgcrypto (gen_random_uuid),
-- picks one exam and one student, then inserts a completed result for testing.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

WITH student AS (
  SELECT id, name FROM public.users WHERE role = 'student' LIMIT 1
), exam AS (
  SELECT id FROM public.exams LIMIT 1
)
INSERT INTO public.exam_results (
  id, exam_id, student_id, student_name, score, status,
  total_points_possible, points_obtained, total_questions,
  correct_count, incorrect_count, unanswered_count,
  started_at, submitted_at, answers, logs, ip_address, device_id
)
SELECT
  gen_random_uuid()::uuid,
  exam.id,
  student.id,
  student.name,
  85::numeric,
  'completed',
  100::numeric,
  85::numeric,
  10,
  8,
  2,
  0,
  now() - interval '1 hour',
  now() - interval '50 minutes',
  '{"q1":0,"q2":true}'::jsonb,
  jsonb_build_array(
    jsonb_build_object('event','start','timestamp',(now() - interval '1 hour')::text),
    jsonb_build_object('event','submit','timestamp',(now() - interval '50 minutes')::text)
  ),
  '127.0.0.1',
  'device-sample'
FROM student, exam
RETURNING id, exam_id, student_id, student_name, score, status, started_at, submitted_at;

-- If no rows are returned, ensure the database has at least one exam and one student.