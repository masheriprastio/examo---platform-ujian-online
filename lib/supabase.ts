
import { createClient } from '@supabase/supabase-js';
import { User, Exam } from '../types';

// Access variables safely, checking multiple possible sources
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  '';

const SUPABASE_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

export const isSupabaseConfigured = !!(SUPABASE_URL && SUPABASE_KEY && SUPABASE_URL.trim() !== '' && SUPABASE_KEY.trim() !== '');

// Debugging (Safe Log)
if (import.meta.env.DEV) {
  if (isSupabaseConfigured) {
    console.log(`[Supabase] Connected to: ${SUPABASE_URL.substring(0, 15)}...`);
  } else {
    console.warn("[Supabase] Configuration missing. Running in Mock Mode.");
    console.debug({ SUPABASE_URL, SUPABASE_KEY_PRESENT: !!SUPABASE_KEY });
  }
}

export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

export const MOCK_TEACHER: User = {
  id: 'guru-01',
  email: 'guru@sekolah.id',
  password: 'password',
  name: 'Bpk. Ahmad Fauzi',
  role: 'teacher',
  school: 'SMA Negeri 1 Digital'
};

export const MOCK_STUDENT: User = {
  id: 'siswa-01',
  email: 'siswa@sekolah.id',
  password: 'password',
  name: 'Budi Santoso',
  grade: 'XII-IPA-1',
  role: 'student',
  school: 'SMA Negeri 1 Digital',
  nis: '12345'
};

export const MOCK_EXAMS: Exam[] = [
  {
    id: 'exam-1',
    title: 'Ujian Akhir Matematika - Kelas XII',
    description: 'Materi Aljabar, Geometri, dan Kalkulus Dasar.',
    durationMinutes: 60,
    category: 'Matematika',
    status: 'published',
    createdAt: new Date().toISOString(),
    questions: [
      {
        id: 'q1',
        type: 'mcq',
        text: 'Berapakah volume kubus jika panjang rusuknya (s) = 5 cm?',
        options: ['125 cm³', '25 cm³', '150 cm³', '100 cm³'],
        correctAnswerIndex: 0,
        explanation: 'Volume kubus = s x s x s = 5 x 5 x 5 = 125.',
        points: 50,
      },
      {
        id: 'q2',
        type: 'true_false',
        text: 'Turunan dari f(x) = x^2 adalah 2x.',
        trueFalseAnswer: true,
        points: 20,
        explanation: 'Benar, karena d/dx(x^n) = nx^(n-1).'
      },
      {
        id: 'q3',
        type: 'short_answer',
        text: 'Siapakah penemu kalkulus? (Sebutkan satu nama saja)',
        shortAnswer: 'Newton',
        points: 20,
        explanation: 'Isaac Newton dan Gottfried Wilhelm Leibniz dikreditkan dengan penemuan kalkulus.'
      },
      {
        id: 'q4',
        type: 'essay',
        text: 'Jelaskan langkah-langkah dalam menentukan turunan fungsi f(x) = x^2 menggunakan definisi limit.',
        essayAnswer: 'Gunakan rumus lim h->0 [f(x+h) - f(x)] / h.',
        points: 10
      }
    ]
  }
];
