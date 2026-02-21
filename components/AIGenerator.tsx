
import React, { useState, useRef } from 'react';
import { generateQuestionsWithAI, FileData } from '../services/aiService';
import { generateUUID } from '../lib/uuid';
import { Exam, Question } from '../types';
import { Sparkles, Brain, Loader2, BookOpen, ArrowLeft, Upload, FileText, X, AlertCircle, FileCheck, ListChecks } from 'lucide-react';

interface AIGeneratorProps {
  onExamCreated: (exam: Exam) => void;
  onCancel: () => void;
}

const AIGenerator: React.FC<AIGeneratorProps> = ({ onExamCreated, onCancel }) => {
  const [topic, setTopic] = useState('');
  const [questionType, setQuestionType] = useState<'mcq' | 'true_false' | 'short_answer' | 'essay' | 'mixed'>('mixed');
  const [questionCount, setQuestionCount] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState<{ name: string; type: string; data: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validasi tipe file (PDF, TXT, DOCX asal didukung browser FileReader)
    const allowedTypes = ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.docx')) {
      setError('Tipe file tidak didukung. Gunakan PDF atau Teks (.txt).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Ukuran file terlalu besar (Maksimal 5MB).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = (event.target?.result as string).split(',')[1];
      setSelectedFile({
        name: file.name,
        type: file.type || 'application/pdf', // fallback
        data: base64Data
      });
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    
    setIsLoading(true);
    setError('');

    try {
      const fileData: FileData | undefined = selectedFile ? {
        mimeType: selectedFile.type,
        data: selectedFile.data
      } : undefined;

      const questions = await generateQuestionsWithAI(topic, 5, fileData, questionType);
      
      const newExam: Exam = {
        id: generateUUID(),
        title: `Ujian: ${topic}`,
        description: selectedFile 
          ? `Evaluasi otomatis berdasarkan dokumen "${selectedFile.name}" mengenai topik ${topic}`
          : `Evaluasi otomatis mengenai topik ${topic}`,
        durationMinutes: 20,
        category: 'AI Generated',
        status: 'published',
        createdAt: new Date().toISOString(),
        questions: questions
      };

      onExamCreated(newExam);
    } catch (err: any) {
      setError(err.message || 'Gagal membuat soal. Pastikan API Key valid.');
    } finally {
      setIsLoading(false);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto mt-6">
        <button onClick={onCancel} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition font-bold">
          <ArrowLeft className="w-5 h-5" />
          Kembali ke Dashboard
        </button>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 transition-all duration-500">
          <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-8 text-white relative overflow-hidden">
            {/* Background pattern deco */}
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-indigo-400/20 rounded-full blur-3xl"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-white/20 p-2.5 rounded-2xl backdrop-blur-md shadow-inner">
                  <Sparkles className="w-6 h-6 text-yellow-300" />
                </div>
                <h2 className="text-2xl font-black tracking-tight">Asisten Ujian Pintar</h2>
              </div>
              <p className="text-indigo-50 leading-relaxed text-left font-medium">
                Buat soal ujian dalam hitungan detik. Anda bisa memasukkan topik umum atau mengunggah modul pembelajaran sebagai referensi materi.
              </p>
            </div>
          </div>

          <div className="p-8 text-left space-y-8">
            {/* STEP 1: TOPIC */}
            <div className="space-y-3">
              <label className="text-sm font-black text-gray-700 uppercase tracking-wider flex items-center gap-2">
                <Brain className="w-4 h-4 text-indigo-600" />
                1. Tentukan Topik / Kompetensi
              </label>
              <div className="relative group">
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Contoh: Ekosistem Laut, Revolusi Industri 4.0..."
                  className="w-full pl-4 pr-12 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white text-gray-900 placeholder-gray-400 outline-none transition-all text-lg font-medium shadow-sm"
                  disabled={isLoading}
                />
                <BookOpen className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-300 group-focus-within:text-indigo-400 transition-colors" />
              </div>
            </div>

            {/* STEP 1.5: QUESTION TYPE */}
            <div className="space-y-3">
              <label className="text-sm font-black text-gray-700 uppercase tracking-wider flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-indigo-600" />
                2. Pilih Tipe Soal
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { id: 'mixed', label: 'Campuran' },
                  { id: 'mcq', label: 'Pilihan Ganda' },
                  { id: 'true_false', label: 'Benar / Salah' },
                  { id: 'short_answer', label: 'Isian Singkat' },
                  { id: 'essay', label: 'Esai' }
                ].map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setQuestionType(type.id as any)}
                    className={`py-3 px-4 rounded-xl font-bold text-sm border-2 transition-all ${
                      questionType === type.id 
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-700' 
                        : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* STEP 2: FILE UPLOAD (OPTIONAL) */}
            <div className="space-y-3">
              <label className="text-sm font-black text-gray-700 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Upload className="w-4 h-4 text-indigo-600" />
                  3. Lampirkan Modul (Opsional)
                </span>
                <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">REKOMENDASI</span>
              </label>
              
              {!selectedFile ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 rounded-3xl p-8 text-center hover:border-indigo-400 hover:bg-indigo-50/30 transition-all cursor-pointer group"
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                    accept=".pdf,.txt,.docx"
                  />
                  <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-sm">
                    <FileText className="w-8 h-8 text-gray-300 group-hover:text-indigo-500 transition-colors" />
                  </div>
                  <p className="text-gray-900 font-bold mb-1">Klik untuk Unggah Dokumen</p>
                  <p className="text-xs text-gray-400">PDF atau Teks (Maks 5MB)</p>
                </div>
              ) : (
                <div className="bg-indigo-50 border-2 border-indigo-200 rounded-2xl p-4 flex items-center justify-between animate-in zoom-in-95 duration-200">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-200">
                      <FileCheck className="w-5 h-5 text-white" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-indigo-900 font-bold text-sm truncate">{selectedFile.name}</p>
                      <p className="text-indigo-400 text-xs font-medium uppercase">File siap dianalisis</p>
                    </div>
                  </div>
                  <button 
                    onClick={removeFile}
                    className="p-2 text-indigo-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 p-4 rounded-2xl text-sm text-red-600 font-semibold flex items-center gap-3 animate-shake">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="pt-4">
              <button
                onClick={handleGenerate}
                disabled={isLoading || !topic}
                className={`w-full py-5 rounded-2xl font-black text-white transition-all shadow-2xl flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed group
                  ${isLoading ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'}
                `}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-200" />
                    <span className="tracking-tight">Gemini Sedang Menganalisis...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6 text-yellow-300 group-hover:rotate-12 transition-transform" />
                    BUAT UJIAN SEKARANG
                  </>
                )}
              </button>
            </div>
          </div>
          <div className="bg-gray-50 px-8 py-4 border-t border-gray-100 text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">
            Powered by Google Gemini 3 Flash Preview &bull; Examo Intelligence
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIGenerator;
