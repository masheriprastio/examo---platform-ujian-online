-- Jalankan script ini di Supabase SQL Editor jika Anda mengalami error "Foreign Key Constraint" saat menghapus ujian.
-- Script ini akan menambahkan aturan ON DELETE CASCADE sehingga saat ujian dihapus,
-- data hasil ujian yang terkait akan terhapus secara otomatis tanpa error.

BEGIN;

-- 1. Hapus data hasil ujian (exam_results) yang yatim piatu / orphaned.
-- Data ini terjadi jika ujian-nya sudah terhapus sebelumnya namun hasil ujiannya masih tertinggal.
-- Ini penting agar constraint Foreign Key bisa dibuat tanpa error.
DELETE FROM public.exam_results
WHERE exam_id NOT IN (SELECT id FROM public.exams);

-- 2. Hapus constraint lama jika ada
ALTER TABLE public.exam_results
DROP CONSTRAINT IF EXISTS exam_results_exam_id_fkey;

-- 3. Buat constraint baru dengan aturan CASCADE
ALTER TABLE public.exam_results
ADD CONSTRAINT exam_results_exam_id_fkey
FOREIGN KEY (exam_id) REFERENCES public.exams(id) ON DELETE CASCADE;

COMMIT;
