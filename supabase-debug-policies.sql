-- WARNING: Permissive policies for debugging only.
-- Run in Supabase SQL editor to allow anon key full access temporarily.
-- Remove or tighten policies after debugging (RLS should be restored).

BEGIN;

-- USERS table: enable RLS and allow anon read/write (for debug)
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
-- Remove existing debug policies if any, then create
DROP POLICY IF EXISTS "Anon select users" ON public.users;
DROP POLICY IF EXISTS "Anon insert users" ON public.users;
DROP POLICY IF EXISTS "Anon update users" ON public.users;
DROP POLICY IF EXISTS "Anon delete users" ON public.users;

CREATE POLICY "Anon select users" ON public.users
  FOR SELECT USING (true);
CREATE POLICY "Anon insert users" ON public.users
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Anon update users" ON public.users
  FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anon delete users" ON public.users
  FOR DELETE USING (true);

-- EXAM_RESULTS table: enable RLS and allow anon read/write (for debug)
ALTER TABLE IF EXISTS public.exam_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anon select exam_results" ON public.exam_results;
DROP POLICY IF EXISTS "Anon insert exam_results" ON public.exam_results;
DROP POLICY IF EXISTS "Anon update exam_results" ON public.exam_results;
DROP POLICY IF EXISTS "Anon delete exam_results" ON public.exam_results;

CREATE POLICY "Anon select exam_results" ON public.exam_results
  FOR SELECT USING (true);
CREATE POLICY "Anon insert exam_results" ON public.exam_results
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Anon update exam_results" ON public.exam_results
  FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anon delete exam_results" ON public.exam_results
  FOR DELETE USING (true);

COMMIT;

-- After applying, reload your app and check DevTools console.
-- IMPORTANT: These policies are permissive and only for short-term debugging.
-- Revoke or replace with proper auth-based policies before production.
