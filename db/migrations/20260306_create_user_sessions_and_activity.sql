-- Migration: create user_sessions and user_activity_log + helper functions
-- Run this in Supabase SQL editor to enable session tracking and forced logout by user or IP.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) user_sessions: track active sessions, device, IP, user agent, timestamps
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text,
  device_id text,
  ip_address text,
  user_agent text,
  login_at timestamptz NOT NULL DEFAULT now(),
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'active'
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_ip ON public.user_sessions(ip_address);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON public.user_sessions(is_active);

-- 2) user_activity_log: append-only activity audit trail
CREATE TABLE IF NOT EXISTS public.user_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  email text,
  activity_type text NOT NULL,
  activity_detail text,
  ip_address text,
  device_id text,
  device_info jsonb,
  exam_id uuid,
  session_id uuid,
  timestamp timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_id ON public.user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_timestamp ON public.user_activity_log(timestamp);

-- 3) Helper function: deactivate all sessions for a user
CREATE OR REPLACE FUNCTION public.deactivate_sessions_for_user(p_user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.user_sessions
  SET is_active = false, status = 'inactive', last_activity_at = now()
  WHERE user_id = p_user_id AND is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4) Helper function: deactivate sessions by IP (optionally restricted to a user)
CREATE OR REPLACE FUNCTION public.deactivate_sessions_by_ip(p_ip text, p_user_id uuid DEFAULT NULL)
RETURNS void AS $$
BEGIN
  IF p_user_id IS NULL THEN
    UPDATE public.user_sessions
    SET is_active = false, status = 'inactive', last_activity_at = now()
    WHERE ip_address = p_ip AND is_active = true;
  ELSE
    UPDATE public.user_sessions
    SET is_active = false, status = 'inactive', last_activity_at = now()
    WHERE ip_address = p_ip AND user_id = p_user_id AND is_active = true;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5) Helper function: deactivate a specific session id
CREATE OR REPLACE FUNCTION public.deactivate_session_by_id(p_session_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.user_sessions
  SET is_active = false, status = 'inactive', last_activity_at = now()
  WHERE id = p_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6) Helper function: fetch active sessions for a user (useful for admin UI)
CREATE OR REPLACE FUNCTION public.get_active_sessions_for_user(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  device_id text,
  ip_address text,
  user_agent text,
  login_at timestamptz,
  last_activity_at timestamptz,
  is_active boolean,
  status text
) AS $$
  SELECT id, device_id, ip_address, user_agent, login_at, last_activity_at, is_active, status
  FROM public.user_sessions
  WHERE user_id = p_user_id AND is_active = true
  ORDER BY login_at DESC;
$$ LANGUAGE sql STABLE;

-- 7) Audit trigger: record session deactivations into user_activity_log automatically
CREATE OR REPLACE FUNCTION public.log_session_deactivation()
RETURNS trigger AS $$
BEGIN
  IF NEW.is_active = false THEN
    INSERT INTO public.user_activity_log (user_id, email, activity_type, activity_detail, ip_address, device_id, session_id, timestamp)
    VALUES (NEW.user_id, NEW.email, 'session_deactivated', 'Session deactivated via DB function', NEW.ip_address, NEW.device_id, NEW.id, now());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_log_session_deactivation ON public.user_sessions;
CREATE TRIGGER trg_log_session_deactivation
AFTER UPDATE ON public.user_sessions
FOR EACH ROW
WHEN (OLD.is_active IS DISTINCT FROM NEW.is_active)
EXECUTE FUNCTION public.log_session_deactivation();

-- 8) Optional grants (adjust roles as needed)
-- GRANT SELECT, INSERT, UPDATE ON public.user_sessions TO authenticated;
-- GRANT INSERT ON public.user_activity_log TO authenticated;
-- GRANT EXECUTE ON FUNCTION public.deactivate_sessions_for_user(uuid) TO authenticated;
-- GRANT EXECUTE ON FUNCTION public.deactivate_sessions_by_ip(text, uuid) TO authenticated;
-- GRANT EXECUTE ON FUNCTION public.deactivate_session_by_id(uuid) TO authenticated;
-- GRANT EXECUTE ON FUNCTION public.get_active_sessions_for_user(uuid) TO authenticated;

-- End of migration