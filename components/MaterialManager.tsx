import React, { useState, useEffect } from 'react';
import { FileText, Upload, Download, Trash2, File, FileSpreadsheet, FileAudio, FileVideo, FileImage, FileArchive, FileCode } from 'lucide-react';
import MaterialList from './MaterialList';
import MaterialUpload from './MaterialUpload';
import { MaterialService } from '../services/MaterialService';
import { Material } from '../types';

const MaterialManager: React.FC = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await MaterialService.getAllMaterials();
      setMaterials(data);
    } catch (err) {
      console.error('Failed to fetch materials:', err);
      setError('Gagal memuat materi. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (materialId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus materi ini?')) {
      return;
    }

    try {
      await MaterialService.deleteMaterial(materialId);
      setMaterials(prev => prev.filter(m => m.id !== materialId));
    } catch (err) {
      console.error('Failed to delete material:', err);
      setError('Gagal menghapus materi. Silakan coba lagi.');
    }
  };

  const handleUploadSuccess = () => {
    fetchMaterials();
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return FileText;
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return FileSpreadsheet;
    if (mimeType.includes('audio')) return FileAudio;
    if (mimeType.includes('video')) return FileVideo;
    if (mimeType.includes('image')) return FileImage;
    if (mimeType.includes('zip') || mimeType.includes('archive')) return FileArchive;
    if (mimeType.includes('code') || mimeType.includes('text')) return FileCode;
    return File;
  };

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Manajemen Materi</h1>
          <p className="text-gray-400">Kelola materi pembelajaran untuk siswa Anda.</p>
        </div>
        <MaterialUpload onUploadSuccess={handleUploadSuccess} />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2 mb-6 animate-shake">
          <Trash2 className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-400 font-medium">Memuat materi...</p>
        </div>
      ) : (
        <MaterialList 
          materials={materials} 
          onDelete={handleDelete}
          onRefresh={fetchMaterials}
        />
      )}
    </div>
  );
};

export default MaterialManager;