-- =========================================================================================
-- SCRIPT: FIX EXAM DELETE CASCADE
-- FUNGSI: Mengizinkan fitur Hapus Ujian berfungsi sempurna di aplikasi dengan menambahkan
-- ON DELETE CASCADE ke setiap tabel yang berelasi dengan tabel `exams`.
--
-- CARA MENGGUNAKAN:
-- 1. Buka Dashboard Supabase Anda (app.supabase.com).
-- 2. Pilih project sekolah Anda.
-- 3. Di menu sebelah kiri, klik "SQL Editor".
-- 4. Buat Query baru ("New Query").
-- 5. Copy seluruh isi file ini dan Paste di dalam SQL Editor tersebut.
-- 6. Klik tombol "Run" (Warna hijau di pojok kanan bawah editor).
-- =========================================================================================

BEGIN;

-- 1. Perbaiki Foreign Key di tabel exam_results (menunjuk ke exams)
ALTER TABLE IF EXISTS public.exam_results DROP CONSTRAINT IF EXISTS exam_results_exam_id_fkey;
ALTER TABLE IF EXISTS public.exam_results
  ADD CONSTRAINT exam_results_exam_id_fkey
  FOREIGN KEY (exam_id)
  REFERENCES public.exams(id)
  ON DELETE CASCADE;

-- 2. Perbaiki Foreign Key di tabel exam_submission_history (jika Anda sudah pernah menjalankan script tracking)
-- Drop the constraint if it exists
ALTER TABLE IF EXISTS public.exam_submission_history DROP CONSTRAINT IF EXISTS exam_submission_history_exam_id_fkey;
ALTER TABLE IF EXISTS public.exam_submission_history DROP CONSTRAINT IF EXISTS exam_submission_history_exam_result_id_fkey;

-- Recreate with CASCADE for exam_id
ALTER TABLE IF EXISTS public.exam_submission_history
  ADD CONSTRAINT exam_submission_history_exam_id_fkey
  FOREIGN KEY (exam_id)
  REFERENCES public.exams(id)
  ON DELETE CASCADE;

-- Recreate with CASCADE for exam_result_id
ALTER TABLE IF EXISTS public.exam_submission_history
  ADD CONSTRAINT exam_submission_history_exam_result_id_fkey
  FOREIGN KEY (exam_result_id)
  REFERENCES public.exam_results(id)
  ON DELETE CASCADE;


-- 3. Tambahan: jika ada tabel user_activity_log yang berelasi ke exam_id
ALTER TABLE IF EXISTS public.user_activity_log DROP CONSTRAINT IF EXISTS user_activity_log_exam_id_fkey;
ALTER TABLE IF EXISTS public.user_activity_log
  ADD CONSTRAINT user_activity_log_exam_id_fkey
  FOREIGN KEY (exam_id)
  REFERENCES public.exams(id)
  ON DELETE CASCADE;

COMMIT;

-- Pesan Sukses (Jika script berjalan tanpa error, maka operasi berhasil)
