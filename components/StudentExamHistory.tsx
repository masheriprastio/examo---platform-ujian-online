import React, { useState, useEffect } from 'react';
import { ExamResult } from '../types';
import { ChevronDown, ChevronUp, Clock, CheckCircle, AlertTriangle, MapPin, Wifi, Calendar } from 'lucide-react';
import UserActivityService, { ExamSubmissionRecord } from '../services/UserActivityService';
import EssayManualScoreInput from './EssayManualScoreInput';

interface StudentExamHistoryProps {
  studentId: string;
  studentName: string;
  onClose: () => void;
}

export const StudentExamHistory: React.FC<StudentExamHistoryProps> = ({ 
  studentId, 
  studentName, 
  onClose 
}) => {
  const [examHistory, setExamHistory] = useState<ExamSubmissionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dropdownOpenId, setDropdownOpenId] = useState<string | null>(null);
  const [manualModal, setManualModal] = useState<{
    open: boolean;
    resultId: string | null;
    questionId: string;
    maxPoints: number;
    currentScore?: number;
  }>({ open: false, resultId: null, questionId: 'essay_overall', maxPoints: 0 });

  useEffect(() => {
    const loadHistory = async () => {
      setIsLoading(true);
      const history = await UserActivityService.getStudentExamHistory(studentId);
      setExamHistory(history);
      setIsLoading(false);
    };

    loadHistory();
  }, [studentId]);

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const formatScorePercentage = (score: number, total: number) => {
    return total > 0 ? Math.round((score / total) * 100) : 0;
  };

  const openManualScoring = (exam: ExamSubmissionRecord) => {
    setManualModal({
      open: true,
      resultId: exam.id,
      questionId: 'essay_overall',
      maxPoints: exam.total_points,
      currentScore: undefined,
    });
    setDropdownOpenId(null);
  };

  const handleEssayScoreSaved = (questionId: string, points: number) => {
    setExamHistory((prev) =>
      prev.map((e) =>
        e.id === manualModal.resultId
          ? {
              ...e,
              answers: { ...(e.answers || {}), [`${questionId}_manual_score`]: points },
              score: Math.min(e.total_points, (e.score || 0) + points),
            }
          : e
      )
    );
    setManualModal((m) => ({ ...m, open: false }));
  };

  const handleExport = (exam: ExamSubmissionRecord) => {
    const rows = [
      ['Exam Title', exam.exam_title],
      ['Student', studentName],
      ['Score', `${exam.score}/${exam.total_points}`],
      ['Submitted At', exam.submitted_at || ''],
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${exam.exam_title || 'result'}_${exam.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setDropdownOpenId(null);
  };

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[40px] shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-100">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-8 py-6 flex justify-between items-center rounded-t-[40px]">
          <div>
            <h2 className="text-2xl font-black text-gray-900">Riwayat Ujian</h2>
            <p className="text-sm text-gray-500 font-medium">{studentName}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-3 hover:bg-gray-100 rounded-xl transition-colors"
          >
            ✕
          </button>
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
              {examHistory.map((exam, idx) => (
                <div 
                  key={exam.id}
                  className="border-2 border-gray-100 rounded-[28px] overflow-hidden hover:border-indigo-200 transition-colors"
                >
                  {/* Summary Row */}
                  <button
                    onClick={() => setExpandedId(expandedId === exam.id ? null : exam.id)}
                    className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="bg-gray-900 text-white px-3 py-1 rounded-lg text-xs font-black">
                          #{examHistory.length - idx}
                        </span>
                        <h3 className="font-bold text-gray-900 text-lg">{exam.exam_title}</h3>
                        <span className={`text-xs font-bold px-3 py-1 rounded-lg ${
                          exam.status === 'completed' 
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
                    <div className="bg-gray-50 border-t border-gray-100 p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Actions (CBT-style dropdown) */}
                      <div className="md:col-span-2 flex justify-end">
                        <div className="relative">
                          <button
                            onClick={(e) => { e.stopPropagation(); setDropdownOpenId(dropdownOpenId === exam.id ? null : exam.id); }}
                            aria-haspopup="true"
                            aria-expanded={dropdownOpenId === exam.id}
                            className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl border bg-white text-sm font-black shadow-sm hover:shadow-md transition"
                          >
                            <span className="text-sm">Kelola Nilai</span>
                            <span className="text-xs text-gray-500">{dropdownOpenId === exam.id ? '▴' : '▾'}</span>
                          </button>

                          {dropdownOpenId === exam.id && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-0 mt-3 w-56 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 ring-1 ring-black/5 overflow-hidden"
                            >
                              <ul className="divide-y divide-gray-100">
                                <li>
                                  <button
                                    onClick={() => { window.open(`/submissions/${exam.id}`, '_blank'); setDropdownOpenId(null); }}
                                    className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition"
                                  >
                                    <span className="w-6 text-indigo-600">🔍</span>
                                    <div>
                                      <div className="font-bold text-sm">Lihat Pengumpulan</div>
                                      <div className="text-xs text-gray-400">Buka halaman pengumpulan siswa</div>
                                    </div>
                                  </button>
                                </li>

                                <li>
                                  <button
                                    onClick={() => { openManualScoring(exam); setDropdownOpenId(null); }}
                                    className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition"
                                  >
                                    <span className="w-6 text-green-600">✏️</span>
                                    <div>
                                      <div className="font-bold text-sm">Nilai Manual Esai</div>
                                      <div className="text-xs text-gray-400">Masukkan nilai esai oleh guru</div>
                                    </div>
                                  </button>
                                </li>

                                <li>
                                  <button
                                    onClick={() => { handleExport(exam); setDropdownOpenId(null); }}
                                    className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition"
                                  >
                                    <span className="w-6 text-amber-600">📤</span>
                                    <div>
                                      <div className="font-bold text-sm">Ekspor Hasil (CSV)</div>
                                      <div className="text-xs text-gray-400">Unduh rekapan nilai</div>
                                    </div>
                                  </button>
                                </li>
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Info Grid */}
                      <div className="space-y-4">
                        <div className="bg-white p-4 rounded-xl border border-gray-100">
                          <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">
                            Status Ujian
                          </div>
                          <div className="font-bold text-gray-900">
                            {exam.status === 'completed' ? '✅ Selesai' : exam.status === 'disqualified' ? '❌ Diskualifikasi' : '⏳ Dalam Proses'}
                          </div>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-gray-100">
                          <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">
                            Waktu Pengerjaan
                          </div>
                          <div className="font-bold text-gray-900">
                            {exam.duration_taken_minutes || 0} menit
                          </div>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-gray-100">
                          <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">
                            Total Soal
                          </div>
                          <div className="font-bold text-gray-900">
                            -
                          </div>
                        </div>
                      </div>

                      {/* Device & Network Info */}
                      <div className="space-y-4">
                        {exam.ip_address && (
                          <div className="bg-white p-4 rounded-xl border border-gray-100">
                            <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                              <MapPin className="w-3 h-3" /> IP Address
                            </div>
                            <div className="font-mono font-bold text-indigo-600 break-all">
                              {exam.ip_address}
                            </div>
                          </div>
                        )}

                        {exam.device_id && (
                          <div className="bg-white p-4 rounded-xl border border-gray-100">
                            <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                              <Wifi className="w-3 h-3" /> Device ID
                            </div>
                            <div className="font-mono font-bold text-gray-600 break-all text-sm">
                              {exam.device_id}
                            </div>
                          </div>
                        )}

                        {exam.violation_count > 0 && (
                          <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                            <div className="text-xs font-black text-red-600 uppercase tracking-widest mb-1 flex items-center gap-2">
                              <AlertTriangle className="w-3 h-3" /> Pelanggaran
                            </div>
                            <div className="font-bold text-red-600">
                              {exam.violation_count} kali keluar dari tab
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Score Breakdown */}
                      <div className="md:col-span-2 bg-white p-4 rounded-xl border border-gray-100">
                        <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
                          Rincian Nilai
                        </div>
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
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {manualModal.open && manualModal.resultId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <h3 className="text-lg font-bold mb-4">Penilaian Manual Esai</h3>
            <p className="text-sm text-gray-500 mb-4">Hasil ID: {manualModal.resultId}</p>
            <EssayManualScoreInput
              questionId={manualModal.questionId}
              maxPoints={manualModal.maxPoints}
              currentScore={manualModal.currentScore}
              resultId={manualModal.resultId}
              onScoreSaved={handleEssayScoreSaved}
            />
            <div className="mt-4 flex justify-end">
              <button onClick={() => setManualModal((m) => ({ ...m, open: false }))} className="px-3 py-2 rounded-md border">Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentExamHistory;
