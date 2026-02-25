
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Exam, Question, ExamLog } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { 
  Clock, CheckCircle, ChevronLeft, ChevronRight, 
  AlertTriangle, Star, Shuffle, LayoutGrid, 
  Menu, X, Save, ShieldCheck, Sparkles 
} from 'lucide-react';

interface ExamRunnerProps {
  exam: Exam;
  userId: string;
  userName: string;
  existingProgress?: any;
  onAutosave: (answers: Record<string, any>, logs: ExamLog[]) => void;
  onFinish: (
    score: number, 
    pointsObtained: number, 
    totalPointsPossible: number, 
    stats: { correct: number, incorrect: number, unanswered: number, total: number },
    answers: Record<string, any>, 
    logs: ExamLog[]
  ) => void;
  onExit: () => void;
  isPreview?: boolean;
}

const MAX_VIOLATIONS = 3;

const ExamRunner: React.FC<ExamRunnerProps> = ({ 
  exam, 
  userId, 
  userName, 
  existingProgress, 
  onAutosave, 
  onFinish, 
  onExit,
  isPreview = false
}) => {
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>(existingProgress?.answers || {});
  const [logs, setLogs] = useState<ExamLog[]>(existingProgress?.logs || [{ event: 'start', timestamp: new Date().toISOString() }]);
  const [timeLeft, setTimeLeft] = useState(exam.durationMinutes * 60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmFinish, setShowConfirmFinish] = useState(false);
  const [showNav, setShowNav] = useState(false);
  const [violationCount, setViolationCount] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [violationAlert, setViolationAlert] = useState(false);

  const timerRef = useRef<any>(null);
  const answersRef = useRef<Record<string, any>>(answers);
  const logsRef = useRef<ExamLog[]>(logs);
  const violationCountRef = useRef<number>(0);
  const [browserNotificationRequested, setBrowserNotificationRequested] = useState(false);

  // Proper Fisher-Yates shuffle algorithm
  const fisherYatesShuffle = <T,>(array: T[]): T[] => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // Generate session-specific shuffle seed key
  const getShuffleCacheKey = (): string => {
    return `examo_shuffle_${exam.id}_${userId}`;
  };

  // Load or generate shuffled questions
  const loadOrGenerateShuffledQuestions = (): Question[] => {
    const cacheKey = getShuffleCacheKey();
    
    // If NOT in preview mode, try to load from cache or existing progress
    if (!isPreview) {
      // If existing progress exists, use the questions from there (preserves order)
      if (existingProgress?.questions) {
        return existingProgress.questions;
      }

      // Try to load from session storage (persists across page refreshes during same session)
      const cachedData = sessionStorage.getItem(cacheKey);
      if (cachedData) {
        try {
          return JSON.parse(cachedData);
        } catch (err) {
          console.warn('Failed to parse cached shuffle data:', err);
        }
      }
    }

    // Generate new shuffle
    let questionsToRun = [...exam.questions];
    
    if (exam.randomizeQuestions) {
      questionsToRun = fisherYatesShuffle(questionsToRun);
    }

    // Randomize options for MCQ and Multiple Select if enabled (HANYA SEKALI)
    questionsToRun = questionsToRun.map(q => {
      if ((q.type === 'mcq' || q.type === 'multiple_select') && q.randomizeOptions && q.options) {
        const optionsWithIndex = q.options.map((opt, idx) => ({ opt, idx }));
        const shuffledOptions = fisherYatesShuffle(optionsWithIndex);
        
        // Find the new index of the correct answer(s)
        const newCorrectIndex = q.type === 'mcq' ? shuffledOptions.findIndex(o => o.idx === q.correctAnswerIndex) : undefined;
        
        let newCorrectIndices: number[] | undefined;
        if (q.type === 'multiple_select' && q.correctAnswerIndices) {
          newCorrectIndices = q.correctAnswerIndices.map(oldIdx => shuffledOptions.findIndex(o => o.idx === oldIdx));
        }
        
        return {
          ...q,
          options: shuffledOptions.map(o => o.opt),
          correctAnswerIndex: newCorrectIndex,
          correctAnswerIndices: newCorrectIndices,
          _originalOptionsMapping: shuffledOptions.map(o => o.idx) // Store mapping if needed
        };
      }
      return q;
    });

    // Save to session storage untuk session berikutnya (jika user refresh)
    // BUT ONLY IF NOT IN PREVIEW MODE
    if (!isPreview) {
      sessionStorage.setItem(cacheKey, JSON.stringify(questionsToRun));
    }
    
    return questionsToRun;
  };

  useEffect(() => {
    const questionsToRun = loadOrGenerateShuffledQuestions();
    setShuffledQuestions(questionsToRun);
    
    if (existingProgress?.startedAt) {
      const started = new Date(existingProgress.startedAt).getTime();
      const now = new Date().getTime();
      const elapsed = Math.floor((now - started) / 1000);
      const remaining = (exam.durationMinutes * 60) - elapsed;
      setTimeLeft(remaining > 0 ? remaining : 0);
    }
    setIsReady(true); // Remove 1-second artificial delay
  }, [exam.id, userId]);

  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { logsRef.current = logs; }, [logs]);

  const addLog = useCallback((event: ExamLog['event'], detail?: string) => {
    if (isPreview) return; // Don't log in preview mode
    const newLog: ExamLog = { event, timestamp: new Date().toISOString(), detail };
    setLogs(prev => [...prev, newLog]);
  }, [isPreview]);

  const calculateFinalStats = useCallback(() => {
    let obtained = 0;
    let totalPossible = 0;
    let correct = 0;
    let incorrect = 0;
    let unanswered = 0;

    exam.questions.forEach(q => {
      totalPossible += q.points;
      const ans = answersRef.current[q.id];
      
      if (ans === undefined || ans === '') {
        unanswered++;
      } else {
        if (q.type === 'mcq') {
          if (ans === q.correctAnswerIndex) {
            obtained += q.points;
            correct++;
          } else {
            incorrect++;
          }
        } else if (q.type === 'multiple_select') {
          const ans = (answersRef.current[q.id] as number[]) || [];
          const correctIndices = q.correctAnswerIndices || [];
          // Check if arrays are equal (ignoring order)
          const isCorrect = ans.length === correctIndices.length && ans.every(val => correctIndices.includes(val));
          if (isCorrect) {
            obtained += q.points;
            correct++;
          } else {
            incorrect++;
          }
        } else if (q.type === 'true_false') {
          if (ans === q.trueFalseAnswer) {
            obtained += q.points;
            correct++;
          } else {
            incorrect++;
          }
        } else if (q.type === 'short_answer') {
          if (typeof ans === 'string' && q.shortAnswer && ans.trim().toLowerCase() === q.shortAnswer.trim().toLowerCase()) {
            obtained += q.points;
            correct++;
          } else {
            incorrect++;
          }
        } else if (q.type === 'essay') {
          // Esai: 
          // - Jika kosong: 0 poin
          // - Jika isi sesuai kunci (keyword match): Poin Penuh
          // - Jika isi tidak kosong tapi tidak sesuai: 1 poin (partisipasi)
          if (typeof ans === 'string' && ans.trim().length > 0) {
            const studentAnswer = ans.trim().toLowerCase();
            const teacherKey = (q.essayAnswer || '').trim().toLowerCase();
            
            // Cek apakah jawaban siswa mengandung kunci jawaban guru (atau sebaliknya jika kunci pendek)
            // Ini adalah heuristik sederhana.
            const isAccurate = teacherKey && (studentAnswer.includes(teacherKey) || teacherKey.includes(studentAnswer));
            
            if (isAccurate) {
              obtained += (q.points || 0);
              correct++;
            } else {
              obtained += 1; // Poin partisipasi
              // Tidak dihitung sebagai 'correct' (benar sempurna) untuk statistik, tapi dapat nilai.
              // Kita anggap 'incorrect' untuk statistik benar/salah, tapi skor bertambah.
              incorrect++; 
            }
          } else {
            incorrect++;
          }
        }
      }
    });

    const score = totalPossible > 0 ? Math.round((obtained / totalPossible) * 100) : 0;
    return { 
      score, 
      obtained, 
      totalPossible, 
      stats: { correct, incorrect, unanswered, total: exam.questions.length } 
    };
  }, [exam.questions]);

  const handleSubmit = useCallback((forced: boolean = false) => {
    if (isPreview) {
      onExit();
      return;
    }

    if (timerRef.current) clearInterval(timerRef.current);
    setIsSubmitting(true);
    addLog('submit', forced ? 'Auto-submitted' : 'Manual submit');
    
    setTimeout(() => {
      const result = calculateFinalStats();
      onFinish(
        result.score, 
        result.obtained, 
        result.totalPossible, 
        result.stats,
        answersRef.current, 
        logsRef.current
      );
    }, 1500);
  }, [calculateFinalStats, onFinish, addLog, isPreview, onExit]);

  useEffect(() => {
    if (isReady && !isSubmitting) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSubmit(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      const autosaveInterval = setInterval(() => {
        if (!isPreview) {
          onAutosave(answersRef.current, logsRef.current);
          addLog('autosave');
        }
      }, 15000);

      return () => {
        clearInterval(timerRef.current);
        clearInterval(autosaveInterval);
      };
    }
  }, [isReady, isSubmitting, handleSubmit, onAutosave, addLog, isPreview]);

  // Function to send violation alert to Supabase in real-time
  const sendViolationAlert = useCallback(async (violationNum: number, isDisqualified: boolean) => {
    if (!isSupabaseConfigured || !supabase || isPreview) return;
    
    try {
      // Find the current exam result for this student
      const { data: existingResults, error: fetchError } = await supabase
        .from('exam_results')
        .select('id')
        .eq('exam_id', exam.id)
        .eq('student_id', userId)
        .eq('status', 'in_progress')
        .limit(1);

      if (fetchError || !existingResults || existingResults.length === 0) {
        console.error('Could not find exam result to update:', fetchError);
        return;
      }

      const resultId = existingResults[0].id;

      // Update the exam result with violation info
      await supabase
        .from('exam_results')
        .update({
          violation_alert: true,
          violation_count: violationNum,
          status: isDisqualified ? 'disqualified' : 'in_progress',
          logs: logsRef.current
        })
        .eq('id', resultId);

      console.log(`Violation alert sent: ${violationNum} violations${isDisqualified ? ' - DISQUALIFIED' : ''}`);
    } catch (err) {
      console.error('Failed to send violation alert:', err);
    }
  }, [exam.id, userId, supabase, isSupabaseConfigured, isPreview]);

  useEffect(() => {
    const handleVisibility = () => {
      if (isPreview) return; // Don't track violations in preview mode
      if (document.visibilityState === 'hidden' && isReady && !isSubmitting) {
        setViolationCount(v => {
          const next = v + 1;
          violationCountRef.current = next;
          addLog('tab_blur', `Violation #${next}`);
          
          // Send real-time alert to teacher
          if (next >= MAX_VIOLATIONS) {
            addLog('violation_disqualified', 'Disqualified due to 3 violations');
            sendViolationAlert(next, true);
            handleSubmit(true);
          } else {
            setShowWarning(true);
            // Send violation alert to teacher (not disqualified yet)
            sendViolationAlert(next, false);
          }
          return next;
        });
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [isReady, isSubmitting, addLog, handleSubmit, isPreview, sendViolationAlert]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!isReady) return <div className="h-screen bg-white flex items-center justify-center"><LoaderComponent text="Mempersiapkan Lembar Ujian..." /></div>;

  const currentQuestion = shuffledQuestions[currentQuestionIndex];

  if (!currentQuestion) {
    return (
        <div className="h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />
            <h3 className="text-xl font-black text-gray-900">Tidak Ada Pertanyaan</h3>
            <p className="text-gray-500 mt-2">Ujian ini belum memiliki pertanyaan yang dapat ditampilkan.</p>
            <button onClick={onExit} className="mt-6 px-6 py-3 bg-gray-900 text-white rounded-xl font-bold">Kembali</button>
        </div>
    );
  }

  const totalAnswered = Object.keys(answers).length;
  const progressPercent = (totalAnswered / shuffledQuestions.length) * 100;

  return (
    <div className="flex flex-col h-screen bg-[#FDFDFD] text-left overflow-hidden">
      {isPreview && (
        <div className="bg-amber-100 text-amber-800 px-4 py-2 text-center text-xs font-bold uppercase tracking-widest border-b border-amber-200">
          Mode Preview Guru - Jawaban tidak akan disimpan
        </div>
      )}
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-4">
          <button onClick={() => setShowNav(!showNav)} className="p-2 hover:bg-gray-50 rounded-xl transition-colors md:hidden"><Menu className="w-6 h-6 text-gray-600" /></button>
          <div className="hidden md:flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Safe Exam Mode</span>
          </div>
          <h2 className="text-sm font-black text-gray-900 truncate max-w-[150px] md:max-w-xs">{exam.title}</h2>
        </div>
        <div className={`flex items-center gap-4 px-5 py-2 rounded-2xl border-2 transition-colors ${timeLeft < 300 ? 'border-red-100 bg-red-50 text-red-600 animate-pulse' : 'border-gray-100 bg-gray-50 text-gray-900'}`}>
          <Clock className={`w-5 h-5 ${timeLeft < 300 ? 'text-red-500' : 'text-indigo-600'}`} />
          <span className="font-mono text-xl font-black">{formatTime(timeLeft)}</span>
        </div>
        <button onClick={() => isPreview ? onExit() : setShowConfirmFinish(true)} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-xs font-black shadow-lg shadow-indigo-100">
          {isPreview ? 'TUTUP PREVIEW' : 'KIRIM'}
        </button>
      </header>

      <div className="w-full h-1.5 bg-gray-100 shrink-0"><div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: `${progressPercent}%` }} /></div>

      <div className="flex flex-1 overflow-hidden relative">
        <aside className={`absolute md:relative inset-y-0 left-0 w-80 bg-white border-r border-gray-100 flex flex-col z-30 transition-transform duration-300 ${showNav ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          <div className="p-6 border-b border-gray-50 flex justify-between items-center"><h3 className="font-black text-gray-900">Navigasi Soal</h3><button onClick={() => setShowNav(false)} className="md:hidden p-1 text-gray-400"><X /></button></div>
          <div className="flex-1 overflow-y-auto p-6 grid grid-cols-5 gap-3 content-start">
            {shuffledQuestions.map((q, idx) => {
              const isAnswered = answers[q.id] !== undefined && answers[q.id] !== '';
              return (
                <button key={q.id} onClick={() => { setCurrentQuestionIndex(idx); if(window.innerWidth < 768) setShowNav(false); }} className={`w-full aspect-square rounded-xl font-black text-sm flex items-center justify-center border-2 transition-all ${currentQuestionIndex === idx ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : isAnswered ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-gray-100 text-gray-300 hover:border-indigo-200'}`}>{idx + 1}</button>
              );
            })}
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto bg-[#FDFDFD] p-6 md:p-12">
          <div className="max-w-3xl mx-auto pb-24 text-left">
            <div className="mb-10">
              <span className="inline-block bg-gray-900 text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] mb-3">PERTANYAAN {currentQuestionIndex + 1}</span>

              {/* Added Image Display Here */}
              {currentQuestion.attachment && currentQuestion.attachment.type === 'image' && (
                <div className="mb-6 rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                    <img
                        src={currentQuestion.attachment.url}
                        alt="Lampiran Soal"
                        className="w-full max-h-[400px] object-contain bg-gray-50"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                    {currentQuestion.attachment.caption && (
                        <p className="p-2 text-center text-xs text-gray-500 bg-gray-50 border-t border-gray-100 italic">
                            {currentQuestion.attachment.caption}
                        </p>
                    )}
                </div>
              )}

              <h1 
                className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight" 
                style={{ textAlign: (currentQuestion.textAlign || 'left') as any }}
              >
                {currentQuestion.text}
              </h1>
            </div>

            <div className="space-y-4">
              {currentQuestion.type === 'mcq' && currentQuestion.options?.map((opt, idx) => {
                const attachment = currentQuestion.optionAttachments?.[idx];
                return (
                  <button key={idx} onClick={() => {
                    setAnswers(prev => {
                      if (prev[currentQuestion.id] !== idx) {
                        addLog('autosave', `Changed answer for Q${currentQuestionIndex + 1} to option ${String.fromCharCode(65 + idx)}`);
                      }
                      return { ...prev, [currentQuestion.id]: idx };
                    });
                  }} className={`w-full text-left p-6 rounded-[28px] border-2 transition-all flex items-start gap-5 ${answers[currentQuestion.id] === idx ? 'bg-indigo-50 border-indigo-600 shadow-xl' : 'bg-white border-gray-50 hover:bg-gray-50/30'}`}>
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black flex-shrink-0 mt-1 ${answers[currentQuestion.id] === idx ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'}`}>{String.fromCharCode(65 + idx)}</div>
                    <div className="flex-1 space-y-2">
                      <div className={`font-bold text-lg ${answers[currentQuestion.id] === idx ? 'text-indigo-900' : 'text-gray-700'}`} dangerouslySetInnerHTML={{__html: opt}}></div>
                      {attachment?.url && (
                        <div className="flex gap-2 items-center">
                          <img
                            src={attachment.url}
                            alt="Option"
                            className="h-20 rounded-lg object-cover"
                            onError={(e) => {
                              const src = attachment.url;
                              // Log the failing URL to help debugging inaccessible/incorrect paths
                              // eslint-disable-next-line no-console
                              console.error('Failed to load option attachment:', src);
                              (e.currentTarget as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80"%3E%3Crect fill="%23e5e7eb" width="80" height="80"/%3E%3Ctext x="40" y="44" text-anchor="middle" fill="%236b7280" font-size="10" font-family="system-ui"%3EUnavailable%3C/text%3E%3C/svg%3E';
                            }}
                          />
                          <div className="flex flex-col">
                            {attachment.caption && <span className="text-xs text-gray-600 italic">{attachment.caption}</span>}
                            <a href={attachment.url} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 mt-1">Buka gambar</a>
                          </div>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}

              {currentQuestion.type === 'multiple_select' && currentQuestion.options?.map((opt, idx) => {
                const currentAnswers = (answers[currentQuestion.id] as number[]) || [];
                const isSelected = currentAnswers.includes(idx);
                const attachment = currentQuestion.optionAttachments?.[idx];
                return (
                  <button key={idx} onClick={() => {
                    setAnswers(prev => {
                      const prevAns = (prev[currentQuestion.id] as number[]) || [];
                      const newAns = prevAns.includes(idx) 
                        ? prevAns.filter(i => i !== idx) 
                        : [...prevAns, idx];
                      
                      addLog('autosave', `Changed answer for Q${currentQuestionIndex + 1} to [${newAns.map(i => String.fromCharCode(65 + i)).join(', ')}]`);
                      return { ...prev, [currentQuestion.id]: newAns };
                    });
                  }} className={`w-full text-left p-6 rounded-[28px] border-2 transition-all flex items-start gap-5 ${isSelected ? 'bg-indigo-50 border-indigo-600 shadow-xl' : 'bg-white border-gray-50 hover:bg-gray-50/30'}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 flex-shrink-0 mt-1 ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-200 text-transparent'}`}>
                      <CheckCircle className="w-6 h-6" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className={`font-bold text-lg ${isSelected ? 'text-indigo-900' : 'text-gray-700'}`} dangerouslySetInnerHTML={{__html: opt}}></div>
                      {attachment?.url && (
                        <div className="flex gap-2 items-center">
                          <img
                            src={attachment.url}
                            alt="Option"
                            className="h-20 rounded-lg object-cover"
                            onError={(e) => {
                              const src = attachment.url;
                              // eslint-disable-next-line no-console
                              console.error('Failed to load option attachment:', src);
                              (e.currentTarget as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80"%3E%3Crect fill="%23e5e7eb" width="80" height="80"/%3E%3Ctext x="40" y="44" text-anchor="middle" fill="%236b7280" font-size="10" font-family="system-ui"%3EUnavailable%3C/text%3E%3C/svg%3E';
                            }}
                          />
                          <div className="flex flex-col">
                            {attachment.caption && <span className="text-xs text-gray-600 italic">{attachment.caption}</span>}
                            <a href={attachment.url} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 mt-1">Buka gambar</a>
                          </div>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}

              {currentQuestion.type === 'true_false' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button onClick={() => {
                    setAnswers(prev => {
                      if (prev[currentQuestion.id] !== true) {
                        addLog('autosave', `Changed answer for Q${currentQuestionIndex + 1} to BENAR`);
                      }
                      return { ...prev, [currentQuestion.id]: true };
                    });
                  }} className={`w-full text-center p-8 rounded-[28px] border-2 transition-all ${answers[currentQuestion.id] === true ? 'bg-indigo-50 border-indigo-600 shadow-xl text-indigo-900' : 'bg-white border-gray-50 hover:bg-gray-50/30 text-gray-700'}`}>
                    <span className="font-black text-2xl">BENAR</span>
                  </button>
                  <button onClick={() => {
                    setAnswers(prev => {
                      if (prev[currentQuestion.id] !== false) {
                        addLog('autosave', `Changed answer for Q${currentQuestionIndex + 1} to SALAH`);
                      }
                      return { ...prev, [currentQuestion.id]: false };
                    });
                  }} className={`w-full text-center p-8 rounded-[28px] border-2 transition-all ${answers[currentQuestion.id] === false ? 'bg-indigo-50 border-indigo-600 shadow-xl text-indigo-900' : 'bg-white border-gray-50 hover:bg-gray-50/30 text-gray-700'}`}>
                    <span className="font-black text-2xl">SALAH</span>
                  </button>
                </div>
              )}

              {currentQuestion.type === 'short_answer' && (
                <input 
                  type="text" 
                  value={answers[currentQuestion.id] || ''} 
                  onChange={(e) => setAnswers(prev => ({ ...prev, [currentQuestion.id]: e.target.value }))} 
                  onBlur={(e) => addLog('autosave', `Updated answer for Q${currentQuestionIndex + 1}: "${e.target.value}"`)}
                  className="w-full p-6 rounded-[28px] border-2 border-gray-50 bg-white focus:border-indigo-500 outline-none font-bold text-gray-800 text-xl shadow-inner" 
                  placeholder="Ketik jawaban singkat Anda di sini..." 
                />
              )}

              {currentQuestion.type === 'essay' && (
                <textarea 
                  value={answers[currentQuestion.id] || ''} 
                  onChange={(e) => setAnswers(prev => ({ ...prev, [currentQuestion.id]: e.target.value }))} 
                  onBlur={(e) => addLog('autosave', `Updated answer for Q${currentQuestionIndex + 1}: "${e.target.value}"`)}
                  className="w-full min-h-[500px] p-8 rounded-[40px] border-2 border-gray-50 bg-white focus:border-indigo-500 outline-none font-medium text-gray-800 text-base shadow-inner resize-vertical" 
                  placeholder="Tulis jawaban lengkap Anda di sini..." 
                />
              )}
            </div>
          </div>
        </main>

        <div className="absolute bottom-10 left-0 right-0 px-6 z-10 pointer-events-none">
          <div className="max-w-3xl mx-auto flex justify-between pointer-events-auto">
            <button onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))} disabled={currentQuestionIndex === 0} className="bg-white border-2 border-gray-100 p-5 rounded-3xl text-gray-400 hover:text-indigo-600 disabled:opacity-0 shadow-xl"><ChevronLeft className="w-8 h-8" /></button>
            <button onClick={() => { if (currentQuestionIndex < shuffledQuestions.length - 1) setCurrentQuestionIndex(prev => prev + 1); else setShowConfirmFinish(true); }} className="bg-gray-900 text-white px-10 py-5 rounded-3xl font-black shadow-2xl flex items-center gap-3">
              {currentQuestionIndex === shuffledQuestions.length - 1 ? 'SELESAI' : 'BERIKUTNYA'} <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {showWarning && (
        <div className="fixed inset-0 bg-red-900/40 backdrop-blur-xl z-[100] flex items-center justify-center p-6 text-left">
          <div className="bg-white w-full max-w-sm rounded-[40px] p-10 text-center shadow-2xl">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-6" />
            <h3 className="text-2xl font-black text-gray-900 mb-2">Peringatan!</h3>
            <p className="text-gray-500 font-medium mb-8">Terdeteksi perpindahan tab. Pelanggaran {violationCount}/{MAX_VIOLATIONS}.</p>
            <button onClick={() => setShowWarning(false)} className="w-full bg-gray-900 text-white py-5 rounded-2xl font-black">SAYA MENGERTI</button>
          </div>
        </div>
      )}

      {showConfirmFinish && (
        <div className="fixed inset-0 bg-indigo-900/20 backdrop-blur-md z-[100] flex items-center justify-center p-6 text-left">
          <div className="bg-white w-full max-w-sm rounded-[40px] p-10 text-center shadow-2xl">
            <h3 className="text-2xl font-black text-gray-900 mb-2">Kirim Sekarang?</h3>
            <p className="text-gray-500 font-medium mb-10">Pastikan semua jawaban sudah benar.</p>
            <div className="flex gap-4">
              <button onClick={() => setShowConfirmFinish(false)} className="flex-1 py-4 text-gray-400 font-black">Batal</button>
              <button onClick={() => handleSubmit(false)} className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-indigo-100">Ya, Kirim</button>
            </div>
          </div>
        </div>
      )}

      {isSubmitting && <div className="fixed inset-0 bg-white z-[200] flex flex-col items-center justify-center p-10 text-center"><LoaderComponent text="Mengkalkulasi Nilai & Menyimpan Hasil..." /></div>}
    </div>
  );
};

const LoaderComponent = ({ text }: { text: string }) => (
  <div className="flex flex-col items-center">
    <div className="relative mb-10">
      <div className="w-20 h-20 border-4 border-gray-100 rounded-full"></div>
      <div className="absolute inset-0 w-20 h-20 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
      <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-indigo-300 animate-pulse" />
    </div>
    <h3 className="text-xl font-black text-gray-900 animate-pulse">{text}</h3>
  </div>
);

export default ExamRunner;