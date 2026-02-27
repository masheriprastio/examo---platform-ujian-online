
import React, { useState, useEffect, useRef } from 'react';
import { generateUUID } from '../lib/uuid';
import { Exam, Question, QuestionType } from '../types';
import RichTextEditor from './RichTextEditor';
import { supabase } from '../lib/supabase';
import { 
  Save, Plus, Trash2, Check, Clock, Type, Star, X, 
  ChevronDown, ChevronUp, Database, GripVertical, Shuffle, Tag, AlertCircle, Eye, Image as ImageIcon, Upload, Link as LinkIcon,
  AlignLeft, AlignCenter, AlignRight
} from 'lucide-react';

interface ExamEditorProps {
  exam: Exam;
  onSave: (updatedExam: Exam) => void;
  onCancel: () => void;
  onSaveToBank?: (q: Question) => void;
  onPreview?: (exam: Exam) => void;
}

// Helper function untuk format datetime-local input dengan timezone awareness
const formatDateTimeLocal = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch {
    return '';
  }
};

// Helper function untuk format timestamp soal dengan format readable
const formatQuestionTimestamp = (dateString?: string): string => {
  if (!dateString) return 'Belum diset';
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays < 7) return `${diffDays} hari lalu`;
    
    return date.toLocaleDateString('id-ID', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'Tanggal tidak valid';
  }

};

// Helper function untuk validasi input penilaian (angka, titik, koma)
const validatePointsInput = (value: string): { isValid: boolean; error?: string; parsedValue?: number } => {
  if (!value || value.trim() === '') {
    return { isValid: false, error: 'Nilai tidak boleh kosong' };
  }

  // Normalize input: convert comma to dot
  const normalized = value.replace(',', '.');

  // Check if it's a valid number
  const parsed = parseFloat(normalized);
  if (isNaN(parsed)) {
    return { isValid: false, error: 'Hanya angka, titik, atau koma yang diizinkan' };
  }

  // Check if number is positive
  if (parsed < 0) {
    return { isValid: false, error: 'Nilai harus angka positif' };
  }

  // Check if number is not too large
  if (parsed > 1000) {
    return { isValid: false, error: 'Nilai maksimal 1000' };
  }

  return { isValid: true, parsedValue: parsed };
};

// Helper function untuk recover backup dari localStorage
const recoverBackup = (examId: string, fallback: Exam): Exam => {
  try {
    const backup = localStorage.getItem(`exam_draft_${examId}`);
    if (backup) {
      const parsed = JSON.parse(backup);
      console.log('Recovered exam draft from backup');
      return parsed;
    }
  } catch (e) {
    console.warn('Failed to recover backup:', e);
  }
  return fallback;
};

// Helper function untuk upload image ke Supabase Storage
const uploadImageToSupabase = async (file: File, examId: string): Promise<string> => {
  try {
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `exams/${examId}/${Date.now()}_${sanitizedName}`;
    
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('materials')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw new Error('Failed to upload image: ' + uploadError.message);
    }

    // Get public URL
    const { data: publicUrlData } = supabase
      .storage
      .from('materials')
      .getPublicUrl(fileName);

    if (!publicUrlData || !publicUrlData.publicUrl) {
      throw new Error('Failed to get public URL');
    }

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Image upload error:', error);
    throw error;
  }
};

const ExamEditor: React.FC<ExamEditorProps> = ({ exam, onSave, onCancel, onSaveToBank, onPreview }) => {
  // Parse initial dates if they exist, or keep them empty/null
  // Try to recover from backup if available
  const [formData, setFormData] = useState<Exam>(() => recoverBackup(exam.id, exam));
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(formData.questions[0]?.id || null);
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [uploadMode, setUploadMode] = useState<Record<string, 'url' | 'file'>>({});
  const [optionUploadMode, setOptionUploadMode] = useState<Record<string, 'url' | 'file'>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [pointsErrors, setPointsErrors] = useState<Record<string, string>>({}); // Track validation errors per question
  const backupTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>(JSON.stringify(exam));

  // Auto-backup state to localStorage every 2 seconds
  useEffect(() => {
    if (backupTimeoutRef.current) clearTimeout(backupTimeoutRef.current);
    
    backupTimeoutRef.current = setTimeout(() => {
      try {
        // Backup exam data with attachments (now they're URLs, not base64)
        const backup = JSON.stringify(formData);
        const backup_size = new Blob([backup]).size;
        
        // Only save if under 4MB (leave room for other data)
        if (backup_size < 4 * 1024 * 1024) {
          localStorage.setItem(`exam_draft_${formData.id}`, backup);
        } else {
          // If too large, remove attachments and save compressed version
          const compressedData: Exam = {
            ...formData,
            questions: formData.questions.map(q => ({
              ...q,
              attachment: undefined, // Remove main attachments to save space
              optionAttachments: undefined // Also remove option attachments to save space
            }))
          };
          const compressedBackup = JSON.stringify(compressedData);
          const compressedSize = new Blob([compressedBackup]).size;
          
          if (compressedSize < 4 * 1024 * 1024) {
            localStorage.setItem(`exam_draft_${formData.id}`, compressedBackup);
          } else {
            // Still too large, try cleanup old backups
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && key.startsWith('exam_draft_') && key !== `exam_draft_${formData.id}`) {
                localStorage.removeItem(key);
              }
            }
            // Try saving compressed version again
            if (compressedSize < 4 * 1024 * 1024) {
              localStorage.setItem(`exam_draft_${formData.id}`, compressedBackup);
            }
          }
        }
        // Check size before saving (rough estimate: 1 char = 1 byte)
        if (backup.length > 4000000) { // ~4MB limit to be safe
          // Clear old backups to free space
          const keys = Object.keys(localStorage);
          keys.forEach(key => {
            if (key.startsWith('exam_draft_') && key !== `exam_draft_${exam.id}`) {
              try {
                localStorage.removeItem(key);
              } catch (e) {
                // Ignore errors
              }
            }
          });
        }
        
        localStorage.setItem(`exam_draft_${exam.id}`, backup);
      } catch (e) {
        if (e instanceof DOMException && e.code === 22) {
          // QuotaExceededError - clear all old backups and try again
          const keys = Object.keys(localStorage);
          keys.forEach(key => {
            if (key.startsWith('exam_draft_') && key !== `exam_draft_${exam.id}`) {
              try {
                localStorage.removeItem(key);
              } catch (err) {
                // Ignore
              }
            }
          });
          // Silently skip backup if still full
        } else {
          console.warn('Failed to backup exam draft:', e);
        }
      }
    }, 2000);

    return () => {
      if (backupTimeoutRef.current) clearTimeout(backupTimeoutRef.current);
    };
  }, [formData, exam.id]);

  // Warn user if they try to leave without saving
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (JSON.stringify(formData) !== lastSavedRef.current) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [formData]);
  
  const handleExamChange = (field: keyof Exam, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleQuestionChange = (qIndex: number, field: keyof Question, value: any) => {
    const newQuestions = [...formData.questions];
    newQuestions[qIndex] = { 
      ...newQuestions[qIndex], 
      [field]: value,
      updatedAt: new Date().toISOString() // Update timestamp setiap ada perubahan
    };
    setFormData(prev => ({ ...prev, questions: newQuestions }));
  };

  // Handler khusus untuk points dengan validasi
  const handlePointsChange = (qIndex: number, value: string) => {
    const qId = formData.questions[qIndex]?.id;
    if (!qId) return;

    const validation = validatePointsInput(value);
    
    if (!validation.isValid) {
      setPointsErrors(prev => ({
        ...prev,
        [qId]: validation.error || 'Invalid value'
      }));
    } else {
      setPointsErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[qId];
        return newErrors;
      });
      handleQuestionChange(qIndex, 'points', validation.parsedValue || 0);
    }
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

  const handleFileUpload = async (qIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) { // 15MB limit
        alert("Ukuran file maksimal 15MB");
        return;
      }

      try {
        // Show loading state while uploading
        const newQuestions = [...formData.questions];
        newQuestions[qIndex] = {
          ...newQuestions[qIndex],
          attachment: { type: 'image', url: 'uploading...', caption: '' }
        };
        setFormData(prev => ({ ...prev, questions: newQuestions }));

        // Upload to Supabase Storage
        const publicUrl = await uploadImageToSupabase(file, formData.id);
        handleAttachmentChange(qIndex, publicUrl);
      } catch (error) {
        alert(`Gagal upload gambar: ${error instanceof Error ? error.message : 'Unknown error'}`);
        // Remove attachment on error
        handleAttachmentChange(qIndex, '');
      }
    }
  };

  const toggleUploadMode = (qId: string, mode: 'url' | 'file') => {
      setUploadMode(prev => ({ ...prev, [qId]: mode }));
  };

  const toggleOptionUploadMode = (key: string, mode: 'url' | 'file') => {
      setOptionUploadMode(prev => ({ ...prev, [key]: mode }));
  };

  const handleOptionChange = (qIndex: number, oIndex: number, value: string) => {
    const newQuestions = [...formData.questions];
    const newOptions = [...newQuestions[qIndex].options!];
    newOptions[oIndex] = value;
    newQuestions[qIndex] = { ...newQuestions[qIndex], options: newOptions };
    setFormData(prev => ({ ...prev, questions: newQuestions }));
  };

  const handleOptionAttachmentChange = (qIndex: number, oIndex: number, url: string) => {
    const newQuestions = [...formData.questions];
    const newAttachments = [...(newQuestions[qIndex].optionAttachments || Array(newQuestions[qIndex].options?.length || 0).fill(null))];
    if (url) {
      newAttachments[oIndex] = { type: 'image', url: url, caption: '' };
    } else {
      newAttachments[oIndex] = { url: undefined };
    }
    newQuestions[qIndex] = { ...newQuestions[qIndex], optionAttachments: newAttachments };
    setFormData(prev => ({ ...prev, questions: newQuestions }));
  };

  const handleOptionFileUpload = async (qIndex: number, oIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) { // 15MB limit
        alert("Ukuran file maksimal 15MB");
        e.target.value = ''; // Reset input
        return;
      }

      try {
        // Show loading state
        handleOptionAttachmentChange(qIndex, oIndex, 'uploading...');

        // Upload to Supabase Storage
        const publicUrl = await uploadImageToSupabase(file, formData.id);
        handleOptionAttachmentChange(qIndex, oIndex, publicUrl);
      } catch (error) {
        console.error('Option image upload failed:', error);
        alert(`Gagal upload gambar opsi: ${error instanceof Error ? error.message : 'Unknown error'}`);
        // Reset on error
        handleOptionAttachmentChange(qIndex, oIndex, '');
      } finally {
        e.target.value = ''; // Reset input
      }
    }
  };

  // Simple CSV parser for import (expects header row).
  // Header fields supported:
  // type,text,options,correctAnswerIndex,correctAnswerIndices,points,explanation,topic,difficulty,randomizeOptions,shortAnswer,essayAnswer
  // - options: separate choices with "||" (double pipe) to allow commas in text
  // - correctAnswerIndices: separate multiple indices with ";" (semicolon) for multiple_select
  const handleImportCsv = (csvText: string, filename: string) => {
    try {
      const lines = csvText.split(/\r?\n/).filter(l => l.trim() !== '');
      if (lines.length < 2) {
        alert('File kosong atau hanya terdapat header.');
        return;
      }
      const header = lines[0].split(',').map(h => h.trim());
      const rows = lines.slice(1);
      const imported: Question[] = [];
      const now = new Date().toISOString();

      for (const line of rows) {
        // naive CSV split: split only on commas, but allow quoted values -- keep simple for now
        // better to use a CSV library if needed. Here we assume no complex quoting.
        const cols = line.split(',').map(c => c.trim());
        const obj: Record<string,string> = {};
        for (let i = 0; i < header.length; i++) {
          obj[header[i]] = cols[i] ?? '';
        }

        const type = (obj['type'] || 'mcq') as QuestionType;
        const text = obj['text'] || 'Soal dari import';
        const points = parseFloat(obj['points'] || '1') || 1;
        const optionsRaw = obj['options'] || '';
        const options = optionsRaw ? optionsRaw.split('||').map(s => s.trim()) : undefined;
        const correctIndex = obj['correctAnswerIndex'] ? parseInt(obj['correctAnswerIndex']) : undefined;
        const correctIndices = obj['correctAnswerIndices'] ? obj['correctAnswerIndices'].split(';').map(x => parseInt(x)).filter(n => !isNaN(n)) : undefined;
        const explanation = obj['explanation'] || '';
        const topic = obj['topic'] || '';
        const difficulty = (obj['difficulty'] as any) || 'medium';
        const randomizeOptions = String(obj['randomizeOptions'] || '').toLowerCase() === 'true';
        const shortAnswer = obj['shortAnswer'] || '';
        const essayAnswer = obj['essayAnswer'] || '';

        const q: Question = {
          id: generateUUID(),
          type,
          text,
          points,
          explanation,
          topic,
          difficulty: difficulty,
          createdAt: now,
          updatedAt: now,
          ...(type === 'mcq' ? { options: options || ['Pilihan A','Pilihan B'], correctAnswerIndex: typeof correctIndex === 'number' && !isNaN(correctIndex) ? correctIndex : 0, randomizeOptions, optionAttachments: options ? Array(options.length).fill(undefined) : undefined } : {}),
          ...(type === 'multiple_select' ? { options: options || ['Pilihan A','Pilihan B'], correctAnswerIndices: correctIndices || [], randomizeOptions, optionAttachments: options ? Array(options.length).fill(undefined) : undefined } : {}),
          ...(type === 'true_false' ? { trueFalseAnswer: (String(obj['correctAnswerIndex'] || '').toLowerCase() === 'true') } : {}),
          ...(type === 'short_answer' ? { shortAnswer } : {}),
          ...(type === 'essay' ? { essayAnswer } : {})
        };

        imported.push(q);
      }

      if (imported.length === 0) {
        alert('Tidak ada soal valid yang diimport.');
        return;
      }

      // Append to formData.questions (preserve existing exam status; do not change publish state automatically)
      setFormData(prev => ({
        ...prev,
        questions: [...prev.questions, ...imported],
        updatedAt: new Date().toISOString()
      }));

      alert(`Berhasil mengimport ${imported.length} soal dari ${filename}. Soal ditambahkan ke editor—simpan perubahan untuk menerapkannya.`);
    } catch (err) {
      console.error('Import CSV error:', err);
      alert('Gagal mengimport file. Pastikan format sesuai template.');
    }
  };

  const addQuestion = (type: QuestionType = 'mcq') => {
    const now = new Date().toISOString();
    const newQuestion: Question = {
      id: generateUUID(),
      type,
      text: 'Pertanyaan Baru',
      points: 10,
      explanation: '',
      difficulty: 'medium',
      createdAt: now, // Timestamp ketika soal dibuat
      updatedAt: now, // Timestamp pembaruan awal
      ...(type === 'mcq' ? { options: ['Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D'], correctAnswerIndex: 0, randomizeOptions: false, optionAttachments: [undefined, undefined, undefined, undefined] } : {}),
      ...(type === 'multiple_select' ? { options: ['Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D'], correctAnswerIndices: [], randomizeOptions: false, optionAttachments: [undefined, undefined, undefined, undefined] } : {}),
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
    
    // Validate indices
    if (draggedIndex < 0 || draggedIndex >= formData.questions.length || 
        index < 0 || index >= formData.questions.length) {
      setDraggedIndex(null);
      return;
    }
    
    const newQs = [...formData.questions];
    const draggedItem = newQs[draggedIndex];
    
    // Safely splice and insert
    if (draggedItem) {
      newQs.splice(draggedIndex, 1);
      newQs.splice(index, 0, draggedItem);
      
      setDraggedIndex(index);
      setFormData(prev => ({ ...prev, questions: newQs }));
    }
  };

  // Helper function untuk mendapatkan soal yang paling terakhir dibuat
  const getLastCreatedQuestion = (): Question | null => {
    if (formData.questions.length === 0) return null;
    return formData.questions.reduce((latest, current) => {
      if (!latest.createdAt) return current;
      if (!current.createdAt) return latest;
      return new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest;
    });
  };

  const lastQuestion = getLastCreatedQuestion();

  return (
    <div className="fixed inset-0 bg-white z-[60] flex flex-col font-sans text-left overflow-hidden">
      <header className="px-6 md:px-8 py-4 md:py-5 border-b border-gray-100 flex justify-between items-center bg-white shadow-sm shrink-0">
        <div className="flex items-center gap-4 flex-1">
          <div className="bg-indigo-50 p-2 rounded-xl border border-indigo-100 hidden md:block">
            <Database className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg md:text-xl font-black text-gray-900 leading-none">Editor Ujian</h2>
            {lastQuestion && (
              <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                Soal terakhir dibuat: {formatQuestionTimestamp(lastQuestion.createdAt)}
              </p>
            )}
          </div>
          {/* Status Badge & Toggle */}
          <div className="flex items-center gap-3 ml-4 pr-2 border-r border-gray-100">
            {formData.status === 'draft' ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 border border-yellow-200 rounded-lg">
                <Clock className="w-4 h-4 text-yellow-600" />
                <span className="text-xs font-bold text-yellow-700">DRAFT</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg">
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-xs font-bold text-green-700">PUBLISHED</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2 ml-4">
          {/* Toggle Draft/Published */}
          {formData.status === 'draft' ? (
            <button
              onClick={() => handleExamChange('status', 'published')}
              className="px-4 py-2 bg-green-50 border-2 border-green-200 text-green-600 rounded-xl hover:bg-green-100 font-bold flex items-center gap-2 transition-all text-sm"
              title="Publikasikan ujian agar siswa bisa melihat"
            >
              <Check className="w-4 h-4" /> Publikasikan
            </button>
          ) : (
            <button
              onClick={() => handleExamChange('status', 'draft')}
              className="px-4 py-2 bg-yellow-50 border-2 border-yellow-200 text-yellow-600 rounded-xl hover:bg-yellow-100 font-bold flex items-center gap-2 transition-all text-sm"
              title="Ubah ke draft agar siswa tidak bisa melihat"
            >
              <Clock className="w-4 h-4" /> Ke Draft
            </button>
          )}
          {onPreview && (
            <button 
              onClick={() => onPreview(formData)} 
              className="px-4 py-2 bg-white border-2 border-indigo-100 text-indigo-600 rounded-xl hover:bg-indigo-50 font-bold flex items-center gap-2 transition-all text-sm"
            >
              <Eye className="w-4 h-4" /> Preview
            </button>
          )}
          <button onClick={onCancel} className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-50 rounded-xl transition text-sm">Batal</button>
          <button 
            onClick={async () => {
              setIsSaving(true);
              try {
                await Promise.resolve(onSave(formData));
                lastSavedRef.current = JSON.stringify(formData);
                // Clear backup after successful save
                try {
                  localStorage.removeItem(`exam_draft_${exam.id}`);
                } catch (e) {
                  console.warn('Failed to clear backup:', e);
                }
              } finally {
                setIsSaving(false);
              }
            }} 
            disabled={isSaving}
            className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-black shadow-lg shadow-indigo-100 flex items-center gap-2 transition-all active:scale-95 text-sm disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Simpan
              </>
            )}
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
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Mulai Ujian</label>
                <input 
                  type="datetime-local" 
                  value={formData.startDate ? formatDateTimeLocal(formData.startDate) : ''}
                  onChange={(e) => handleExamChange('startDate', e.target.value ? new Date(e.target.value).toISOString() : undefined)}
                  className="w-full px-5 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white outline-none transition font-bold text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Selesai Ujian</label>
                <input 
                  type="datetime-local" 
                  value={formData.endDate ? formatDateTimeLocal(formData.endDate) : ''}
                  onChange={(e) => handleExamChange('endDate', e.target.value ? new Date(e.target.value).toISOString() : undefined)}
                  className="w-full px-5 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white outline-none transition font-bold text-sm"
                />
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
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xl font-black text-gray-900 tracking-tight">Daftar Pertanyaan</h3>
              <div className="flex gap-2 items-center">
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

                {/* Import CSV/XLSX (CSV parser simple) */}
                <div className="flex items-center gap-2">
                  <input id="exam-import-file" type="file" accept=".csv" className="hidden" onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const text = await file.text();
                      // trigger parse handler
                      // @ts-ignore
                      handleImportCsv(text, file.name);
                    } catch (err) {
                      alert('Gagal membaca file: ' + (err instanceof Error ? err.message : 'Unknown'));
                    } finally {
                      // reset input
                      (e.target as HTMLInputElement).value = '';
                    }
                  }} />

                  <button onClick={() => { const inp = document.getElementById('exam-import-file') as HTMLInputElement; inp?.click(); }} className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition">
                    Import dari CSV
                  </button>

                  <a href="/templates/exam_import_template.csv" download className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition">
                    Unduh Template
                  </a>
                </div>
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
                      <div className="flex-1 overflow-hidden min-w-0">
                        <span className="text-gray-700 font-bold truncate text-sm block">{q.text}</span>
                        <span className="text-gray-400 text-xs mt-0.5">Dibuat {formatQuestionTimestamp(q.createdAt)}</span>
                      </div>
                      {q.attachment?.url && <ImageIcon className="w-4 h-4 text-indigo-500" />}
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
                      <button 
                        onClick={(e) => { e.stopPropagation(); setQuestionToDelete(q.id); }} 
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition"
                        title="Hapus Soal"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      {activeQuestionId === q.id ? <ChevronUp className="w-4 h-4 text-indigo-400" /> : <ChevronDown className="w-4 h-4 text-gray-300" />}
                    </div>
                  </div>

                  {activeQuestionId === q.id && (
                    <div className="p-6 md:p-8 bg-gray-50/30 border-t border-gray-50 space-y-6 animate-in slide-in-from-top-2">
                      {/* Timestamp Info */}
                      <div className="flex flex-wrap gap-4 text-xs text-gray-500 pb-4 border-b border-gray-200">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-indigo-400" />
                          <span>Dibuat: {formatQuestionTimestamp(q.createdAt)}</span>
                        </div>
                        {q.updatedAt && q.updatedAt !== q.createdAt && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-400" />
                            <span>Diubah: {formatQuestionTimestamp(q.updatedAt)}</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Pertanyaan</label>
                        <div className="mb-2 flex gap-1 bg-gray-100 rounded-lg p-1">
                          <button
                            onClick={() => handleQuestionChange(qIndex, 'textAlign', 'left')}
                            className={`p-2 rounded-md text-xs transition-all ${q.textAlign === 'left' || !q.textAlign ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                            title="Rata Kiri"
                          >
                            <AlignLeft className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleQuestionChange(qIndex, 'textAlign', 'center')}
                            className={`p-2 rounded-md text-xs transition-all ${q.textAlign === 'center' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                            title="Rata Tengah"
                          >
                            <AlignCenter className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleQuestionChange(qIndex, 'textAlign', 'right')}
                            className={`p-2 rounded-md text-xs transition-all ${q.textAlign === 'right' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                            title="Rata Kanan"
                          >
                            <AlignRight className="w-4 h-4" />
                          </button>
                        </div>
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
                          {(!uploadMode[q.id] || uploadMode[q.id] === 'url') ? 'Masukkan URL gambar langsung.' : 'Maksimal ukuran file 15MB.'}
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
                          <input 
                            type="text" 
                            step="0.5" 
                            value={q.points} 
                            onChange={(e) => handlePointsChange(qIndex, e.target.value)}
                            className={`w-full px-4 py-2.5 rounded-xl border-2 bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-bold outline-none transition-all ${
                              pointsErrors[q.id] ? 'border-red-500 bg-red-50' : 'border-gray-100'
                            }`}
                            placeholder="Misal: 6, 6.5, atau 10"
                          />
                          {pointsErrors[q.id] && (
                            <div className="flex items-center gap-1 mt-1 text-red-500 text-xs font-bold">
                              <AlertCircle className="w-3 h-3" />
                              {pointsErrors[q.id]}
                            </div>
                          )}
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
                          
                          <div className="grid grid-cols-1 gap-6">
                            {q.options?.map((opt, oIndex) => (
                              <div key={oIndex} className="bg-gray-50 p-4 rounded-2xl border-2 border-gray-100 space-y-4">
                                {/* Option Label */}
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
                                    onClick={() => handleQuestionChange(qIndex, 'correctAnswerIndex', oIndex)}
                                    className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 text-xs font-bold ${q.correctAnswerIndex === oIndex ? 'bg-green-600 text-white shadow-lg shadow-green-200' : 'bg-gray-200 text-gray-400 hover:bg-gray-300'}`}
                                    title="Tandai Jawaban Benar"
                                  >
                                    <Check className="w-4 h-4" /> {q.correctAnswerIndex === oIndex ? 'Jawaban Benar' : 'Tandai Benar'}
                                  </button>
                                </div>

                                {/* Rich Text Editor for Option - PERTAMA */}
                                <div>
                                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Teks Pilihan</label>
                                  <RichTextEditor 
                                    value={opt} 
                                    onChange={(value) => handleOptionChange(qIndex, oIndex, value)}
                                    placeholder={`Masukkan teks untuk pilihan ${String.fromCharCode(65 + oIndex)}...`}
                                    height="120px"
                                  />
                                </div>

                                <div className="mt-2">
                                  <div className="flex justify-between items-center mb-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase flex items-center gap-2">
                                        <ImageIcon className="w-3 h-3" /> Lampiran Gambar (Opsional)
                                    </label>
                                    <div className="flex bg-gray-100 rounded-lg p-0.5">
                                        <button
                                          onClick={() => toggleOptionUploadMode(`${q.id}_${oIndex}`, 'url')}
                                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 ${(!optionUploadMode[`${q.id}_${oIndex}`] || optionUploadMode[`${q.id}_${oIndex}`] === 'url') ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                                        >
                                          <LinkIcon className="w-3 h-3" /> URL
                                        </button>
                                        <button
                                          onClick={() => toggleOptionUploadMode(`${q.id}_${oIndex}`, 'file')}
                                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 ${optionUploadMode[`${q.id}_${oIndex}`] === 'file' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                                        >
                                          <Upload className="w-3 h-3" /> Upload
                                        </button>
                                    </div>
                                  </div>

                                  <div className="flex gap-2 items-start">
                                      {(!optionUploadMode[`${q.id}_${oIndex}`] || optionUploadMode[`${q.id}_${oIndex}`] === 'url') ? (
                                          <input
                                              type="text"
                                              value={q.optionAttachments?.[oIndex]?.url || ''}
                                              onChange={(e) => handleOptionAttachmentChange(qIndex, oIndex, e.target.value)}
                                              placeholder="https://example.com/image.jpg"
                                              className="flex-1 px-3 py-2 rounded-xl border border-gray-100 bg-white focus:ring-2 focus:ring-indigo-500 text-xs font-bold outline-none"
                                          />
                                      ) : (
                                          <div className="flex-1 relative">
                                              <input
                                                  type="file"
                                                  accept="image/*"
                                                  onChange={(e) => handleOptionFileUpload(qIndex, oIndex, e)}
                                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                              />
                                              <div className="w-full px-3 py-2 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 text-center hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 text-gray-400 font-bold text-xs">
                                                  <Upload className="w-3 h-3" />
                                                  {q.optionAttachments?.[oIndex]?.url === 'uploading...' ? 'Mengunggah...' : 'Klik untuk Upload'}
                                              </div>
                                          </div>
                                      )}

                                      {q.optionAttachments?.[oIndex]?.url && (
                                          <div className="relative group shrink-0">
                                              <div className="w-10 h-10 rounded-lg bg-gray-200 border border-gray-300 overflow-hidden">
                                                  <img src={q.optionAttachments[oIndex]?.url} alt="Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = 'https://placehold.co/100x100?text=Error')} />
                                              </div>
                                              <button
                                                onClick={() => handleOptionAttachmentChange(qIndex, oIndex, '')}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                                title="Hapus Gambar"
                                              >
                                                <X className="w-3 h-3" />
                                              </button>
                                          </div>
                                      )}
                                  </div>
                                </div>

                                {/* Delete Option Button - KEDUA */}
                                {(q.options?.length || 0) > 2 && (
                                  <button
                                    onClick={() => {
                                      const newOptions = q.options?.filter((_, i) => i !== oIndex) || [];
                                      handleQuestionChange(qIndex, 'options', newOptions);
                                      if (q.correctAnswerIndex === oIndex) {
                                        handleQuestionChange(qIndex, 'correctAnswerIndex', 0);
                                      }
                                    }}
                                    className="w-full py-2 rounded-lg bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                                    title="Hapus Pilihan"
                                  >
                                    <Trash2 className="w-4 h-4" /> Hapus Pilihan
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>

                          {(q.options?.length || 0) < 8 && (
                            <button
                              onClick={() => {
                                const newOptions = [...(q.options || []), ''];
                                handleQuestionChange(qIndex, 'options', newOptions);
                              }}
                              className="w-full py-2 border-2 border-dashed border-indigo-300 rounded-xl text-indigo-600 font-bold hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2 text-sm mt-3"
                            >
                              <Plus className="w-4 h-4" /> Tambah Pilihan
                            </button>
                          )}
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

                          {/* Toolbar */}
                          <div className="flex gap-1 bg-gray-100 p-2 rounded-lg w-fit mb-4">
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
                            {q.options?.map((opt, oIndex) => (
                              <div key={oIndex} className="bg-gray-50 p-4 rounded-2xl border-2 border-gray-100 space-y-4">
                                {/* Option Label */}
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
                                      const currentIndices = q.correctAnswerIndices || [];
                                      const newIndices = currentIndices.includes(oIndex) 
                                        ? currentIndices.filter(i => i !== oIndex) 
                                        : [...currentIndices, oIndex];
                                      handleQuestionChange(qIndex, 'correctAnswerIndices', newIndices);
                                    }}
                                    className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 text-xs font-bold ${q.correctAnswerIndices?.includes(oIndex) ? 'bg-green-600 text-white shadow-lg shadow-green-200' : 'bg-gray-200 text-gray-400 hover:bg-gray-300'}`}
                                  >
                                    <Check className="w-4 h-4" /> {q.correctAnswerIndices?.includes(oIndex) ? 'Jawaban Benar' : 'Tandai Benar'}
                                  </button>
                                </div>

                                {/* Rich Text Editor for Option - PERTAMA */}
                                <div>
                                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Teks Pilihan</label>
                                  <RichTextEditor 
                                    value={opt} 
                                    onChange={(value) => handleOptionChange(qIndex, oIndex, value)}
                                    placeholder={`Masukkan teks untuk pilihan ${String.fromCharCode(65 + oIndex)}...`}
                                    height="120px"
                                  />
                                </div>

                                <div className="mt-2">
                                  <div className="flex justify-between items-center mb-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase flex items-center gap-2">
                                        <ImageIcon className="w-3 h-3" /> Lampiran Gambar (Opsional)
                                    </label>
                                    <div className="flex bg-gray-100 rounded-lg p-0.5">
                                        <button
                                          onClick={() => toggleOptionUploadMode(`${q.id}_${oIndex}`, 'url')}
                                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 ${(!optionUploadMode[`${q.id}_${oIndex}`] || optionUploadMode[`${q.id}_${oIndex}`] === 'url') ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                                        >
                                          <LinkIcon className="w-3 h-3" /> URL
                                        </button>
                                        <button
                                          onClick={() => toggleOptionUploadMode(`${q.id}_${oIndex}`, 'file')}
                                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 ${optionUploadMode[`${q.id}_${oIndex}`] === 'file' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                                        >
                                          <Upload className="w-3 h-3" /> Upload
                                        </button>
                                    </div>
                                  </div>

                                  <div className="flex gap-2 items-start">
                                      {(!optionUploadMode[`${q.id}_${oIndex}`] || optionUploadMode[`${q.id}_${oIndex}`] === 'url') ? (
                                          <input
                                              type="text"
                                              value={q.optionAttachments?.[oIndex]?.url || ''}
                                              onChange={(e) => handleOptionAttachmentChange(qIndex, oIndex, e.target.value)}
                                              placeholder="https://example.com/image.jpg"
                                              className="flex-1 px-3 py-2 rounded-xl border border-gray-100 bg-white focus:ring-2 focus:ring-indigo-500 text-xs font-bold outline-none"
                                          />
                                      ) : (
                                          <div className="flex-1 relative">
                                              <input
                                                  type="file"
                                                  accept="image/*"
                                                  onChange={(e) => handleOptionFileUpload(qIndex, oIndex, e)}
                                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                              />
                                              <div className="w-full px-3 py-2 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 text-center hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 text-gray-400 font-bold text-xs">
                                                  <Upload className="w-3 h-3" />
                                                  {q.optionAttachments?.[oIndex]?.url === 'uploading...' ? 'Mengunggah...' : 'Klik untuk Upload'}
                                              </div>
                                          </div>
                                      )}

                                      {q.optionAttachments?.[oIndex]?.url && (
                                          <div className="relative group shrink-0">
                                              <div className="w-10 h-10 rounded-lg bg-gray-200 border border-gray-300 overflow-hidden">
                                                  <img src={q.optionAttachments[oIndex]?.url} alt="Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = 'https://placehold.co/100x100?text=Error')} />
                                              </div>
                                              <button
                                                onClick={() => handleOptionAttachmentChange(qIndex, oIndex, '')}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                                title="Hapus Gambar"
                                              >
                                                <X className="w-3 h-3" />
                                              </button>
                                          </div>
                                      )}
                                  </div>
                                </div>

                                {/* Delete Option Button - KEDUA */}
                                {(q.options?.length || 0) > 2 && (
                                  <button
                                    onClick={() => {
                                      const newOptions = q.options?.filter((_, i) => i !== oIndex) || [];
                                      handleQuestionChange(qIndex, 'options', newOptions);
                                      const currentIndices = q.correctAnswerIndices || [];
                                      const newIndices = currentIndices.filter(i => i !== oIndex);
                                      handleQuestionChange(qIndex, 'correctAnswerIndices', newIndices);
                                    }}
                                    className="w-full py-2 rounded-lg bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                                    title="Hapus Pilihan"
                                  >
                                    <Trash2 className="w-4 h-4" /> Hapus Pilihan
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>

                          {(q.options?.length || 0) < 8 && (
                            <button
                              onClick={() => {
                                const newOptions = [...(q.options || []), ''];
                                handleQuestionChange(qIndex, 'options', newOptions);
                              }}
                              className="w-full py-2 border-2 border-dashed border-indigo-300 rounded-xl text-indigo-600 font-bold hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2 text-sm mt-3"
                            >
                              <Plus className="w-4 h-4" /> Tambah Pilihan
                            </button>
                          )}
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
            <p className="text-sm text-gray-500 mb-6">Soal yang dihapus tidak dapat dikembalikan.</p>
            <div className="flex gap-3">
              <button onClick={() => setQuestionToDelete(null)} className="flex-1 py-3 bg-gray-50 text-gray-500 rounded-xl font-bold hover:bg-gray-100 transition">Batal</button>
              <button onClick={() => { 
                setFormData(prev => ({ 
                  ...prev, 
                  questions: prev.questions.filter(q => q.id !== questionToDelete),
                  updatedAt: new Date().toISOString() // Update timestamp saat soal dihapus
                })); 
                setQuestionToDelete(null); 
              }} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-black hover:bg-red-700 transition">Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamEditor;