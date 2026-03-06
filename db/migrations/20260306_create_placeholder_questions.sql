-- Placeholder migration: create minimal questions table so dependent migrations/functions can run.
-- This is intentionally minimal and should be replaced/merged with your real questions schema.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_id uuid,
  content text,
  type text,
  points integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_questions_bank_id ON questions(bank_id);