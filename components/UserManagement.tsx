import React, { useState, useEffect } from 'react';
import { UserTracking } from '../types';
import MonitoringService from '../services/MonitoringService';
import { Users, Search, Activity, RefreshCw, FileText, Globe, Monitor, Clock, PlayCircle, Loader2 } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Helper Format
const fmtDate = (iso?: string) => {
    if (!iso) return '-';
    return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<UserTracking[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchData = async (silent = false) => {
        if (!silent) setIsLoading(true);
        setIsRefreshing(true);
        try {
            const data = await MonitoringService.getAllUserTracking();
            setUsers(data || []);
        } catch (error) {
            console.error("Failed to load user tracking data:", error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();

        // Auto refresh set-up via Realtime Supabase
        let channel: any;
        if (isSupabaseConfigured && supabase) {
            channel = supabase
                .channel('user-management-changes')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'user_sessions' }, () => {
                    fetchData(true);
                })
                .on('postgres_changes', { event: '*', schema: 'public', table: 'user_activity_log' }, () => {
                    fetchData(true);
                })
                .on('postgres_changes', { event: '*', schema: 'public', table: 'exam_submission_history' }, () => {
                    fetchData(true);
                })
                .subscribe();
        }

        // Optional fallback: auto refresh every 30s
        const interval = setInterval(() => fetchData(true), 30000);

        return () => {
            clearInterval(interval);
            if (channel) {
                supabase?.removeChannel(channel);
            }
        };
    }, []);

    const filteredUsers = users.filter(u =>
        (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.role || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const onlineCount = users.filter(u => u.is_online).length;

    if (isLoading && users.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                <p className="text-gray-400 font-bold">Memuat data pengguna...</p>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 leading-tight">Manajemen Pengguna</h1>
                        <p className="text-xs text-gray-400 font-medium mt-0.5">
                            Pantau aktivitas, status login, dan riwayat ujian pengguna.
                        </p>
                    </div>
                </div>
                {!isSupabaseConfigured && (
                    <div className="bg-amber-50 text-amber-600 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap">
                        Mock Mode Aktif
                    </div>
                )}
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Pengguna</p>
                        <p className="text-2xl font-black text-gray-900">{users.length}</p>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                        <Activity className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Online Sekarang</p>
                        <p className="text-2xl font-black text-gray-900">{onlineCount}</p>
                    </div>
                </div>
                {/* Add more stats if needed */}
            </div>

            {/* Actions & Search */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
                <div className="relative w-full sm:max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border-transparent focus:bg-white focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 rounded-2xl outline-none transition-all text-sm font-medium"
                        placeholder="Cari nama, email, atau role..."
                    />
                </div>
                <button
                    onClick={() => fetchData(false)}
                    disabled={isRefreshing}
                    className="flex items-center gap-2 px-5 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-2xl font-bold transition-all text-sm whitespace-nowrap disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Main Table */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto min-h-[300px]">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="p-4 pl-6 text-xs font-black text-gray-500 uppercase tracking-wider">Pengguna</th>
                                <th className="p-4 text-xs font-black text-gray-500 uppercase tracking-wider">Status & Waktu</th>
                                <th className="p-4 text-xs font-black text-gray-500 uppercase tracking-wider">Device & IP</th>
                                <th className="p-4 pr-6 text-xs font-black text-gray-500 uppercase tracking-wider">Ujian Terakhir</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-gray-400 font-medium">
                                        Tidak ada data pengguna ditemukan.
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.user_id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="p-4 pl-6 align-top">
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-700 font-bold flex items-center justify-center flex-shrink-0">
                                                        {(user.name || 'U')[0].toUpperCase()}
                                                    </div>
                                                    {user.is_online ? (
                                                        <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full"></span>
                                                    ) : (
                                                        <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-gray-300 border-2 border-white rounded-full"></span>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 text-sm">{user.name}</p>
                                                    <p className="text-xs text-gray-500">{user.email}</p>
                                                    <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${user.role === 'teacher' ? 'bg-purple-100 text-purple-700' :
                                                        user.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700'
                                                        }`}>
                                                        {user.role}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 align-top">
                                            <div className="space-y-1.5">
                                                {user.is_online ? (
                                                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                                                        <Activity className="w-3 h-3" /> Online
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                                                        Offline
                                                    </span>
                                                )}
                                                <div className="text-xs text-gray-500 flex items-center gap-1.5 mt-1">
                                                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                                                    <span>Update: {fmtDate(user.last_activity_at || user.last_login_at)}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 align-top">
                                            {user.ip_address || user.device_id ? (
                                                <div className="space-y-1">
                                                    {user.ip_address && (
                                                        <div className="flex items-center gap-1.5 text-xs text-gray-600 font-mono">
                                                            <Globe className="w-3.5 h-3.5 text-gray-400" /> {user.ip_address}
                                                        </div>
                                                    )}
                                                    {user.user_agent && (
                                                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                                            <Monitor className="w-3.5 h-3.5 text-gray-400" />
                                                            <span className="truncate max-w-[150px]" title={user.user_agent}>
                                                                {MonitoringService.parseUserAgent(user.user_agent)}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">Belum ada data</span>
                                            )}
                                        </td>
                                        <td className="p-4 pr-6 align-top">
                                            {user.last_exam_title ? (
                                                <div className="space-y-1">
                                                    <p className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                                                        <FileText className="w-3.5 h-3.5 text-indigo-500" />
                                                        <span className="truncate max-w-[160px]" title={user.last_exam_title}>
                                                            {user.last_exam_title}
                                                        </span>
                                                    </p>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <p className="text-[11px] font-medium px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                                                            Skor: <span className="font-black text-indigo-600">{user.last_exam_score}</span>/{user.last_exam_total_points}
                                                        </p>
                                                        <p className="text-[10px] text-gray-400">{fmtDate(user.last_exam_submitted_at)}</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">Belum ada ujian</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default UserManagement;
