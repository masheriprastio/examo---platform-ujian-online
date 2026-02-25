import React, { useState, useEffect, useRef } from 'react';
import { User, Exam, AppView, ExamResult, Question, ExamLog } from './types';
import { MOCK_TEACHER, MOCK_STUDENT, MOCK_EXAMS, supabase, isSupabaseConfigured } from './lib/supabase';
import { generateUUID } from './lib/uuid';
import {
  LogOut, LayoutDashboard, ClipboardList, Sparkles,
  GraduationCap, Book, Award, Users, Clock, Star,
  TrendingUp, CheckCircle, PlayCircle, FileText, History,
  Mail, Lock, Eye, EyeOff, ArrowRight, AlertTriangle, Database,
  Menu, X as CloseIcon, FileDown, Download, UserPlus, FileSpreadsheet,
  XCircle, HelpCircle, RotateCcw, PenTool, Save, Plus, ChevronDown, Trash2, ShieldCheck,
  ArrowUpDown, ArrowUp, ArrowDown, Key, AlertCircle, RefreshCw, WifiOff
} from 'lucide-react';
import { useNotification } from './context/NotificationContext';

import ExamRunner from './components/ExamRunner';
import AIGenerator from './components/AIGenerator';
import ExamEditor from './components/ExamEditor';
import QuestionBank from './components/QuestionBank';
import StudentManager from './components/StudentManager';
import MaterialManager from './components/MaterialManager';
import StudentMaterialList from './components/StudentMaterialList';
import { MaterialService, Material } from './services/MaterialService';

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('id-ID', {
  day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
});

const LoginView: React.FC<{
  onLogin: (role: 'teacher' | 'student', email: string, password?: string) => Promise<string | null>;
}> = ({ onLogin }) => {
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Only autofill if using mocks
    if (!isSupabaseConfigured) {
        if (role === 'teacher') setEmail(MOCK_TEACHER.email);
        else setEmail(MOCK_STUDENT.email);
        setPassword('password');
    } else {
        setEmail('');
        setPassword('');
    }
    setErrorMsg(null);
  }, [role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const error = await onLogin(role, email, password);
    setIsLoading(false);
    if (error) setErrorMsg(error);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4 font-sans text-left">
      <div className="max-w-md w-full bg-white rounded-[40px] shadow-2xl border border-gray-100 overflow-hidden">
        <div className="bg-indigo-600 p-10 text-center text-white relative">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight">Examo Platform</h1>
          <p className="text-indigo-100 mt-1 font-medium text-sm">Masuk ke akun Anda</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-10 space-y-6">
          <div className="flex bg-gray-100 p-1 rounded-2xl">
            <button type="button" onClick={() => setRole('student')} className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${role === 'student' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Siswa</button>
            <button type="button" onClick={() => setRole('teacher')} className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${role === 'teacher' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Guru</button>
          </div>

          {errorMsg && (
            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2 animate-shake">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {errorMsg}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Email / NIS Ujian</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition font-bold text-gray-900" placeholder="Email atau NIS..." required />
              </div>
            </div>
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-12 pr-12 py-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition font-bold text-gray-900" placeholder="••••••••" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600 transition">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          <button type="submit" disabled={isLoading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl transition shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 group disabled:opacity-70">
            {isLoading ? 'Memproses...' : 'Masuk Sekarang'} <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>
      </div>
    </div>
  );
};

const Sidebar: React.FC<{
  user: User;
  activeView: AppView;
  isOpen: boolean;
  onNavigate: (view: AppView) => void;
  onLogout: () => void;
  onClose: () => void;
}> = ({ user, activeView, isOpen, onNavigate, onLogout, onClose }) => {
  const isTeacher = user.role === 'teacher';
  const menuItems = isTeacher ? [
    { id: 'TEACHER_DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'TEACHER_GRADES', label: 'Buku Nilai', icon: ClipboardList },
    { id: 'TEACHER_BANK', label: 'Bank Soal', icon: Database },
    { id: 'TEACHER_STUDENTS', label: 'Manajemen Siswa', icon: Users },
    { id: 'AI_GENERATOR', label: 'Generator AI', icon: Sparkles },
    { id: 'MATERIAL_MANAGER', label: 'Manajemen Materi', icon: FileText },
  ] : [
    { id: 'STUDENT_DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'STUDENT_MATERIALS', label: 'Materi Belajar', icon: Book },
    { id: 'STUDENT_HISTORY', label: 'Riwayat Ujian', icon: History },
  ];

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-40 md:hidden" onClick={onClose} />}
      <aside className={`fixed md:sticky top-0 left-0 h-[100dvh] bg-white border-r border-gray-100 flex flex-col z-50 transition-transform duration-300 w-72 overflow-hidden ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3"><div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-lg shadow-indigo-100"><GraduationCap className="w-6 h-6" /></div><span className="font-black text-2xl text-indigo-900 tracking-tight">Examo</span></div>
          <button onClick={onClose} className="md:hidden p-2 text-gray-400 hover:bg-gray-50 rounded-xl"><CloseIcon /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2 scrollbar-hide">
          {menuItems.map((item) => (
            <button key={item.id} onClick={() => { onNavigate(item.id as AppView); onClose(); }} className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-bold transition-all ${activeView === item.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-gray-400 hover:bg-gray-50'}`}>
              <item.icon className="w-5 h-5" />{item.label}
            </button>
          ))}
        </div>
        <div className="p-4 border-t border-gray-50 shrink-0 bg-white">
          <div className="bg-gray-50 rounded-2xl p-4 mb-3 flex items-center gap-3 border border-gray-100">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 border border-indigo-200 flex items-center justify-center font-black text-indigo-600">{user.name.charAt(0)}</div>
            <div className="overflow-hidden"><p className="font-bold text-gray-900 text-sm truncate">{user.name}</p><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{user.role}</p></div>
          </div>
          <button onClick={() => { onLogout(); onClose(); }} className="w-full flex items-center gap-3 px-5 py-3 rounded-2xl font-bold text-red-400 hover:bg-red-50 transition-all"><LogOut className="w-5 h-5" /> Keluar</button>
        </div>
      </aside>
    </>
  );
};

export default function App() {
  const [view, setView] = useState<AppView>('LOGIN');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const shouldFetchRef = useRef(true); // Prevent re-fetching stale data after save

  const { addAlert } = useNotification();

  // Notification helper (uses NotificationContext which handles dedupe by key)
  const notify = (message: string, type: 'info' | 'error' | 'success' = 'info', key?: string) => {
    addAlert(message, type, key);
  };

  // Restore session from localStorage so refresh keeps user logged in
  useEffect(() => {
    try {
      const raw = localStorage.getItem('examo_session');
      if (raw) {
        const sess = JSON.parse(raw);
        if (sess?.user) setCurrentUser(sess.user);
        if (sess?.view) setView(sess.view as AppView);
      }
    } catch (err) {
      console.error('Failed to restore session', err);
    }
  }, []);

  // Persist session when user/view changes
  useEffect(() => {
    if (currentUser) {
      try {
        localStorage.setItem('examo_session', JSON.stringify({ user: currentUser, view }));
      } catch (err) {
        console.error('Failed to persist session', err);
      }
    } else {
      localStorage.removeItem('examo_session');
    }
  }, [currentUser, view]);

  // State Initialization: Use Mocks only if Supabase is NOT configured
  const [exams, setExams] = useState<Exam[]>(isSupabaseConfigured ? [] : MOCK_EXAMS);
  const [bankQuestions, setBankQuestions] = useState<Question[]>(isSupabaseConfigured ? [] : MOCK_EXAMS.flatMap(e => e.questions));
  const [students, setStudents] = useState<User[]>(isSupabaseConfigured ? [] : [MOCK_STUDENT]);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [studentMaterials, setStudentMaterials] = useState<Material[]>([]);

  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [lastResult, setLastResult] = useState<ExamResult | null>(null);
  const [selectedResult, setSelectedResult] = useState<ExamResult | null>(null);
  const [previewMaterial, setPreviewMaterial] = useState<Material | null>(null);

  // New State for Gradebook
  const [dailyScoreColumns, setDailyScoreColumns] = useState<string[]>(['Capaian 1']);
  const [dailyScores, setDailyScores] = useState<Record<string, Record<number, number>>>({}); // studentId -> colIndex -> score
  const [gradeViewMode, setGradeViewMode] = useState<'summary' | 'history'>('summary');

  // New State for Create Exam Dropdown
  const [showCreateMenu, setShowCreateMenu] = useState(false);

  // State for sorting riwayat pengerjaan
  const [sortField, setSortField] = useState<'date' | 'score' | 'name'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // State for token modal
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [tokenExam, setTokenExam] = useState<Exam | null>(null);
  const [inputToken, setInputToken] = useState('');
  const [tokenError, setTokenError] = useState<string | null>(null);

  // State for server error handling
  const [isOffline, setIsOffline] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Session Timeout & Warning State
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  const [timeoutWarningSeconds, setTimeoutWarningSeconds] = useState(0);
  const SESSION_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
  const WARNING_BEFORE_LOGOUT_MS = 60 * 1000; // Show warning 1 minute before logout

  // Auto Logout Logic (Students Only) - 5 minutes with warning at 4 minutes
  useEffect(() => {
    let mainTimeout: NodeJS.Timeout;
    let warningTimeout: NodeJS.Timeout;
    let warningCountdownInterval: NodeJS.Timeout;

    const resetTimer = () => {
      if (currentUser && currentUser.role === 'student') {
        clearTimeout(mainTimeout);
        clearTimeout(warningTimeout);
        clearInterval(warningCountdownInterval);
        setShowTimeoutWarning(false);

        // Warning at 4 minutes (1 minute before logout)
        warningTimeout = setTimeout(() => {
          setShowTimeoutWarning(true);
          setTimeoutWarningSeconds(60);

          // Countdown from 60 to 0
          warningCountdownInterval = setInterval(() => {
            setTimeoutWarningSeconds(prev => {
              if (prev <= 1) {
                clearInterval(warningCountdownInterval);
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        }, SESSION_TIMEOUT_MS - WARNING_BEFORE_LOGOUT_MS);

        // Logout at 5 minutes
        mainTimeout = setTimeout(() => {
          setView('LOGIN');
          setCurrentUser(null);
          localStorage.removeItem('examo_session');
          addAlert('Sesi Anda telah berakhir karena tidak ada aktivitas selama 5 menit.', 'info', 'session-timeout');
        }, SESSION_TIMEOUT_MS);
      }
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    if (currentUser && currentUser.role === 'student') {
      resetTimer();
      events.forEach(event => document.addEventListener(event, resetTimer));
    }

    return () => {
      clearTimeout(mainTimeout);
      clearTimeout(warningTimeout);
      clearInterval(warningCountdownInterval);
      events.forEach(event => document.removeEventListener(event, resetTimer));
    };
  }, [currentUser, addAlert]);

    // Load Data from Supabase. Returns fetched exams and results for callers to act on.
    const fetchData = async () => {
      if (!isSupabaseConfigured || !supabase) return { exams: null as any, results: null as any };

      try {
        // 1. Fetch Exams
        const { data: examsData, error: examsError } = await supabase.from('exams').select('*').order('created_at', { ascending: false });
        let mappedExams: Exam[] = [];
        if (examsData && !examsError) {
          mappedExams = examsData.map((e: any) => ({
            ...e,
            durationMinutes: e.duration_minutes,
            createdAt: e.created_at,
            startDate: e.start_date,
            endDate: e.end_date
          }));
          setExams(mappedExams);
          setBankQuestions(mappedExams.flatMap(e => e.questions || []));
        }

        // 2. Fetch Results
        const { data: resultsData, error: resultsError } = await supabase.from('exam_results').select('*');
        let mappedResults: ExamResult[] = [];
        if (resultsData && !resultsError) {
          mappedResults = resultsData.map((r: any) => ({
             ...r,
             examId: r.exam_id,
             studentId: r.student_id,
             studentName: r.student_name || 'Unknown',
             totalPointsPossible: r.total_points_possible,
             pointsObtained: r.points_obtained,
             totalQuestions: r.total_questions,
             correctCount: r.correct_count,
             incorrectCount: r.incorrect_count,
             unansweredCount: r.unanswered_count,
             submittedAt: r.submitted_at,
             startedAt: r.started_at,
             violation_alert: Array.isArray(r.logs) && r.logs.some((l: any) => l.event === 'tab_blur' || l.event === 'violation_disqualified')
          }));
          setResults(mappedResults);
        }

        return { exams: mappedExams, results: mappedResults };
      } catch (err) {
        console.error("Failed to fetch data from Supabase:", err);
        return { exams: null as any, results: null as any };
      }
    };

  useEffect(() => {
    fetchData();
  }, []);

  // Single Session Enforcement (One IP/Device Logic)
  useEffect(() => {
    if (!currentUser || !isSupabaseConfigured || !supabase) return;

    // Realtime listener for session token changes
    const channel = supabase
      .channel(`user-session-${currentUser.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${currentUser.id}` },
        (payload: any) => {
          const newUser = payload.new;
          // If the DB token changes and doesn't match our current token -> kicked out
          if (newUser.session_token && newUser.session_token !== currentUser.session_token) {
            alert("Sesi Anda telah berakhir karena akun ini login di perangkat lain.");
            setCurrentUser(null);
            setView('LOGIN');
            localStorage.removeItem('examo_session');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser]);

  // Fetch Data on view change (specifically when switching to Dashboard)
  useEffect(() => {
    if (view === 'STUDENT_DASHBOARD' || view === 'TEACHER_DASHBOARD') {
      if (shouldFetchRef.current) {
        fetchData();
      } else {
        shouldFetchRef.current = true; // Reset for next time
      }
    }

    if (view === 'STUDENT_MATERIALS') {
      const fetchMaterials = async () => {
        try {
          const data = await MaterialService.getAllMaterials();
          setStudentMaterials(data);
        } catch (err) {
          console.error('Failed to fetch materials:', err);
        }
      };
      fetchMaterials();
    }
  }, [view]);

  // Fetch Students (only if Teacher logged in)
  useEffect(() => {
     const fetchStudents = async () => {
        if (currentUser?.role === 'teacher' && isSupabaseConfigured && supabase) {
            const { data, error } = await supabase.from('users').select('*').eq('role', 'student');
            if (data && !error) {
                setStudents(data as User[]);
            }
        }
     };
     fetchStudents();
  }, [currentUser]);

  // Realtime Violation Monitoring for Teacher
  useEffect(() => {
    if (currentUser?.role !== 'teacher' || !isSupabaseConfigured || !supabase) return;

    // Request Notification Permission
    if (Notification.permission !== 'granted') {
      Notification.requestPermission();
    }

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'exam_results' },
        (payload: any) => { // Cast payload to any to resolve TS errors temporarily
          console.log('Realtime update received:', payload);
          
          if (payload.event === 'INSERT') {
            const newRes = payload.new as any;
            const mapped = {
               ...newRes,
               examId: newRes.exam_id,
               studentId: newRes.student_id,
               studentName: newRes.student_name,
               totalPointsPossible: newRes.total_points_possible,
               pointsObtained: newRes.points_obtained,
               totalQuestions: newRes.total_questions,
               correctCount: newRes.correct_count,
               incorrectCount: newRes.incorrect_count,
               unansweredCount: newRes.unanswered_count,
               submittedAt: newRes.submitted_at,
               startedAt: newRes.started_at
            };
            setResults(prev => {
                if (prev.find(r => r.id === mapped.id)) return prev;
                return [mapped, ...prev];
            });
            notify(`Siswa ${mapped.studentName} mulai mengerjakan ujian.`, 'info', `start:${mapped.id}`);
          } 
          else if (payload.event === 'UPDATE') {
            const newRecord = payload.new as any;
            const mapped = {
               ...newRecord,
               examId: newRecord.exam_id,
               studentId: newRecord.student_id,
               studentName: newRecord.student_name,
               totalPointsPossible: newRecord.total_points_possible,
               pointsObtained: newRecord.points_obtained,
               totalQuestions: newRecord.total_questions,
               correctCount: newRecord.correct_count,
               incorrectCount: newRecord.incorrect_count,
               unansweredCount: newRecord.unanswered_count,
               submittedAt: newRecord.submitted_at,
               startedAt: newRecord.started_at
            };

            setResults(prev => prev.map(r => r.id === mapped.id ? mapped : r));

            if (newRecord.logs && Array.isArray(newRecord.logs)) {
               const newLogs = newRecord.logs as ExamLog[];
               const latestLog = newLogs[newLogs.length - 1];
               
               if (latestLog && latestLog.event === 'violation_disqualified') {
                  notify(`PELANGGARAN BERAT: Siswa ${newRecord.student_name} didiskualifikasi (3x keluar tab)!`, 'error', `violation:${newRecord.id}`);
                  if (Notification.permission === 'granted') {
                     new Notification('Pelanggaran Berat!', { body: `Siswa ${newRecord.student_name} didiskualifikasi!`, icon: '/vite.svg' });
                  }
               } else if (latestLog && latestLog.event === 'tab_blur') {
                  notify(`Peringatan: Siswa ${newRecord.student_name} keluar dari tab ujian!`, 'error', `tabblur:${newRecord.id}`);
                  if (Notification.permission === 'granted') {
                     new Notification('Pelanggaran Ujian', { body: `Siswa ${newRecord.student_name} terdeteksi keluar tab!`, icon: '/vite.svg' });
                  }
               } else if (latestLog && latestLog.event === 'submit') {
                  notify(`Siswa ${newRecord.student_name} telah mengirimkan ujian.`, 'success', `submit:${newRecord.id}`);
                  if (Notification.permission === 'granted') {
                     new Notification('Ujian Selesai', { body: `Siswa ${newRecord.student_name} telah mengirimkan ujian.`, icon: '/vite.svg' });
                  }
               }
            }
          }
          else if (payload.event === 'DELETE') {
            setResults(prev => prev.filter(r => r.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser]);


  const handleLogin = async (role: 'teacher' | 'student', email: string, password?: string): Promise<string | null> => {
    const pwd = password || 'password';

    if (isSupabaseConfigured && supabase) {
        // Authenticate via Database
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .or(`email.eq.${email},nis.eq.${email}`)
            .eq('role', role)
            .single();

        if (error || !data) return `${role === 'teacher' ? 'Guru' : 'Siswa'} tidak ditemukan.`;

        // Simple password check (In production, use bcrypt/argon2 on backend or Supabase Auth)
        if (data.password && data.password !== pwd) {
            return "Password salah.";
        }

        // Generate and update Session Token (Single Device Enforcement)
        const sessionToken = generateUUID();
        const { error: tokenError } = await supabase
            .from('users')
            .update({ session_token: sessionToken })
            .eq('id', data.id);

        if (tokenError) {
            console.error("Failed to set session token:", tokenError);
        }

        // Request Notification Permission immediately upon successful login (especially for teachers)
        if (Notification.permission !== 'granted') {
             Notification.requestPermission();
        }

        const userWithToken = { ...data, session_token: sessionToken };
        setCurrentUser(userWithToken);

        setView(role === 'teacher' ? 'TEACHER_DASHBOARD' : 'STUDENT_DASHBOARD');
        // Fetch fresh data and notify existing violations to teacher
        const fetched = await fetchData();
        if (role === 'teacher' && fetched.results) {
          fetched.results.forEach(r => {
            if (r.violation_alert) {
              const msg = r.logs && Array.isArray(r.logs) && r.logs.some((l: any) => l.event === 'violation_disqualified')
                ? `PELANGGARAN BERAT: Siswa ${r.studentName} didiskualifikasikan!`
                : `Peringatan: Siswa ${r.studentName} terdeteksi keluar tab ujian.`;
              notify(msg, 'error', `violation:${r.id}`);
              // mark in state so UI shows highlight
              setResults(prev => prev.map(p => p.id === r.id ? { ...p, violation_alert: true } : p));
            }
          });
        }
        return null;

    } else {
        // Fallback to Mock
        if (role === 'teacher') {
            if (email === MOCK_TEACHER.email && pwd === 'password') {
                setCurrentUser(MOCK_TEACHER);
                setView('TEACHER_DASHBOARD');
                // For mock mode, check any existing results in state and notify
                results.forEach(r => {
                  if (r.logs && Array.isArray(r.logs) && r.logs.some(l => l.event === 'tab_blur' || l.event === 'violation_disqualified')) {
                    const isDisq = r.logs.some((l: any) => l.event === 'violation_disqualified');
                    notify(isDisq ? `PELANGGARAN BERAT: Siswa ${r.studentName} didiskualifikasikan!` : `Peringatan: Siswa ${r.studentName} terdeteksi keluar tab ujian.`, 'error', `violation:${r.id}`);
                    setResults(prev => prev.map(p => p.id === r.id ? { ...p, violation_alert: true } : p));
                  }
                });
                return null; }
            return "Guru tidak ditemukan.";
        } else {
            const found = students.find(s => s.email === email || s.nis === email);
            if (found) {
                if (found.password && found.password !== pwd) {
                    return "Password salah.";
                }
                setCurrentUser(found); setView('STUDENT_DASHBOARD'); return null;
            }
            return "Siswa tidak terdaftar.";
        }
    }
  };

  // Generate random token
  const generateExamToken = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let token = '';
    for (let i = 0; i < 6; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  };

  // Function to handle exam start with token check
  const handleStartExamWithToken = (exam: Exam) => {
    // Check if exam requires token
    if (exam.requireToken && exam.examToken) {
      setTokenExam(exam);
      setShowTokenModal(true);
      setInputToken('');
      setTokenError(null);
    } else {
      handleStartExam(exam);
    }
  };

  // Verify token and start exam
  const verifyTokenAndStartExam = () => {
    if (!tokenExam) return;
    
    if (inputToken.toUpperCase() === tokenExam.examToken?.toUpperCase()) {
      setShowTokenModal(false);
      handleStartExam(tokenExam);
      setTokenExam(null);
      setInputToken('');
      setTokenError(null);
    } else {
      setTokenError('Token salah! Pastikan Anda memasukkan token yang benar.');
    }
  };

  // Sorting function for results
  const getSortedResults = (resultsToSort: ExamResult[]) => {
    return [...resultsToSort].sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'date':
          comparison = new Date(a.submittedAt || a.startedAt).getTime() - new Date(b.submittedAt || b.startedAt).getTime();
          break;
        case 'score':
          comparison = a.score - b.score;
          break;
        case 'name':
          comparison = a.studentName.localeCompare(b.studentName);
          break;
        default:
          comparison = 0;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  };

  // Toggle sort direction
  const toggleSort = (field: 'date' | 'score' | 'name') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleStartExam = (exam: Exam) => {
    const existing = results.find(r => r.examId === exam.id && r.studentId === currentUser?.id && r.status === 'in_progress');
    if (!existing) {
      const newResult: ExamResult = {
        id: generateUUID(),
        examId: exam.id,
        studentId: currentUser!.id,
        studentName: currentUser!.name,
        score: 0,
        status: 'in_progress',
        totalPointsPossible: 0,
        pointsObtained: 0,
        totalQuestions: exam.questions.length,
        correctCount: 0,
        incorrectCount: 0,
        unansweredCount: exam.questions.length,
        startedAt: new Date().toISOString(),
        answers: {},
        logs: []
      };

      // Optimistic Update
      setResults(prev => [newResult, ...prev]);

      // DB Insert with error handling (don't logout on error)
      if (isSupabaseConfigured && supabase) {
          supabase.from('exam_results').insert({
              id: newResult.id,
              exam_id: exam.id,
              student_id: currentUser!.id,
              student_name: currentUser!.name,
              status: 'in_progress',
              started_at: newResult.startedAt,
              total_questions: newResult.totalQuestions,
              answers: {},
              logs: []
          }).then(({ error }) => {
              if (error) {
                console.error("Failed to start exam in DB:", error);
                // Check if it's a server/connection error
                if (error.code === 'PGRST301' || error.code === '5XX' || error.message?.includes('network')) {
                  setIsOffline(true);
                  addAlert('Koneksi ke server terputus. Data akan disimpan secara lokal.', 'error');
                }
              }
          });
      }
    }
    setActiveExam(exam);
    setView('EXAM_SESSION');
  };

  const handleAutosave = (answers: Record<string, any>, logs: ExamLog[]) => {
    if (currentUser && activeExam) {
      // Optimistic
      setResults(prev => prev.map(r => (r.examId === activeExam.id && r.studentId === currentUser.id && r.status === 'in_progress') ? { ...r, answers, logs } : r));

      // DB Sync (Debounced ideally, but here direct)
      if (isSupabaseConfigured && supabase) {
          // Find the result ID to update
          const currentResult = results.find(r => r.examId === activeExam.id && r.studentId === currentUser.id && r.status === 'in_progress');
          if (currentResult) {
              supabase.from('exam_results')
                .update({ answers, logs })
                .eq('id', currentResult.id)
                .then(({ error }) => { if (error) console.error("Autosave failed", error); });
          }
      }
    }
  };

  const handleExamFinish = async (
    score: number, 
    obtained: number, 
    total: number, 
    stats: { correct: number, incorrect: number, unanswered: number, total: number },
    answers: Record<string, any>, 
    logs: ExamLog[]
  ) => {
    if (currentUser && activeExam) {
      let finalRes: ExamResult | null = null;

      // Optimistic Update
      const updatedResults = results.map(r => {
        if (r.examId === activeExam.id && r.studentId === currentUser.id && r.status === 'in_progress') {
          finalRes = { 
            ...r, 
            score, 
            status: 'completed', 
            totalPointsPossible: total, 
            pointsObtained: obtained, 
            totalQuestions: stats.total,
            correctCount: stats.correct,
            incorrectCount: stats.incorrect,
            unansweredCount: stats.unanswered,
            submittedAt: new Date().toISOString(),
            answers,
            logs 
          };
          return finalRes;
        }
        return r;
      });
      setResults(updatedResults);
      setLastResult(finalRes);

      // DB Update (Upsert to be safe)
      if (isSupabaseConfigured && supabase && finalRes) {
          const { error } = await supabase.from('exam_results').upsert({
              id: (finalRes as any).id,
              exam_id: activeExam.id,
              student_id: currentUser.id,
              student_name: currentUser.name,
              score,
              status: 'completed',
              total_points_possible: total,
              points_obtained: obtained,
              total_questions: stats.total,
              correct_count: stats.correct,
              incorrect_count: stats.incorrect,
              unanswered_count: stats.unanswered,
              submitted_at: finalRes.submittedAt,
              started_at: finalRes.startedAt,
              answers,
              logs
          }, { onConflict: 'id' });
          
          if (error) {
            console.error('SUPABASE_SAVE_ERROR:', JSON.stringify(error, null, 2));
            addAlert(`Gagal menyimpan: ${error.message} (${error.code || 'Unknown Code'})`, 'error');
          }
      }
    }
    setView('RESULT');
  };

  // --- NEW HANDLERS FOR STUDENT MANAGEMENT ---

  const handleAddStudent = async (newStudent: User) => {
    // 1. Optimistic Update
    setStudents(prev => [newStudent, ...prev]);

    // 2. DB Insert
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('users').insert({
        name: newStudent.name,
        email: newStudent.email,
        password: newStudent.password, // In prod: hash this!
        role: 'student',
        grade: newStudent.grade,
        school: newStudent.school || 'SMA Negeri 1 Digital',
        nis: newStudent.nis
      }).select().single();

      if (error) {
        console.error("Failed to insert student:", error);
        // Rollback? Alert? For now, alert.
        addAlert("Gagal menyimpan ke database: " + error.message, 'error');
        // Remove optimistic update
        setStudents(prev => prev.filter(s => s.id !== newStudent.id));
      } else if (data) {
        // Update local state with REAL ID from DB
        setStudents(prev => prev.map(s => s.id === newStudent.id ? { ...s, id: data.id } : s));
      }
    }
  };

  const handleDeleteStudent = async (id: string) => {
    // 1. Optimistic Update
    const originalStudents = [...students];
    setStudents(prev => prev.filter(s => s.id !== id));

    // 2. DB Delete
    if (isSupabaseConfigured && supabase) {
      // Check if it's a temp ID (not in DB yet)
      if (id.startsWith('temp-') || id.startsWith('std-')) {
          // If it was just added and hasn't synced, we just removed it from state. Good.
          return;
      }

      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) {
        console.error("Failed to delete student:", error);
        addAlert("Gagal menghapus dari database: " + error.message, 'error');
        // Rollback
        setStudents(originalStudents);
      }
    }
  };

  // Handler for INDIVIDUAL Student Edit (Update existing student)
  const handleEditStudent = async (editedStudent: User) => {
    // 1. Optimistic Update
    setStudents(prev => prev.map(s => s.id === editedStudent.id ? editedStudent : s));

    // 2. DB Update
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('users')
        .update({
          name: editedStudent.name,
          email: editedStudent.email,
          password: editedStudent.password,
          grade: editedStudent.grade,
          nis: editedStudent.nis
        })
        .eq('id', editedStudent.id);

      if (error) {
        console.error("Failed to update student:", error);
        addAlert("Gagal update data siswa: " + error.message, 'error');
        // Rollback by reverting to original
        const originalStudent = students.find(s => s.id === editedStudent.id);
        if (originalStudent) {
          setStudents(prev => prev.map(s => s.id === editedStudent.id ? originalStudent : s));
        }
      } else {
        addAlert('Data siswa berhasil diperbarui!', 'success');
      }
    } else {
      // Mock mode: just show success
      addAlert('Data siswa berhasil diperbarui!', 'success');
    }
  };

  // Wrapper for BULK Student Updates (e.g., Import)
  const handleStudentUpdate = async (newStudents: User[]) => {
      // This is primarily for Excel Import which replaces/appends the list
      // Determine added items (simple diff based on ID format or just append logic from StudentManager)

      // If StudentManager passes the WHOLE new list, and we want to sync:
      // It's safer to just handle the NEW items if possible, but let's assume
      // `newStudents` contains [newly_imported..., old_existing...]

      // Filter out students that are already in state (by ID)
      const existingIds = new Set(students.map(s => s.id));
      const addedStudents = newStudents.filter(s => !existingIds.has(s.id));

      // Optimistic
      setStudents(newStudents);

      if (isSupabaseConfigured && supabase && addedStudents.length > 0) {
          const rowsToInsert = addedStudents.map(s => ({
            name: s.name,
            email: s.email,
            password: s.password,
            role: 'student',
            grade: s.grade,
            school: 'SMA Negeri 1 Digital', // Default
            nis: s.nis
          }));

          const { error } = await supabase.from('users').insert(rowsToInsert);
          if (error) {
              console.error("Bulk insert failed:", error);
              addAlert("Gagal import ke database: " + error.message, 'error');
              // Rollback optimistic
              setStudents(students);
          } else {
              // Re-fetch to get IDs? Or just let next load handle it.
              // For better UX, we should ideally re-fetch.
              const { data } = await supabase.from('users').select('*').eq('role', 'student');
              if (data) setStudents(data as User[]);
          }
      }
  };

  // Wrapper for Exam Updates (Sync with DB)
  const handleExamSave = async (updatedExam: Exam) => {
      // Check if exam exists in local state
      const exists = exams.some(e => e.id === updatedExam.id);

      // Optimistic update - immediate UI update
      if (exists) {
          setExams(prev => prev.map(e => e.id === updatedExam.id ? updatedExam : e));
      } else {
          setExams(prev => [updatedExam, ...prev]);
      }

      // Show success message immediately (optimistic)
      addAlert('Ujian berhasil disimpan!', 'success', 'save:' + updatedExam.id);

      // DB save in background - don't wait for it
      if (isSupabaseConfigured && supabase) {
          const dbExam = {
              id: updatedExam.id,
              title: updatedExam.title,
              description: updatedExam.description,
              duration_minutes: updatedExam.durationMinutes,
              category: updatedExam.category,
              status: updatedExam.status,
              questions: updatedExam.questions,
              start_date: updatedExam.startDate,
              end_date: updatedExam.endDate,
              created_by: currentUser?.id,
              created_at: exists ? undefined : updatedExam.createdAt
          };

          // Fire and forget - don't await
          (async () => {
              try {
                  if (exists) {
                      // Update existing exam
                      const { error } = await supabase.from('exams').update(dbExam).eq('id', updatedExam.id);
                      if (error) {
                          console.error("Failed to update exam in database:", error);
                          // Only show error if DB save fails
                          addAlert("Database save gagal (tapi data lokal tersimpan): " + error.message, 'warning');
                      }
                  } else {
                      // Insert new exam
                      const { error } = await supabase.from('exams').insert(dbExam);
                      if (error) {
                          console.error("Failed to create exam in database:", error);
                          addAlert("Database save gagal (tapi data lokal tersimpan): " + error.message, 'warning');
                      }
                  }
              } catch (err) {
                  console.error("Database operation error:", err);
              }
          })();
      }

      // Navigate immediately - don't wait for DB
      shouldFetchRef.current = false; // Prevent race condition where fetch gets old data
      setView('TEACHER_DASHBOARD');
  };

  const handleExamCreate = async (newExam: Exam) => {
       // Optimistic
       setExams([newExam, ...exams]);

       // DB
       if (isSupabaseConfigured && supabase) {
           const dbExam = {
              id: newExam.id,
              title: newExam.title,
              description: newExam.description,
              duration_minutes: newExam.durationMinutes,
              category: newExam.category,
              status: newExam.status,
              questions: newExam.questions,
              start_date: newExam.startDate,
              end_date: newExam.endDate,
              created_by: currentUser?.id,
              created_at: newExam.createdAt
           };
           const { error } = await supabase.from('exams').insert(dbExam);
           if (error) {
               console.error("Failed to create exam in database:", error);
               addAlert("Gagal menyimpan ujian ke database: " + error.message, 'error');
               // Rollback optimistic insert
               setExams(prev => prev.filter(e => e.id !== newExam.id));
           } else {
               // Verify data was saved by refetching
               await fetchData();
           }
       }
       setView('TEACHER_DASHBOARD');
  }

  const handleCreateManual = () => {
    const newExam: Exam = {
      id: generateUUID(),
      title: 'Ujian Baru Tanpa Judul',
      description: '',
      durationMinutes: 60,
      category: 'Umum',
      status: 'published',
      createdAt: new Date().toISOString(),
      questions: []
    };
    setEditingExam(newExam);
    setView('EXAM_EDITOR');
    setShowCreateMenu(false);
  };

  const exportGradesToPDF = () => {
    const doc = new jsPDF();
    doc.text('Laporan Hasil Ujian - Examo', 14, 20);
    const tableData = results.filter(r => r.status === 'completed').map((r, index) => [
      index + 1, r.studentName, exams.find(e => e.id === r.examId)?.title || '-', `${r.correctCount}/${r.totalQuestions}`, r.score, formatDate(r.submittedAt!)
    ]);
    autoTable(doc, { startY: 30, head: [['No', 'Nama', 'Ujian', 'Benar', 'Nilai', 'Waktu']], body: tableData });
    doc.save('Laporan_Nilai.pdf');
  };

  const exportGradesToCSV = () => {
    const headers = ['Nama Siswa', 'Ujian', 'Total Soal', 'Benar', 'Salah', 'Kosong', 'Skor', 'Waktu Kirim'];
    const rows = results.filter(r => r.status === 'completed').map(r => [
      r.studentName,
      exams.find(e => e.id === r.examId)?.title || '',
      r.totalQuestions,
      r.correctCount,
      r.incorrectCount,
      r.unansweredCount,
      r.score,
      r.submittedAt
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Rekap_Nilai_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportAnswersToPDF = (resultsToExport: ExamResult[], filename: string) => {
    const doc = new jsPDF();
    
    if (resultsToExport.length === 0) {
      addAlert("Tidak ada data untuk diekspor.", 'info');
      return;
    }

    resultsToExport.forEach((result, index) => {
      if (index > 0) doc.addPage();

      const exam = exams.find(e => e.id === result.examId);
      if (!exam) return;

      let yPos = 20;
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text(`Lembar Jawaban Siswa`, 14, yPos);
      yPos += 10;
      
      doc.setFontSize(10);
      doc.text(`Nama: ${result.studentName}`, 14, yPos);
      doc.text(`Waktu: ${result.submittedAt ? formatDate(result.submittedAt) : '-' }`, 120, yPos);
      yPos += 6;
      doc.text(`Ujian: ${exam.title}`, 14, yPos);
      doc.text(`Skor: ${result.score}`, 120, yPos);
      
      // KKM Indicator & Violation Check
      const violationCount = result.logs.filter(l => l.event === 'tab_blur').length;
      
      if (result.status === 'disqualified') {
        doc.setTextColor(220, 38, 38); // Red
        doc.text(`(DIDISKUALIFIKASI / DINONAKTIFKAN)`, 140, yPos);
        doc.setTextColor(0, 0, 0); // Reset
      } else if (result.score < 75) {
        doc.setTextColor(220, 38, 38); // Red
        doc.text(`(Di Bawah KKM)`, 140, yPos);
        doc.setTextColor(0, 0, 0); // Reset
      }

      if (violationCount > 0) {
        yPos += 6;
        doc.setTextColor(220, 38, 38);
        doc.setFontSize(9);
        doc.text(`Catatan: Terdeteksi ${violationCount}x pelanggaran (keluar tab ujian).`, 14, yPos);
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
      }
      
      yPos += 10;

      const tableBody = exam.questions.map((q, qIdx) => {
        const answer = result.answers[q.id];
        let answerText = '-';
        let status = '';

        if (q.type === 'mcq') {
          answerText = q.options && answer !== undefined && answer !== '' ? `${String.fromCharCode(65 + Number(answer))}. ${q.options[Number(answer)]}` : '-';
          status = answer === q.correctAnswerIndex ? 'Benar' : 'Salah';
        } else if (q.type === 'multiple_select') {
          const ans = (answer as number[]) || [];
          answerText = q.options && ans.length > 0 
            ? ans.map(i => `${String.fromCharCode(65 + i)}. ${q.options![i]}`).join('\n') 
            : '-';
          
          const correctIndices = q.correctAnswerIndices || [];
          const isCorrect = ans.length === correctIndices.length && ans.every(val => correctIndices.includes(val));
          status = isCorrect ? 'Benar' : 'Salah';
        } else if (q.type === 'true_false') {
          answerText = answer === true ? 'BENAR' : answer === false ? 'SALAH' : '-';
          status = answer === q.trueFalseAnswer ? 'Benar' : 'Salah';
        } else if (q.type === 'short_answer') {
          answerText = answer || '-';
          status = q.shortAnswer && typeof answer === 'string' && answer.trim().toLowerCase() === q.shortAnswer.trim().toLowerCase() ? 'Benar' : 'Salah';
        } else if (q.type === 'essay') {
          answerText = answer || '-';
          status = 'Esai';
        }

        return [
          qIdx + 1,
          q.text.substring(0, 50) + (q.text.length > 50 ? '...' : ''),
          q.type === 'mcq' ? 'PG' : q.type === 'multiple_select' ? 'PG (Banyak)' : q.type === 'true_false' ? 'B/S' : q.type === 'short_answer' ? 'Isian' : 'Esai',
          answerText,
          status
        ];
      });

      autoTable(doc, {
        startY: yPos,
        head: [['No', 'Soal', 'Tipe', 'Jawaban Siswa', 'Status']],
        body: tableBody,
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229] },
        styles: { fontSize: 8, cellPadding: 3 },
        margin: { left: 10, right: 10 },
        columnStyles: {
          0: { cellWidth: 8 },
          1: { cellWidth: 60 },
          2: { cellWidth: 15 },
          3: { cellWidth: 'auto' },
          4: { cellWidth: 20 }
        }
      });
    });

    doc.save(filename);
  };

  const exportFullAnswersToPDF = () => {
    const completedResults = results.filter(r => r.status === 'completed' || r.status === 'disqualified');
    if (completedResults.length === 0) {
      addAlert("Belum ada data ujian yang selesai.", 'info');
      return;
    }
    exportAnswersToPDF(completedResults, 'Rekap_Jawaban_Lengkap.pdf');
  };

  const handleDeleteExam = async (examId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus ujian ini? Data nilai siswa juga akan terhapus.")) return;

    // 1. Optimistic Update (Remove Exam)
    const prevExams = [...exams];
    setExams(prev => prev.filter(e => e.id !== examId));

    // 2. Optimistic Update (Remove Results)
    const prevResults = [...results];
    setResults(prev => prev.filter(r => r.examId !== examId));

    if (isSupabaseConfigured && supabase) {
        // Delete Results first (best practice)
        const { error: resError } = await supabase.from('exam_results').delete().eq('exam_id', examId);
        if (resError) console.error("Failed to delete exam results:", resError);

        // Delete Exam
        const { error } = await supabase.from('exams').delete().eq('id', examId);
        if (error) {
            console.error("Failed to delete exam:", error);
            addAlert("Gagal menghapus ujian dari database.", 'error');
            // Rollback
            setExams(prevExams);
            setResults(prevResults);
        } else {
            addAlert("Ujian berhasil dihapus.", 'success');
        }
    } else {
        addAlert("Ujian berhasil dihapus.", 'success');
    }
  };

  const handleDisqualify = async (resultId: string) => {
    if (!confirm("Apakah Anda yakin ingin menonaktifkan ujian siswa ini? Siswa tidak dapat melanjutkan ujian dan status akan menjadi didiskualifikasi.")) return;

    // Optimistic Update
    setResults(prev => prev.map(r => r.id === resultId ? { ...r, status: 'disqualified', score: 0 } : r));

    // DB Update
    if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.from('exam_results').update({
            status: 'disqualified',
            score: 0
        }).eq('id', resultId);
        
        if (error) {
            console.error("Failed to disqualify:", error);
            addAlert("Gagal update status di database.", 'error');
        }
    }
  };

  const handleDeleteResult = async (resultId: string) => {
    if (!confirm("Hapus data nilai ini? Tindakan ini akan menghapus riwayat pengerjaan dan membatalkan status pelanggaran.")) return;

    // Optimistic Update
    setResults(prev => prev.filter(r => r.id !== resultId));

    // DB Update
    if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.from('exam_results').delete().eq('id', resultId);
        
        if (error) {
            console.error("Failed to delete result:", error);
            addAlert("Gagal menghapus data dari database.", 'error');
            fetchData();
        }
    }
  };

  if (view === 'LOGIN') return <LoginView onLogin={handleLogin} />;
  
  if (view === 'EXAM_SESSION' && activeExam) {
    const progress = results.find(r => r.examId === activeExam.id && r.studentId === currentUser?.id && r.status === 'in_progress');
    return <ExamRunner exam={activeExam} userId={currentUser!.id} userName={currentUser!.name} existingProgress={progress} onAutosave={handleAutosave} onFinish={handleExamFinish} onExit={() => setView('STUDENT_DASHBOARD')} />;
  }

  if (view === 'RESULT' && lastResult) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 text-left">
      <div className="bg-white p-8 md:p-12 rounded-[40px] shadow-2xl max-w-2xl w-full border border-gray-100 text-center">
        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle className="w-10 h-10 text-indigo-600" /></div>
        <h2 className="text-3xl font-black text-gray-900 mb-2">Ujian Berhasil Dikirim</h2>
        <p className="text-gray-400 font-medium mb-10">Ringkasan performa pengerjaan Anda</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="bg-indigo-600 rounded-[30px] p-8 text-white">
            <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-80">Skor Akhir</p>
            <h3 className="text-7xl font-black tracking-tighter">{lastResult.score}</h3>
          </div>
          <div className="bg-gray-50 rounded-[30px] p-8 border border-gray-100 flex flex-col justify-center gap-4">
             <div className="flex justify-between items-center"><div className="flex items-center gap-2 text-green-600 font-bold"><CheckCircle className="w-4 h-4" /> Benar</div><span className="font-black text-xl">{lastResult.correctCount}</span></div>
             <div className="flex justify-between items-center"><div className="flex items-center gap-2 text-red-500 font-bold"><XCircle className="w-4 h-4" /> Salah</div><span className="font-black text-xl">{lastResult.incorrectCount}</span></div>
             <div className="flex justify-between items-center"><div className="flex items-center gap-2 text-gray-400 font-bold"><HelpCircle className="w-4 h-4" /> Kosong</div><span className="font-black text-xl">{lastResult.unansweredCount}</span></div>
          </div>
        </div>
        
        <button onClick={() => setView('STUDENT_DASHBOARD')} className="w-full bg-gray-900 text-white font-bold py-5 rounded-3xl shadow-xl hover:bg-black transition-all">Kembali ke Beranda</button>
      </div>
    </div>
  );

  // Token Modal Component
  const TokenModal = () => (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in" onClick={() => { setShowTokenModal(false); setTokenExam(null); }}>
      <div className="bg-white w-full max-w-md rounded-[30px] shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-8 border-b border-gray-100 bg-gradient-to-br from-indigo-600 to-indigo-700 text-white">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Key className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-black text-center tracking-tight">Token Diperlukan</h3>
          <p className="text-indigo-100 text-center mt-2 text-sm">Ujian ini memerlukan token untuk memulai</p>
        </div>
        <div className="p-8">
          {tokenError && (
            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2 mb-4">
              <AlertCircle className="w-4 h-4" />
              {tokenError}
            </div>
          )}
          <div className="mb-6">
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Masukkan Token</label>
            <input
              type="text"
              value={inputToken}
              onChange={(e) => { setInputToken(e.target.value.toUpperCase()); setTokenError(null); }}
              placeholder="XXXXXX"
              maxLength={6}
              className="w-full px-6 py-4 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition font-bold text-center text-2xl tracking-[0.5em] text-gray-900 uppercase"
              autoFocus
            />
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => { setShowTokenModal(false); setTokenExam(null); }} 
              className="flex-1 py-4 text-gray-400 font-black hover:text-gray-600 transition"
            >
              Batal
            </button>
            <button 
              onClick={verifyTokenAndStartExam}
              disabled={inputToken.length < 4}
              className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Verifikasi
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Offline Indicator Component
  const OfflineIndicator = () => isOffline ? (
    <div className="fixed top-0 left-0 right-0 bg-red-600 text-white py-3 px-6 z-[200] flex items-center justify-center gap-3 font-bold text-sm">
      <WifiOff className="w-5 h-5" />
      Mode Offline - Data akan disimpan secara lokal
      <button onClick={() => { setIsOffline(false); fetchData(); }} className="ml-4 bg-white text-red-600 px-3 py-1 rounded-lg text-xs font-black">
        Coba Koneksi Ulang
      </button>
    </div>
  ) : null;

  // Session Timeout Warning Modal
  const SessionTimeoutWarning = () => showTimeoutWarning ? (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[500] flex items-center justify-center p-6 animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-[30px] shadow-2xl overflow-hidden animate-in zoom-in-95">
        <div className="p-8 border-b border-gray-100 bg-gradient-to-br from-amber-50 to-orange-50">
          <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-orange-600" />
          </div>
          <h3 className="text-2xl font-black text-center text-gray-900 tracking-tight">Sesi Akan Berakhir</h3>
          <p className="text-gray-500 text-center mt-2 text-sm">Anda tidak aktif selama beberapa saat.</p>
        </div>
        <div className="p-8">
          <div className="bg-orange-50 border border-orange-100 rounded-2xl p-6 mb-6 text-center">
            <p className="text-xs font-black text-orange-600 uppercase tracking-widest mb-2">Waktu tersisa</p>
            <p className="text-5xl font-black text-orange-600 tracking-tighter">{timeoutWarningSeconds}</p>
            <p className="text-xs text-orange-500 mt-2">detik</p>
          </div>
          <p className="text-sm text-gray-600 text-center mb-6 font-medium">
            Sistem akan logout otomatis jika tidak ada aktivitas. Klik tombol di bawah untuk melanjutkan sesi.
          </p>
          <button
            onClick={() => {
              setShowTimeoutWarning(false);
              setTimeoutWarningSeconds(0);
            }}
            className="w-full bg-orange-600 text-white py-4 rounded-2xl font-black hover:bg-orange-700 transition-all shadow-lg shadow-orange-100"
          >
            Lanjutkan Sesi
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className="flex bg-[#fcfdfe] min-h-screen font-sans relative">
      <OfflineIndicator />

      {/* Session Timeout Warning */}
      {<SessionTimeoutWarning />}

      {/* Token Modal */}
      {showTokenModal && <TokenModal />}

      <Sidebar user={currentUser!} activeView={view} isOpen={isSidebarOpen} onNavigate={setView} onLogout={() => setView('LOGIN')} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex-1 flex flex-col h-screen overflow-hidden text-left">
        <header className="md:hidden bg-white border-b border-gray-100 p-4 flex items-center justify-between"><button onClick={() => setIsSidebarOpen(true)} className="p-2 text-indigo-600 bg-indigo-50 rounded-xl"><Menu /></button><div className="flex items-center gap-2"><GraduationCap className="text-indigo-600" /><span className="font-black">Examo</span></div><div className="w-10" /></header>
        <main className="flex-1 p-6 md:p-10 overflow-y-auto">
          {currentUser?.role === 'teacher' ? (
            view === 'TEACHER_GRADES' ? (
              <div className="max-w-6xl mx-auto animate-in fade-in">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                  <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Buku Nilai Siswa</h1>
                    <p className="text-gray-400">Kelola dan ekspor hasil ujian kelas.</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={exportGradesToCSV} className="bg-white border-2 border-green-600 text-green-600 px-6 py-3 rounded-2xl font-black hover:bg-green-50 transition-all flex items-center gap-2"><FileSpreadsheet className="w-5 h-5" /> CSV</button>
                    <button onClick={exportGradesToPDF} className="bg-white border-2 border-indigo-600 text-indigo-600 px-6 py-3 rounded-2xl font-black hover:bg-indigo-50 transition-all flex items-center gap-2"><FileDown className="w-5 h-5" /> PDF</button>
                    <button onClick={exportFullAnswersToPDF} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-100"><FileText className="w-5 h-5" /> Cetak Jawaban</button>
                  </div>
                </div>

                <div className="bg-white p-2 rounded-[25px] border border-gray-100 shadow-sm inline-flex mb-8">
                    <button
                        onClick={() => setGradeViewMode('summary')}
                        className={`px-6 py-3 rounded-[18px] font-bold text-sm transition-all ${gradeViewMode === 'summary' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        Rekap Nilai
                    </button>
                    <button
                        onClick={() => setGradeViewMode('history')}
                        className={`px-6 py-3 rounded-[18px] font-bold text-sm transition-all ${gradeViewMode === 'history' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        Riwayat Pengerjaan
                    </button>
                </div>

                <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-x-auto">
                  {gradeViewMode === 'history' ? (
                      <table className="w-full min-w-[800px]">
                        <thead className="bg-gray-50/50 border-b text-left">
                          <tr>
                            <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Siswa</th>
                            <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Ujian</th>
                            <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Statistik (B/S/K)</th>
                            <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Nilai Akhir</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {results.length === 0 ? <tr><td colSpan={4} className="py-20 text-center text-gray-400 font-medium italic">Belum ada data pengerjaan.</td></tr> : results.map(r => (
                            <tr key={r.id} className={`hover:bg-gray-50 transition-colors ${r.status === 'disqualified' ? 'bg-red-50/30' : ''} ${r.violation_alert ? 'animate-pulse bg-red-100' : ''}`}>
                              <td className="px-10 py-8 font-bold text-gray-900">
                                {r.studentName}
                                <p className="text-[10px] font-black text-gray-300 uppercase mt-1">{formatDate(r.startedAt)}</p>
                                {r.status === 'disqualified' && <span className="inline-block mt-2 px-2 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded">DISKUALIFIKASI</span>}
                                {r.violation_alert && <div className="mt-2 text-[10px] font-black text-red-600 animate-bounce">🚨 TERJADI PELANGGARAN 🚨</div>}
                              </td>
                              <td className="px-10 py-8 text-gray-500 font-medium">{exams.find(e => e.id === r.examId)?.title}</td>
                              <td className="px-10 py-8">
                                <div className="flex items-center justify-center gap-2">
                                  <span className="bg-green-50 text-green-600 px-2 py-1 rounded-lg text-[10px] font-black border border-green-100">{r.correctCount}B</span>
                                  <span className="bg-red-50 text-red-500 px-2 py-1 rounded-lg text-[10px] font-black border border-red-100">{r.incorrectCount}S</span>
                                  <span className="bg-gray-50 text-gray-400 px-2 py-1 rounded-lg text-[10px] font-black border border-gray-100">{r.unansweredCount}K</span>
                                </div>
                              </td>
                              <td className="px-10 py-8 text-right">
                                <div className="flex items-center justify-end gap-4">
                                  <div className="text-right">
                                    <span className={`font-black text-3xl tracking-tighter block ${r.status === 'completed' && r.score < 75 ? 'text-red-500' : r.status === 'disqualified' ? 'text-gray-400 line-through' : 'text-indigo-600'}`}>
                                      {r.status === 'completed' || r.status === 'disqualified' ? r.score : '-'}
                                    </span>
                                    {r.logs.filter(l => l.event === 'tab_blur').length > 0 && (
                                        <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded-md mt-1 inline-block">
                                            {r.logs.filter(l => l.event === 'tab_blur').length}x Pelanggaran
                                        </span>
                                    )}
                                  </div>
                                  
                                  {r.status !== 'disqualified' && (
                                    <button onClick={() => handleDisqualify(r.id)} className="p-3 bg-red-50 text-red-400 hover:text-white hover:bg-red-500 rounded-xl transition-all" title="Nonaktifkan / Diskualifikasi">
                                        <CloseIcon className="w-5 h-5" />
                                    </button>
                                  )}
                                  
                                  <button 
                                    onClick={() => handleDeleteResult(r.id)} 
                                    className="p-3 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-xl transition-all" 
                                    title="Hapus Nilai / Reset Pelanggaran"
                                  >
                                    <Trash2 className="w-5 h-5" />
                                  </button>
                                  
                                  <button onClick={() => exportAnswersToPDF([r], `Hasil_${r.studentName.replace(/\s+/g, '_')}.pdf`)} className="p-3 bg-gray-50 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" title="Cetak Hasil Siswa Ini">
                                    <FileDown className="w-5 h-5" />
                                  </button>
                                  <button onClick={() => setSelectedResult(r)} className="p-3 bg-gray-50 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" title="Lihat Log Aktivitas">
                                    <FileText className="w-5 h-5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                  ) : (
                    <div>
                      <div className="flex justify-end p-4 border-b border-gray-50 gap-2">
                         <button 
                           onClick={() => setDailyScoreColumns(prev => [...prev, `Capaian ${prev.length + 1}`])}
                           className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-2 rounded-lg hover:bg-indigo-100 transition-all flex items-center gap-1"
                         >
                           <Plus className="w-3 h-3" /> Tambah Kolom Nilai
                         </button>
                         {dailyScoreColumns.length > 1 && (
                           <button 
                             onClick={() => {
                               setDailyScoreColumns(prev => prev.slice(0, -1));
                               // Cleanup deleted column data could be here but optional for ephemeral state
                             }}
                             className="text-xs font-bold text-red-600 bg-red-50 px-3 py-2 rounded-lg hover:bg-red-100 transition-all"
                           >
                             Hapus Kolom
                           </button>
                         )}
                      </div>
                      <div className="overflow-x-auto">
                      <table className="w-full min-w-[800px]">
                        <thead className="bg-gray-50/50 border-b text-left">
                          <tr>
                            <th className="px-6 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest sticky left-0 bg-gray-50 z-10">Siswa</th>
                            <th className="px-4 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center border-l border-gray-100">Rata-rata Ujian</th>
                            {dailyScoreColumns.map((col, idx) => (
                              <th key={idx} className="px-4 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center border-l border-gray-100">
                                {col}
                              </th>
                            ))}
                            <th className="px-4 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center border-l border-gray-100">Rata-rata Harian</th>
                            <th className="px-6 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right border-l border-gray-100 bg-indigo-50/30">Nilai Akhir (50:50)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {students.length === 0 ? <tr><td colSpan={4 + dailyScoreColumns.length} className="py-20 text-center text-gray-400 font-medium italic">Belum ada siswa.</td></tr> : students.map(s => {
                              const studentResults = results.filter(r => r.studentId === s.id && r.status === 'completed');
                              const avgExam = studentResults.length > 0 ? Math.round(studentResults.reduce((a, b) => a + b.score, 0) / studentResults.length) : 0;
                              
                              const studentDailyScores = dailyScores[s.id] || {};
                              let dailyTotal = 0;
                              let dailyCount = 0;
                              
                              dailyScoreColumns.forEach((_, idx) => {
                                const val = studentDailyScores[idx];
                                if (val !== undefined && !isNaN(val)) {
                                  dailyTotal += val;
                                  dailyCount++;
                                }
                              });
                              
                              const avgDaily = dailyCount > 0 ? Math.round(dailyTotal / dailyCount) : 0;
                              const finalScore = Math.round((avgExam + avgDaily) / 2);

                              return (
                                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                                  <td className="px-6 py-6 sticky left-0 bg-white group-hover:bg-gray-50 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                                      <p className="font-bold text-gray-900">{s.name}</p>
                                      <p className="text-xs text-gray-400 mt-1">{s.grade || '-'} • {s.nis || s.email}</p>
                                  </td>
                                  <td className="px-4 py-6 text-center border-l border-gray-50">
                                      <span className={`font-black text-lg ${avgExam < 75 ? 'text-amber-500' : 'text-gray-900'}`}>{avgExam}</span>
                                      <p className="text-[10px] text-gray-400 mt-1">{studentResults.length} Ujian</p>
                                  </td>
                                  {dailyScoreColumns.map((_, idx) => (
                                    <td key={idx} className="px-4 py-6 text-center border-l border-gray-50">
                                        <div className="flex items-center justify-center">
                                            <input
                                                type="number"
                                                min="0" max="100"
                                                value={dailyScores[s.id]?.[idx] ?? ''}
                                                onChange={(e) => {
                                                    const val = e.target.value === '' ? undefined : parseInt(e.target.value);
                                                    setDailyScores(prev => ({
                                                      ...prev,
                                                      [s.id]: {
                                                        ...(prev[s.id] || {}),
                                                        [idx]: val as number
                                                      }
                                                    }));
                                                }}
                                                placeholder="0"
                                                className="w-16 px-2 py-2 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-bold text-center outline-none text-sm"
                                            />
                                        </div>
                                    </td>
                                  ))}
                                  <td className="px-4 py-6 text-center border-l border-gray-50">
                                     <span className="font-bold text-gray-600">{avgDaily}</span>
                                  </td>
                                  <td className="px-6 py-6 text-right border-l border-gray-50 bg-indigo-50/10">
                                      <span className={`font-black text-2xl tracking-tighter ${finalScore < 75 ? 'text-red-500' : 'text-indigo-600'}`}>
                                          {finalScore}
                                      </span>
                                  </td>
                                </tr>
                              );
                          })}
                        </tbody>
                      </table>
                      </div>
                    </div>
                  )}
                </div>
                
                {selectedResult && (
                  <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in" onClick={() => setSelectedResult(null)}>
                    <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
                      <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                        <div>
                          <h3 className="text-2xl font-black text-gray-900 tracking-tight">Log Aktivitas Siswa</h3>
                          <p className="text-gray-500 font-bold mt-1 text-sm">{selectedResult.studentName} • {exams.find(e => e.id === selectedResult.examId)?.title}</p>
                        </div>
                        <button onClick={() => setSelectedResult(null)} className="p-3 bg-white rounded-full text-gray-400 hover:text-gray-900 shadow-sm transition-all hover:rotate-90"><CloseIcon /></button>
                      </div>
                      <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-white">
                        {selectedResult.logs.length === 0 ? (
                          <div className="text-center py-10 text-gray-400 font-medium italic">Tidak ada aktivitas tercatat.</div>
                        ) : (
                          selectedResult.logs.map((log, idx) => (
                            <div key={idx} className="flex gap-6 items-start group">
                              <div className="w-24 text-xs font-black text-gray-400 pt-1 uppercase tracking-widest shrink-0 text-right">
                                {new Date(log.timestamp).toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </div>
                              <div className="flex-1 pb-6 border-b border-gray-50 last:border-0 relative">
                                <div className={`absolute -left-[31px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white ring-1 ${log.event === 'tab_blur' ? 'bg-red-500 ring-red-100' : log.event === 'submit' ? 'bg-green-500 ring-green-100' : 'bg-indigo-500 ring-indigo-100'}`}></div>
                                <div className={`font-bold text-sm mb-1 ${log.event === 'tab_blur' ? 'text-red-500' : log.event === 'submit' ? 'text-green-600' : 'text-gray-900'}`}>
                                  {log.event === 'start' && 'Mulai Ujian'}
                                  {log.event === 'tab_blur' && 'Meninggalkan Halaman Ujian (Tab Blur)'}
                                  {log.event === 'tab_focus' && 'Kembali ke Halaman Ujian'}
                                  {log.event === 'autosave' && 'Jawaban Disimpan'}
                                  {log.event === 'submit' && 'Mengirim Ujian'}
                                </div>
                                {log.detail && <p className="text-xs text-gray-500 font-medium bg-gray-50 p-3 rounded-xl inline-block">{log.detail}</p>}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : view === 'TEACHER_BANK' ? (
              <QuestionBank questions={bankQuestions} onUpdate={setBankQuestions} />
            ) : view === 'TEACHER_STUDENTS' ? (
              <StudentManager
                  students={students}
                  onUpdate={handleStudentUpdate}
                  onAddStudent={handleAddStudent}
                  onDeleteStudent={handleDeleteStudent}
                  onEditStudent={handleEditStudent}
              />
            ) : view === 'MATERIAL_MANAGER' ? (
              <MaterialManager />
            ) : view === 'AI_GENERATOR' ? (
              <AIGenerator 
                onExamCreated={handleExamCreate}
                onCancel={() => setView('TEACHER_DASHBOARD')}
              />
            ) : view === 'EXAM_EDITOR' && editingExam ? (
              <ExamEditor 
                exam={editingExam} 
                onSave={handleExamSave}
                onCancel={() => setView('TEACHER_DASHBOARD')}
                onSaveToBank={(q) => setBankQuestions(prev => [q, ...prev])}
                onPreview={(exam) => {
                  setActiveExam(exam);
                  setView('EXAM_PREVIEW' as AppView);
                }}
                bankQuestions={bankQuestions}
              />
            ) : view === ('EXAM_PREVIEW' as AppView) && activeExam ? (
              <ExamRunner 
                exam={activeExam} 
                userId={currentUser!.id} 
                userName={currentUser!.name} 
                onAutosave={() => {}} 
                onFinish={() => {}} 
                onExit={() => {
                  // Restore the edited exam when exiting preview
                  setEditingExam(activeExam);
                  setView('EXAM_EDITOR');
                }}
                isPreview={true}
              />
            ) : (
              <div className="max-w-6xl mx-auto animate-in fade-in pb-20">
                <h1 className="text-3xl font-black text-gray-900 mb-8">Dashboard Guru</h1>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                  <StatCard label="Ujian Aktif" value={exams.length} icon={Book} color="blue" />
                  <StatCard label="Bank Soal" value={bankQuestions.length} icon={Database} color="green" />
                  <StatCard label="Total Siswa" value={students.length} icon={Users} color="indigo" />
                  <StatCard label="Hasil Masuk" value={results.filter(r => r.status === 'completed').length} icon={CheckCircle} color="blue" />
                </div>

                <div className="flex flex-col md:flex-row justify-between items-end mb-6 gap-4">
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Ujian Terkini</h2>

                    <div className="relative">
                        <button
                            onClick={() => setShowCreateMenu(!showCreateMenu)}
                            className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2 active:scale-95"
                        >
                            <Plus className="w-5 h-5" /> Buat Ujian Baru <ChevronDown className={`w-4 h-4 transition-transform ${showCreateMenu ? 'rotate-180' : ''}`} />
                        </button>

                        {showCreateMenu && (
                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-20 animate-in fade-in slide-in-from-top-2">
                                <button
                                    onClick={handleCreateManual}
                                    className="w-full text-left px-5 py-4 hover:bg-gray-50 flex items-center gap-3 font-bold text-gray-700 transition-colors border-b border-gray-50"
                                >
                                    <PenTool className="w-4 h-4 text-indigo-500" />
                                    Buat Manual
                                </button>
                                <button
                                    onClick={() => { setView('AI_GENERATOR'); setShowCreateMenu(false); }}
                                    className="w-full text-left px-5 py-4 hover:bg-indigo-50 flex items-center gap-3 font-bold text-indigo-700 transition-colors"
                                >
                                    <Sparkles className="w-4 h-4 text-indigo-600" />
                                    Generate dengan AI
                                </button>
                            </div>
                        )}
                        {showCreateMenu && <div className="fixed inset-0 z-10" onClick={() => setShowCreateMenu(false)}></div>}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-5">
                  {exams.length === 0 ? (
                      <div className="col-span-full text-center py-16 bg-gray-50 rounded-[40px] border border-dashed border-gray-200">
                          <p className="text-gray-400 font-medium">Belum ada ujian yang dibuat.</p>
                      </div>
                  ) : (
                      exams.map(e => (
                        <div key={e.id} className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex items-center justify-between group">
                          <div>
                            <h3 className="font-bold text-gray-900 text-lg md:text-xl">{e.title}</h3>
                            <div className="flex gap-4 mt-2 text-[10px] font-black text-gray-400 uppercase tracking-widest"><span>{e.category}</span><span>{e.questions.length} Soal</span></div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleDeleteExam(e.id)} className="p-5 bg-gray-50 text-gray-400 rounded-3xl hover:bg-red-600 hover:text-white transition-all" title="Hapus Ujian"><Trash2 /></button>
                            <button onClick={() => { setEditingExam(e); setView('EXAM_EDITOR'); }} className="p-5 bg-gray-50 text-gray-400 rounded-3xl hover:bg-indigo-600 hover:text-white transition-all" title="Edit Ujian"><FileText /></button>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            )
          ) : (
            view === 'STUDENT_MATERIALS' ? (
              <div className="max-w-6xl mx-auto animate-in fade-in">
                <div className="flex justify-between items-center mb-8">
                  <h1 className="text-3xl font-black text-gray-900">Materi Pembelajaran</h1>
                  <button 
                    onClick={async () => {
                      try {
                        const data = await MaterialService.getAllMaterials();
                        setStudentMaterials(data);
                      } catch (err) { console.error(err); }
                    }} 
                    className="p-3 bg-gray-50 text-gray-400 hover:text-indigo-600 rounded-2xl transition-all"
                    title="Segarkan"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                </div>
                <StudentMaterialList 
                  materials={studentMaterials}
                  onPreview={setPreviewMaterial}
                />
                
                {previewMaterial && (
                  <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in" onClick={() => setPreviewMaterial(null)}>
                    <div className="bg-white w-full max-w-5xl h-[85vh] rounded-[30px] shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                        <h3 className="font-bold text-gray-900 truncate max-w-md">{previewMaterial.title}</h3>
                        <div className="flex gap-2">
                           <a 
                             href={previewMaterial.fileUrl} 
                             download={previewMaterial.fileName}
                             className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition"
                             title="Download"
                           >
                             <Download className="w-5 h-5" />
                           </a>
                           <button onClick={() => setPreviewMaterial(null)} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl transition"><CloseIcon /></button>
                        </div>
                      </div>
                      <div className="flex-1 bg-gray-100 overflow-hidden relative">
                         {previewMaterial.mimeType?.includes('pdf') ? (
                           <iframe src={`${previewMaterial.fileUrl}#toolbar=0`} className="w-full h-full" title="PDF Preview" />
                         ) : previewMaterial.mimeType?.includes('image') ? (
                           <div className="w-full h-full flex items-center justify-center p-4">
                             <img src={previewMaterial.fileUrl} alt={previewMaterial.title} className="max-w-full max-h-full object-contain rounded-lg shadow-lg" />
                           </div>
                         ) : (
                           <div className="flex flex-col items-center justify-center h-full text-gray-400">
                             <FileText className="w-20 h-20 mb-4 opacity-20" />
                             <p className="font-medium">Preview tidak tersedia untuk tipe file ini.</p>
                             <a href={previewMaterial.fileUrl} download={previewMaterial.fileName} className="mt-4 text-indigo-600 font-bold hover:underline">Download File</a>
                           </div>
                         )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : view === 'STUDENT_HISTORY' ? (
              <div className="max-w-5xl mx-auto animate-in fade-in">
                <h1 className="text-3xl font-black text-gray-900 mb-8">Riwayat Ujian Saya</h1>
                
                {/* Sorting Controls */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => toggleSort('date')}
                    className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${sortField === 'date' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    Tanggal {sortField === 'date' && (sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />)}
                  </button>
                  <button
                    onClick={() => toggleSort('score')}
                    className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${sortField === 'score' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    Nilai {sortField === 'score' && (sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />)}
                  </button>
                  <button
                    onClick={() => toggleSort('name')}
                    className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${sortField === 'name' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    Nama Ujian {sortField === 'name' && (sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />)}
                  </button>
                </div>
                
                <div className="bg-white rounded-[20px] shadow-sm border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                      <thead className="bg-gray-100 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider">Ujian</th>
                          <th className="px-6 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider">Tanggal</th>
                          <th className="px-6 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider">Nilai</th>
                          <th className="px-6 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                      {getSortedResults(results.filter(r => r.studentId === currentUser?.id && r.status === 'completed')).map(r => {
                        const exam = exams.find(e => e.id === r.examId);
                        const isPassed = r.score >= 75;
                        return (
                          <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 font-bold text-gray-900">{exam?.title || '-'}</td>
                            <td className="px-6 py-4 text-gray-600 font-medium">{formatDate(r.submittedAt!)}</td>
                            <td className="px-6 py-4 font-bold text-gray-900">{r.score}</td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-md text-xs font-bold border ${isPassed ? 'bg-green-50 text-green-600 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                                {isPassed ? 'Lulus' : 'Tidak Lulus'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right flex justify-end gap-2">
                              <button onClick={() => setSelectedResult(r)} className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg font-bold text-sm hover:bg-gray-50 transition-all shadow-sm">
                                Lihat Detail
                              </button>
                              <button onClick={() => handleStartExam(exam!)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 transition-all shadow-sm flex items-center gap-2">
                                <RotateCcw className="w-3 h-3" /> Ulangi
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {results.filter(r => r.studentId === currentUser?.id && r.status === 'completed').length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-6 py-10 text-center text-gray-400 font-medium italic">Belum ada riwayat ujian.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  </div>
                </div>

                {selectedResult && (
                  <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in" onClick={() => setSelectedResult(null)}>
                    <div className="bg-white w-full max-w-4xl rounded-[30px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                      <div className="p-6 md:p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                        <div>
                          <h3 className="text-2xl font-black text-gray-900 tracking-tight">Detail Hasil Ujian</h3>
                          <p className="text-gray-500 font-bold mt-1 text-sm">{selectedResult.studentName} • {exams.find(e => e.id === selectedResult.examId)?.title}</p>
                        </div>
                        <button onClick={() => setSelectedResult(null)} className="p-2 bg-white rounded-full text-gray-400 hover:text-gray-900 shadow-sm transition-all hover:rotate-90"><CloseIcon /></button>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-gray-50/30">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                          <div className={`p-6 rounded-2xl border-2 ${selectedResult.score >= 75 ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'} text-center`}>
                             <p className="text-xs font-black uppercase tracking-widest mb-1 opacity-70">Skor Akhir</p>
                             <h3 className="text-5xl font-black tracking-tighter">{selectedResult.score}</h3>
                             <p className="text-sm font-bold mt-2">{selectedResult.score >= 75 ? 'LULUS' : 'TIDAK LULUS'}</p>
                          </div>
                          <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm flex flex-col justify-center gap-2">
                             <div className="flex justify-between"><span className="text-gray-500 font-bold text-sm">Benar</span><span className="font-black text-green-600">{selectedResult.correctCount}</span></div>
                             <div className="flex justify-between"><span className="text-gray-500 font-bold text-sm">Salah</span><span className="font-black text-red-500">{selectedResult.incorrectCount}</span></div>
                             <div className="flex justify-between"><span className="text-gray-500 font-bold text-sm">Kosong</span><span className="font-black text-gray-400">{selectedResult.unansweredCount}</span></div>
                          </div>
                          <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm flex flex-col justify-center">
                             <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Waktu Pengerjaan</p>
                             <p className="font-bold text-gray-900">{formatDate(selectedResult.startedAt)}</p>
                             <p className="text-xs text-gray-400 mt-1">Dikirim: {formatDate(selectedResult.submittedAt!)}</p>
                          </div>
                        </div>

                        <h4 className="font-black text-gray-900 text-lg mb-4">Jawaban Anda</h4>
                        <div className="space-y-4">
                          {exams.find(e => e.id === selectedResult.examId)?.questions.map((q, idx) => {
                            const answer = selectedResult.answers[q.id];
                            let isCorrect = false;
                            let answerText = '-';
                            
                            if (q.type === 'mcq') {
                              isCorrect = answer === q.correctAnswerIndex;
                              answerText = q.options && answer !== undefined && answer !== '' ? `${String.fromCharCode(65 + Number(answer))}. ${q.options[Number(answer)]}` : '(Tidak Dijawab)';
                            } else if (q.type === 'multiple_select') {
                              const ans = (answer as number[]) || [];
                              const correctIndices = q.correctAnswerIndices || [];
                              isCorrect = ans.length === correctIndices.length && ans.every(val => correctIndices.includes(val));
                              answerText = q.options && ans.length > 0 ? ans.map(i => `${String.fromCharCode(65 + i)}. ${q.options![i]}`).join(', ') : '(Tidak Dijawab)';
                            } else if (q.type === 'true_false') {
                              isCorrect = answer === q.trueFalseAnswer;
                              answerText = answer === true ? 'BENAR' : answer === false ? 'SALAH' : '(Tidak Dijawab)';
                            } else if (q.type === 'short_answer') {
                              isCorrect = q.shortAnswer && typeof answer === 'string' && answer.trim().toLowerCase() === q.shortAnswer.trim().toLowerCase();
                              answerText = answer || '(Tidak Dijawab)';
                            } else if (q.type === 'essay') {
                              const studentAnswer = (answer || '').trim().toLowerCase();
                              const teacherKey = (q.essayAnswer || '').trim().toLowerCase();
                              isCorrect = teacherKey && (studentAnswer.includes(teacherKey) || teacherKey.includes(studentAnswer));
                              answerText = answer || '(Tidak Dijawab)';
                            }

                            let statusLabel = isCorrect ? 'Benar' : 'Salah';
                            let statusClass = isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
                            let borderClass = isCorrect ? 'border-l-green-500' : 'border-l-red-500';

                            if (q.type === 'essay') {
                                if (isCorrect) {
                                    statusLabel = 'Tepat (+Full)';
                                    statusClass = 'bg-green-100 text-green-700';
                                    borderClass = 'border-l-green-500';
                                } else if (answer) {
                                    statusLabel = 'Kurang Tepat (+1)';
                                    statusClass = 'bg-yellow-100 text-yellow-700';
                                    borderClass = 'border-l-yellow-500';
                                } else {
                                    statusLabel = 'Kosong (0)';
                                    statusClass = 'bg-red-100 text-red-700';
                                    borderClass = 'border-l-red-500';
                                }
                            }

                            return (
                              <div key={q.id} className={`p-5 rounded-2xl border-l-4 bg-white shadow-sm ${borderClass}`}>
                                <div className="flex justify-between items-start mb-2">
                                  <span className="font-black text-gray-400 text-xs uppercase tracking-widest">Soal {idx + 1} • {q.points} Poin</span>
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${statusClass}`}>{statusLabel}</span>
                                </div>
                                <p className="font-bold text-gray-900 mb-3">{q.text}</p>
                                <div className="bg-gray-50 p-3 rounded-xl text-sm font-medium text-gray-700">
                                  <span className="font-bold text-gray-400 mr-2">Jawaban:</span> {answerText}
                                </div>
                                {q.explanation && !isCorrect && (
                                  <div className="mt-3 text-xs text-gray-500 bg-blue-50 p-3 rounded-xl border border-blue-100">
                                    <span className="font-bold text-blue-600 block mb-1">Pembahasan:</span>
                                    {q.explanation}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="max-w-6xl mx-auto animate-in fade-in">
                <div className="flex justify-between items-center mb-8">
                  <h1 className="text-3xl font-black text-gray-900">Dashboard Siswa</h1>
                  <button onClick={fetchData} className="p-3 bg-gray-50 text-gray-400 hover:text-indigo-600 rounded-2xl transition-all" title="Segarkan Data"><RotateCcw className="w-5 h-5" /></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-14">
                   <div className="bg-indigo-600 p-10 rounded-[50px] text-white shadow-2xl relative overflow-hidden">
                     <div className="relative z-10"><p className="text-indigo-100 font-black uppercase tracking-widest text-[10px] mb-2">Ujian Selesai</p><h3 className="text-7xl font-black tracking-tighter">{results.filter(r => r.studentId === currentUser?.id && r.status === 'completed').length}</h3></div>
                     <CheckCircle className="absolute -right-6 -bottom-6 w-52 h-52 text-white/10" />
                   </div>
                   <div className="bg-white p-10 rounded-[50px] border border-gray-100 shadow-sm flex items-center justify-between">
                     <div><p className="text-gray-400 font-black uppercase tracking-widest text-[10px] mb-2">Rata-rata Skor</p><h3 className="text-7xl font-black text-gray-900 tracking-tighter">{results.filter(r => r.studentId === currentUser?.id && r.status === 'completed').length > 0 ? Math.round(results.filter(r => r.studentId === currentUser?.id && r.status === 'completed').reduce((a, b) => a + b.score, 0) / results.filter(r => r.studentId === currentUser?.id && r.status === 'completed').length) : 0}</h3></div>
                     <div className="bg-green-50 p-8 rounded-[35px] border border-green-100"><TrendingUp className="w-12 h-12 text-green-600" /></div>
                   </div>
                </div>
                <h2 className="text-2xl font-black text-gray-900 mb-8 tracking-tight">Ujian Tersedia</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                  {exams.filter(e => e.status === 'published').length === 0 ? (
                    <div className="col-span-full text-center py-20 bg-gray-50 rounded-[40px] border border-dashed border-gray-200">
                      <p className="text-gray-400 font-medium">Belum ada ujian yang tersedia saat ini.</p>
                      <button onClick={fetchData} className="mt-4 text-indigo-600 font-bold hover:underline">Coba Segarkan</button>
                    </div>
                  ) : exams.filter(e => e.status === 'published').map(e => {
                    const progress = results.find(r => r.examId === e.id && r.studentId === currentUser?.id);
                    const isTaken = progress?.status === 'completed';
                    const isInProgress = progress?.status === 'in_progress';
                    
                    const now = new Date().getTime();
                    const start = e.startDate ? new Date(e.startDate).getTime() : 0;
                    const end = e.endDate ? new Date(e.endDate).getTime() : Infinity;
                    
                    const isNotStarted = start > now;
                    const isExpired = end < now;
                    const isActive = !isNotStarted && !isExpired;

                    let btnText = 'Mulai Sekarang';
                    let btnClass = 'bg-indigo-600 text-white shadow-indigo-100';
                    let btnIcon = <PlayCircle className="w-5 h-5" />;
                    let isDisabled = false;

                    if (isNotStarted) {
                        btnText = `Belum Dimulai (${new Date(start).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })})`;
                        btnClass = 'bg-gray-100 text-gray-400 cursor-not-allowed';
                        isDisabled = true;
                        btnIcon = <Clock className="w-5 h-5" />;
                    } else if (isExpired) {
                        btnText = 'Ujian Berakhir';
                        btnClass = 'bg-red-50 text-red-500 cursor-not-allowed border border-red-100';
                        isDisabled = true;
                        btnIcon = <XCircle className="w-5 h-5" />;
                    } else if (isTaken) {
                        btnText = 'Ulangi Ujian';
                        btnClass = 'bg-white border-2 border-indigo-600 text-indigo-600 shadow-none hover:bg-indigo-50';
                        btnIcon = <RotateCcw className="w-5 h-5" />;
                    } else if (isInProgress) {
                        btnText = 'Lanjutkan';
                        btnClass = 'bg-amber-500 text-white';
                        btnIcon = <Clock className="w-5 h-5" />;
                    }

                    return (
                      <div key={e.id} className="bg-white p-10 rounded-[50px] border border-gray-100 shadow-sm hover:shadow-2xl transition-all flex flex-col group">
                        <div className="flex justify-between items-center mb-8">
                            <span className="bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase px-4 py-1.5 rounded-full border border-indigo-100 tracking-widest">{e.category}</span>
                            {isTaken && <CheckCircle className="text-green-500" />}
                            {isInProgress && !isExpired && <Clock className="text-amber-500" />}
                            {isExpired && <span className="text-[10px] font-black uppercase bg-red-100 text-red-600 px-2 py-1 rounded">Expired</span>}
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2 leading-tight group-hover:text-indigo-600 transition-colors">{e.title}</h3>
                        
                        {(e.startDate || e.endDate) && (
                            <div className="mb-4 text-xs text-gray-500 font-medium space-y-1 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                {e.startDate && <div>Mulai: {new Date(e.startDate).toLocaleString('id-ID')}</div>}
                                {e.endDate && <div>Selesai: {new Date(e.endDate).toLocaleString('id-ID')}</div>}
                            </div>
                        )}

                        <div className="mt-auto pt-6 border-t border-gray-50">
                            <button 
                                onClick={() => !isDisabled && handleStartExamWithToken(e)} 
                                disabled={isDisabled}
                                className={`w-full font-black py-4 rounded-[20px] shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95 ${btnClass} ${isDisabled ? 'shadow-none active:scale-100' : ''}`}
                            >
                                {btnText} {btnIcon}
                                {e.requireToken && !isDisabled && <Key className="w-4 h-4 ml-1" />}
                            </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )
          )}
        </main>
      </div>
    </div>
  );
}

const StatCard = ({ label, value, icon: Icon, color }: any) => {
  const colorMap: any = { blue: 'bg-blue-50 text-blue-600 border-blue-100', green: 'bg-green-50 text-green-600 border-green-100', indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100' };
  return (
    <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm flex items-center justify-between hover:shadow-xl transition-all">
      <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{label}</p><p className="text-5xl font-black text-gray-900 tracking-tighter">{value}</p></div>
      <div className={`p-6 rounded-[30px] border-2 shadow-inner ${colorMap[color]}`}><Icon className="w-10 h-10" /></div>
    </div>
  );
};