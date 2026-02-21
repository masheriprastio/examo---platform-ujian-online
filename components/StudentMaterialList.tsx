import React from 'react';
import { Download, File, FileArchive, FileAudio, FileCode, FileImage, FileSpreadsheet, FileText, FileVideo, Eye } from 'lucide-react';
import { Material } from '../types';

interface StudentMaterialListProps {
  materials: Material[];
  onPreview: (material: Material) => void;
}

const StudentMaterialList: React.FC<StudentMaterialListProps> = ({ materials, onPreview }) => {
  const getFileIcon = (mimeType: string | null | undefined) => {
    const safeMime = mimeType ?? '';
    if (safeMime.includes('pdf')) return FileText;
    if (safeMime.includes('spreadsheet') || safeMime.includes('excel')) return FileSpreadsheet;
    if (safeMime.includes('audio')) return FileAudio;
    if (safeMime.includes('video')) return FileVideo;
    if (safeMime.includes('image')) return FileImage;
    if (safeMime.includes('zip') || safeMime.includes('archive')) return FileArchive;
    if (safeMime.includes('code') || safeMime.includes('text')) return FileCode;
    return File;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex justify-between items-center p-6 border-b border-gray-100">
        <div>
          <h2 className="text-xl font-black text-gray-900">Materi Pembelajaran</h2>
          <p className="text-gray-400 text-sm">Total {materials.length} materi tersedia</p>
        </div>
      </div>

      {materials.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-[40px] border border-dashed border-gray-200">
          <p className="text-gray-400 font-medium">Belum ada materi yang dibagikan.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 border-b text-left">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">File</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Deskripsi</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Ukuran</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {materials.map((material) => {
                const IconComponent = getFileIcon(material.mimeType);
                return (
                  <tr key={material.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                          <IconComponent className="w-6 h-6 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{material.title}</p>
                          <p className="text-xs text-gray-400 mt-1">{material.fileName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-gray-500 font-medium">
                      {material.description || '-'}
                    </td>
                    <td className="px-6 py-6 text-gray-500 font-medium">
                      {formatFileSize(material.fileSize)}
                    </td>
                    <td className="px-6 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onPreview(material)}
                          className="p-3 bg-gray-50 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                          title="Preview"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <a
                          href={material.fileUrl}
                          download={material.fileName}
                          className="p-3 bg-gray-50 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                          title="Unduh File"
                        >
                          <Download className="w-5 h-5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StudentMaterialList;