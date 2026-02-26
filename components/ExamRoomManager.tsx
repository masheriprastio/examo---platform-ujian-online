
import React, { useState } from 'react';
import { User, ExamRoom } from '../types';
import {
  Users, MapPin, Monitor, CheckCircle, XCircle,
  Plus, Search, Trash2, Edit, X, Save
} from 'lucide-react';
import { generateUUID } from '../lib/uuid';

interface ExamRoomManagerProps {
  rooms: ExamRoom[];
  teachers: User[];
  onAddRoom: (room: ExamRoom) => Promise<void>;
  onDeleteRoom: (id: string) => Promise<void>;
}

export default function ExamRoomManager({ rooms, teachers, onAddRoom, onDeleteRoom }: ExamRoomManagerProps) {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<ExamRoom>>({
    name: '',
    description: '',
    capacity: 30,
    status: 'available',
    supervisorId: '',
    location: ''
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      capacity: 30,
      status: 'available',
      supervisorId: '',
      location: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.capacity || !formData.supervisorId) {
      alert('Mohon lengkapi field yang wajib diisi (*)');
      return;
    }

    setIsSubmitting(true);
    try {
      const newRoom: ExamRoom = {
        id: generateUUID(),
        name: formData.name!,
        description: formData.description,
        capacity: Number(formData.capacity),
        status: formData.status as 'available' | 'occupied',
        supervisorId: formData.supervisorId!,
        location: formData.location
      };

      await onAddRoom(newRoom);
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Failed to save room:', error);
      alert('Gagal menyimpan ruangan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredRooms = rooms.filter(r =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Ruang Ujian</h1>
          <p className="text-gray-400">Manajemen ruang ujian fisik dan pengawas.</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2 active:scale-95"
        >
          <Plus className="w-5 h-5" /> Tambah Ruang
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-[20px] border border-gray-100 shadow-sm flex items-center gap-3">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Cari ruangan..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 outline-none font-bold text-gray-700 placeholder-gray-300"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRooms.length === 0 ? (
           <div className="col-span-full text-center py-20 bg-gray-50 rounded-[40px] border border-dashed border-gray-200">
             <p className="text-gray-400 font-medium">Belum ada ruang ujian.</p>
           </div>
        ) : filteredRooms.map(room => {
          const supervisor = teachers.find(t => t.id === room.supervisorId);
          return (
            <div key={room.id} className="bg-white p-6 rounded-[30px] border border-gray-100 shadow-sm hover:shadow-lg transition-all group relative overflow-hidden">
              <div className={`absolute top-0 right-0 px-4 py-2 rounded-bl-[20px] font-black text-[10px] uppercase tracking-widest ${room.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                {room.status === 'available' ? 'Tersedia' : 'Terisi'}
              </div>

              <div className="mb-4">
                <h3 className="font-black text-xl text-gray-900">{room.name}</h3>
                {room.location && (
                  <div className="flex items-center gap-1 text-gray-400 text-xs font-bold mt-1">
                    <MapPin className="w-3 h-3" /> {room.location}
                  </div>
                )}
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-indigo-600 shadow-sm">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase">Kapasitas</p>
                    <p className="font-bold text-gray-900">{room.capacity} Peserta</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-indigo-600 shadow-sm">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[10px] font-black text-gray-400 uppercase">Pengawas</p>
                    <p className="font-bold text-gray-900 truncate">{supervisor?.name || 'Belum ditentukan'}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => onDeleteRoom(room.id)}
                  className="flex-1 py-3 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Hapus
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-[35px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-black text-gray-900">Ruang Ujian Baru</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white rounded-full transition-all text-gray-400 hover:text-gray-900"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Nama Ruang *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="Contoh: Lab Komputer 1, Ruang Multimedia"
                  className="w-full px-5 py-3.5 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-bold transition-all placeholder-gray-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Deskripsi (Opsional)</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="Deskripsi fasilitas atau keterangan ruang..."
                  className="w-full px-5 py-3.5 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-bold transition-all placeholder-gray-400 h-24 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Kapasitas</label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={e => setFormData({...formData, capacity: parseInt(e.target.value)})}
                    className="w-full px-5 py-3.5 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-bold transition-all text-center"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value as any})}
                    className="w-full px-5 py-3.5 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-bold transition-all cursor-pointer appearance-none"
                  >
                    <option value="available">Tersedia</option>
                    <option value="occupied">Terisi</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Pengawas (Guru) *</label>
                <div className="relative">
                  <select
                    value={formData.supervisorId}
                    onChange={e => setFormData({...formData, supervisorId: e.target.value})}
                    className="w-full px-5 py-3.5 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-bold transition-all cursor-pointer appearance-none"
                    required
                  >
                    <option value="" disabled>Pilih Guru Pengawas</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.nis || 'NIP -'})</option>
                    ))}
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Lokasi (Opsional)</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={e => setFormData({...formData, location: e.target.value})}
                  placeholder="Contoh: Gedung A Lantai 2, Ruang 201"
                  className="w-full px-5 py-3.5 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-bold transition-all placeholder-gray-400"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl transition shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 mt-4 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Menyimpan...' : (
                  <>
                    Simpan Ruang Ujian <Plus className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
