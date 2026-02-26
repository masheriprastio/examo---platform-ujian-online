-- Inspect exam_results contents (run in Supabase SQL editor)
-- NOTE: some deployments do not have created_at/updated_at columns. This file
-- provides safe queries that do not assume those columns exist.

-- 1) Row counts
SELECT count(*) AS total_rows FROM public.exam_results;
SELECT count(*) FILTER (WHERE status = 'completed') AS completed_rows FROM public.exam_results;
SELECT count(*) FILTER (WHERE status = 'in_progress') AS in_progress_rows FROM public.exam_results;

-- 2) Schema / column types
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'exam_results'
ORDER BY ordinal_position;

-- 3) Latest rows (inspect payloads) - safe selection without assumed audit cols
SELECT id, exam_id, student_id, student_name, score, status, total_questions, correct_count, incorrect_count, unanswered_count, started_at, submitted_at, answers, logs
FROM public.exam_results
ORDER BY submitted_at DESC NULLS LAST, started_at DESC NULLS LAST
LIMIT 50;

-- 4) Any rows with non-null logs (helps detect violations) - avoid created_at
SELECT id, student_name, status, logs, submitted_at
FROM public.exam_results
WHERE logs IS NOT NULL
ORDER BY submitted_at DESC NULLS LAST
LIMIT 50;

-- 5) Example: show one row by id (replace the id below if needed)
-- SELECT * FROM public.exam_results WHERE id = 'PUT_AN_ID_HERE';

-- After running, please paste:
--  - the counts (output of queries 1 & 2),
--  - the schema output (query 2),
--  - any sample rows from query 3,
--  - and any error messages if the queries fail.
