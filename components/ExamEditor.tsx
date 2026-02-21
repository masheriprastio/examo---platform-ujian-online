
import React, { useState } from 'react';
import { Exam, Question, QuestionType } from '../types';
import { 
  Save, Plus, Trash2, Check, Clock, Type, Star, X, 
  ChevronDown, ChevronUp, Database, GripVertical, Shuffle, Tag, AlertCircle, Eye, Image as ImageIcon, Upload, Link as LinkIcon
} from 'lucide-react';

interface ExamEditorProps {
  exam: Exam;
  onSave: (updatedExam: Exam) => void;
  onCancel: () => void;
  onSaveToBank?: (q: Question) => void;
  onPreview?: (exam: Exam) => void;
}

const ExamEditor: React.FC<ExamEditorProps> = ({ exam, onSave, onCancel, onSaveToBank, onPreview }) => {
  const [formData, setFormData] = useState<Exam>({ ...exam });
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(formData.questions[0]?.id || null);
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [uploadMode, setUploadMode] = useState<Record<string, 'url' | 'file'>>({});
  
  const handleExamChange = (field: keyof Exam, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleQuestionChange = (qIndex: number, field: keyof Question, value: any) => {
    const newQuestions = [...formData.questions];
    newQuestions[qIndex] = { ...newQuestions[qIndex], [field]: value };
    setFormData(prev => ({ ...prev, questions: newQuestions }));
  };

  const handleAttachmentChange = (qIndex: number, url: string) => {
    const newQuestions = [...formData.questions];
    if (url) {
        newQuestions[qIndex] = {
            ...newQuestions[qIndex],
            attachment: { type: 'image', url: url, caption: '' }
        };
    } else {
        const { attachment, ...rest } = newQuestions[qIndex];
        newQuestions[qIndex] = rest;
    }
    setFormData(prev => ({ ...prev, questions: newQuestions }));
  };

  const handleFileUpload = (qIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert("Ukuran file maksimal 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        handleAttachmentChange(qIndex, reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleUploadMode = (qId: string, mode: 'url' | 'file') => {
      setUploadMode(prev => ({ ...prev, [qId]: mode }));
  };

  const handleOptionChange = (qIndex: number, oIndex: number, value: string) => {
    const newQuestions = [...formData.questions];
    const newOptions = [...newQuestions[qIndex].options!];
    newOptions[oIndex] = value;
    newQuestions[qIndex] = { ...newQuestions[qIndex], options: newOptions };
    setFormData(prev => ({ ...prev, questions: newQuestions }));
  };

  const addQuestion = (type: QuestionType = 'mcq') => {
    const newQuestion: Question = {
      id: `new-q-${Date.now()}`,
      type,
      text: 'Pertanyaan Baru',
      points: 10,
      explanation: '',
      difficulty: 'medium',
      ...(type === 'mcq' ? { options: ['Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D'], correctAnswerIndex: 0, randomizeOptions: false } : {}),
      ...(type === 'multiple_select' ? { options: ['Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D'], correctAnswerIndices: [], randomizeOptions: false } : {}),
      ...(type === 'true_false' ? { trueFalseAnswer: true } : {}),
      ...(type === 'short_answer' ? { shortAnswer: '' } : {}),
      ...(type === 'essay' ? { essayAnswer: '' } : {})
    };
    setFormData(prev => ({ ...prev, questions: [...prev.questions, newQuestion] }));
    setActiveQuestionId(newQuestion.id);
  };

  const moveQuestion = (idx: number, dir: 'up' | 'down') => {
    const target = dir === 'up' ? idx - 1 : idx + 1;
    if (target < 0 || target >= formData.questions.length) return;
    
    const newQs = [...formData.questions];
    [newQs[idx], newQs[target]] = [newQs[target], newQs[idx]];
    setFormData(prev => ({ ...prev, questions: newQs }));
  };

  // DnD Handlers
  const onDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const newQs = [...formData.questions];
    const draggedItem = newQs.splice(draggedIndex, 1)[0];
    newQs.splice(index, 0, draggedItem);
    
    setDraggedIndex(index);
    setFormData(prev => ({ ...prev, questions: newQs }));
  };

  return (
    <div className="fixed inset-0 bg-white z-[60] flex flex-col font-sans text-left overflow-hidden">
      <header className="px-6 md:px-8 py-4 md:py-5 border-b border-gray-100 flex justify-between items-center bg-white shadow-sm shrink-0">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-50 p-2 rounded-xl border border-indigo-100 hidden md:block">
            <Database className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-black text-gray-900 leading-none">Editor Ujian</h2>
          </div>
        </div>
        <div className="flex gap-2">
          {onPreview && (
            <button 
              onClick={() => onPreview(formData)} 
              className="px-4 py-2 bg-white border-2 border-indigo-100 text-indigo-600 rounded-xl hover:bg-indigo-50 font-bold flex items-center gap-2 transition-all text-sm"
            >
              <Eye className="w-4 h-4" /> Preview
            </button>
          )}
          <button onClick={onCancel} className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-50 rounded-xl transition text-sm">Batal</button>
          <button onClick={() => onSave(formData)} className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-black shadow-lg shadow-indigo-100 flex items-center gap-2 transition-all active:scale-95 text-sm">
            <Save className="w-4 h-4" /> Simpan
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto bg-gray-50/50 p-4 md:p-10">
        <div className="max-w-4xl mx-auto space-y-6 md:space-y-10">
          <section className="bg-white rounded-[30px] md:rounded-[40px] shadow-sm border border-gray-100 p-6 md:p-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Judul Ujian</label>
                <input type="text" value={formData.title} onChange={(e) => handleExamChange('title', e.target.value)} className="w-full px-5 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition font-bold" />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Kategori</label>
                <input type="text" value={formData.category} onChange={(e) => handleExamChange('category', e.target.value)} className="w-full px-5 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white outline-none transition font-bold" />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Durasi (Menit)</label>
                <input type="number" value={formData.durationMinutes} onChange={(e) => handleExamChange('durationMinutes', parseInt(e.target.value))} className="w-full px-5 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white outline-none transition font-bold" />
              </div>
              <div className="md:col-span-2 flex flex-col md:flex-row gap-4 mt-2">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="randomizeQuestions"
                    checked={formData.randomizeQuestions || false}
                    onChange={(e) => handleExamChange('randomizeQuestions', e.target.checked)}
                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <label htmlFor="randomizeQuestions" className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <Shuffle className="w-4 h-4 text-gray-400" />
                    Acak Urutan Soal
                  </label>
                </div>

                <div className="flex items-center gap-3">
                   <input
                      type="checkbox"
                      id="publishExam"
                      checked={formData.status === 'published'}
                      onChange={(e) => handleExamChange('status', e.target.checked ? 'published' : 'draft')}
                      className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                    />
                    <label htmlFor="publishExam" className="text-sm font-bold text-gray-700 flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      Publikasikan Ujian (Tampil ke Siswa)
                    </label>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xl font-black text-gray-900 tracking-tight">Daftar Pertanyaan</h3>
              <div className="flex gap-2">
                <select 
                  className="bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-xl text-xs font-bold outline-none"
                  onChange={(e) => {
                    if (e.target.value) {
                      addQuestion(e.target.value as QuestionType);
                      e.target.value = '';
                    }
                  }}
                  defaultValue=""
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

            <div className="space-y-3">
              {formData.questions.map((q, qIndex) => (
                <div 
                  key={q.id} 
                  draggable 
                  onDragStart={(e) => onDragStart(e, qIndex)}
                  onDragOver={(e) => onDragOver(e, qIndex)}
                  onDragEnd={() => setDraggedIndex(null)}
                  className={`bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden transition-all ${draggedIndex === qIndex ? 'opacity-40 border-indigo-400 border-dashed' : ''}`}
                >
                  <div 
                    onClick={() => setActiveQuestionId(activeQuestionId === q.id ? null : q.id)}
                    className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50/50"
                  >
                    <div className="flex items-center gap-4 flex-1 overflow-hidden">
                      <div className="flex flex-col md:hidden shrink-0">
                        <button onClick={(e) => { e.stopPropagation(); moveQuestion(qIndex, 'up'); }} className="p-1 text-gray-300"><ChevronUp className="w-4 h-4"/></button>
                        <button onClick={(e) => { e.stopPropagation(); moveQuestion(qIndex, 'down'); }} className="p-1 text-gray-300"><ChevronDown className="w-4 h-4"/></button>
                      </div>
                      <div className="hidden md:block p-1 text-gray-300 cursor-grab active:cursor-grabbing"><GripVertical className="w-5 h-5"/></div>
                      <span className="w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center font-black text-xs shrink-0">{qIndex + 1}</span>
                      <span className="text-gray-700 font-bold truncate text-sm">{q.text}</span>
                      {q.attachment?.url && <ImageIcon className="w-4 h-4 text-indigo-500 ml-2" />}
                    </div>
                    <div className="flex items-center gap-1">
                      {onSaveToBank && (
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            onSaveToBank(q); 
                            alert('Soal disimpan ke Bank Soal!');
                          }} 
                          className="p-2 text-indigo-300 hover:text-indigo-600"
                          title="Simpan ke Bank Soal"
                        >
                          <Database className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={(e) => { e.stopPropagation(); setQuestionToDelete(q.id); }} className="p-2 text-red-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                      {activeQuestionId === q.id ? <ChevronUp className="w-4 h-4 text-indigo-400" /> : <ChevronDown className="w-4 h-4 text-gray-300" />}
                    </div>
                  </div>

                  {activeQuestionId === q.id && (
                    <div className="p-6 md:p-8 bg-gray-50/30 border-t border-gray-50 space-y-6 animate-in slide-in-from-top-2">
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Pertanyaan</label>
                        <textarea value={q.text} onChange={(e) => handleQuestionChange(qIndex, 'text', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-indigo-500 h-20 font-bold outline-none" />
                      </div>

                      {/* Image Attachment Input */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase flex items-center gap-2">
                              <ImageIcon className="w-3 h-3" /> Lampiran Gambar
                          </label>
                          <div className="flex bg-gray-100 rounded-lg p-0.5">
                              <button
                                onClick={() => toggleUploadMode(q.id, 'url')}
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 ${(!uploadMode[q.id] || uploadMode[q.id] === 'url') ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                              >
                                <LinkIcon className="w-3 h-3" /> URL
                              </button>
                              <button
                                onClick={() => toggleUploadMode(q.id, 'file')}
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 ${uploadMode[q.id] === 'file' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                              >
                                <Upload className="w-3 h-3" /> Upload
                              </button>
                          </div>
                        </div>

                        <div className="flex gap-2 items-start">
                            {(!uploadMode[q.id] || uploadMode[q.id] === 'url') ? (
                                <input
                                    type="text"
                                    value={q.attachment?.url || ''}
                                    onChange={(e) => handleAttachmentChange(qIndex, e.target.value)}
                                    placeholder="https://example.com/image.jpg"
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-100 bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-bold outline-none"
                                />
                            ) : (
                                <div className="flex-1 relative">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleFileUpload(qIndex, e)}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    <div className="w-full px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 text-center hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 text-gray-400 font-bold text-xs">
                                        <Upload className="w-3 h-3" />
                                        {q.attachment?.url?.startsWith('data:') ? 'Ganti File...' : 'Klik untuk Upload'}
                                    </div>
                                </div>
                            )}

                            {q.attachment?.url && (
                                <div className="relative group shrink-0">
                                    <div className="w-10 h-10 rounded-lg bg-gray-200 border border-gray-300 overflow-hidden">
                                        <img src={q.attachment.url} alt="Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = 'https://placehold.co/100x100?text=Error')} />
                                    </div>
                                    <button
                                      onClick={() => handleAttachmentChange(qIndex, '')}
                                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                      title="Hapus Gambar"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                </div>
                            )}
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">
                          {(!uploadMode[q.id] || uploadMode[q.id] === 'url') ? 'Masukkan URL gambar langsung.' : 'Maksimal ukuran file 5MB.'}
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Topik (Blueprint)</label>
                          <div className="relative">
                            <Tag className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                            <input type="text" value={q.topic || ''} onChange={(e) => handleQuestionChange(qIndex, 'topic', e.target.value)} placeholder="Misal: Aljabar" className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-100 bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-bold outline-none" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Tingkat Kesulitan</label>
                          <select value={q.difficulty || 'medium'} onChange={(e) => handleQuestionChange(qIndex, 'difficulty', e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-bold outline-none">
                            <option value="easy">Mudah</option>
                            <option value="medium">Sedang</option>
                            <option value="hard">Sulit</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Bobot Nilai</label>
                          <input type="number" value={q.points} onChange={(e) => handleQuestionChange(qIndex, 'points', parseInt(e.target.value) || 0)} className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-bold outline-none" />
                        </div>
                      </div>

                      {q.type === 'mcq' && (
                        <>
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-[10px] font-black text-gray-400 uppercase">Pilihan Jawaban</label>
                            <label className="flex items-center gap-2 text-xs font-bold text-gray-600 cursor-pointer">
                              <input type="checkbox" checked={q.randomizeOptions || false} onChange={(e) => handleQuestionChange(qIndex, 'randomizeOptions', e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                              Acak Pilihan
                            </label>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {q.options?.map((opt, oIndex) => (
                              <div key={oIndex} className="relative">
                                <input type="text" value={opt} onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)} className={`w-full pl-10 pr-10 py-3 rounded-xl border-2 font-bold text-sm outline-none transition-all ${q.correctAnswerIndex === oIndex ? 'border-green-600 bg-green-50/30' : 'border-gray-50 bg-white'}`} />
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-300">{String.fromCharCode(65 + oIndex)}</div>
                                <button onClick={() => handleQuestionChange(qIndex, 'correctAnswerIndex', oIndex)} className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg ${q.correctAnswerIndex === oIndex ? 'bg-green-600 text-white' : 'text-gray-200 hover:text-green-500'}`}><Check className="w-4 h-4" /></button>
                              </div>
                            ))}
                          </div>
                        </>
                      )}

                      {q.type === 'multiple_select' && (
                        <>
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-[10px] font-black text-gray-400 uppercase">Pilihan Jawaban (Centang Semua yang Benar)</label>
                            <label className="flex items-center gap-2 text-xs font-bold text-gray-600 cursor-pointer">
                              <input type="checkbox" checked={q.randomizeOptions || false} onChange={(e) => handleQuestionChange(qIndex, 'randomizeOptions', e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                              Acak Pilihan
                            </label>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {q.options?.map((opt, oIndex) => (
                              <div key={oIndex} className="relative">
                                <input type="text" value={opt} onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)} className={`w-full pl-10 pr-10 py-3 rounded-xl border-2 font-bold text-sm outline-none transition-all ${q.correctAnswerIndices?.includes(oIndex) ? 'border-green-600 bg-green-50/30' : 'border-gray-50 bg-white'}`} />
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-300">{String.fromCharCode(65 + oIndex)}</div>
                                <button onClick={() => {
                                  const currentIndices = q.correctAnswerIndices || [];
                                  const newIndices = currentIndices.includes(oIndex) 
                                    ? currentIndices.filter(i => i !== oIndex) 
                                    : [...currentIndices, oIndex];
                                  handleQuestionChange(qIndex, 'correctAnswerIndices', newIndices);
                                }} className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg ${q.correctAnswerIndices?.includes(oIndex) ? 'bg-green-600 text-white' : 'text-gray-200 hover:text-green-500'}`}><Check className="w-4 h-4" /></button>
                              </div>
                            ))}
                          </div>
                        </>
                      )}

                      {q.type === 'true_false' && (
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Kunci Jawaban</label>
                          <div className="flex gap-4">
                            <button onClick={() => handleQuestionChange(qIndex, 'trueFalseAnswer', true)} className={`flex-1 py-3 rounded-xl font-bold border-2 transition-all ${q.trueFalseAnswer === true ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'}`}>Benar</button>
                            <button onClick={() => handleQuestionChange(qIndex, 'trueFalseAnswer', false)} className={`flex-1 py-3 rounded-xl font-bold border-2 transition-all ${q.trueFalseAnswer === false ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'}`}>Salah</button>
                          </div>
                        </div>
                      )}

                      {q.type === 'short_answer' && (
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Kunci Jawaban (Isian Singkat)</label>
                          <input type="text" value={q.shortAnswer || ''} onChange={(e) => handleQuestionChange(qIndex, 'shortAnswer', e.target.value)} placeholder="Masukkan jawaban yang benar..." className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-indigo-500 font-bold outline-none" />
                        </div>
                      )}

                      {q.type === 'essay' && (
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Panduan Jawaban / Rubrik (Esai)</label>
                          <textarea value={q.essayAnswer || ''} onChange={(e) => handleQuestionChange(qIndex, 'essayAnswer', e.target.value)} placeholder="Masukkan poin-poin penting yang harus ada dalam jawaban siswa..." className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-indigo-500 h-24 font-bold outline-none text-sm" />
                        </div>
                      )}

                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Pembahasan Soal (Opsional)</label>
                        <div className="relative">
                          <AlertCircle className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                          <textarea value={q.explanation || ''} onChange={(e) => handleQuestionChange(qIndex, 'explanation', e.target.value)} placeholder="Penjelasan jawaban yang benar untuk ditampilkan setelah ujian..." className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 h-20 text-sm font-medium outline-none" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {questionToDelete && (
        <div className="fixed inset-0 bg-gray-900/60 flex items-center justify-center z-[70] p-6 animate-in fade-in">
          <div className="bg-white p-8 rounded-[35px] max-w-sm w-full text-center">
            <h3 className="text-xl font-black mb-6">Hapus Soal?</h3>
            <div className="flex gap-3">
              <button onClick={() => setQuestionToDelete(null)} className="flex-1 py-3 bg-gray-50 text-gray-500 rounded-xl font-bold">Batal</button>
              <button onClick={() => { setFormData(prev => ({ ...prev, questions: prev.questions.filter(q => q.id !== questionToDelete) })); setQuestionToDelete(null); }} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-black">Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamEditor;