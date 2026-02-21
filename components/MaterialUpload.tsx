import React, { useState } from 'react';
import { Upload, FileText, FileSpreadsheet, FileAudio, FileVideo, FileImage, FileArchive, FileCode, X } from 'lucide-react';
import { MaterialService } from '../services/MaterialService';

interface MaterialUploadProps {
  onUploadSuccess: () => void;
}

const MaterialUpload: React.FC<MaterialUploadProps> = ({ onUploadSuccess }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Umum');
  const [grade, setGrade] = useState('');
  const [subject, setSubject] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (selectedFile: File) => {
    // Validasi file
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/bmp',
      'image/webp',
      'video/mp4',
      'video/mpeg',
      'video/quicktime',
      'audio/mpeg',
      'audio/wav',
      'audio/mp3',
      'application/zip',
      'application/x-rar-compressed'
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Format file tidak didukung. Silakan pilih file PDF, DOC, XLS, gambar, atau file lainnya.');
      return;
    }

    if (selectedFile.size > 50 * 1024 * 1024) { // 50MB limit
      setError('Ukuran file terlalu besar. Maksimal 50MB.');
      return;
    }

    setFile(selectedFile);
    setError(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Silakan pilih file terlebih dahulu.');
      return;
    }

    if (!title.trim()) {
      setError('Silakan masukkan judul materi.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      await MaterialService.uploadMaterial(
        file,
        title.trim(),
        description.trim(),
        category,
        grade || undefined,
        subject || undefined
      );
      
      // Reset form
      setFile(null);
      setTitle('');
      setDescription('');
      setCategory('Umum');
      setGrade('');
      setSubject('');
      
      onUploadSuccess();
    } catch (err) {
      console.error('Upload failed:', err);
      setError('Gagal mengunggah materi. Silakan coba lagi.');
    } finally {
      setIsUploading(false);
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return FileText;
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return FileSpreadsheet;
    if (mimeType.includes('audio')) return FileAudio;
    if (mimeType.includes('video')) return FileVideo;
    if (mimeType.includes('image')) return FileImage;
    if (mimeType.includes('zip') || mimeType.includes('archive')) return FileArchive;
    if (mimeType.includes('code') || mimeType.includes('text')) return FileCode;
    return FileText;
  };

  return (
    <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-black text-gray-900 mb-4">Unggah Materi Baru</h3>
      
      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2 mb-4 animate-shake">
          <X className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* File Upload Area */}
      <div
        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all mb-6 ${
          isDragging 
            ? 'border-indigo-500 bg-indigo-50' 
            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {file ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-gray-600" />
              </div>
              <div className="text-left">
                <p className="font-bold text-gray-900">{file.name}</p>
                <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
            <button
              onClick={() => setFile(null)}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div>
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-400 font-medium mb-2">Tarik dan lepas file di sini</p>
            <p className="text-xs text-gray-300">atau klik untuk memilih file</p>
          </div>
        )}
        
        <input
          type="file"
          className="hidden"
          id="file-input"
          onChange={handleFileInputChange}
        />
        
        <label
          htmlFor="file-input"
          className="mt-4 inline-block bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black hover:bg-indigo-700 transition-all cursor-pointer"
        >
          Pilih File
        </label>
      </div>

      {/* Form Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Judul Materi</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition font-bold text-gray-900"
            placeholder="Masukkan judul materi..."
          />
        </div>
        <div>
          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Kategori</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition font-bold text-gray-900"
          >
            <option value="Umum">Umum</option>
            <option value="Matematika">Matematika</option>
            <option value="Bahasa Indonesia">Bahasa Indonesia</option>
            <option value="Bahasa Inggris">Bahasa Inggris</option>
            <option value="IPA">IPA</option>
            <option value="IPS">IPS</option>
            <option value="Agama">Agama</option>
            <option value="Seni">Seni</option>
            <option value="Olahraga">Olahraga</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Kelas</label>
          <input
            type="text"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition font-bold text-gray-900"
            placeholder="Contoh: X, XI, XII"
          />
        </div>
        <div>
          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Mata Pelajaran</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition font-bold text-gray-900"
            placeholder="Contoh: Aljabar, Sejarah"
          />
        </div>
        <div>
          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Deskripsi</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition font-bold text-gray-900"
            placeholder="Deskripsi singkat materi"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleUpload}
          disabled={isUploading || !file}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 px-8 rounded-2xl transition shadow-xl shadow-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isUploading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Mengunggah...
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              Unggah Materi
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default MaterialUpload;