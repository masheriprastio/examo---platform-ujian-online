
import React, { useState, useEffect } from 'react';
import { User, Exam, AppView, ExamResult, Question, ExamLog } from './types';
import { MOCK_TEACHER, MOCK_STUDENT, MOCK_EXAMS } from './lib/supabase';
import { 
  LogOut, LayoutDashboard, ClipboardList, Sparkles, 
  GraduationCap, Book, Award, Users, Clock, Star,
  TrendingUp, CheckCircle, PlayCircle, FileText, History,
  Mail, Lock, Eye, EyeOff, ArrowRight, AlertTriangle, Database,
  Menu, X as CloseIcon, FileDown, Download, UserPlus, FileSpreadsheet,
  XCircle, HelpCircle, RotateCcw
} from 'lucide-react';

import ExamRunner from './components/ExamRunner';
import AIGenerator from './components/AIGenerator';
import ExamEditor from './components/ExamEditor';
import QuestionBank from './components/QuestionBank';
import StudentManager from './components/StudentManager';

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('id-ID', {
  day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
});

const LoginView: React.FC<{
  onLogin: (role: 'teacher' | 'student', email: string, password?: string) => string | null;
}> = ({ onLogin }) => {
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (role === 'teacher') setEmail(MOCK_TEACHER.email);
    else setEmail(MOCK_STUDENT.email);
    setPassword('password');
    setErrorMsg(null);
  }, [role]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const error = onLogin(role, email, password);
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
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Email / Username</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition font-bold text-gray-900" placeholder="name@sekolah.id" required />
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

          <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl transition shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 group">
            Masuk Sekarang <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
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
  ] : [
    { id: 'STUDENT_DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'STUDENT_HISTORY', label: 'Riwayat Ujian', icon: History },
  ];

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-40 md:hidden" onClick={onClose} />}
      <aside className={`fixed md:sticky top-0 left-0 h-screen bg-white border-r border-gray-100 flex flex-col z-50 transition-transform duration-300 w-72 ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3"><div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-lg shadow-indigo-100"><GraduationCap className="w-6 h-6" /></div><span className="font-black text-2xl text-indigo-900 tracking-tight">Examo</span></div>
          <button onClick={onClose} className="md:hidden p-2 text-gray-400 hover:bg-gray-50 rounded-xl"><CloseIcon /></button>
        </div>
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto py-2">
          {menuItems.map((item) => (
            <button key={item.id} onClick={() => { onNavigate(item.id as AppView); onClose(); }} className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-bold transition-all ${activeView === item.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-gray-400 hover:bg-gray-50'}`}>
              <item.icon className="w-5 h-5" />{item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 mt-auto border-t border-gray-50 shrink-0 bg-white">
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
  const [exams, setExams] = useState<Exam[]>(MOCK_EXAMS);
  const [bankQuestions, setBankQuestions] = useState<Question[]>(MOCK_EXAMS.flatMap(e => e.questions));
  const [students, setStudents] = useState<User[]>([MOCK_STUDENT]);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [lastResult, setLastResult] = useState<ExamResult | null>(null);
  const [selectedResult, setSelectedResult] = useState<ExamResult | null>(null);

  const handleLogin = (role: 'teacher' | 'student', email: string, password?: string): string | null => {
    const pwd = password || 'password';
    if (role === 'teacher') {
      if (email === MOCK_TEACHER.email && pwd === 'password') { setCurrentUser(MOCK_TEACHER); setView('TEACHER_DASHBOARD'); return null; }
      return "Guru tidak ditemukan.";
    } else {
      const found = students.find(s => s.email === email);
      if (found) { setCurrentUser(found); setView('STUDENT_DASHBOARD'); return null; }
      return "Siswa tidak terdaftar.";
    }
  };

  const handleStartExam = (exam: Exam) => {
    const existing = results.find(r => r.examId === exam.id && r.studentId === currentUser?.id && r.status === 'in_progress');
    if (!existing) {
      const newResult: ExamResult = {
        id: `res-${Date.now()}`,
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
      setResults(prev => [newResult, ...prev]);
    }
    setActiveExam(exam);
    setView('EXAM_SESSION');
  };

  const handleAutosave = (answers: Record<string, any>, logs: ExamLog[]) => {
    if (currentUser && activeExam) {
      setResults(prev => prev.map(r => (r.examId === activeExam.id && r.studentId === currentUser.id && r.status === 'in_progress') ? { ...r, answers, logs } : r));
    }
  };

  const handleExamFinish = (
    score: number, 
    obtained: number, 
    total: number, 
    stats: { correct: number, incorrect: number, unanswered: number, total: number },
    answers: Record<string, any>, 
    logs: ExamLog[]
  ) => {
    if (currentUser && activeExam) {
      let finalRes: ExamResult | null = null;
      setResults(prev => prev.map(r => {
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
      }));
      setLastResult(finalRes);
    }
    setView('RESULT');
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
      alert("Tidak ada data untuk diekspor.");
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
      doc.text(`Waktu: ${formatDate(result.submittedAt!)}`, 120, yPos);
      yPos += 6;
      doc.text(`Ujian: ${exam.title}`, 14, yPos);
      doc.text(`Skor: ${result.score}`, 120, yPos);
      
      // KKM Indicator
      if (result.score < 75) {
        doc.setTextColor(220, 38, 38); // Red
        doc.text(`(Di Bawah KKM)`, 140, yPos);
        doc.setTextColor(0, 0, 0); // Reset
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
    const completedResults = results.filter(r => r.status === 'completed');
    if (completedResults.length === 0) {
      alert("Belum ada data ujian yang selesai.");
      return;
    }
    exportAnswersToPDF(completedResults, 'Rekap_Jawaban_Lengkap.pdf');
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

  return (
    <div className="flex bg-[#fcfdfe] min-h-screen font-sans relative">
      <Sidebar user={currentUser!} activeView={view} isOpen={isSidebarOpen} onNavigate={setView} onLogout={() => setView('LOGIN')} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex-1 flex flex-col h-screen overflow-hidden text-left">
        <header className="md:hidden bg-white border-b border-gray-100 p-4 flex items-center justify-between"><button onClick={() => setIsSidebarOpen(true)} className="p-2 text-indigo-600 bg-indigo-50 rounded-xl"><Menu /></button><div className="flex items-center gap-2"><GraduationCap className="text-indigo-600" /><span className="font-black">Examo</span></div><div className="w-10" /></header>
        <main className="flex-1 p-6 md:p-10 overflow-y-auto">
          {currentUser?.role === 'teacher' ? (
            view === 'TEACHER_GRADES' ? (
              <div className="max-w-6xl mx-auto animate-in fade-in">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                  <div><h1 className="text-3xl font-black text-gray-900 tracking-tight">Buku Nilai Siswa</h1><p className="text-gray-400">Kelola dan ekspor hasil ujian kelas.</p></div>
                  <div className="flex gap-2">
                    <button onClick={exportGradesToCSV} className="bg-white border-2 border-green-600 text-green-600 px-6 py-3 rounded-2xl font-black hover:bg-green-50 transition-all flex items-center gap-2"><FileSpreadsheet className="w-5 h-5" /> CSV</button>
                    <button onClick={exportGradesToPDF} className="bg-white border-2 border-indigo-600 text-indigo-600 px-6 py-3 rounded-2xl font-black hover:bg-indigo-50 transition-all flex items-center gap-2"><FileDown className="w-5 h-5" /> PDF</button>
                    <button onClick={exportFullAnswersToPDF} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-100"><FileText className="w-5 h-5" /> Cetak Jawaban</button>
                  </div>
                </div>
                <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-x-auto">
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
                        <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-10 py-8 font-bold text-gray-900">{r.studentName}<p className="text-[10px] font-black text-gray-300 uppercase mt-1">{formatDate(r.startedAt)}</p></td>
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
                              <span className={`font-black text-3xl tracking-tighter ${r.status === 'completed' && r.score < 75 ? 'text-red-500' : 'text-indigo-600'}`}>
                                {r.status === 'completed' ? r.score : '-'}
                              </span>
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
              <StudentManager students={students} onUpdate={setStudents} />
            ) : view === 'AI_GENERATOR' ? (
              <AIGenerator 
                onExamCreated={(newExam) => {
                  setExams([newExam, ...exams]);
                  setView('TEACHER_DASHBOARD');
                }}
                onCancel={() => setView('TEACHER_DASHBOARD')}
              />
            ) : view === 'EXAM_EDITOR' && editingExam ? (
              <ExamEditor 
                exam={editingExam} 
                onSave={(updatedExam) => {
                  setExams(prev => prev.map(e => e.id === updatedExam.id ? updatedExam : e));
                  setView('TEACHER_DASHBOARD');
                }} 
                onCancel={() => setView('TEACHER_DASHBOARD')}
                onSaveToBank={(q) => setBankQuestions(prev => [q, ...prev])}
                onPreview={(exam) => {
                  setActiveExam(exam);
                  setView('EXAM_PREVIEW' as AppView);
                }}
              />
            ) : view === ('EXAM_PREVIEW' as AppView) && activeExam ? (
              <ExamRunner 
                exam={activeExam} 
                userId={currentUser!.id} 
                userName={currentUser!.name} 
                onAutosave={() => {}} 
                onFinish={() => {}} 
                onExit={() => setView('EXAM_EDITOR')}
                isPreview={true}
              />
            ) : (
              <div className="max-w-6xl mx-auto animate-in fade-in">
                <h1 className="text-3xl font-black text-gray-900 mb-8">Dashboard Guru</h1>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                  <StatCard label="Ujian Aktif" value={exams.length} icon={Book} color="blue" />
                  <StatCard label="Bank Soal" value={bankQuestions.length} icon={Database} color="green" />
                  <StatCard label="Total Siswa" value={students.length} icon={Users} color="indigo" />
                  <StatCard label="Hasil Masuk" value={results.filter(r => r.status === 'completed').length} icon={CheckCircle} color="blue" />
                </div>
                <h2 className="text-2xl font-black text-gray-900 mb-6 tracking-tight">Ujian Terkini</h2>
                <div className="grid grid-cols-1 gap-5">
                  {exams.map(e => (
                    <div key={e.id} className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex items-center justify-between group">
                      <div><h3 className="font-bold text-gray-900 text-lg md:text-xl">{e.title}</h3><div className="flex gap-4 mt-2 text-[10px] font-black text-gray-400 uppercase tracking-widest"><span>{e.category}</span><span>{e.questions.length} Soal</span></div></div>
                      <button onClick={() => { setEditingExam(e); setView('EXAM_EDITOR'); }} className="p-5 bg-gray-50 text-gray-400 rounded-3xl hover:bg-indigo-600 hover:text-white transition-all"><FileText /></button>
                    </div>
                  ))}
                </div>
              </div>
            )
          ) : (
            view === 'STUDENT_HISTORY' ? (
              <div className="max-w-5xl mx-auto animate-in fade-in">
                <h1 className="text-3xl font-black text-gray-900 mb-8">Riwayat Ujian Saya</h1>
                
                <div className="bg-white rounded-[20px] shadow-sm border border-gray-200 overflow-hidden">
                  <table className="w-full text-left border-collapse">
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
                      {results.filter(r => r.studentId === currentUser?.id && r.status === 'completed').map(r => {
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
                <h1 className="text-3xl font-black text-gray-900 mb-8">Dashboard Siswa</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-14">
                   <div className="bg-indigo-600 p-10 rounded-[50px] text-white shadow-2xl relative overflow-hidden">
                     <div className="relative z-10"><p className="text-indigo-100 font-black uppercase tracking-widest text-[10px] mb-2">Ujian Selesai</p><h3 className="text-7xl font-black tracking-tighter">{results.filter(r => r.studentId === currentUser?.id && r.status === 'completed').length}</h3></div>
                     <CheckCircle className="absolute -right-6 -bottom-6 w-52 h-52 text-white/10" />
                   </div>
                   <div className="bg-white p-10 rounded-[50px] border border-gray-100 shadow-sm flex items-center justify-between">
                     <div><p className="text-gray-400 font-black uppercase tracking-widest text-[10px] mb-2">Rata-rata Skor</p><h3 className="text-7xl font-black text-gray-900 tracking-tighter">{results.filter(r => r.status === 'completed').length > 0 ? Math.round(results.filter(r => r.status === 'completed').reduce((a, b) => a + b.score, 0) / results.filter(r => r.status === 'completed').length) : 0}</h3></div>
                     <div className="bg-green-50 p-8 rounded-[35px] border border-green-100"><TrendingUp className="w-12 h-12 text-green-600" /></div>
                   </div>
                </div>
                <h2 className="text-2xl font-black text-gray-900 mb-8 tracking-tight">Ujian Tersedia</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                  {exams.map(e => {
                    const progress = results.find(r => r.examId === e.id && r.studentId === currentUser?.id);
                    const isTaken = progress?.status === 'completed';
                    const isInProgress = progress?.status === 'in_progress';
                    return (
                      <div key={e.id} className="bg-white p-10 rounded-[50px] border border-gray-100 shadow-sm hover:shadow-2xl transition-all flex flex-col group">
                        <div className="flex justify-between items-center mb-8"><span className="bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase px-4 py-1.5 rounded-full border border-indigo-100 tracking-widest">{e.category}</span>{isTaken && <CheckCircle className="text-green-500" />}{isInProgress && <Clock className="text-amber-500" />}</div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-4 leading-tight group-hover:text-indigo-600 transition-colors">{e.title}</h3>
                        <div className="mt-auto pt-6 border-t border-gray-50"><button onClick={() => handleStartExam(e)} className={`w-full font-black py-4 rounded-[20px] shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95 ${isTaken ? 'bg-white border-2 border-indigo-600 text-indigo-600 shadow-none hover:bg-indigo-50' : isInProgress ? 'bg-amber-500 text-white' : 'bg-indigo-600 text-white shadow-indigo-100'}`}>{isTaken ? 'Ulangi Ujian' : isInProgress ? 'Lanjutkan' : 'Mulai Sekarang'} {isTaken ? <RotateCcw className="w-5 h-5" /> : <PlayCircle />}</button></div>
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
