
export interface User {
  id: string;
  email: string;
  password?: string;
  role: 'teacher' | 'student' | 'admin';
  name: string;
  grade?: string;
  school?: string;
  nis?: string;
  subject?: string; // Mapel for teachers
  session_token?: string;
}

export type QuestionType = 'mcq' | 'true_false' | 'short_answer' | 'essay' | 'multiple_select' | 'essay_dragdrop';

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  options?: string[];
  optionAttachments?: Array<{
    url?: string;
    type?: 'image' | 'video' | 'audio';
    caption?: string;
  }>;
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
  textAlign?: 'left' | 'center' | 'right';
  createdAt?: string;
  updatedAt?: string;
  // Untuk Essay Drag & Drop
  dragDropItems?: string[];                    // Item yang bisa di-drag (kiri)
  dragDropTargets?: string[];                  // Target drop zones (kanan)
  dragDropAnswer?: { [key: string]: string }; // Mapping: item → target
  attachment?: {
    type: 'image' | 'video' | 'audio';
    url: string;
    caption?: string;
  };
}

export interface ExamRoom {
  id: string;
  name: string;
  description?: string;
  capacity: number;
  supervisorId: string;
  supervisorName?: string; // Nama guru yang mengawas
  supervisorToken?: string; // Token unik for pengawas verification
  location?: string;
  status: 'available' | 'occupied' | 'maintenance';
  createdAt: string;
  updatedAt: string;
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
  startDate?: string;
  endDate?: string;
  examToken?: string; // Token untuk memulai ujian
  requireToken?: boolean; // Apakah ujian memerlukan token
  roomId?: string; // ID ruang ujian
  room?: ExamRoom; // Data ruang ujian lengkap (optional)
}

export interface ExamLog {
  event: 'start' | 'tab_blur' | 'tab_focus' | 'autosave' | 'submit' | 'violation_disqualified';
  timestamp: string;
  detail?: string;
}

export interface ExamResult {
  id: string;
  examId: string;
  studentId: string;
  studentName: string;
  score: number;
  status: 'in_progress' | 'completed' | 'disqualified';
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
  violation_alert?: boolean;
}

export interface Material {
  id: string;
  title: string;
  description: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  fileUrl: string;
  uploadedBy: string;
  uploadedAt: string;
  category: string;
  grade?: string;
  subject?: string;
  isPublic: boolean;
}

export type AppView = 'LOGIN' | 'TEACHER_DASHBOARD' | 'TEACHER_GRADES' | 'TEACHER_BANK' | 'TEACHER_EXAM_ROOM' | 'TEACHER_STUDENTS' | 'TEACHER_TEACHERS' | 'STUDENT_DASHBOARD' | 'STUDENT_HISTORY' | 'STUDENT_MATERIALS' | 'EXAM_SESSION' | 'RESULT' | 'AI_GENERATOR' | 'EXAM_EDITOR' | 'CHANGE_PASSWORD' | 'MATERIAL_MANAGER' | 'MONITORING';