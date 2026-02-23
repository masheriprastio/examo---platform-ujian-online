import React, { useState, useEffect } from 'react';
import { MapPin, Wifi, Clock, LogIn, LogOut, Activity, Calendar, AlertTriangle, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';
import UserActivityService, { UserSession, ActivityLog } from '../services/UserActivityService';

interface UserActivityManagerProps {
  onClose?: () => void;
}

export const UserActivityManager: React.FC<UserActivityManagerProps> = ({ onClose }) => {
  const [activitySummary, setActivitySummary] = useState<any[]>([]);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [userActivityDetails, setUserActivityDetails] = useState<Record<string, ActivityLog[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDateRange, setSelectedDateRange] = useState<'today' | 'week' | 'month' | 'all'>('week');

  useEffect(() => {
    loadActivityData();
  }, [selectedDateRange]);

  const loadActivityData = async () => {
    setIsLoading(true);
    try {
      const summary = await UserActivityService.getAllUserActivitySummary();
      setActivitySummary(summary);
    } catch (err) {
      console.error('Error loading activity summary:', err);
    }
    setIsLoading(false);
  };

  const loadUserActivityDetails = async (userId: string) => {
    if (userActivityDetails[userId]) {
      setExpandedUserId(expandedUserId === userId ? null : userId);
      return;
    }

    try {
      const logs = await UserActivityService.getUserActivityLog(userId, 100);
      setUserActivityDetails(prev => ({ ...prev, [userId]: logs }));
      setExpandedUserId(expandedUserId === userId ? null : userId);
    } catch (err) {
      console.error('Error loading user activity:', err);
    }
  };

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const formatDateShort = (iso: string) => new Date(iso).toLocaleTimeString('id-ID', {
    hour: '2-digit', minute: '2-digit'
  });

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'login':
        return <LogIn className="w-4 h-4 text-green-600" />;
      case 'logout':
        return <LogOut className="w-4 h-4 text-red-600" />;
      case 'exam_start':
        return <Activity className="w-4 h-4 text-blue-600" />;
      case 'exam_submit':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActivityBadgeColor = (activityType: string) => {
    switch (activityType) {
      case 'login':
        return 'bg-green-50 text-green-600 border-green-100';
      case 'logout':
        return 'bg-red-50 text-red-600 border-red-100';
      case 'exam_start':
        return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'exam_submit':
        return 'bg-green-50 text-green-600 border-green-100';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-[40px] shadow-2xl p-12 text-center">
          <div className="inline-block w-8 h-8 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="mt-4 text-gray-400">Memuat data aktivitas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-100 my-8">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-8 py-6 flex justify-between items-center rounded-t-[40px]">
          <div>
            <h2 className="text-2xl font-black text-gray-900">Manajemen Aktivitas User</h2>
            <p className="text-sm text-gray-500 font-medium">Pantau aktivitas login dan penggunaan sistem</p>
          </div>
          {onClose && (
            <button 
              onClick={onClose}
              className="p-3 hover:bg-gray-100 rounded-xl transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter */}
        <div className="border-b border-gray-100 px-8 py-4 bg-gray-50">
          <div className="flex gap-2">
            {['today', 'week', 'month', 'all'].map(range => (
              <button
                key={range}
                onClick={() => setSelectedDateRange(range as any)}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
                  selectedDateRange === range
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300'
                }`}
              >
                {range === 'today' ? 'Hari Ini' : range === 'week' ? 'Minggu Ini' : range === 'month' ? 'Bulan Ini' : 'Semua'}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {activitySummary.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-400">Belum ada data aktivitas.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activitySummary.map((user) => (
                <div 
                  key={user.id}
                  className="border-2 border-gray-100 rounded-[28px] overflow-hidden hover:border-indigo-200 transition-colors"
                >
                  {/* User Summary Row */}
                  <button
                    onClick={() => loadUserActivityDetails(user.id)}
                    className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 border border-indigo-200 flex items-center justify-center font-black text-indigo-600">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg">{user.name}</h3>
                          <p className="text-xs text-gray-500 font-medium">{user.email}</p>
                        </div>
                        <span className={`ml-auto text-xs font-bold px-3 py-1 rounded-lg ${
                          user.role === 'teacher' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'
                        }`}>
                          {user.role === 'teacher' ? 'Guru' : 'Siswa'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-8">
                      <div className="text-right hidden sm:block">
                        <div className="text-xs font-black text-gray-400 uppercase mb-1">
                          Total Aktivitas
                        </div>
                        <div className="text-2xl font-black text-indigo-600">
                          {user.total_activities || 0}
                        </div>
                      </div>

                      {user.last_online && (
                        <div className="text-right hidden sm:block">
                          <div className="text-xs font-black text-gray-400 uppercase mb-1">
                            Terakhir Online
                          </div>
                          <div className="text-sm font-bold text-gray-600">
                            {formatDateShort(user.last_online)}
                          </div>
                        </div>
                      )}

                      {user.current_ip && (
                        <div className="text-right hidden lg:block">
                          <div className="text-xs font-black text-gray-400 uppercase mb-1">
                            IP Saat Ini
                          </div>
                          <div className="text-sm font-mono font-bold text-gray-600">
                            {user.current_ip}
                          </div>
                        </div>
                      )}

                      <div className="text-gray-400">
                        {expandedUserId === user.id ? <ChevronUp /> : <ChevronDown />}
                      </div>
                    </div>
                  </button>

                  {/* Expanded Activity Log */}
                  {expandedUserId === user.id && (
                    <div className="bg-gray-50 border-t border-gray-100 p-6">
                      <div className="mb-4">
                        <h4 className="font-black text-gray-900 text-sm uppercase tracking-widest mb-4">
                          Riwayat Aktivitas
                        </h4>

                        {!userActivityDetails[user.id] ? (
                          <div className="text-center py-4">
                            <div className="inline-block w-5 h-5 border-3 border-gray-200 border-t-indigo-600 rounded-full animate-spin" />
                          </div>
                        ) : userActivityDetails[user.id].length === 0 ? (
                          <p className="text-gray-400 text-sm">Belum ada aktivitas yang dicatat.</p>
                        ) : (
                          <div className="space-y-3 max-h-[400px] overflow-y-auto">
                            {userActivityDetails[user.id].slice(0, 20).map((log, idx) => (
                              <div 
                                key={idx}
                                className="bg-white p-4 rounded-xl border border-gray-100 flex items-start gap-4"
                              >
                                <div className="mt-1">
                                  {getActivityIcon(log.activity_type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md border ${getActivityBadgeColor(log.activity_type)}`}>
                                      {log.activity_type.toUpperCase().replace(/_/g, ' ')}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {formatDateShort(log.timestamp)}
                                    </span>
                                  </div>
                                  {log.activity_detail && (
                                    <p className="text-sm text-gray-700 mb-2">{log.activity_detail}</p>
                                  )}
                                  <div className="flex flex-wrap gap-2 text-xs">
                                    {log.ip_address && (
                                      <span className="flex items-center gap-1 text-gray-600 bg-gray-50 px-2 py-1 rounded">
                                        <MapPin className="w-3 h-3" /> {log.ip_address}
                                      </span>
                                    )}
                                    {log.device_id && (
                                      <span className="flex items-center gap-1 text-gray-600 bg-gray-50 px-2 py-1 rounded font-mono">
                                        <Wifi className="w-3 h-3" /> {log.device_id.substring(0, 12)}...
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* User Session Info */}
                      <div className="border-t border-gray-100 pt-6">
                        <h4 className="font-black text-gray-900 text-sm uppercase tracking-widest mb-4">
                          Informasi Session
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-white p-4 rounded-xl border border-gray-100">
                            <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                              Total Session Aktif
                            </div>
                            <div className="text-2xl font-black text-indigo-600">
                              {user.active_session_count || 0}
                            </div>
                          </div>
                          {user.current_ip && (
                            <div className="bg-white p-4 rounded-xl border border-gray-100">
                              <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <MapPin className="w-3 h-3" /> IP Address Saat Ini
                              </div>
                              <div className="font-mono font-bold text-gray-700 break-all">
                                {user.current_ip}
                              </div>
                            </div>
                          )}
                          {user.current_device && (
                            <div className="bg-white p-4 rounded-xl border border-gray-100 md:col-span-2">
                              <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Wifi className="w-3 h-3" /> Device ID Saat Ini
                              </div>
                              <div className="font-mono font-bold text-gray-700 break-all">
                                {user.current_device}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserActivityManager;
