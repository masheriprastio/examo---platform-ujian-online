-- Force-deactivate sessions for IP 182.253.174.48 and known user_ids
-- Run this in Supabase SQL editor.

-- 1) Force update any active sessions from that IP
UPDATE public.user_sessions
SET is_active = false, status = 'inactive', last_activity_at = now()
WHERE ip_address = '182.253.174.48' AND is_active = true;

-- 2) Also ensure sessions for detected user_ids are deactivated (replace/add IDs as needed)
UPDATE public.user_sessions
SET is_active = false, status = 'inactive', last_activity_at = now()
WHERE user_id IN (
  '97356bf0-3b7b-4f4d-b930-26b8e7080610',
  '81f5f92a-f79b-41dc-a0d1-7778db9e980d',
  '9b4ac3e7-bec7-4896-b7bd-59648f402c9d'
) AND is_active = true;

-- 3) Confirm results
SELECT id, user_id, email, ip_address, login_at, is_active, status
FROM public.user_sessions
WHERE ip_address = '182.253.174.48'
ORDER BY login_at DESC;