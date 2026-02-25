
import React, { useState } from 'react';
import { generateUUID } from '../lib/uuid';
import { Question, QuestionType } from '../types';
import RichTextEditor from './RichTextEditor';
import { 
  Plus, Search, Filter, Trash2, Edit2, Check, X,
  ChevronDown, ChevronUp, Database, Tag, AlertCircle, Save, ArrowLeft, GripVertical, Image as ImageIcon, Upload, Link as LinkIcon,
  AlignLeft, AlignCenter, AlignRight
} from 'lucide-react';

interface QuestionBankProps {
  questions: Question[];
  onUpdate: (questions: Question[]) => void;
}

const QuestionBank: React.FC<QuestionBankProps> = ({ questions = [], onUpdate }) => {
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
        {filteredQuestions.length === 0 ? (
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
                <p className="font-bold text-gray-800 line-clamp-2 mb-2 pl-7 md:pl-0">{q.text || '(Tanpa Teks Soal)'}</p>
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
  const [optionUploadMode, setOptionUploadMode] = useState<{ [key: number]: 'url' | 'file' }>({});

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

  const handleOptionFileUpload = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) { // 15MB limit
        alert("Ukuran file maksimal 15MB");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        handleOptionAttachmentChange(idx, reader.result as string);
      };
      reader.readAsDataURL(file);
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) { // 15MB limit
        alert("Ukuran file maksimal 15MB");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        handleAttachmentChange(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-[60] flex flex-col font-sans text-left overflow-hidden animate-in slide-in-from-bottom-10">
      <header className="px-6 md:px-8 py-4 border-b border-gray-100 flex justify-between items-center bg-white shadow-sm shrink-0">
        <div className="flex items-center gap-4">
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

      <div className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-8">
        <div className="max-w-3xl mx-auto space-y-6 pb-20">
          <div className="bg-white p-6 md:p-8 rounded-[30px] shadow-sm border border-gray-100 space-y-6">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Tipe Soal</label>
              <select
                value={formData.type}
                onChange={(e) => {
                  const type = e.target.value as QuestionType;
                  setFormData(prev => ({
                    ...prev,
                    type,
                    // Reset fields based on type
                    options: (type === 'mcq' || type === 'multiple_select') ? (prev.options || ['', '', '', '']) : undefined,
                    correctAnswerIndex: type === 'mcq' ? 0 : undefined,
                    correctAnswerIndices: type === 'multiple_select' ? [] : undefined,
                    trueFalseAnswer: type === 'true_false' ? true : undefined,
                    shortAnswer: type === 'short_answer' ? '' : undefined,
                    essayAnswer: type === 'essay' ? '' : undefined
                  }));
                }}
                className="w-full px-5 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition font-bold text-gray-700"
              >
                <option value="mcq">Pilihan Ganda</option>
                <option value="multiple_select">Pilihan Ganda (Banyak Jawaban)</option>
                <option value="true_false">Benar / Salah</option>
                <option value="short_answer">Isian Singkat</option>
                <option value="essay">Esai</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Pertanyaan</label>
              <textarea
                value={formData.text}
                onChange={(e) => handleChange('text', e.target.value)}
                placeholder="Tulis pertanyaan di sini..."
                className="w-full px-5 py-4 rounded-xl border border-gray-100 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition font-bold text-gray-900 min-h-[120px] resize-y"
              />
            </div>

            {/* Image Attachment Input */}
            <div>
              <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <ImageIcon className="w-3 h-3" /> Lampiran Gambar
                  </label>
                  <div className="flex bg-gray-100 rounded-lg p-0.5">
                      <button
                        onClick={() => setUploadMode('url')}
                        className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 ${uploadMode === 'url' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        <LinkIcon className="w-3 h-3" /> URL
                      </button>
                      <button
                        onClick={() => setUploadMode('file')}
                        className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 ${uploadMode === 'file' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
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
                          className="flex-1 px-4 py-3 rounded-xl border border-gray-100 bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-bold outline-none"
                      />
                  ) : (
                      <div className="flex-1 relative">
                          <input
                              type="file"
                              accept="image/*"
                              onChange={handleFileUpload}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          />
                          <div className="w-full px-4 py-3 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 text-center hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 text-gray-400 font-bold text-sm">
                              <Upload className="w-4 h-4" />
                              {formData.attachment?.url?.startsWith('data:') ? 'Ganti File Gambar...' : 'Klik untuk Upload Gambar'}
                          </div>
                      </div>
                  )}
              </div>

              <div className="flex justify-start mt-2">
                  {formData.attachment?.url && (
                      <div className="relative group shrink-0">
                          <div className="w-12 h-12 rounded-xl bg-gray-200 border border-gray-300 overflow-hidden">
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
              <p className="text-[10px] text-gray-400 mt-1 ml-1">
                {uploadMode === 'url' ? 'Masukkan URL gambar langsung.' : 'Maksimal ukuran file 15MB.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Topik</label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" value={formData.topic || ''} onChange={(e) => handleChange('topic', e.target.value)} placeholder="Topik" className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-bold outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Kesulitan</label>
                <select value={formData.difficulty || 'medium'} onChange={(e) => handleChange('difficulty', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-bold outline-none">
                  <option value="easy">Mudah</option>
                  <option value="medium">Sedang</option>
                  <option value="hard">Sulit</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Poin</label>
                <input type="number" value={formData.points} onChange={(e) => handleChange('points', parseInt(e.target.value) || 0)} className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-bold outline-none" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-[30px] shadow-sm border border-gray-100 space-y-6">
            {formData.type === 'mcq' && (
              <>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Pilihan Jawaban</label>
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-600 cursor-pointer">
                    <input type="checkbox" checked={formData.randomizeOptions || false} onChange={(e) => handleChange('randomizeOptions', e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                    Acak Pilihan
                  </label>
                </div>

                {/* Toolbar */}
                <div className="flex gap-1 bg-gray-100 p-2 rounded-lg w-fit">
                  <button className="p-2 rounded hover:bg-gray-200 text-gray-600 font-bold text-sm transition-colors" title="Align Left">
                    <AlignLeft className="w-4 h-4" />
                  </button>
                  <button className="p-2 rounded hover:bg-gray-200 text-gray-600 font-bold text-sm transition-colors" title="Align Center">
                    <AlignCenter className="w-4 h-4" />
                  </button>
                  <button className="p-2 rounded hover:bg-gray-200 text-gray-600 font-bold text-sm transition-colors" title="Align Right">
                    <AlignRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {formData.options?.map((opt, idx) => (
                    <div key={idx} className="bg-gray-50 p-4 rounded-2xl border-2 border-gray-100 space-y-4">
                      {/* Option Label */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-400 border border-gray-200">
                            {String.fromCharCode(65 + idx)}
                          </div>
                          <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
                            Jawaban {String.fromCharCode(65 + idx)}
                          </label>
                        </div>
                        <button
                          onClick={() => handleChange('correctAnswerIndex', idx)}
                          className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 text-xs font-bold ${formData.correctAnswerIndex === idx ? 'bg-green-500 text-white shadow-lg shadow-green-200' : 'bg-gray-200 text-gray-400 hover:bg-gray-300'}`}
                          title="Tandai Jawaban Benar"
                        >
                          <Check className="w-4 h-4" /> {formData.correctAnswerIndex === idx ? 'Jawaban Benar' : 'Tandai Benar'}
                        </button>
                      </div>

                      {/* Rich Text Editor for Option */}
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Teks Pilihan</label>
                        <RichTextEditor 
                          value={opt} 
                          onChange={(value) => handleOptionChange(idx, value)}
                          placeholder={`Masukkan teks untuk pilihan ${String.fromCharCode(65 + idx)}...`}
                          height="150px"
                        />
                      </div>

                      {/* Delete Option Button */}
                      {(formData.options?.length || 0) > 2 && (
                        <button
                          onClick={() => {
                            const newOptions = formData.options?.filter((_, i) => i !== idx) || [];
                            handleChange('options', newOptions);
                            if (formData.correctAnswerIndex === idx) {
                              handleChange('correctAnswerIndex', 0);
                            }
                          }}
                          className="w-full py-2 rounded-lg bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                          title="Hapus Pilihan"
                        >
                          <Trash2 className="w-4 h-4" /> Hapus Pilihan
                        </button>
                      )}

                      {/* Attachment Section */}
                      <div className="border-t border-gray-200 pt-4">
                        <div className="flex justify-between items-center mb-3">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <ImageIcon className="w-3 h-3" /> Lampiran Gambar (Opsional)
                          </label>
                          <div className="flex bg-gray-100 rounded-lg p-0.5">
                            <button
                              onClick={() => setOptionUploadMode(prev => ({ ...prev, [idx]: 'url' }))}
                              className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 ${(optionUploadMode[idx] ?? 'url') === 'url' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                              <LinkIcon className="w-3 h-3" /> URL
                            </button>
                            <button
                              onClick={() => setOptionUploadMode(prev => ({ ...prev, [idx]: 'file' }))}
                              className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 ${(optionUploadMode[idx] ?? 'url') === 'file' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                              <Upload className="w-3 h-3" /> Upload
                            </button>
                          </div>
                        </div>

                        <div className="flex gap-2 items-start">
                          {(optionUploadMode[idx] ?? 'url') === 'url' ? (
                            <input
                              type="text"
                              value={formData.optionAttachments?.[idx]?.url || ''}
                              onChange={(e) => handleOptionAttachmentChange(idx, e.target.value)}
                              placeholder="https://example.com/image.jpg"
                              className="flex-1 px-4 py-3 rounded-xl border border-gray-100 bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-bold outline-none"
                            />
                          ) : (
                            <div className="flex-1 relative">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleOptionFileUpload(idx, e)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                              />
                              <div className="w-full px-4 py-3 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 text-center hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 text-gray-400 font-bold text-sm">
                                <Upload className="w-4 h-4" />
                                {formData.optionAttachments?.[idx]?.url?.startsWith('data:') ? 'Ganti File...' : 'Upload Gambar'}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex justify-start mt-2">
                          {formData.optionAttachments?.[idx]?.url && (
                            <div className="relative group shrink-0">
                              <div className="w-12 h-12 rounded-xl bg-gray-200 border border-gray-300 overflow-hidden">
                                <img src={formData.optionAttachments[idx].url} alt="Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = 'https://placehold.co/100x100?text=Error')} />
                              </div>
                              <button
                                onClick={() => handleOptionAttachmentChange(idx, '')}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                title="Hapus Gambar"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {(formData.options?.length || 0) < 8 && (
                  <button
                    onClick={() => {
                      const newOptions = [...(formData.options || []), ''];
                      handleChange('options', newOptions);
                    }}
                    className="w-full py-3 border-2 border-dashed border-indigo-300 rounded-xl text-indigo-600 font-bold hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Tambah Pilihan
                  </button>
                )}
              </>
            )}

            {formData.type === 'multiple_select' && (
              <>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Pilihan Jawaban (Pilih Semua Benar)</label>
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-600 cursor-pointer">
                    <input type="checkbox" checked={formData.randomizeOptions || false} onChange={(e) => handleChange('randomizeOptions', e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                    Acak Pilihan
                  </label>
                </div>

                {/* Toolbar */}
                <div className="flex gap-1 bg-gray-100 p-2 rounded-lg w-fit">
                  <button className="p-2 rounded hover:bg-gray-200 text-gray-600 font-bold text-sm transition-colors" title="Align Left">
                    <AlignLeft className="w-4 h-4" />
                  </button>
                  <button className="p-2 rounded hover:bg-gray-200 text-gray-600 font-bold text-sm transition-colors" title="Align Center">
                    <AlignCenter className="w-4 h-4" />
                  </button>
                  <button className="p-2 rounded hover:bg-gray-200 text-gray-600 font-bold text-sm transition-colors" title="Align Right">
                    <AlignRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {formData.options?.map((opt, idx) => {
                    const isSelected = formData.correctAnswerIndices?.includes(idx);
                    return (
                      <div key={idx} className="bg-gray-50 p-4 rounded-2xl border-2 border-gray-100 space-y-4">
                        {/* Option Label */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-400 border border-gray-200">
                              {String.fromCharCode(65 + idx)}
                            </div>
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
                              Jawaban {String.fromCharCode(65 + idx)}
                            </label>
                          </div>
                          <button 
                            onClick={() => {
                              const current = formData.correctAnswerIndices || [];
                              handleChange('correctAnswerIndices', current.includes(idx) ? current.filter(i => i !== idx) : [...current, idx]);
                            }} 
                            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 text-xs font-bold ${isSelected ? 'bg-green-500 text-white shadow-lg shadow-green-200' : 'bg-gray-200 text-gray-400 hover:bg-gray-300'}`}
                          >
                            <Check className="w-4 h-4" /> {isSelected ? 'Jawaban Benar' : 'Tandai Benar'}
                          </button>
                        </div>

                        {/* Rich Text Editor for Option */}
                        <div>
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Teks Pilihan</label>
                          <RichTextEditor 
                            value={opt} 
                            onChange={(value) => handleOptionChange(idx, value)}
                            placeholder={`Masukkan teks untuk pilihan ${String.fromCharCode(65 + idx)}...`}
                            height="150px"
                          />
                        </div>

                        {/* Delete Option Button */}
                        {(formData.options?.length || 0) > 2 && (
                          <button
                            onClick={() => {
                              const newOptions = formData.options?.filter((_, i) => i !== idx) || [];
                              const newAttachments = formData.optionAttachments?.filter((_, i) => i !== idx);
                              handleChange('options', newOptions);
                              if (newAttachments) handleChange('optionAttachments', newAttachments);
                              const current = formData.correctAnswerIndices || [];
                              const newIndices = current.filter(i => i !== idx);
                              handleChange('correctAnswerIndices', newIndices);
                            }}
                            className="w-full py-2 rounded-lg bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                            title="Hapus Pilihan"
                          >
                            <Trash2 className="w-4 h-4" /> Hapus Pilihan
                          </button>
                        )}

                        {/* Attachment Section */}
                        <div className="border-t border-gray-200 pt-4">
                          <div className="flex justify-between items-center mb-3">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                              <ImageIcon className="w-3 h-3" /> Lampiran Gambar (Opsional)
                            </label>
                            <div className="flex bg-gray-100 rounded-lg p-0.5">
                              <button
                                onClick={() => setOptionUploadMode(prev => ({ ...prev, [idx]: 'url' }))}
                                className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 ${(optionUploadMode[idx] ?? 'url') === 'url' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                              >
                                <LinkIcon className="w-3 h-3" /> URL
                              </button>
                              <button
                                onClick={() => setOptionUploadMode(prev => ({ ...prev, [idx]: 'file' }))}
                                className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 ${(optionUploadMode[idx] ?? 'url') === 'file' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                              >
                                <Upload className="w-3 h-3" /> Upload
                              </button>
                            </div>
                          </div>

                          <div className="flex gap-2 items-start">
                            {(optionUploadMode[idx] ?? 'url') === 'url' ? (
                              <input
                                type="text"
                                value={formData.optionAttachments?.[idx]?.url || ''}
                                onChange={(e) => handleOptionAttachmentChange(idx, e.target.value)}
                                placeholder="https://example.com/image.jpg"
                                className="flex-1 px-4 py-3 rounded-xl border border-gray-100 bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-bold outline-none"
                              />
                            ) : (
                              <div className="flex-1 relative">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleOptionFileUpload(idx, e)}
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <div className="w-full px-4 py-3 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 text-center hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 text-gray-400 font-bold text-sm">
                                  <Upload className="w-4 h-4" />
                                  {formData.optionAttachments?.[idx]?.url?.startsWith('data:') ? 'Ganti File...' : 'Upload Gambar'}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex justify-start mt-2">
                            {formData.optionAttachments?.[idx]?.url && (
                              <div className="relative group shrink-0">
                                <div className="w-12 h-12 rounded-xl bg-gray-200 border border-gray-300 overflow-hidden">
                                  <img src={formData.optionAttachments[idx].url} alt="Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = 'https://placehold.co/100x100?text=Error')} />
                                </div>
                                <button
                                  onClick={() => handleOptionAttachmentChange(idx, '')}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                  title="Hapus Gambar"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {(formData.options?.length || 0) < 8 && (
                  <button
                    onClick={() => {
                      const newOptions = [...(formData.options || []), ''];
                      handleChange('options', newOptions);
                    }}
                    className="w-full py-3 border-2 border-dashed border-indigo-300 rounded-xl text-indigo-600 font-bold hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Tambah Pilihan
                  </button>
                )}
              </>
            )}

            {formData.type === 'true_false' && (
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Kunci Jawaban</label>
                <div className="flex gap-4">
                  <button onClick={() => handleChange('trueFalseAnswer', true)} className={`flex-1 py-4 rounded-xl font-black border-2 transition-all ${formData.trueFalseAnswer === true ? 'border-green-500 bg-green-50 text-green-600' : 'border-gray-100 bg-gray-50 text-gray-400'}`}>BENAR</button>
                  <button onClick={() => handleChange('trueFalseAnswer', false)} className={`flex-1 py-4 rounded-xl font-black border-2 transition-all ${formData.trueFalseAnswer === false ? 'border-green-500 bg-green-50 text-green-600' : 'border-gray-100 bg-gray-50 text-gray-400'}`}>SALAH</button>
                </div>
              </div>
            )}

            {formData.type === 'short_answer' && (
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Kunci Jawaban</label>
                <input type="text" value={formData.shortAnswer || ''} onChange={(e) => handleChange('shortAnswer', e.target.value)} placeholder="Jawaban singkat yang benar..." className="w-full px-5 py-4 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-bold outline-none" />
              </div>
            )}

            {formData.type === 'essay' && (
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Rubrik Penilaian / Kunci Jawaban</label>
                <textarea value={formData.essayAnswer || ''} onChange={(e) => handleChange('essayAnswer', e.target.value)} placeholder="Masukkan poin-poin penting..." className="w-full px-5 py-4 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-bold outline-none h-32" />
              </div>
            )}

            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Pembahasan (Opsional)</label>
              <div className="relative">
                <AlertCircle className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                <textarea value={formData.explanation || ''} onChange={(e) => handleChange('explanation', e.target.value)} placeholder="Penjelasan jawaban..." className="w-full pl-12 pr-5 py-4 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 h-24 text-sm font-medium outline-none" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionBank;