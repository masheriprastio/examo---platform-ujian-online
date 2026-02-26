import React, { useState } from 'react';
import { generateUUID } from '../lib/uuid';
import { Question, QuestionType } from '../types';
import RichTextEditor from './RichTextEditor';
import { uploadImageToSupabase } from '../lib/supabase';
import { 
  Plus, Search, Filter, Trash2, Edit2, Check, X,
  ChevronDown, ChevronUp, Database, Tag, AlertCircle, Save, ArrowLeft, GripVertical, Image as ImageIcon, Upload, Link as LinkIcon,
  AlignLeft, AlignCenter, AlignRight
} from 'lucide-react';

interface QuestionBankProps {
  questions: Question[];
  onUpdate: (questions: Question[]) => void;
  isLoading?: boolean;
}

const QuestionBank: React.FC<QuestionBankProps> = ({ questions = [], onUpdate, isLoading = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<QuestionType | 'all'>('all');
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);

  // Drag and Drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const filteredQuestions = (questions || []).filter(q => {
    if (!q) return false;
    const matchesSearch = (q.text || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (q.topic && q.topic.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'all' || q.type === filterType;
    return matchesSearch && matchesType;
  });

  const isReorderable = !searchTerm && filterType === 'all';

  const handleSaveQuestion = (updatedQ: Question) => {
    if ((questions || []).some(q => q && q.id === updatedQ.id)) {
      onUpdate((questions || []).map(q => (q && q.id === updatedQ.id) ? updatedQ : q));
    } else {
      onUpdate([updatedQ, ...(questions || [])]);
    }
    setEditingQuestion(null);
  };

  const handleDeleteQuestion = (id: string) => {
    onUpdate((questions || []).filter(q => q && q.id !== id));
    setQuestionToDelete(null);
  };

  const createNewQuestion = () => {
    const newQ: Question = {
      id: generateUUID(),
      type: 'mcq',
      text: '',
      points: 10,
      difficulty: 'medium',
      options: ['', '', '', ''],
      correctAnswerIndex: 0,
      randomizeOptions: false,
      optionAttachments: [undefined, undefined, undefined, undefined],
      explanation: '',
      topic: ''
    };
    setEditingQuestion(newQ);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    // Optional: Set a custom drag image or style
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault(); // Necessary to allow dropping
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);

    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const newQuestions = [...(questions || [])];
    const [movedItem] = newQuestions.splice(draggedIndex, 1);
    newQuestions.splice(targetIndex, 0, movedItem);

    onUpdate(newQuestions);
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  if (editingQuestion) {
    return (
      <QuestionEditor
        question={editingQuestion}
        onSave={handleSaveQuestion}
        onCancel={() => setEditingQuestion(null)}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Bank Soal</h1>
          <p className="text-gray-400 font-medium">Kelola koleksi soal ujian Anda.</p>
        </div>
        <button
          onClick={createNewQuestion}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-100"
        >
          <Plus className="w-5 h-5" /> Tambah Soal
        </button>
      </div>

      <div className="bg-white p-4 rounded-[30px] shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari soal atau topik..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition font-bold text-gray-700"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-5 h-5 text-gray-400 hidden md:block" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="w-full md:w-48 px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition font-bold text-gray-700"
          >
            <option value="all">Semua Tipe</option>
            <option value="mcq">Pilihan Ganda</option>
            <option value="multiple_select">Pilihan Ganda (Banyak)</option>
            <option value="true_false">Benar / Salah</option>
            <option value="short_answer">Isian Singkat</option>
            <option value="essay">Esai</option>
          </select>
        </div>
      </div>

      {!isReorderable && (
        <div className="mb-4 text-center">
           <span className="text-xs font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-full">Mode urutan dinonaktifkan saat filter aktif</span>
        </div>
      )}

      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 animate-pulse">
                <div className="flex justify-between items-start gap-4 mb-3">
                  <div className="h-6 w-24 bg-gray-200 rounded-lg"></div>
                  <div className="flex gap-2">
                    <div className="h-8 w-8 bg-gray-200 rounded-xl"></div>
                    <div className="h-8 w-8 bg-gray-200 rounded-xl"></div>
                  </div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[30px] border border-gray-100">
            <Database className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-xl font-black text-gray-900">Belum ada soal</h3>
            <p className="text-gray-400 mt-2">Mulai buat soal baru atau ubah filter pencarian.</p>
          </div>
        ) : (
          filteredQuestions.map((q, index) => {
            const isDragged = draggedIndex === index;
            const isDragOver = dragOverIndex === index && !isDragged;

            return (
              <div
                key={q.id}
                draggable={isReorderable}
                onDragStart={(e) => isReorderable && handleDragStart(e, index)}
                onDragOver={(e) => isReorderable && handleDragOver(e, index)}
                onDrop={(e) => isReorderable && handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`
                  bg-white p-6 rounded-[24px] shadow-sm border transition-all group relative
                  ${isDragged ? 'border-dashed border-2 border-indigo-300 opacity-50 bg-indigo-50' : 'border-gray-100 hover:shadow-md'}
                  ${isDragOver ? 'border-t-[4px] border-t-indigo-500 pt-[20px] -mt-[4px]' : ''}
                `}
              >
                <div className="flex justify-between items-start gap-4 mb-3">
                  <div className="flex items-start gap-3">
                    {isReorderable && (
                      <div className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-indigo-500 transition-colors p-1 -ml-2 self-center">
                        <GripVertical className="w-5 h-5" />
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                        {q.type === 'mcq' ? 'PG' : q.type === 'multiple_select' ? 'PG (Banyak)' : q.type === 'true_false' ? 'B/S' : q.type === 'short_answer' ? 'Isian' : 'Esai'}
                      </span>
                      {q.topic && <span className="px-3 py-1 bg-gray-50 text-gray-500 rounded-lg text-[10px] font-black uppercase tracking-widest border border-gray-100">{q.topic}</span>}
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${q.difficulty === 'hard' ? 'bg-red-50 text-red-600 border-red-100' : q.difficulty === 'easy' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-yellow-50 text-yellow-600 border-yellow-100'}`}>
                        {q.difficulty === 'hard' ? 'Sulit' : q.difficulty === 'easy' ? 'Mudah' : 'Sedang'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => setEditingQuestion(q)} className="p-2 text-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => setQuestionToDelete(q.id)} className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="font-bold text-gray-800 line-clamp-2 mb-2 pl-7 md:pl-0" dangerouslySetInnerHTML={{ __html: q.text || '(Tanpa Teks Soal)' }} />
                <div className="text-xs text-gray-400 font-medium pl-7 md:pl-0">Points: {q.points}</div>
              </div>
            );
          })
        )}
      </div>

      {questionToDelete && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in">
          <div className="bg-white p-8 rounded-[35px] max-w-sm w-full text-center shadow-2xl">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
              <Trash2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Hapus Soal?</h3>
            <p className="text-gray-500 font-medium mb-8 text-sm">Soal ini akan dihapus permanen dari bank soal.</p>
            <div className="flex gap-3">
              <button onClick={() => setQuestionToDelete(null)} className="flex-1 py-3 bg-gray-50 text-gray-500 rounded-xl font-bold hover:bg-gray-100 transition-all">Batal</button>
              <button onClick={() => handleDeleteQuestion(questionToDelete)} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-black hover:bg-red-700 transition-all shadow-lg shadow-red-100">Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const QuestionEditor: React.FC<{ question: Question, onSave: (q: Question) => void, onCancel: () => void }> = ({ question, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Question>({ ...question });
  const [uploadMode, setUploadMode] = useState<'url' | 'file'>('url');
  const [optionUploadMode, setOptionUploadMode] = useState<{ [key: string]: 'url' | 'file' }>({});

  const handleChange = (field: keyof Question, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleOptionChange = (idx: number, val: string) => {
    const newOpts = [...(formData.options || [])];
    newOpts[idx] = val;
    setFormData(prev => ({ ...prev, options: newOpts }));
  };

  const handleOptionAttachmentChange = (idx: number, url: string) => {
    const newAttachments = [...(formData.optionAttachments || Array(formData.options?.length || 0).fill(null))];
    if (url) {
      newAttachments[idx] = { type: 'image', url: url, caption: '' };
    } else {
      newAttachments[idx] = { url: undefined };
    }
    setFormData(prev => ({ ...prev, optionAttachments: newAttachments }));
  };

  const handleOptionFileUpload = async (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) { // 15MB limit
        alert("Ukuran file maksimal 15MB");
        e.target.value = ''; // Reset input
        return;
      }

      try {
        // Show loading state
        handleOptionAttachmentChange(idx, 'uploading...');

        // Upload to Supabase Storage
        // Use a generic ID if the question is new/doesn't have an exam ID context (though Bank uses UUIDs)
        const publicUrl = await uploadImageToSupabase(file, 'question-bank');
        handleOptionAttachmentChange(idx, publicUrl);
      } catch (error) {
        console.error('Option image upload failed:', error);
        alert(`Gagal upload gambar opsi: ${error instanceof Error ? error.message : 'Unknown error'}`);
        // Reset on error
        handleOptionAttachmentChange(idx, '');
      } finally {
        e.target.value = ''; // Reset input
      }
    }
  };

  const handleAttachmentChange = (url: string) => {
    if (url) {
        setFormData(prev => ({
            ...prev,
            attachment: { type: 'image', url: url, caption: '' }
        }));
    } else {
        setFormData(prev => {
            const { attachment, ...rest } = prev;
            return rest;
        });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) { // 15MB limit
        alert("Ukuran file maksimal 15MB");
        return;
      }

      try {
        setFormData(prev => ({
          ...prev,
          attachment: { type: 'image', url: 'uploading...', caption: '' }
        }));

        const publicUrl = await uploadImageToSupabase(file, 'question-bank');
        handleAttachmentChange(publicUrl);
      } catch (error) {
        alert(`Gagal upload gambar: ${error instanceof Error ? error.message : 'Unknown error'}`);
        handleAttachmentChange('');
      }
    }
  };

  const toggleOptionUploadMode = (key: string, mode: 'url' | 'file') => {
    setOptionUploadMode(prev => ({ ...prev, [key]: mode }));
  };

  return (
    <div className="fixed inset-0 bg-white z-[60] flex flex-col font-sans text-left overflow-hidden animate-in slide-in-from-bottom-10">
      <header className="px-6 md:px-8 py-4 border-b border-gray-100 flex justify-between items-center bg-white shadow-sm shrink-0">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-50 p-2 rounded-xl border border-indigo-100 hidden md:block">
            <Database className="w-5 h-5 text-indigo-600" />
          </div>
          <button onClick={onCancel} className="md:hidden p-2 -ml-2 text-gray-400 hover:text-gray-900"><ArrowLeft className="w-6 h-6" /></button>
          <h2 className="text-xl font-black text-gray-900">Editor Soal</h2>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="hidden md:block px-6 py-2 text-gray-500 font-bold hover:bg-gray-50 rounded-xl transition text-sm">Batal</button>
          <button
            onClick={() => onSave(formData)}
            disabled={!formData.text}
            className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-black shadow-lg shadow-indigo-100 flex items-center gap-2 transition-all active:scale-95 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" /> Simpan
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto bg-gray-50/50 p-4 md:p-8 pb-32 md:pb-10">
        <div className="max-w-4xl mx-auto space-y-6 md:space-y-10">
          <div className="bg-white p-6 md:p-10 rounded-[30px] shadow-sm border border-gray-100 space-y-6">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Pertanyaan</label>
              <div className="mb-2 flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
                <button
                  onClick={() => handleChange('textAlign', 'left')}
                  className={`p-2 rounded-md text-xs transition-all ${formData.textAlign === 'left' || !formData.textAlign ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                  title="Rata Kiri"
                >
                  <AlignLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleChange('textAlign', 'center')}
                  className={`p-2 rounded-md text-xs transition-all ${formData.textAlign === 'center' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                  title="Rata Tengah"
                >
                  <AlignCenter className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleChange('textAlign', 'right')}
                  className={`p-2 rounded-md text-xs transition-all ${formData.textAlign === 'right' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                  title="Rata Kanan"
                >
                  <AlignRight className="w-4 h-4" />
                </button>
              </div>
              <RichTextEditor
                value={formData.text}
                onChange={(val) => handleChange('text', val)}
                placeholder="Tulis pertanyaan Anda di sini..."
                height="150px"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-[10px] font-black text-gray-400 uppercase flex items-center gap-2">
                    <ImageIcon className="w-3 h-3" /> Lampiran Gambar
                </label>
                <div className="flex bg-gray-100 rounded-lg p-0.5">
                    <button
                      onClick={() => setUploadMode('url')}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 ${uploadMode === 'url' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      <LinkIcon className="w-3 h-3" /> URL
                    </button>
                    <button
                      onClick={() => setUploadMode('file')}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 ${uploadMode === 'file' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      <Upload className="w-3 h-3" /> Upload
                    </button>
                </div>
              </div>

              <div className="flex gap-2 items-start">
                  {uploadMode === 'url' ? (
                      <input
                          type="text"
                          value={formData.attachment?.url || ''}
                          onChange={(e) => handleAttachmentChange(e.target.value)}
                          placeholder="https://example.com/image.jpg"
                          className="flex-1 px-4 py-2.5 rounded-xl border border-gray-100 bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-bold outline-none"
                      />
                  ) : (
                      <div className="flex-1 relative">
                          <input
                              type="file"
                              accept="image/*"
                              onChange={handleFileUpload}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          />
                          <div className="w-full px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 text-center hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 text-gray-400 font-bold text-xs">
                              <Upload className="w-3 h-3" />
                              {formData.attachment?.url?.startsWith('data:') ? 'Ganti File...' : 'Klik untuk Upload'}
                          </div>
                      </div>
                  )}

                  {formData.attachment?.url && (
                      <div className="relative group shrink-0">
                          <div className="w-10 h-10 rounded-lg bg-gray-200 border border-gray-300 overflow-hidden">
                              <img src={formData.attachment.url} alt="Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = 'https://placehold.co/100x100?text=Error')} />
                          </div>
                          <button
                            onClick={() => handleAttachmentChange('')}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                            title="Hapus Gambar"
                          >
                            <X className="w-3 h-3" />
                          </button>
                      </div>
                  )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Tipe Soal</label>
                <select value={formData.type} onChange={(e) => handleChange('type', e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-bold outline-none">
                  <option value="mcq">Pilihan Ganda</option>
                  <option value="multiple_select">Pilihan Ganda (Banyak)</option>
                  <option value="true_false">Benar / Salah</option>
                  <option value="short_answer">Isian Singkat</option>
                  <option value="essay">Esai</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Topik</label>
                <div className="relative">
                  <Tag className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input type="text" value={formData.topic || ''} onChange={(e) => handleChange('topic', e.target.value)} placeholder="Misal: Aljabar" className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-100 bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-bold outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Bobot Nilai</label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.points}
                  onChange={(e) => handleChange('points', parseFloat(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-bold outline-none"
                />
              </div>
            </div>

            {/* Answer Section Based on Type */}
            {formData.type === 'mcq' && (
              <>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase">Pilihan Jawaban</label>
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-600 cursor-pointer">
                    <input type="checkbox" checked={formData.randomizeOptions || false} onChange={(e) => handleChange('randomizeOptions', e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                    Acak Pilihan
                  </label>
                </div>

                <div className="space-y-4">
                  {formData.options?.map((opt, oIndex) => (
                    <div key={oIndex} className="bg-gray-50 p-4 rounded-2xl border-2 border-gray-100 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-400 border border-gray-200">
                            {String.fromCharCode(65 + oIndex)}
                          </div>
                          <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
                            Jawaban {String.fromCharCode(65 + oIndex)}
                          </label>
                        </div>
                        <button
                          onClick={() => handleChange('correctAnswerIndex', oIndex)}
                          className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 text-xs font-bold ${formData.correctAnswerIndex === oIndex ? 'bg-green-600 text-white shadow-lg shadow-green-200' : 'bg-gray-200 text-gray-400 hover:bg-gray-300'}`}
                        >
                          <Check className="w-4 h-4" /> {formData.correctAnswerIndex === oIndex ? 'Jawaban Benar' : 'Tandai Benar'}
                        </button>
                      </div>

                      <RichTextEditor
                        value={opt}
                        onChange={(value) => handleOptionChange(oIndex, value)}
                        placeholder={`Masukkan teks untuk pilihan ${String.fromCharCode(65 + oIndex)}...`}
                        height="120px"
                      />

                      <div className="flex items-center gap-2">
                          <div className="flex bg-gray-100 rounded-lg p-0.5">
                            <button
                              onClick={() => toggleOptionUploadMode(`${formData.id}_${oIndex}`, 'url')}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 ${(!optionUploadMode[`${formData.id}_${oIndex}`] || optionUploadMode[`${formData.id}_${oIndex}`] === 'url') ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                              <LinkIcon className="w-3 h-3" /> URL
                            </button>
                            <button
                              onClick={() => toggleOptionUploadMode(`${formData.id}_${oIndex}`, 'file')}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 ${optionUploadMode[`${formData.id}_${oIndex}`] === 'file' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                              <Upload className="w-3 h-3" /> Upload
                            </button>
                          </div>

                          <div className="flex-1">
                            {(!optionUploadMode[`${formData.id}_${oIndex}`] || optionUploadMode[`${formData.id}_${oIndex}`] === 'url') ? (
                              <input
                                type="text"
                                value={formData.optionAttachments?.[oIndex]?.url || ''}
                                onChange={(e) => handleOptionAttachmentChange(oIndex, e.target.value)}
                                placeholder="URL Gambar (Opsional)"
                                className="w-full px-3 py-2 rounded-xl border border-gray-100 bg-white focus:ring-2 focus:ring-indigo-500 text-xs font-bold outline-none"
                              />
                            ) : (
                              <div className="relative">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleOptionFileUpload(oIndex, e)}
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <div className="w-full px-3 py-2 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 text-center hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 text-gray-400 font-bold text-xs">
                                  <Upload className="w-3 h-3" />
                                  {formData.optionAttachments?.[oIndex]?.url === 'uploading...' ? 'Mengunggah...' : 'Upload Gambar'}
                                </div>
                              </div>
                            )}
                          </div>

                          {formData.optionAttachments?.[oIndex]?.url && (
                            <div className="relative group shrink-0">
                                <div className="w-10 h-10 rounded-lg bg-gray-200 border border-gray-300 overflow-hidden">
                                    <img src={formData.optionAttachments[oIndex]?.url} alt="Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = 'https://placehold.co/100x100?text=Error')} />
                                </div>
                                <button
                                  onClick={() => handleOptionAttachmentChange(oIndex, '')}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                  title="Hapus Gambar"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                            </div>
                          )}
                      </div>

                      {(formData.options?.length || 0) > 2 && (
                        <button
                          onClick={() => {
                            const newOptions = formData.options?.filter((_, i) => i !== oIndex) || [];
                            handleChange('options', newOptions);
                            if (formData.correctAnswerIndex === oIndex) {
                              handleChange('correctAnswerIndex', 0);
                            }
                          }}
                          className="w-full py-2 rounded-lg bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-all flex items-center justify-center gap-2 text-xs"
                        >
                          <Trash2 className="w-3 h-3" /> Hapus Pilihan
                        </button>
                      )}
                    </div>
                  ))}

                  {(formData.options?.length || 0) < 8 && (
                    <button
                      onClick={() => {
                        const newOptions = [...(formData.options || []), ''];
                        handleChange('options', newOptions);
                      }}
                      className="w-full py-3 border-2 border-dashed border-indigo-300 rounded-xl text-indigo-600 font-bold hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      <Plus className="w-4 h-4" /> Tambah Pilihan
                    </button>
                  )}
                </div>
              </>
            )}

            {formData.type === 'multiple_select' && (
              <>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase">Pilihan Jawaban (Banyak)</label>
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-600 cursor-pointer">
                    <input type="checkbox" checked={formData.randomizeOptions || false} onChange={(e) => handleChange('randomizeOptions', e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                    Acak Pilihan
                  </label>
                </div>

                <div className="space-y-4">
                  {formData.options?.map((opt, oIndex) => (
                    <div key={oIndex} className="bg-gray-50 p-4 rounded-2xl border-2 border-gray-100 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-400 border border-gray-200">
                            {String.fromCharCode(65 + oIndex)}
                          </div>
                          <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
                            Jawaban {String.fromCharCode(65 + oIndex)}
                          </label>
                        </div>
                        <button
                          onClick={() => {
                            const currentIndices = formData.correctAnswerIndices || [];
                            const newIndices = currentIndices.includes(oIndex)
                              ? currentIndices.filter(i => i !== oIndex)
                              : [...currentIndices, oIndex];
                            handleChange('correctAnswerIndices', newIndices);
                          }}
                          className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 text-xs font-bold ${formData.correctAnswerIndices?.includes(oIndex) ? 'bg-green-600 text-white shadow-lg shadow-green-200' : 'bg-gray-200 text-gray-400 hover:bg-gray-300'}`}
                        >
                          <Check className="w-4 h-4" /> {formData.correctAnswerIndices?.includes(oIndex) ? 'Jawaban Benar' : 'Tandai Benar'}
                        </button>
                      </div>

                      <RichTextEditor
                        value={opt}
                        onChange={(value) => handleOptionChange(oIndex, value)}
                        placeholder={`Masukkan teks untuk pilihan ${String.fromCharCode(65 + oIndex)}...`}
                        height="120px"
                      />

                      {/* Option Image Upload - same as MCQ */}
                      <div className="flex items-center gap-2">
                          <div className="flex bg-gray-100 rounded-lg p-0.5">
                            <button
                              onClick={() => toggleOptionUploadMode(`${formData.id}_${oIndex}`, 'url')}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 ${(!optionUploadMode[`${formData.id}_${oIndex}`] || optionUploadMode[`${formData.id}_${oIndex}`] === 'url') ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                              <LinkIcon className="w-3 h-3" /> URL
                            </button>
                            <button
                              onClick={() => toggleOptionUploadMode(`${formData.id}_${oIndex}`, 'file')}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 ${optionUploadMode[`${formData.id}_${oIndex}`] === 'file' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                              <Upload className="w-3 h-3" /> Upload
                            </button>
                          </div>

                          <div className="flex-1">
                            {(!optionUploadMode[`${formData.id}_${oIndex}`] || optionUploadMode[`${formData.id}_${oIndex}`] === 'url') ? (
                              <input
                                type="text"
                                value={formData.optionAttachments?.[oIndex]?.url || ''}
                                onChange={(e) => handleOptionAttachmentChange(oIndex, e.target.value)}
                                placeholder="URL Gambar (Opsional)"
                                className="w-full px-3 py-2 rounded-xl border border-gray-100 bg-white focus:ring-2 focus:ring-indigo-500 text-xs font-bold outline-none"
                              />
                            ) : (
                              <div className="relative">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleOptionFileUpload(oIndex, e)}
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <div className="w-full px-3 py-2 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 text-center hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 text-gray-400 font-bold text-xs">
                                  <Upload className="w-3 h-3" />
                                  {formData.optionAttachments?.[oIndex]?.url === 'uploading...' ? 'Mengunggah...' : 'Upload Gambar'}
                                </div>
                              </div>
                            )}
                          </div>

                          {formData.optionAttachments?.[oIndex]?.url && (
                            <div className="relative group shrink-0">
                                <div className="w-10 h-10 rounded-lg bg-gray-200 border border-gray-300 overflow-hidden">
                                    <img src={formData.optionAttachments[oIndex]?.url} alt="Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = 'https://placehold.co/100x100?text=Error')} />
                                </div>
                                <button
                                  onClick={() => handleOptionAttachmentChange(oIndex, '')}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                  title="Hapus Gambar"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                            </div>
                          )}
                      </div>

                      {(formData.options?.length || 0) > 2 && (
                        <button
                          onClick={() => {
                            const newOptions = formData.options?.filter((_, i) => i !== oIndex) || [];
                            handleChange('options', newOptions);
                            const currentIndices = formData.correctAnswerIndices || [];
                            const newIndices = currentIndices.filter(i => i !== oIndex);
                            handleChange('correctAnswerIndices', newIndices);
                          }}
                          className="w-full py-2 rounded-lg bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-all flex items-center justify-center gap-2 text-xs"
                        >
                          <Trash2 className="w-3 h-3" /> Hapus Pilihan
                        </button>
                      )}
                    </div>
                  ))}

                  {(formData.options?.length || 0) < 8 && (
                    <button
                      onClick={() => {
                        const newOptions = [...(formData.options || []), ''];
                        handleChange('options', newOptions);
                      }}
                      className="w-full py-3 border-2 border-dashed border-indigo-300 rounded-xl text-indigo-600 font-bold hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      <Plus className="w-4 h-4" /> Tambah Pilihan
                    </button>
                  )}
                </div>
              </>
            )}

            {formData.type === 'true_false' && (
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Kunci Jawaban</label>
                <div className="flex gap-4">
                  <button onClick={() => handleChange('trueFalseAnswer', true)} className={`flex-1 py-3 rounded-xl font-bold border-2 transition-all ${formData.trueFalseAnswer === true ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'}`}>Benar</button>
                  <button onClick={() => handleChange('trueFalseAnswer', false)} className={`flex-1 py-3 rounded-xl font-bold border-2 transition-all ${formData.trueFalseAnswer === false ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'}`}>Salah</button>
                </div>
              </div>
            )}

            {formData.type === 'short_answer' && (
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Kunci Jawaban (Isian Singkat)</label>
                <input type="text" value={formData.shortAnswer || ''} onChange={(e) => handleChange('shortAnswer', e.target.value)} placeholder="Masukkan jawaban yang benar..." className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-indigo-500 font-bold outline-none" />
              </div>
            )}

            {formData.type === 'essay' && (
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Panduan Jawaban / Rubrik (Esai)</label>
                <RichTextEditor
                  value={formData.essayAnswer || ''}
                  onChange={(val) => handleChange('essayAnswer', val)}
                  placeholder="Masukkan poin-poin penting yang harus ada dalam jawaban siswa..."
                  height="150px"
                />
              </div>
            )}

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Pembahasan Soal (Opsional)</label>
              <div className="relative">
                <RichTextEditor
                  value={formData.explanation || ''}
                  onChange={(val) => handleChange('explanation', val)}
                  placeholder="Penjelasan jawaban yang benar untuk ditampilkan setelah ujian..."
                  height="120px"
                />
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionBank;