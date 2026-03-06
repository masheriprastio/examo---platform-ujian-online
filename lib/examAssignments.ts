import { supabase, isSupabaseConfigured } from './supabase';
import { Question } from '../types';

/**
 * Fetch deterministic essay questions (without persisting mapping)
 * Calls Postgres function: get_deterministic_essay_questions(p_bank_id, p_student_id, p_count)
 */
export async function getDeterministicEssayQuestions(bankId: string, studentId: string, count: number): Promise<{ question_id: string; content: string; ordinal: number }[]> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabase
    .rpc('get_deterministic_essay_questions', {
      p_bank_id: bankId,
      p_student_id: studentId,
      p_count: count
    });

  if (error) throw error;
  return (data as any) || [];
}

/**
 * Persist deterministic assignment into student_exam_questions
 * Calls Postgres function: assign_essay_questions(p_student_exam_id, p_bank_id, p_student_id, p_count)
 */
export async function assignEssayQuestions(studentExamId: string, bankId: string, studentId: string, count: number): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase not configured');
  }

  const { error } = await supabase
    .rpc('assign_essay_questions', {
      p_student_exam_id: studentExamId,
      p_bank_id: bankId,
      p_student_id: studentId,
      p_count: count
    });

  if (error) throw error;
}