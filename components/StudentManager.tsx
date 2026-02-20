
import React, { useState, useRef } from 'react';
import { User } from '../types';
import { 
  Users, Upload, Download, FileSpreadsheet, Trash2, 
  UserPlus, Search, X, CheckCircle2, AlertCircle, Edit3, Save,
  BadgeCheck, Key
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface StudentManagerProps {
  students: User[];
  onUpdate: (updated: User[]) => void;
  onAddStudent: (newStudent: User) => Promise<void>;
  onDeleteStudent: (id: string) => Promise<void>;
}

const StudentManager: React.FC<StudentManagerProps> = ({ students, onUpdate, onAddStudent, onDeleteStudent }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', grade: '', nis: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.grade && s.grade.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (s.nis && s.nis.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleDownloadTemplate = () => {
    const templateData = [
      { Nama: 'Budi Santoso', Email: 'budi@sekolah.id', Kelas: 'X-1', NIS: '12345', Password: 'rahasia123' },
      { Nama: 'Siti Aminah', Email: 'siti@sekolah.id', Kelas: 'X-2', NIS: '67890', Password: 'password' },
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Daftar Siswa");
    XLSX.writeFile(wb, "Template_Import_Siswa_Examo_v2.xlsx");
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

        const importedStudents: User[] = jsonData
          .filter(row => row.Nama && (row.Email || row.NIS)) // Require Name and (Email OR NIS)
          .map((row, idx) => ({
            id: `temp-${Date.now()}-${idx}`, // Temp ID, server should generate real ID
            name: row.Nama,
            email: row.Email || `user-${Date.now()}-${idx}@placeholder.com`, // Fallback email
            grade: row.Kelas || '-',
            nis: row.NIS ? String(row.NIS) : undefined,
            role: 'student',
            password: row.Password ? String(row.Password) : 'password' // Use Excel password or default
          }));

        if (importedStudents.length > 0) {
            // For bulk import, we pass to onUpdate which App.tsx will handle as bulk insert
            onUpdate(importedStudents);
            // Note: App.tsx implementation of onUpdate for bulk should handle appending
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

  const handleOpenEdit = (student: User) => {
    setFormData({
      name: student.name,
      email: student.email,
      grade: student.grade || '',
      nis: student.nis || '',
      password: student.password || ''
    });
    setEditingId(student.id);
    setModalMode('edit');
  };

  const handleSubmitManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || (!formData.email && !formData.nis)) {
      alert("Nama dan salah satu dari Email atau NIS wajib diisi.");
      return;
    }
    
    setIsSubmitting(true);
    // Fallback email if empty but NIS provided
    const emailToUse = formData.email || `${formData.nis}@sekolah.id`;
    const passwordToUse = formData.password || 'password';

    try {
        if (modalMode === 'add') {
        const student: User = {
            id: `temp-add-${Date.now()}`, // Temporary ID
            name: formData.name,
            email: emailToUse,
            grade: formData.grade,
            nis: formData.nis,
            role: 'student',
            password: passwordToUse
        };
        await onAddStudent(student);
        } else if (modalMode === 'edit' && editingId) {
            // For edit, we still use the old way via onUpdate(all_students) OR ideally a new onEditStudent prop
            // Given the plan, let's keep using onUpdate for edits for now as refactor focused on Add/Delete
            const updatedStudents = students.map(s => s.id === editingId ? { ...s, ...formData, email: emailToUse, password: passwordToUse } : s);
            // We can trick App.tsx: usually onUpdate handles replacement
            // Ideally we need onUpdateStudent prop.
            // But let's follow the prop signature: onUpdate
            onUpdate(updatedStudents);
        }

        setFormData({ name: '', email: '', grade: '', nis: '', password: '' });
        setModalMode(null);
        setEditingId(null);
    } catch (error) {
        console.error("Failed to save student:", error);
        alert("Gagal menyimpan data siswa.");
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Hapus siswa ini dari daftar?')) {
        try {
            await onDeleteStudent(id);
        } catch (error) {
            console.error("Failed to delete student:", error);
            alert("Gagal menghapus siswa.");
        }
    }
  };

  return (
    <div className="max-w-6xl mx-auto text-left animate-in fade-in duration-500 pb-20 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Manajemen Siswa</h1>
          <p className="text-gray-400 font-medium mt-1">Kelola akun dan kelas siswa pengakses ujian.</p>
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
              setFormData({ name: '', email: '', grade: '', nis: '', password: '' });
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
            placeholder="Cari nama, email, NIS, atau kelas..."
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
                <th className="px-8 py-6 text-xs font-black text-gray-400 uppercase tracking-widest w-[25%]">Nama Lengkap</th>
                <th className="px-6 py-6 text-xs font-black text-gray-400 uppercase tracking-widest w-[15%]">NIS Ujian</th>
                <th className="px-6 py-6 text-xs font-black text-gray-400 uppercase tracking-widest w-[15%]">Kelas</th>
                <th className="px-6 py-6 text-xs font-black text-gray-400 uppercase tracking-widest w-[30%]">Email Access</th>
                <th className="px-8 py-6 text-xs font-black text-gray-400 uppercase tracking-widest text-right w-[15%]">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredStudents.length === 0 ? (
                <tr><td colSpan={5} className="px-10 py-24 text-center text-gray-400 font-medium italic">Belum ada data siswa.</td></tr>
              ) : (
                filteredStudents.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50/30 transition-colors group">
                    <td className="px-8 py-6 font-bold text-gray-900">{s.name}</td>
                    <td className="px-6 py-6">
                      {s.nis ? (
                        <div className="flex items-center gap-2">
                          <BadgeCheck className="w-4 h-4 text-green-500" />
                          <span className="font-mono font-bold text-gray-700">{s.nis}</span>
                        </div>
                      ) : (
                        <span className="text-gray-300 italic">-</span>
                      )}
                    </td>
                    <td className="px-6 py-6">
                      <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-lg text-xs font-black border border-gray-200 uppercase tracking-tight">
                        {s.grade || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-6 text-indigo-600 font-medium text-sm truncate max-w-[200px]">{s.email}</td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleOpenEdit(s)} className="p-3 bg-gray-50 text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                          <Edit3 className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleDelete(s.id)} className="p-3 bg-red-50 text-red-100 hover:text-red-500 hover:bg-red-100 rounded-xl transition-all">
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
                {modalMode === 'add' ? 'Siswa Baru' : 'Edit Siswa'}
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
                  placeholder="Contoh: Andi Wijaya"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">NIS Ujian (Opsional)</label>
                <input
                  type="text"
                  value={formData.nis}
                  onChange={(e) => setFormData({...formData, nis: e.target.value})}
                  className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-transparent focus:border-indigo-500 focus:bg-white outline-none font-bold transition-all font-mono"
                  placeholder="Contoh: 12345"
                />
                <p className="text-[10px] text-gray-400 mt-1 ml-1">Dapat digunakan untuk login pengganti email.</p>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Kelas</label>
                <input 
                  type="text" 
                  list="grades-list"
                  value={formData.grade}
                  onChange={(e) => setFormData({...formData, grade: e.target.value})}
                  className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-transparent focus:border-indigo-500 focus:bg-white outline-none font-bold transition-all"
                  placeholder="Misal: X-1, XII-IPA-1"
                />
                <datalist id="grades-list">
                  <option value="X-1" /><option value="X-2" /><option value="X-3" />
                  <option value="XI-IPA-1" /><option value="XI-IPS-1" />
                  <option value="XII-IPA-1" /><option value="XII-IPS-1" />
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Email Access</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-transparent focus:border-indigo-500 focus:bg-white outline-none font-bold transition-all"
                  placeholder="andi@sekolah.id"
                />
                <p className="text-[10px] text-gray-400 mt-1 ml-1">Jika kosong, akan diisi otomatis jika NIS tersedia.</p>
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
                <p className="text-[10px] text-gray-400 mt-1 ml-1">Default: 'password' jika dikosongkan.</p>
              </div>

              <button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-70">
                {isSubmitting ? 'Menyimpan...' : (modalMode === 'add' ? 'Simpan Siswa' : 'Update Siswa')}
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

export default StudentManager;