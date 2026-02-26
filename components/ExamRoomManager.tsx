import React, { useState, useRef, useEffect } from 'react';
import { generateUUID } from '../lib/uuid';
import { ExamRoom, User } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  Building2, Users, MapPin, Plus, Trash2, Edit3, Save,
  X, Search, CheckCircle, AlertCircle, Clock, User as UserIcon,
  Download, Upload, FileSpreadsheet, Key, Home, Wifi, WifiOff
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface ExamRoomManagerProps {
  examRooms: ExamRoom[];
  teachers: User[];
  onUpdate: (updatedRooms: ExamRoom[]) => void;
  onAddRoom: (newRoom: ExamRoom) => Promise<void>;
  onDeleteRoom: (id: string) => Promise<void>;
  onEditRoom?: (editedRoom: ExamRoom) => Promise<void>;
}

const ExamRoomManager: React.FC<ExamRoomManagerProps> = ({ 
  examRooms, 
  teachers, 
  onUpdate, 
  onAddRoom, 
  onDeleteRoom, 
  onEditRoom 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    description: '', 
    capacity: 30, 
    supervisorId: '', 
    location: '', 
    status: 'available' as 'available' | 'occupied' | 'maintenance' 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter rooms based on search term
  const filteredRooms = examRooms.filter(room =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.supervisorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get teacher name by ID
  const getTeacherName = (teacherId: string) => {
    const teacher = teachers.find(t => t.id === teacherId);
    return teacher ? teacher.name : 'Unknown Teacher';
  };

  // Handle download template
  const handleDownloadTemplate = () => {
    const templateData = [
      { Nama_Ruang: 'Lab Komputer 1', Deskripsi: 'Laboratorium komputer utama', Kapasitas: 30, Pengawas_ID: 'guru-01', Lokasi: 'Gedung A Lantai 2', Status: 'available' },
      { Nama_Ruang: 'Ruang Multimedia', Deskripsi: 'Ruang dengan proyektor', Kapasitas: 40, Pengawas_ID: 'guru-01', Lokasi: 'Gedung B Lantai 1', Status: 'available' },
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Daftar Ruang Ujian");
    XLSX.writeFile(wb, "Template_Import_Ruang_Ujian_Examo.xlsx");
  };

  // Handle file upload
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

        const importedRooms: ExamRoom[] = jsonData
          .filter(row => row.Nama_Ruang && row.Pengawas_ID)
          .map((row, idx) => {
            const teacher = teachers.find(t => t.id === row.Pengawas_ID);
            return {
              id: `temp-${Date.now()}-${idx}`,
              name: row.Nama_Ruang,
              description: row.Deskripsi || '',
              capacity: parseInt(row.Kapasitas) || 30,
              supervisorId: row.Pengawas_ID,
              supervisorName: teacher?.name || 'Unknown Teacher',
              location: row.Lokasi || '',
              status: (row.Status || 'available') as 'available' | 'occupied' | 'maintenance',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
          });

        if (importedRooms.length > 0) {
          // Add imported rooms to state
          const updatedRooms = [...examRooms, ...importedRooms];
          onUpdate(updatedRooms);
          
          // Save to database if configured
          if (isSupabaseConfigured && supabase && importedRooms.length > 0) {
            const rowsToInsert = importedRooms.map(room => ({
              name: room.name,
              description: room.description,
              capacity: room.capacity,
              supervisor_id: room.supervisorId,
              location: room.location,
              status: room.status
            }));

            const { error } = await supabase.from('exam_rooms').insert(rowsToInsert);
            if (error) {
              console.error("Bulk insert rooms failed:", error);
              alert("Gagal import ke database: " + error.message);
            } else {
              // Refresh data from database
              const { data } = await supabase.from('exam_rooms').select('*');
              if (data) {
                const mappedRooms: ExamRoom[] = data.map((r: any) => ({
                  id: r.id,
                  name: r.name,
                  description: r.description,
                  capacity: r.capacity,
                  supervisorId: r.supervisor_id,
                  supervisorName: getTeacherName(r.supervisor_id),
                  location: r.location,
                  status: r.status,
                  createdAt: r.created_at,
                  updatedAt: r.updated_at
                }));
                onUpdate(mappedRooms);
              }
            }
          }
        } else {
          alert('Format Excel salah atau tidak ada data yang valid (Nama Ruang dan ID Pengawas wajib diisi).');
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

  // Handle open edit modal
  const handleOpenEdit = (room: ExamRoom) => {
    setFormData({
      name: room.name,
      description: room.description || '',
      capacity: room.capacity,
      supervisorId: room.supervisorId,
      location: room.location || '',
      status: room.status
    });
    setEditingId(room.id);
    setModalMode('edit');
  };

  // Handle form submission
  const handleSubmitManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.supervisorId) {
      alert("Nama ruang dan pengawas wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    const teacher = teachers.find(t => t.id === formData.supervisorId);

    try {
      if (modalMode === 'add') {
        const newRoom: ExamRoom = {
          id: generateUUID(),
          name: formData.name,
          description: formData.description,
          capacity: formData.capacity,
          supervisorId: formData.supervisorId,
          supervisorName: teacher?.name || 'Unknown Teacher',
          location: formData.location,
          status: formData.status,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await onAddRoom(newRoom);
      } else if (modalMode === 'edit' && editingId) {
        const editedRoom = examRooms.find(r => r.id === editingId);
        if (editedRoom) {
          const updatedRoom: ExamRoom = {
            ...editedRoom,
            name: formData.name,
            description: formData.description,
            capacity: formData.capacity,
            supervisorId: formData.supervisorId,
            supervisorName: teacher?.name || 'Unknown Teacher',
            location: formData.location,
            status: formData.status,
            updatedAt: new Date().toISOString()
          };
          
          if (onEditRoom) {
            await onEditRoom(updatedRoom);
          } else {
            const updatedRooms = examRooms.map(r => r.id === editingId ? updatedRoom : r);
            onUpdate(updatedRooms);
          }
        }
      }

      setFormData({ 
        name: '', 
        description: '', 
        capacity: 30, 
        supervisorId: '', 
        location: '', 
        status: 'available' 
      });
      setModalMode(null);
      setEditingId(null);
    } catch (error) {
      console.error("Failed to save room:", error);
      alert("Gagal menyimpan data ruang ujian.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete room
  const handleDelete = async (id: string) => {
    if (confirm('Hapus ruang ujian ini dari daftar?')) {
      try {
        await onDeleteRoom(id);
      } catch (error) {
        console.error("Failed to delete room:", error);
        alert("Gagal menghapus ruang ujian.");
      }
    }
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    const statusConfig = {
      available: { color: 'bg-green-100 text-green-700 border-green-200', icon: <CheckCircle className="w-3 h-3" />, label: 'Tersedia' },
      occupied: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: <Users className="w-3 h-3" />, label: 'Terisi' },
      maintenance: { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: <AlertCircle className="w-3 h-3" />, label: 'Perbaikan' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.available;

    return (
      <div className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 ${config.color}`}>
        {config.icon}
        {config.label}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto text-left animate-in fade-in duration-500 pb-20 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Manajemen Ruang Ujian</h1>
          <p className="text-gray-400 font-medium mt-1">Kelola ruang ujian dan penugasan pengawas.</p>
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
              setFormData({ 
                name: '', 
                description: '', 
                capacity: 30, 
                supervisorId: teachers[0]?.id || '', 
                location: '', 
                status: 'available' 
              });
              setModalMode('add');
            }}
            className="flex-1 md:flex-none bg-indigo-600 text-white px-6 py-4 rounded-[20px] font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 active:scale-95 text-sm"
          >
            <Plus className="w-5 h-5" /> Tambah Manual
          </button>
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".xlsx, .xls" />
        </div>
      </div>

      <div className="bg-white p-4 rounded-[30px] border border-gray-100 shadow-sm mb-8 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-4 w-5 h-5 text-gray-300" />
          <input
            type="text"
            placeholder="Cari nama ruang, lokasi, atau pengawas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-gray-50 border-transparent focus:border-indigo-500 focus:bg-white transition font-bold text-gray-800 outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRooms.length === 0 ? (
          <div className="col-span-full text-center py-20 bg-gray-50 rounded-[40px] border border-dashed border-gray-200">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-400 font-medium">Belum ada data ruang ujian.</p>
            <button 
              onClick={() => setModalMode('add')}
              className="mt-4 text-indigo-600 font-bold hover:underline"
            >
              Tambah Ruang Ujian Pertama
            </button>
          </div>
        ) : (
          filteredRooms.map(room => (
            <div key={room.id} className="bg-white rounded-[30px] shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all group">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg mb-1 group-hover:text-indigo-600 transition-colors">{room.name}</h3>
                    <StatusBadge status={room.status} />
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => handleOpenEdit(room)}
                      className="p-2 bg-gray-50 text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                      title="Edit Ruang"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(room.id)}
                      className="p-2 bg-red-50 text-red-100 hover:text-red-500 hover:bg-red-100 rounded-xl transition-all"
                      title="Hapus Ruang"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {room.description && (
                  <p className="text-gray-500 text-sm mb-4 line-clamp-2">{room.description}</p>
                )}

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-700">Kapasitas:</span>
                    <span className="font-bold text-gray-900">{room.capacity} siswa</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <UserIcon className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-700">Pengawas:</span>
                    <span className="font-bold text-gray-900 truncate">{room.supervisorName || getTeacherName(room.supervisorId)}</span>
                  </div>

                  {room.location && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-700">Lokasi:</span>
                      <span className="font-bold text-gray-900 truncate">{room.location}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-700">Diperbarui:</span>
                    <span className="font-bold text-gray-900">
                      {new Date(room.updatedAt).toLocaleDateString('id-ID', { 
                        day: 'numeric', 
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      {modalMode && (
        <div className="fixed inset-0 z-[100] bg-gray-900/40 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in">
          <form onSubmit={handleSubmitManual} className="bg-white w-full max-w-md rounded-[40px] shadow-2xl p-10 text-left">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-gray-900">
                {modalMode === 'add' ? 'Ruang Ujian Baru' : 'Edit Ruang Ujian'}
              </h3>
              <button type="button" onClick={() => setModalMode(null)} className="p-2 text-gray-400 hover:bg-gray-50 rounded-xl"><X className="w-6 h-6" /></button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Nama Ruang *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-transparent focus:border-indigo-500 focus:bg-white outline-none font-bold transition-all"
                  placeholder="Contoh: Lab Komputer 1, Ruang Multimedia"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Deskripsi (Opsional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-transparent focus:border-indigo-500 focus:bg-white outline-none font-bold transition-all h-24"
                  placeholder="Deskripsi fasilitas atau keterangan ruang..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Kapasitas</label>
                  <input
                    type="number"
                    min="1"
                    max="200"
                    value={formData.capacity}
                    onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value) || 30})}
                    className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-transparent focus:border-indigo-500 focus:bg-white outline-none font-bold transition-all"
                    placeholder="30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as 'available' | 'occupied' | 'maintenance'})}
                    className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-transparent focus:border-indigo-500 focus:bg-white outline-none font-bold transition-all"
                  >
                    <option value="available">Tersedia</option>
                    <option value="occupied">Terisi</option>
                    <option value="maintenance">Perbaikan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Pengawas (Guru) *</label>
                <select
                  value={formData.supervisorId}
                  onChange={(e) => setFormData({...formData, supervisorId: e.target.value})}
                  className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-transparent focus:border-indigo-500 focus:bg-white outline-none font-bold transition-all"
                  required
                >
                  <option value="">Pilih Guru Pengawas</option>
                  {teachers.filter(t => t.role === 'teacher').map(teacher => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name} {teacher.subject ? `(${teacher.subject})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Lokasi (Opsional)</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-transparent focus:border-indigo-500 focus:bg-white outline-none font-bold transition-all"
                  placeholder="Contoh: Gedung A Lantai 2, Ruang 201"
                />
              </div>

              <button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-70">
                {isSubmitting ? 'Menyimpan...' : (modalMode === 'add' ? 'Simpan Ruang Ujian' : 'Update Ruang Ujian')}
                {modalMode === 'add' && !isSubmitting && <Plus className="w-5 h-5" />}
                {modalMode === 'edit' && !isSubmitting && <Save className="w-5 h-5" />}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ExamRoomManager;
