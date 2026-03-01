-- Jalankan script ini di Supabase SQL Editor jika Anda mengalami error "Foreign Key Constraint" saat menghapus ujian.
-- Script ini akan menambahkan aturan ON DELETE CASCADE sehingga saat ujian dihapus,
-- data hasil ujian yang terkait akan terhapus secara otomatis tanpa error.

BEGIN;

ALTER TABLE public.exam_results
DROP CONSTRAINT IF EXISTS exam_results_exam_id_fkey;

ALTER TABLE public.exam_results
ADD CONSTRAINT exam_results_exam_id_fkey
FOREIGN KEY (exam_id) REFERENCES public.exams(id) ON DELETE CASCADE;

COMMIT;
