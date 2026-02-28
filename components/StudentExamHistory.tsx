import React, { useState, useEffect } from 'react';
import { ExamResult, Exam } from '../types';
import { ChevronDown, ChevronUp, Clock, CheckCircle, AlertTriangle, MapPin, Wifi, Calendar, PenLine } from 'lucide-react';
import UserActivityService, { ExamSubmissionRecord } from '../services/UserActivityService';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface StudentExamHistoryProps {
  studentId: string;
  studentName: string;
  onClose: () => void;
}

interface ExamAnswerDetail {
  examResultId: string;
  answers: Record<string, any>;
  exam: Exam | null;
}

export const StudentExamHistory: React.FC<StudentExamHistoryProps> = ({
  studentId,
  studentName,
  onClose
}) => {
  const [examHistory, setExamHistory] = useState<ExamSubmissionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [answerDetails, setAnswerDetails] = useState<Record<string, ExamAnswerDetail>>({});
  const [loadingDetails, setLoadingDetails] = useState<string | null>(null);

  useEffect(() => {
    const loadHistory = async () => {
      setIsLoading(true);
      const history = await UserActivityService.getStudentExamHistory(studentId);
      setExamHistory(history);
      setIsLoading(false);
    };
    loadHistory();
  }, [studentId]);

  // Fetch detail jawaban esai saat expand
  const loadAnswerDetails = async (exam: ExamSubmissionRecord) => {
    const key = exam.id;
    if (answerDetails[key]) return; // Sudah di-cache

    setLoadingDetails(key);
    try {
      if (!isSupabaseConfigured || !supabase) return;

      // Fetch exam_result berdasarkan exam_result_id
      const { data: resultData } = await supabase
        .from('exam_results')
        .select('answers, exam_id')
        .eq('id', exam.exam_result_id)
        .maybeSingle();

      // Fetch exam soal
      let examData: Exam | null = null;
      if (resultData?.exam_id) {
        const { data: ed } = await supabase
          .from('exams')
          .select('*')
          .eq('id', resultData.exam_id)
          .maybeSingle();
        if (ed) {
          examData = {
            ...ed,
            durationMinutes: ed.duration_minutes,
            questions: ed.questions || [],
          } as any;
        }
      }

      setAnswerDetails(prev => ({
        ...prev,
        [key]: {
          examResultId: exam.exam_result_id,
          answers: resultData?.answers || {},
          exam: examData,
        }
      }));
    } catch (err) {
      console.error('Error loading answer details:', err);
    } finally {
      setLoadingDetails(null);
    }
  };

  const handleToggle = async (exam: ExamSubmissionRecord) => {
    const newExpanded = expandedId === exam.id ? null : exam.id;
    setExpandedId(newExpanded);
    if (newExpanded) {
      await loadAnswerDetails(exam);
    }
  };

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const formatScorePercentage = (score: number, total: number) =>
    total > 0 ? Math.round((score / total) * 100) : 0;

  const stripHtml = (html: string) =>
    (html || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[40px] shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-100">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-8 py-6 flex justify-between items-center rounded-t-[40px]">
          <div>
            <h2 className="text-2xl font-black text-gray-900">Riwayat Ujian</h2>
            <p className="text-sm text-gray-500 font-medium">{studentName}</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-gray-100 rounded-xl transition-colors">✕</button>
        </div>

        {/* Content */}
        <div className="p-8">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin" />
              <p className="mt-4 text-gray-400">Memuat riwayat ujian...</p>
            </div>
          ) : examHistory.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-400">Belum ada riwayat pengerjaan ujian.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {examHistory.map((exam, idx) => {
                const detail = answerDetails[exam.id];
                const essayQuestions = detail?.exam?.questions?.filter(q => q.type === 'essay') || [];

                return (
                  <div
                    key={exam.id}
                    className="border-2 border-gray-100 rounded-[28px] overflow-hidden hover:border-indigo-200 transition-colors"
                  >
                    {/* Summary Row */}
                    <button
                      onClick={() => handleToggle(exam)}
                      className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="bg-gray-900 text-white px-3 py-1 rounded-lg text-xs font-black">
                            #{examHistory.length - idx}
                          </span>
                          <h3 className="font-bold text-gray-900 text-lg">{exam.exam_title}</h3>
                          <span className={`text-xs font-bold px-3 py-1 rounded-lg ${exam.status === 'completed'
                              ? 'bg-green-50 text-green-600'
                              : exam.status === 'disqualified'
                                ? 'bg-red-50 text-red-600'
                                : 'bg-yellow-50 text-yellow-600'
                            }`}>
                            {exam.status === 'completed' ? 'SELESAI' : exam.status === 'disqualified' ? 'DISKUALIFIKASI' : 'DALAM PROSES'}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(exam.submitted_at || '')}
                          </div>
                          {exam.duration_taken_minutes && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {exam.duration_taken_minutes} menit
                            </div>
                          )}
                          {exam.violation_count > 0 && (
                            <div className="flex items-center gap-1 text-red-500 font-bold">
                              <AlertTriangle className="w-4 h-4" />
                              {exam.violation_count} pelanggaran
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="text-3xl font-black text-indigo-600">
                            {exam.score}/{exam.total_points}
                          </div>
                          <div className="text-xs font-bold text-gray-400">
                            {formatScorePercentage(exam.score, exam.total_points)}%
                          </div>
                        </div>
                        <div className="text-gray-400">
                          {expandedId === exam.id ? <ChevronUp /> : <ChevronDown />}
                        </div>
                      </div>
                    </button>

                    {/* Expanded Details */}
                    {expandedId === exam.id && (
                      <div className="bg-gray-50 border-t border-gray-100 p-6 space-y-6">
                        {/* Info Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-white p-4 rounded-xl border border-gray-100">
                            <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Status Ujian</div>
                            <div className="font-bold text-gray-900">
                              {exam.status === 'completed' ? '✅ Selesai' : exam.status === 'disqualified' ? '❌ Diskualifikasi' : '⏳ Dalam Proses'}
                            </div>
                          </div>
                          <div className="bg-white p-4 rounded-xl border border-gray-100">
                            <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Waktu Pengerjaan</div>
                            <div className="font-bold text-gray-900">{exam.duration_taken_minutes || 0} menit</div>
                          </div>
                          {exam.ip_address && (
                            <div className="bg-white p-4 rounded-xl border border-gray-100">
                              <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                                <MapPin className="w-3 h-3" /> IP Address
                              </div>
                              <div className="font-mono font-bold text-indigo-600 break-all">{exam.ip_address}</div>
                            </div>
                          )}
                          {exam.device_id && (
                            <div className="bg-white p-4 rounded-xl border border-gray-100">
                              <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                                <Wifi className="w-3 h-3" /> Device ID
                              </div>
                              <div className="font-mono font-bold text-gray-600 break-all text-sm">{exam.device_id}</div>
                            </div>
                          )}
                        </div>

                        {/* Score Breakdown */}
                        <div className="bg-white p-4 rounded-xl border border-gray-100">
                          <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Rincian Nilai</div>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="text-center p-3 bg-green-50 rounded-lg">
                              <div className="text-sm text-green-600 font-black">Perolehan</div>
                              <div className="text-2xl font-black text-green-600">{exam.score}</div>
                            </div>
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                              <div className="text-sm text-gray-600 font-black">Total Poin</div>
                              <div className="text-2xl font-black text-gray-600">{exam.total_points}</div>
                            </div>
                            <div className="text-center p-3 bg-indigo-50 rounded-lg">
                              <div className="text-sm text-indigo-600 font-black">Persentase</div>
                              <div className="text-2xl font-black text-indigo-600">{formatScorePercentage(exam.score, exam.total_points)}%</div>
                            </div>
                          </div>
                        </div>

                        {/* ── Jawaban Esai ── */}
                        {loadingDetails === exam.id ? (
                          <div className="text-center py-4">
                            <div className="inline-block w-6 h-6 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin" />
                            <p className="mt-2 text-sm text-gray-400">Memuat jawaban esai...</p>
                          </div>
                        ) : essayQuestions.length > 0 ? (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <PenLine className="w-4 h-4 text-indigo-500" />
                              <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">
                                Jawaban Esai Siswa
                              </span>
                            </div>
                            {essayQuestions.map((q, i) => {
                              const answer = detail?.answers?.[q.id];
                              return (
                                <div key={q.id} className="bg-white p-4 rounded-xl border border-indigo-100">
                                  <div className="text-xs font-black text-gray-400 uppercase mb-2">
                                    Soal Esai #{i + 1}
                                  </div>
                                  <div
                                    className="font-bold text-gray-800 text-sm mb-3 pb-3 border-b border-gray-100"
                                    dangerouslySetInnerHTML={{ __html: q.text }}
                                  />
                                  <div className="text-xs font-black text-indigo-500 uppercase mb-1">Jawaban Siswa:</div>
                                  {answer && String(answer).trim() ? (
                                    <div className="text-gray-700 text-sm font-medium bg-indigo-50 p-3 rounded-lg leading-relaxed whitespace-pre-wrap">
                                      {String(answer)}
                                    </div>
                                  ) : (
                                    <div className="text-gray-400 italic text-sm bg-gray-50 p-3 rounded-lg">
                                      (Tidak ada jawaban)
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : detail && essayQuestions.length === 0 ? (
                          <p className="text-xs text-gray-400 text-center italic">Tidak ada soal esai dalam ujian ini.</p>
                        ) : null}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentExamHistory;
