
import React, { useState, useRef } from 'react';
import { Question, QuestionType } from '../types';
import { 
  Search, Plus, Edit3, Trash2, Check, Star, Filter, X, 
  Save, FileText, ListChecks, Type, GripVertical, 
  ChevronUp, ChevronDown, Download, Upload, Tag, AlertCircle,
  Image as ImageIcon
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface QuestionBankProps {
  questions: Question[];
  onUpdate: (updated: Question[]) => void;
}

const QuestionBank: React.FC<QuestionBankProps> = ({ questions, onUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredQuestions = questions.filter(q => 
    q.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (q.topic && q.topic.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleDelete = (id: string) => {
    if (confirm('Hapus soal ini dari bank soal?')) {
      onUpdate(questions.filter(q => q.id !== id));
    }
  };

  const handleSave = (q: Question) => {
    if (isAdding) {
      onUpdate([{ ...q, id: `bank-${Date.now()}` }, ...questions]);
    } else {
      onUpdate(questions.map(item => item.id === q.id ? q : item));
    }
    setEditingQuestion(null);
    setIsAdding(false);
  };

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    if (searchTerm) return; // Disable reorder while filtering
    const newItems = [...questions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newItems.length) return;
    
    [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
    onUpdate(newItems);
  };

  const onDragStart = (e: React.DragEvent, index: number) => {
    if (searchTerm) return;
    setDraggedItemIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // Visual feedback for ghost image
    const target = e.target as HTMLElement;
    setTimeout(() => {
      target.style.opacity = '0.4';
    }, 0);
  };

  const onDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedItemIndex === null || draggedItemIndex === index || searchTerm) return;

    const newItems = [...questions];
    const draggedItem = newItems[draggedItemIndex];
    
    newItems.splice(draggedItemIndex, 1);
    newItems.splice(index, 0, draggedItem);

    setDraggedItemIndex(index);
    onUpdate(newItems);
  };

  const onDragEnd = (e: React.DragEvent) => {
    setDraggedItemIndex(null);
    (e.target as HTMLElement).style.opacity = '1';
  };

  const startNew = (type: QuestionType) => {
    setIsAdding(true);
    setEditingQuestion({
      id: '',
      type: type,
      text: '',
      points: 10,
      explanation: '',
      difficulty: 'medium',
      ...(type === 'mcq' ? { options: ['', '', '', ''], correctAnswerIndex: 0, randomizeOptions: false } : {}),
      ...(type === 'multiple_select' ? { options: ['', '', '', ''], correctAnswerIndices: [], randomizeOptions: false } : {}),
      ...(type === 'true_false' ? { trueFalseAnswer: true } : {}),
      ...(type === 'short_answer' ? { shortAnswer: '' } : {}),
      ...(type === 'essay' ? { essayAnswer: '' } : {})
    });
  };

  const handleExport = () => {
    const exportData = questions.map(q => ({
      ID: q.id,
      Tipe: q.type,
      Pertanyaan: q.text,
      Opsi_A: q.options?.[0] || '',
      Opsi_B: q.options?.[1] || '',
      Opsi_C: q.options?.[2] || '',
      Opsi_D: q.options?.[3] || '',
      Kunci_Jawaban_MCQ: q.correctAnswerIndex !== undefined ? String.fromCharCode(65 + q.correctAnswerIndex) : '',
      Kunci_Jawaban_BenarSalah: q.trueFalseAnswer !== undefined ? (q.trueFalseAnswer ? 'BENAR' : 'SALAH') : '',
      Kunci_Jawaban_Isian: q.shortAnswer || '',
      Panduan_Esai: q.essayAnswer || '',
      Bobot: q.points,
      Topik: q.topic || '',
      Tingkat_Kesulitan: q.difficulty || 'medium',
      Pembahasan: q.explanation || ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Bank Soal");
    XLSX.writeFile(wb, "bank_soal_examo.xlsx");
  };

  const handleDownloadTemplate = () => {
    const headers = [
      {
        Tipe: 'mcq',
        Pertanyaan: 'Contoh Soal Pilihan Ganda',
        Opsi_A: 'Pilihan A',
        Opsi_B: 'Pilihan B',
        Opsi_C: 'Pilihan C',
        Opsi_D: 'Pilihan D',
        Kunci_Jawaban_MCQ: 'A',
        Kunci_Jawaban_BenarSalah: '',
        Kunci_Jawaban_Isian: '',
        Panduan_Esai: '',
        Bobot: 10,
        Topik: 'Matematika',
        Tingkat_Kesulitan: 'medium',
        Pembahasan: 'Penjelasan jawaban...'
      },
      {
        Tipe: 'true_false',
        Pertanyaan: 'Contoh Soal Benar Salah',
        Opsi_A: '',
        Opsi_B: '',
        Opsi_C: '',
        Opsi_D: '',
        Kunci_Jawaban_MCQ: '',
        Kunci_Jawaban_BenarSalah: 'BENAR',
        Kunci_Jawaban_Isian: '',
        Panduan_Esai: '',
        Bobot: 10,
        Topik: 'Sejarah',
        Tingkat_Kesulitan: 'easy',
        Pembahasan: ''
      },
      {
        Tipe: 'short_answer',
        Pertanyaan: 'Contoh Soal Isian Singkat',
        Opsi_A: '',
        Opsi_B: '',
        Opsi_C: '',
        Opsi_D: '',
        Kunci_Jawaban_MCQ: '',
        Kunci_Jawaban_BenarSalah: '',
        Kunci_Jawaban_Isian: 'Jawaban Singkat',
        Panduan_Esai: '',
        Bobot: 15,
        Topik: 'Biologi',
        Tingkat_Kesulitan: 'hard',
        Pembahasan: ''
      },
      {
        Tipe: 'essay',
        Pertanyaan: 'Contoh Soal Esai',
        Opsi_A: '',
        Opsi_B: '',
        Opsi_C: '',
        Opsi_D: '',
        Kunci_Jawaban_MCQ: '',
        Kunci_Jawaban_BenarSalah: '',
        Kunci_Jawaban_Isian: '',
        Panduan_Esai: 'Poin penting jawaban...',
        Bobot: 20,
        Topik: 'Fisika',
        Tingkat_Kesulitan: 'medium',
        Pembahasan: ''
      }
    ];

    const ws = XLSX.utils.json_to_sheet(headers);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Soal");
    XLSX.writeFile(wb, "template_soal_examo.xlsx");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        const importedQuestions: Question[] = data.map((row, idx) => {
          const type = (row.Tipe as QuestionType) || 'mcq';
          
          let correctAnswerIndex = 0;
          if (row.Kunci_Jawaban_MCQ) {
            const char = String(row.Kunci_Jawaban_MCQ).toUpperCase();
            correctAnswerIndex = char.charCodeAt(0) - 65;
            if (correctAnswerIndex < 0 || correctAnswerIndex > 3) correctAnswerIndex = 0;
          }

          let trueFalseAnswer = true;
          if (row.Kunci_Jawaban_BenarSalah) {
            trueFalseAnswer = String(row.Kunci_Jawaban_BenarSalah).toUpperCase() === 'BENAR';
          }

          return {
            id: `imported-${Date.now()}-${idx}`,
            type,
            text: row.Pertanyaan || 'Pertanyaan tanpa teks',
            points: Number(row.Bobot) || 10,
            topic: row.Topik || '',
            difficulty: ['easy', 'medium', 'hard'].includes(row.Tingkat_Kesulitan) ? row.Tingkat_Kesulitan : 'medium',
            explanation: row.Pembahasan || '',
            ...(type === 'mcq' ? { 
              options: [row.Opsi_A || '', row.Opsi_B || '', row.Opsi_C || '', row.Opsi_D || ''], 
              correctAnswerIndex 
            } : {}),
            ...(type === 'true_false' ? { trueFalseAnswer } : {}),
            ...(type === 'short_answer' ? { shortAnswer: row.Kunci_Jawaban_Isian || '' } : {}),
            ...(type === 'essay' ? { essayAnswer: row.Panduan_Esai || '' } : {})
          };
        });

        if (importedQuestions.length > 0) {
          onUpdate([...importedQuestions, ...questions]);
          alert(`Berhasil mengimpor ${importedQuestions.length} soal.`);
        }
      } catch (error) {
        console.error("Error importing file:", error);
        alert("Gagal mengimpor file. Pastikan format sesuai dengan template export.");
      }
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsBinaryString(file);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingQuestion) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Ukuran gambar maksimal 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setEditingQuestion({
        ...editingQuestion,
        attachment: {
          type: 'image',
          url: base64
        }
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-6xl mx-auto text-left animate-in fade-in duration-500 pb-20 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Bank Soal Guru</h1>
          <p className="text-gray-400 font-medium mt-1">Kelola koleksi soal Pilihan Ganda & Esai Anda.</p>
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <input 
            type="file" 
            accept=".xlsx, .xls, .csv" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleImport}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 md:flex-none bg-white text-gray-600 border-2 border-gray-200 px-4 py-3 rounded-[20px] font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-2 text-xs"
          >
            <Upload className="w-4 h-4" /> Import
          </button>
          <button 
            onClick={handleExport}
            className="flex-1 md:flex-none bg-white text-gray-600 border-2 border-gray-200 px-4 py-3 rounded-[20px] font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-2 text-xs"
          >
            <Download className="w-4 h-4" /> Export
          </button>
          
          <button 
            onClick={handleDownloadTemplate}
            className="flex-1 md:flex-none bg-white text-gray-600 border-2 border-gray-200 px-4 py-3 rounded-[20px] font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-2 text-xs"
          >
            <FileText className="w-4 h-4" /> Template
          </button>
          
          <div className="w-full md:w-px md:h-10 bg-gray-200 mx-1 hidden md:block"></div>

          <div className="flex gap-2 w-full md:w-auto">
            <select 
              className="flex-1 md:flex-none bg-indigo-600 text-white px-4 py-3 rounded-[20px] font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all outline-none text-sm cursor-pointer appearance-none text-center"
              onChange={(e) => {
                if (e.target.value) {
                  startNew(e.target.value as QuestionType);
                  e.target.value = '';
                }
              }}
              value=""
            >
              <option value="" disabled>+ Tambah Soal</option>
              <option value="mcq">Pilihan Ganda</option>
              <option value="multiple_select">Pilihan Ganda (Banyak Jawaban)</option>
              <option value="true_false">Benar / Salah</option>
              <option value="short_answer">Isian Singkat</option>
              <option value="essay">Esai</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-[30px] border border-gray-100 shadow-sm mb-8 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-4 w-5 h-5 text-gray-300" />
          <input 
            type="text" 
            placeholder="Cari teks soal..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-gray-50 border-transparent focus:border-indigo-500 focus:bg-white transition font-bold text-gray-800 outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredQuestions.map((q, idx) => (
          <div 
            key={q.id} 
            draggable={!searchTerm}
            onDragStart={(e) => onDragStart(e, idx)}
            onDragOver={(e) => onDragOver(e, idx)}
            onDragEnd={onDragEnd}
            className={`bg-white p-5 md:p-6 rounded-[35px] border border-gray-100 shadow-sm flex items-center justify-between group transition-all ${!searchTerm ? 'hover:border-indigo-200 active:shadow-inner' : ''} ${draggedItemIndex === idx ? 'opacity-40 border-indigo-500 border-dashed' : ''}`}
          >
            <div className="flex items-center gap-3 md:gap-6 flex-1 mr-4 overflow-hidden">
              {!searchTerm && (
                <div className="hidden md:flex cursor-grab active:cursor-grabbing text-gray-300 hover:text-indigo-400 p-2">
                  <GripVertical className="w-6 h-6" />
                </div>
              )}
              
              {/* Mobile Reorder Controls */}
              {!searchTerm && (
                <div className="flex flex-col gap-1 md:hidden shrink-0">
                  <button onClick={() => moveQuestion(idx, 'up')} disabled={idx === 0} className="p-1 text-gray-300 hover:text-indigo-600 disabled:opacity-20"><ChevronUp className="w-5 h-5" /></button>
                  <button onClick={() => moveQuestion(idx, 'down')} disabled={idx === filteredQuestions.length - 1} className="p-1 text-gray-300 hover:text-indigo-600 disabled:opacity-20"><ChevronDown className="w-5 h-5" /></button>
                </div>
              )}

              <div className="flex-1 overflow-hidden">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black border flex items-center gap-1 ${
                    q.type === 'mcq' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                    q.type === 'true_false' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                    q.type === 'short_answer' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                    'bg-amber-50 text-amber-600 border-amber-100'
                  }`}>
                    {q.type === 'mcq' ? 'MCQ' : q.type === 'true_false' ? 'B/S' : q.type === 'short_answer' ? 'ISIAN' : 'ESAI'}
                  </span>
                  <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-lg text-[9px] font-black border border-indigo-100">
                    {q.points} PTS
                  </span>
                  {q.difficulty && (
                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black border ${
                      q.difficulty === 'easy' ? 'bg-green-50 text-green-600 border-green-100' :
                      q.difficulty === 'medium' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' :
                      'bg-red-50 text-red-600 border-red-100'
                    }`}>
                      {q.difficulty.toUpperCase()}
                    </span>
                  )}
                  {q.topic && (
                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-lg text-[9px] font-bold border border-gray-200 truncate max-w-[100px]">
                      {q.topic}
                    </span>
                  )}
                </div>
                <p className="text-gray-800 font-bold text-sm md:text-lg line-clamp-2 leading-tight">{q.text}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              <button 
                onClick={() => { setEditingQuestion(q); setIsAdding(false); }}
                className="p-3 md:p-4 bg-gray-50 text-gray-400 rounded-2xl hover:bg-indigo-50 hover:text-indigo-600 transition-all active:scale-90"
              >
                <Edit3 className="w-5 h-5" />
              </button>
              <button 
                onClick={() => handleDelete(q.id)}
                className="p-3 md:p-4 bg-gray-50 text-gray-400 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all active:scale-90"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}

        {filteredQuestions.length === 0 && (
          <div className="py-20 text-center bg-gray-50/50 rounded-[40px] border border-dashed border-gray-200">
            <h3 className="text-xl font-black text-gray-900 mb-1">Soal Tidak Ditemukan</h3>
            <p className="text-gray-400 font-medium">Coba gunakan kata kunci lain.</p>
          </div>
        )}
      </div>

      {/* MODAL EDITOR */}
      {editingQuestion && (
        <div className="fixed inset-0 z-[100] bg-gray-900/40 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-3xl rounded-[40px] md:rounded-[50px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 md:p-8 border-b border-gray-50 flex justify-between items-center bg-white sticky top-0 z-10">
              <h3 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
                {isAdding ? 'Buat Soal' : 'Edit Soal'} {editingQuestion.type === 'mcq' ? 'MCQ' : 'Esai'}
              </h3>
              <button onClick={() => setEditingQuestion(null)} className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 md:p-10 overflow-y-auto space-y-6 text-left">
              <div className="space-y-4">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Lampiran Gambar (Opsional)</label>
                {editingQuestion.attachment ? (
                  <div className="relative rounded-xl overflow-hidden border border-gray-200 group w-full md:w-1/2">
                    <img src={editingQuestion.attachment.url} alt="Lampiran" className="w-full h-48 object-cover bg-gray-100" />
                    <button 
                      onClick={() => setEditingQuestion({...editingQuestion, attachment: undefined})}
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer w-full md:w-1/2" onClick={() => document.getElementById('qb-file-upload')?.click()}>
                    <ImageIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs font-bold text-gray-500">Klik untuk unggah gambar</p>
                    <input 
                      id="qb-file-upload"
                      type="file" 
                      accept="image/*" 
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Teks Pertanyaan</label>
                <textarea 
                  value={editingQuestion.text}
                  onChange={(e) => setEditingQuestion({...editingQuestion, text: e.target.value})}
                  className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white transition font-bold text-gray-800 h-32 outline-none"
                  placeholder="Tuliskan pertanyaan Anda..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Topik (Blueprint)</label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input type="text" value={editingQuestion.topic || ''} onChange={(e) => setEditingQuestion({...editingQuestion, topic: e.target.value})} placeholder="Misal: Aljabar" className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-100 bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-bold outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Tingkat Kesulitan</label>
                  <select value={editingQuestion.difficulty || 'medium'} onChange={(e) => setEditingQuestion({...editingQuestion, difficulty: e.target.value as any})} className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-bold outline-none">
                    <option value="easy">Mudah</option>
                    <option value="medium">Sedang</option>
                    <option value="hard">Sulit</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Bobot Nilai</label>
                  <input type="number" value={editingQuestion.points} onChange={(e) => setEditingQuestion({...editingQuestion, points: parseInt(e.target.value)})} className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-bold outline-none" />
                </div>
              </div>

              {editingQuestion.type === 'mcq' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Opsi Jawaban</label>
                    <label className="flex items-center gap-2 text-xs font-bold text-gray-600 cursor-pointer">
                      <input type="checkbox" checked={editingQuestion.randomizeOptions || false} onChange={(e) => setEditingQuestion({...editingQuestion, randomizeOptions: e.target.checked})} className="rounded text-indigo-600 focus:ring-indigo-500" />
                      Acak Pilihan
                    </label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(editingQuestion.options || ['', '', '', '']).map((opt, idx) => (
                      <div key={idx} className="relative group">
                        <input 
                          type="text" 
                          value={opt}
                          onChange={(e) => {
                            const newOpts = [...(editingQuestion.options || ['', '', '', ''])];
                            newOpts[idx] = e.target.value;
                            setEditingQuestion({...editingQuestion, options: newOpts});
                          }}
                          className={`w-full pl-12 pr-12 py-4 rounded-2xl border-2 font-bold text-gray-700 outline-none transition-all ${editingQuestion.correctAnswerIndex === idx ? 'border-green-600 bg-green-50/30' : 'border-gray-50 bg-gray-50/30'}`}
                        />
                        <button 
                          onClick={() => setEditingQuestion({...editingQuestion, correctAnswerIndex: idx})}
                          className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg ${editingQuestion.correctAnswerIndex === idx ? 'bg-green-600 text-white' : 'text-gray-200 hover:text-green-500'}`}
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-xs text-gray-300">{String.fromCharCode(65 + idx)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {editingQuestion.type === 'multiple_select' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Opsi Jawaban (Centang Semua yang Benar)</label>
                    <label className="flex items-center gap-2 text-xs font-bold text-gray-600 cursor-pointer">
                      <input type="checkbox" checked={editingQuestion.randomizeOptions || false} onChange={(e) => setEditingQuestion({...editingQuestion, randomizeOptions: e.target.checked})} className="rounded text-indigo-600 focus:ring-indigo-500" />
                      Acak Pilihan
                    </label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(editingQuestion.options || ['', '', '', '']).map((opt, idx) => (
                      <div key={idx} className="relative group">
                        <input 
                          type="text" 
                          value={opt}
                          onChange={(e) => {
                            const newOpts = [...(editingQuestion.options || ['', '', '', ''])];
                            newOpts[idx] = e.target.value;
                            setEditingQuestion({...editingQuestion, options: newOpts});
                          }}
                          className={`w-full pl-12 pr-12 py-4 rounded-2xl border-2 font-bold text-gray-700 outline-none transition-all ${editingQuestion.correctAnswerIndices?.includes(idx) ? 'border-green-600 bg-green-50/30' : 'border-gray-50 bg-gray-50/30'}`}
                        />
                        <button 
                          onClick={() => {
                            const currentIndices = editingQuestion.correctAnswerIndices || [];
                            const newIndices = currentIndices.includes(idx) 
                              ? currentIndices.filter(i => i !== idx) 
                              : [...currentIndices, idx];
                            setEditingQuestion({...editingQuestion, correctAnswerIndices: newIndices});
                          }}
                          className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg ${editingQuestion.correctAnswerIndices?.includes(idx) ? 'bg-green-600 text-white' : 'text-gray-200 hover:text-green-500'}`}
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-xs text-gray-300">{String.fromCharCode(65 + idx)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {editingQuestion.type === 'true_false' && (
                <div className="space-y-4">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Kunci Jawaban</label>
                  <div className="flex gap-4">
                    <button onClick={() => setEditingQuestion({...editingQuestion, trueFalseAnswer: true})} className={`flex-1 py-4 rounded-xl font-bold border-2 transition-all ${editingQuestion.trueFalseAnswer === true ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'}`}>Benar</button>
                    <button onClick={() => setEditingQuestion({...editingQuestion, trueFalseAnswer: false})} className={`flex-1 py-4 rounded-xl font-bold border-2 transition-all ${editingQuestion.trueFalseAnswer === false ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'}`}>Salah</button>
                  </div>
                </div>
              )}

              {editingQuestion.type === 'short_answer' && (
                <div className="space-y-4">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Kunci Jawaban (Isian Singkat)</label>
                  <input type="text" value={editingQuestion.shortAnswer || ''} onChange={(e) => setEditingQuestion({...editingQuestion, shortAnswer: e.target.value})} placeholder="Masukkan jawaban yang benar..." className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white transition font-bold text-gray-800 outline-none" />
                </div>
              )}

              {editingQuestion.type === 'essay' && (
                <div className="space-y-4">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Pedoman Jawaban / Rubrik</label>
                  <textarea 
                    value={editingQuestion.essayAnswer || ''}
                    onChange={(e) => setEditingQuestion({...editingQuestion, essayAnswer: e.target.value})}
                    className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-indigo-500 text-sm font-medium outline-none h-32"
                    placeholder="Masukkan poin-poin penting yang harus ada dalam jawaban siswa..."
                  />
                </div>
              )}

              <div className="space-y-4">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Pembahasan Soal (Opsional)</label>
                <div className="relative">
                  <AlertCircle className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                  <textarea value={editingQuestion.explanation || ''} onChange={(e) => setEditingQuestion({...editingQuestion, explanation: e.target.value})} placeholder="Penjelasan jawaban yang benar untuk ditampilkan setelah ujian..." className="w-full pl-12 pr-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white transition text-sm font-medium outline-none h-24" />
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8 border-t border-gray-50 bg-gray-50/30 flex justify-end gap-3 sticky bottom-0">
              <button onClick={() => setEditingQuestion(null)} className="px-6 py-4 text-gray-400 font-black uppercase text-xs">Batal</button>
              <button 
                onClick={() => handleSave(editingQuestion)}
                className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2"
              >
                <Save className="w-5 h-5" /> Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionBank;
