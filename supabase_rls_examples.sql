-- Supabase RLS example policies: minimal examples to allow the client app to UPDATE/DELETE exams & exam_results.
-- WARNING: these "minimal" policies can be permissive. Prefer creating stricter policies for production.
-- Run in SQL editor on Supabase; adjust according to your authentication setup (JWT claims, service role, etc).

-- 0) Ensure RLS is enabled (we'll add policies). If you prefer the quick-and-easy route, DISABLE RLS instead:
-- ALTER TABLE public.exams DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.exam_results DISABLE ROW LEVEL SECURITY;
-- (But disabling RLS weakens row-level protections. Prefer policies.)

-- 1) Enable RLS (idempotent)
ALTER TABLE IF EXISTS public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.exam_results ENABLE ROW LEVEL SECURITY;

-- 2) Minimal permissive policies (development/testing)
-- These allow anonymous/authenticated requests (client) to perform all operations.
-- This is equivalent to "open" access — use only for testing or when you control network access.

-- Exams: allow SELECT/INSERT/UPDATE/DELETE for anon/authenticated roles
DROP POLICY IF EXISTS "allow_all_on_exams" ON public.exams;
-- allow SELECT
CREATE POLICY "allow_all_exams_select" ON public.exams
  FOR SELECT
  USING (auth.role() = 'anon' OR auth.role() = 'authenticated');

-- allow INSERT
CREATE POLICY "allow_all_exams_insert" ON public.exams
  FOR INSERT
  WITH CHECK (auth.role() = 'anon' OR auth.role() = 'authenticated');

-- allow UPDATE
CREATE POLICY "allow_all_exams_update" ON public.exams
  FOR UPDATE
  USING (auth.role() = 'anon' OR auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'anon' OR auth.role() = 'authenticated');

-- allow DELETE
CREATE POLICY "allow_all_exams_delete" ON public.exams
  FOR DELETE
  USING (auth.role() = 'anon' OR auth.role() = 'authenticated');

-- Exam results: allow SELECT/INSERT/UPDATE/DELETE for anon/authenticated roles
DROP POLICY IF EXISTS "allow_all_on_exam_results" ON public.exam_results;
-- allow SELECT
CREATE POLICY "allow_all_exam_results_select" ON public.exam_results
  FOR SELECT
  USING (auth.role() = 'anon' OR auth.role() = 'authenticated');

-- allow INSERT
CREATE POLICY "allow_all_exam_results_insert" ON public.exam_results
  FOR INSERT
  WITH CHECK (auth.role() = 'anon' OR auth.role() = 'authenticated');

-- allow UPDATE
CREATE POLICY "allow_all_exam_results_update" ON public.exam_results
  FOR UPDATE
  USING (auth.role() = 'anon' OR auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'anon' OR auth.role() = 'authenticated');

-- allow DELETE
CREATE POLICY "allow_all_exam_results_delete" ON public.exam_results
  FOR DELETE
  USING (auth.role() = 'anon' OR auth.role() = 'authenticated');

-- 3) Safer alternative: allow only the exam owner (created_by) or service role to modify
-- NOTE: This requires your JWT to include a "user_id" claim that matches exams.created_by,
-- or to run sensitive operations from a trusted backend using the service_role key.

-- Example: allow SELECT to everyone, but UPDATE/DELETE only to owner or service_role
DROP POLICY IF EXISTS "public_select_exams" ON public.exams;
CREATE POLICY "public_select_exams" ON public.exams
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "owner_modify_exams" ON public.exams;
-- allow owner to UPDATE only
CREATE POLICY "owner_modify_exams_update" ON public.exams
  FOR UPDATE
  USING (
    -- allow if JWT claim user_id equals created_by
    current_setting('request.jwt.claims.user_id', true) IS NOT NULL
    AND created_by::text = current_setting('request.jwt.claims.user_id', true)
  )
  WITH CHECK (
    current_setting('request.jwt.claims.user_id', true) IS NOT NULL
    AND created_by::text = current_setting('request.jwt.claims.user_id', true)
  );

-- allow owner to DELETE only
CREATE POLICY "owner_modify_exams_delete" ON public.exams
  FOR DELETE
  USING (
    current_setting('request.jwt.claims.user_id', true) IS NOT NULL
    AND created_by::text = current_setting('request.jwt.claims.user_id', true)
  );

-- Also allow service_role (server) to bypass via checking role
-- Note: auth.role() returns 'service_role' for requests made with the secret key.
DROP POLICY IF EXISTS "service_role_modify_exams" ON public.exams;
CREATE POLICY "service_role_modify_exams_update" ON public.exams
  FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "service_role_modify_exams_delete" ON public.exams
  FOR DELETE
  USING (auth.role() = 'service_role');

-- Apply same owner/service_role pattern for exam_results
DROP POLICY IF EXISTS "public_select_exam_results" ON public.exam_results;
CREATE POLICY "public_select_exam_results" ON public.exam_results
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "owner_modify_exam_results" ON public.exam_results;
CREATE POLICY "owner_modify_exam_results_update" ON public.exam_results
  FOR UPDATE
  USING (
    current_setting('request.jwt.claims.user_id', true) IS NOT NULL
    AND student_id::text = current_setting('request.jwt.claims.user_id', true)
  )
  WITH CHECK (
    current_setting('request.jwt.claims.user_id', true) IS NOT NULL
    AND student_id::text = current_setting('request.jwt.claims.user_id', true)
  );

CREATE POLICY "owner_modify_exam_results_delete" ON public.exam_results
  FOR DELETE
  USING (
    current_setting('request.jwt.claims.user_id', true) IS NOT NULL
    AND student_id::text = current_setting('request.jwt.claims.user_id', true)
  );

DROP POLICY IF EXISTS "service_role_modify_exam_results" ON public.exam_results;
CREATE POLICY "service_role_modify_exam_results_update" ON public.exam_results
  FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "service_role_modify_exam_results_delete" ON public.exam_results
  FOR DELETE
  USING (auth.role() = 'service_role');

-- 4) Notes & next steps:
-- - If your app does not use Supabase Auth, the JWT claims (request.jwt.claims.*) may be empty.
--   In that case either:
--     * Run DB modifications from a trusted backend using the service_role key (recommended), or
--     * Use the permissive policies above (allow_all_on_*) during development only.
-- - After applying policies, test DELETE from the client and verify error messages (42501 => RLS/permissions).
-- - For production, prefer service-role for destructive ops or implement strict JWT-based policies.

-- 5) Helpful debug query: show existing policies
-- SELECT * FROM pg_policies WHERE schemaname='public' AND tablename IN ('exams','exam_results');