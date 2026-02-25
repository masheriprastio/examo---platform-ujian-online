
import React, { useState, useRef } from 'react';
import { generateUUID } from '../lib/uuid';
import { User } from '../types';
import {
  Users, Upload, Download, FileSpreadsheet, Trash2,
  UserPlus, Search, X, CheckCircle2, AlertCircle, Edit3, Save,
  BadgeCheck, Key, BookOpen
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface TeacherManagerProps {
  teachers: User[];
  onUpdate: (updated: User[]) => void;
  onAddTeacher: (newTeacher: User) => Promise<void>;
  onDeleteTeacher: (id: string) => Promise<void>;
  onEditTeacher?: (editedTeacher: User) => Promise<void>;
}

const TeacherManager: React.FC<TeacherManagerProps> = ({ teachers, onUpdate, onAddTeacher, onDeleteTeacher, onEditTeacher }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', nip: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredTeachers = teachers.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.subject && t.subject.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (t.nis && t.nis.toLowerCase().includes(searchTerm.toLowerCase())) // Checking NIS as NIP
  );

  const handleDownloadTemplate = () => {
    const templateData = [
      { Nama: 'Budi Santoso', Email: 'budi@sekolah.id', Mapel: 'Matematika', NIP: '19800101', Password: 'rahasia123' },
      { Nama: 'Siti Aminah', Email: 'siti@sekolah.id', Mapel: 'Bahasa Indonesia', NIP: '19850505', Password: 'password' },
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Daftar Guru");
    XLSX.writeFile(wb, "Template_Import_Guru_Examo.xlsx");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

        const importedTeachers: User[] = jsonData
          .filter(row => row.Nama && (row.Email || row.NIP))
          .map((row, idx) => ({
            id: `temp-${Date.now()}-${idx}`,
            name: row.Nama,
            email: row.Email || `teacher-${Date.now()}-${idx}@placeholder.com`,
            subject: row.Mapel || '-',
            nis: row.NIP ? String(row.NIP) : undefined, // Using NIS field for NIP
            role: 'teacher',
            password: row.Password ? String(row.Password) : 'password'
          }));

        if (importedTeachers.length > 0) {
            onUpdate(importedTeachers);
        } else {
          alert('Format Excel salah atau tidak ada data yang valid (Nama wajib diisi).');
        }
      } catch (err) {
        alert('Gagal memproses file Excel.');
        console.error(err);
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleOpenEdit = (teacher: User) => {
    setFormData({
      name: teacher.name,
      email: teacher.email,
      subject: teacher.subject || '',
      nip: teacher.nis || '', // Using NIS as NIP
      password: teacher.password || ''
    });
    setEditingId(teacher.id);
    setModalMode('edit');
  };

  const handleSubmitManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || (!formData.email && !formData.nip)) {
      alert("Nama dan salah satu dari Email atau NIP wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    const emailToUse = formData.email || `${formData.nip}@sekolah.id`;
    const passwordToUse = formData.password || 'password';

    try {
        if (modalMode === 'add') {
        const teacher: User = {
            id: generateUUID(),
            name: formData.name,
            email: emailToUse,
            subject: formData.subject,
            nis: formData.nip, // Store NIP in NIS field
            role: 'teacher',
            password: passwordToUse
        };
        await onAddTeacher(teacher);
        } else if (modalMode === 'edit' && editingId) {
            const editedTeacher = teachers.find(t => t.id === editingId);
            if (editedTeacher) {
              const updatedTeacher: User = {
                ...editedTeacher,
                name: formData.name,
                email: emailToUse,
                subject: formData.subject,
                nis: formData.nip,
                password: passwordToUse
              };
              if (onEditTeacher) {
                await onEditTeacher(updatedTeacher);
              } else {
                const updatedTeachers = teachers.map(t => t.id === editingId ? updatedTeacher : t);
                onUpdate(updatedTeachers);
              }
            }
        }

        setFormData({ name: '', email: '', subject: '', nip: '', password: '' });
        setModalMode(null);
        setEditingId(null);
    } catch (error) {
        console.error("Failed to save teacher:", error);
        alert("Gagal menyimpan data guru.");
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Hapus guru ini dari daftar?')) {
        try {
            await onDeleteTeacher(id);
        } catch (error) {
            console.error("Failed to delete teacher:", error);
            alert("Gagal menghapus guru.");
        }
    }
  };

  return (
    <div className="max-w-6xl mx-auto text-left animate-in fade-in duration-500 pb-20 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Manajemen Guru</h1>
          <p className="text-gray-400 font-medium mt-1">Kelola akun dan mata pelajaran guru.</p>
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <button
            onClick={handleDownloadTemplate}
            className="flex-1 md:flex-none bg-white border-2 border-gray-100 text-gray-600 px-6 py-4 rounded-[20px] font-black hover:bg-gray-50 transition-all flex items-center justify-center gap-2 text-sm"
          >
            <Download className="w-5 h-5" /> Template
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="flex-1 md:flex-none bg-indigo-50 border-2 border-indigo-100 text-indigo-600 px-6 py-4 rounded-[20px] font-black hover:bg-indigo-100 transition-all flex items-center justify-center gap-2 text-sm shadow-sm"
          >
            <Upload className="w-5 h-5" /> Import Excel
          </button>
          <button
            onClick={() => {
              setFormData({ name: '', email: '', subject: '', nip: '', password: '' });
              setModalMode('add');
            }}
            className="flex-1 md:flex-none bg-indigo-600 text-white px-6 py-4 rounded-[20px] font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 active:scale-95 text-sm"
          >
            <UserPlus className="w-5 h-5" /> Tambah Manual
          </button>
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".xlsx, .xls" />
        </div>
      </div>

      <div className="bg-white p-4 rounded-[30px] border border-gray-100 shadow-sm mb-8 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-4 w-5 h-5 text-gray-300" />
          <input
            type="text"
            placeholder="Cari nama, email, NIP, atau mapel..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-gray-50 border-transparent focus:border-indigo-500 focus:bg-white transition font-bold text-gray-800 outline-none"
          />
        </div>
      </div>

      <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-gray-50/50 border-b border-gray-50 text-left">
              <tr>
                <th className="px-8 py-6 text-xs font-black text-gray-400 uppercase tracking-widest w-[25%]">Nama Guru</th>
                <th className="px-6 py-6 text-xs font-black text-gray-400 uppercase tracking-widest w-[15%]">NIP</th>
                <th className="px-6 py-6 text-xs font-black text-gray-400 uppercase tracking-widest w-[20%]">Mata Pelajaran</th>
                <th className="px-6 py-6 text-xs font-black text-gray-400 uppercase tracking-widest w-[25%]">Email Access</th>
                <th className="px-8 py-6 text-xs font-black text-gray-400 uppercase tracking-widest text-right w-[15%]">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredTeachers.length === 0 ? (
                <tr><td colSpan={5} className="px-10 py-24 text-center text-gray-400 font-medium italic">Belum ada data guru.</td></tr>
              ) : (
                filteredTeachers.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50/30 transition-colors group">
                    <td className="px-8 py-6 font-bold text-gray-900">{t.name}</td>
                    <td className="px-6 py-6">
                      {t.nis ? (
                        <div className="flex items-center gap-2">
                          <BadgeCheck className="w-4 h-4 text-indigo-500" />
                          <span className="font-mono font-bold text-gray-700">{t.nis}</span>
                        </div>
                      ) : (
                        <span className="text-gray-300 italic">-</span>
                      )}
                    </td>
                    <td className="px-6 py-6">
                      <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg text-xs font-black border border-indigo-100 uppercase tracking-tight">
                        {t.subject || 'UMUM'}
                      </span>
                    </td>
                    <td className="px-6 py-6 text-gray-600 font-medium text-sm truncate max-w-[200px]">{t.email}</td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleOpenEdit(t)} className="p-3 bg-gray-50 text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                          <Edit3 className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleDelete(t.id)} className="p-3 bg-red-50 text-red-100 hover:text-red-500 hover:bg-red-100 rounded-xl transition-all">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalMode && (
        <div className="fixed inset-0 z-[100] bg-gray-900/40 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in">
          <form onSubmit={handleSubmitManual} className="bg-white w-full max-w-md rounded-[40px] shadow-2xl p-10 text-left">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-gray-900">
                {modalMode === 'add' ? 'Guru Baru' : 'Edit Guru'}
              </h3>
              <button type="button" onClick={() => setModalMode(null)} className="p-2 text-gray-400 hover:bg-gray-50 rounded-xl"><X className="w-6 h-6" /></button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Nama Lengkap *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-transparent focus:border-indigo-500 focus:bg-white outline-none font-bold transition-all"
                  placeholder="Contoh: Budi Santoso, S.Pd."
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">NIP / ID Guru (Opsional)</label>
                <input
                  type="text"
                  value={formData.nip}
                  onChange={(e) => setFormData({...formData, nip: e.target.value})}
                  className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-transparent focus:border-indigo-500 focus:bg-white outline-none font-bold transition-all font-mono"
                  placeholder="Contoh: 19800101..."
                />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Mata Pelajaran</label>
                <div className="relative">
                    <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    className="w-full pl-11 pr-5 py-4 rounded-2xl bg-gray-50 border-transparent focus:border-indigo-500 focus:bg-white outline-none font-bold transition-all"
                    placeholder="Misal: Matematika, Fisika"
                    />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Email Access</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-transparent focus:border-indigo-500 focus:bg-white outline-none font-bold transition-all"
                  placeholder="guru@sekolah.id"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Password</label>
                <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                    type="text"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full pl-11 pr-5 py-4 rounded-2xl bg-gray-50 border-transparent focus:border-indigo-500 focus:bg-white outline-none font-bold transition-all"
                    placeholder="Set password (default: password)"
                    />
                </div>
              </div>

              <button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-70">
                {isSubmitting ? 'Menyimpan...' : (modalMode === 'add' ? 'Simpan Guru' : 'Update Guru')}
                {modalMode === 'add' && !isSubmitting && <UserPlus className="w-5 h-5" />}
                {modalMode === 'edit' && !isSubmitting && <Save className="w-5 h-5" />}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default TeacherManager;
