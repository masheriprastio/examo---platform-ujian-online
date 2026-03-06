-- Examples: Deactivate / Inspect active sessions (run after user_sessions migration)
-- NOTE: Do NOT run queries with literal placeholders like <USER_UUID>.
-- Replace placeholders with real values or use a subquery to resolve the UUID.

-- 1) List active sessions
SELECT id, user_id, email, ip_address, login_at FROM public.user_sessions WHERE is_active = true ORDER BY login_at DESC;

-- 2) Find a user's UUID by email (copy result and use in next query)
SELECT id FROM public.users WHERE email = 'user@example.com';

-- 3) Deactivate all sessions for a specific user (replace with real UUID)
-- Example using a real UUID:
-- SELECT public.deactivate_sessions_for_user('550e8400-e29b-41d4-a716-446655440000');
-- Or, resolve by email inline (safer if you have the user's email):
SELECT public.deactivate_sessions_for_user(
  (SELECT id FROM public.users WHERE email = 'user@example.com')
);

-- 4) Deactivate sessions by IP (all users)
SELECT public.deactivate_sessions_by_ip('1.2.3.4');

-- 5) Deactivate sessions by IP for a specific user (by email)
SELECT public.deactivate_sessions_by_ip(
  '1.2.3.4',
  (SELECT id FROM public.users WHERE email = 'user@example.com')
);

-- 6) Deactivate a specific session id (replace with real session UUID)
-- SELECT public.deactivate_session_by_id('f47ac10b-58cc-4372-a567-0e02b2c3d479');

-- 7) View active sessions for a user (helper function) — replace with real UUID or use subquery
-- SELECT * FROM public.get_active_sessions_for_user('<USER_UUID>'::uuid);
SELECT * FROM public.get_active_sessions_for_user(
  (SELECT id FROM public.users WHERE email = 'user@example.com')
);

-- Troubleshooting:
-- ERROR 22P02 (invalid input syntax for type uuid) occurs when you pass a literal placeholder like '<USER_UUID>'.
-- Always provide a valid UUID string (36 chars, hyphenated) or use a subquery that returns a UUID.
-- Run the "List active sessions" query first to obtain real session_id/user_id values to operate on.