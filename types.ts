
export interface User {
  id: string;
  email: string;
  password?: string;
  role: 'teacher' | 'student';
  name: string;
  grade?: string;
  school?: string;
}

export type QuestionType = 'mcq' | 'true_false' | 'short_answer' | 'essay' | 'multiple_select';

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  options?: string[];
  correctAnswerIndex?: number;
  correctAnswerIndices?: number[];
  trueFalseAnswer?: boolean;
  shortAnswer?: string;
  essayAnswer?: string;
  explanation?: string;
  points: number;
  topic?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  randomizeOptions?: boolean;
  attachment?: {
    type: 'image' | 'video' | 'audio' | 'pdf';
    url: string;
    caption?: string;
  };
}

export interface Exam {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  questions: Question[];
  category: string;
  status: 'draft' | 'published';
  createdAt: string;
  randomizeQuestions?: boolean;
}

export interface ExamLog {
  event: 'start' | 'tab_blur' | 'tab_focus' | 'autosave' | 'submit';
  timestamp: string;
  detail?: string;
}

export interface ExamResult {
  id: string;
  examId: string;
  studentId: string;
  studentName: string;
  score: number;
  status: 'in_progress' | 'completed';
  totalPointsPossible: number;
  pointsObtained: number;
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  startedAt: string;
  submittedAt?: string;
  answers: Record<string, any>;
  logs: ExamLog[];
}

export type AppView = 'LOGIN' | 'TEACHER_DASHBOARD' | 'TEACHER_GRADES' | 'TEACHER_BANK' | 'TEACHER_STUDENTS' | 'STUDENT_DASHBOARD' | 'STUDENT_HISTORY' | 'EXAM_SESSION' | 'RESULT' | 'AI_GENERATOR' | 'EXAM_EDITOR' | 'CHANGE_PASSWORD';
