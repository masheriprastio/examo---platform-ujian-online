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
        e.target.value = ''; // Reset input
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        handleOptionAttachmentChange(idx, reader.result as string);
        e.target.value = ''; // Reset input after successful upload
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
              <label className="block text-xs font-bold text-gray-400 mb-2">Teks Soal</label>
              <RichTextEditor
                value={formData.text || ''}
                onChange={(val) => handleChange('text', val)}
                placeholder="Masukkan teks soal..."
                className="min-h-[120px] bg-gray-50 border-gray-100 focus:border-indigo-500"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2">Tipe Soal</label>
                <select
                  value={formData.type}
                  onChange={(e) => handleChange('type', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition font-bold text-gray-700"
                >
                  <option value="mcq">Pilihan Ganda</option>
                  <option value="multiple_select">Pilihan Ganda (Banyak)</option>
                  <option value="true_false">Benar / Salah</option>
                  <option value="short_answer">Isian Singkat</option>
                  <option value="essay">Esai</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2">Topik</label>
                <input
                  type="text"
                  value={formData.topic || ''}
                  onChange={(e) => handleChange('topic', e.target.value)}
                  placeholder="Matematika, IPA, dll."
                  className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition font-bold text-gray-700"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2">Poin</label>
                <input
                  type="number"
                  min="1"
                  value={formData.points}
                  onChange={(e) => handleChange('points', parseInt(e.target.value, 10) || 1)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition font-bold text-gray-700"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2">Kesulitan</label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => handleChange('difficulty', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition font-bold text-gray-700"
                >
                  <option value="easy">Mudah</option>
                  <option value="medium">Sedang</option>
                  <option value="hard">Sulit</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2">Acak Opsi</label>
                <select
                  value={formData.randomizeOptions ? 'yes' : 'no'}
                  onChange={(e) => handleChange('randomizeOptions', e.target.value === 'yes')}
                  className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition font-bold text-gray-700"
                >
                  <option value="no">Tidak</option>
                  <option value="yes">Ya</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2">Jawaban Benar</label>
                <select
                  value={formData.correctAnswerIndex?.toString() || '0'}
                  onChange={(e) => handleChange('correctAnswerIndex', parseInt(e.target.value, 10))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition font-bold text-gray-700"
                >
                  {Array.from({ length: formData.options?.length || 4 }, (_, i) => (
                    <option key={i} value={i.toString()}>{i + 1}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-2">Lampiran Soal</label>
              <div className="flex gap-2 mb-2">
                <button
                  onClick={() => setUploadMode('url')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold ${uploadMode === 'url' ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}
                >
                  URL
                </button>
                <button
                  onClick={() => setUploadMode('file')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold ${uploadMode === 'file' ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}
                >
                  File
                </button>
              </div>
              {uploadMode === 'url' ? (
                <input
                  type="url"
                  value={formData.attachment?.url || ''}
                  onChange={(e) => handleAttachmentChange(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition font-bold text-gray-700"
                />
              ) : (
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-indigo-300 transition">
                    <Upload className="w-5 h-5 text-gray-400" />
                    <span className="text-sm font-bold text-gray-500">Pilih File</span>
                  </label>
                  {formData.attachment?.url && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <ImageIcon className="w-4 h-4" />
                      <span>File terpilih</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            {formData.attachment?.url && (
              <div className="mt-4">
                <img src={formData.attachment.url} alt="Attachment" className="max-w-full h-auto rounded-lg border border-gray-100" />
              </div>
            )}
          </div>

          {formData.type !== 'essay' && (
            <div className="bg-white p-6 md:p-10 rounded-[30px] shadow-sm border border-gray-100 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-black text-gray-900">Opsi Jawaban</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFormData(prev => ({ ...prev, options: [...(prev.options || []), ''], optionAttachments: [...(prev.optionAttachments || []), undefined] }))}
                    className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold hover:bg-indigo-100 transition text-sm"
                  >
                    + Tambah Opsi
                  </button>
                  <button
                    onClick={() => {
                      const opts = formData.options?.slice(0, -1) || [];
                      const atts = formData.optionAttachments?.slice(0, -1) || [];
                      setFormData(prev => ({ ...prev, options: opts, optionAttachments: atts }));
                    }}
                    disabled={(formData.options?.length || 0) <= 2}
                    className="px-4 py-2 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    - Kurangi Opsi
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(formData.options || []).map((opt, idx) => (
                  <div key={idx} className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-bold text-gray-600">Opsi {idx + 1}</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setOptionUploadMode(prev => ({ ...prev, [idx]: 'url' }))}
                          className={`px-2 py-1 rounded text-xs font-bold ${optionUploadMode[idx] === 'url' ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}
                        >
                          URL
                        </button>
                        <button
                          onClick={() => setOptionUploadMode(prev => ({ ...prev, [idx]: 'file' }))}
                          className={`px-2 py-1 rounded text-xs font-bold ${optionUploadMode[idx] === 'file' ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}
                        >
                          File
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <RichTextEditor
                        value={opt || ''}
                        onChange={(val) => handleOptionChange(idx, val)}
                        placeholder={`Opsi ${idx + 1}...`}
                        className="flex-1 min-h-[80px] bg-gray-50 border-gray-100 focus:border-indigo-500"
                      />
                      {optionUploadMode[idx] === 'url' ? (
                        <input
                          type="url"
                          value={formData.optionAttachments?.[idx]?.url || ''}
                          onChange={(e) => handleOptionAttachmentChange(idx, e.target.value)}
                          placeholder="https://..."
                          className="w-48 px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition font-bold text-gray-700"
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleOptionFileUpload(idx, e)}
                            className="hidden"
                            id={`option-file-${idx}`}
                          />
                          <label htmlFor={`option-file-${idx}`} className="flex items-center gap-2 px-3 py-2 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-indigo-300 transition">
                            <Upload className="w-4 h-4 text-gray-400" />
                            <span className="text-xs font-bold text-gray-500">Pilih</span>
                          </label>
                        </div>
                      )}
                    </div>
                    {formData.optionAttachments?.[idx]?.url && (
                      <div className="mt-2">
                        <img src={formData.optionAttachments[idx].url} alt={`Option ${idx + 1}`} className="max-w-full h-auto rounded-lg border border-gray-100" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white p-6 md:p-10 rounded-[30px] shadow-sm border border-gray-100 space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-2">Penjelasan Jawaban</label>
              <RichTextEditor
                value={formData.explanation || ''}
                onChange={(val) => handleChange('explanation', val)}
                placeholder="Berikan penjelasan jawaban yang benar..."
                className="min-h-[120px] bg-gray-50 border-gray-100 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionBank;
