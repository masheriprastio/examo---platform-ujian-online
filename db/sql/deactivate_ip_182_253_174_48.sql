-- Inspect sessions from IP 182.253.174.48
SELECT id, user_id, email, ip_address, login_at, is_active FROM public.user_sessions
WHERE ip_address = '182.253.174.48'
ORDER BY login_at DESC;

-- Deactivate all active sessions from that IP (all users)
SELECT public.deactivate_sessions_by_ip('182.253.174.48');

-- Confirm deactivation
SELECT id, user_id, email, ip_address, login_at, is_active FROM public.user_sessions
WHERE ip_address = '182.253.174.48'
ORDER BY login_at DESC;