import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Activity, Users, Database, Server, RefreshCw, Wifi, WifiOff,
    LogOut, Monitor, Clock, Zap, BarChart2, Globe, CheckCircle,
    AlertTriangle, XCircle, Loader2, Shield, ChevronRight,
    TrendingUp, MemoryStick, HardDrive, Cpu
} from 'lucide-react';
import MonitoringService, {
    SystemMetrics, ActiveUserSession, VercelDeployment, ActivityFeedItem
} from '../services/MonitoringService';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// ── Helper formatters ────────────────────────────────────────────────────

const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

const fmtDuration = (mins: number) => {
    if (mins < 1) return '< 1 mnt';
    if (mins < 60) return `${mins} mnt`;
    const h = Math.floor(mins / 60); const m = mins % 60;
    return `${h}j ${m}m`;
};

const activityLabel: Record<string, { label: string; color: string }> = {
    login: { label: 'Login', color: 'bg-emerald-100 text-emerald-700' },
    logout: { label: 'Logout', color: 'bg-red-100 text-red-700' },
    exam_start: { label: 'Mulai Ujian', color: 'bg-blue-100 text-blue-700' },
    exam_submit: { label: 'Kumpul Ujian', color: 'bg-purple-100 text-purple-700' },
    page_view: { label: 'Halaman', color: 'bg-gray-100 text-gray-600' },
};

const vercelStateConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    READY: { label: 'Deployed', color: 'text-emerald-600 bg-emerald-50', icon: <CheckCircle className="w-4 h-4" /> },
    BUILDING: { label: 'Building', color: 'text-amber-600  bg-amber-50', icon: <Loader2 className="w-4 h-4 animate-spin" /> },
    ERROR: { label: 'Error', color: 'text-red-600    bg-red-50', icon: <XCircle className="w-4 h-4" /> },
    QUEUED: { label: 'Queued', color: 'text-sky-600    bg-sky-50', icon: <Clock className="w-4 h-4" /> },
    CANCELED: { label: 'Cancelled', color: 'text-gray-500   bg-gray-100', icon: <XCircle className="w-4 h-4" /> },
};

// ── Sub-components ───────────────────────────────────────────────────────

const StatCard: React.FC<{
    icon: React.ReactNode;
    label: string;
    value: string | number;
    sub?: string;
    gradient: string;
    pulse?: boolean;
}> = ({ icon, label, value, sub, gradient, pulse }) => (
    <div className={`relative overflow-hidden rounded-3xl p-6 text-white ${gradient} shadow-lg`}>
        {/* Decorative blob */}
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full" />
        <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-white/10 rounded-full" />
        <div className="relative">
            <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">{icon}</div>
                {pulse && (
                    <span className="flex items-center gap-1.5 text-xs font-bold bg-white/20 px-2.5 py-1 rounded-full">
                        <span className="w-2 h-2 bg-white rounded-full animate-ping inline-block" />
                        LIVE
                    </span>
                )}
            </div>
            <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-1">{label}</p>
            <p className="text-3xl font-black tracking-tight">{value}</p>
            {sub && <p className="text-white/60 text-xs font-medium mt-1">{sub}</p>}
        </div>
    </div>
);

const RamGauge: React.FC<{ usedMB: number; limitMB: number; pct: number; available: boolean }> = ({
    usedMB, limitMB, pct, available
}) => {
    const r = 52; const circ = 2 * Math.PI * r;
    const dashOffset = circ - (pct / 100) * circ;
    const color = pct > 80 ? '#ef4444' : pct > 60 ? '#f59e0b' : '#6366f1';

    return (
        <div className="flex flex-col items-center justify-center h-full gap-2">
            {available ? (
                <>
                    <svg width="140" height="140" viewBox="0 0 140 140">
                        <circle cx="70" cy="70" r={r} fill="none" stroke="#e5e7eb" strokeWidth="12" />
                        <circle
                            cx="70" cy="70" r={r} fill="none"
                            stroke={color} strokeWidth="12"
                            strokeLinecap="round"
                            strokeDasharray={circ}
                            strokeDashoffset={dashOffset}
                            transform="rotate(-90 70 70)"
                            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                        />
                        <text x="70" y="65" textAnchor="middle" fontSize="22" fontWeight="900" fill={color}>{pct}%</text>
                        <text x="70" y="84" textAnchor="middle" fontSize="10" fill="#9ca3af">{usedMB} MB used</text>
                    </svg>
                    <p className="text-xs text-gray-400 font-medium">of {limitMB} MB limit</p>
                </>
            ) : (
                <div className="text-center text-gray-400">
                    <MemoryStick className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-xs font-bold">Hanya tersedia di Chrome</p>
                </div>
            )}
        </div>
    );
};

const SessionRow: React.FC<{
    session: ActiveUserSession;
    onForceLogout: (id: string, email: string) => void;
}> = ({ session, onForceLogout }) => {
    const roleColor = session.role === 'teacher'
        ? 'bg-purple-100 text-purple-700'
        : session.role === 'admin'
            ? 'bg-amber-100 text-amber-700'
            : 'bg-sky-100 text-sky-700';
    const roleLabel = session.role === 'teacher' ? 'Guru' : session.role === 'admin' ? 'Admin' : 'Siswa';
    const device = MonitoringService.parseUserAgent(session.user_agent);

    return (
        <div className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group">
            {/* Avatar */}
            <div className="relative shrink-0">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-indigo-100">
                    {(session.name || session.email).charAt(0).toUpperCase()}
                </div>
                <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="font-bold text-gray-900 text-sm truncate">
                        {session.name || session.email}
                    </span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${roleColor}`}>
                        {roleLabel}
                    </span>
                </div>
                <p className="text-xs text-gray-400 truncate">{session.email}</p>
                <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[11px] text-gray-500">
                    <span className="flex items-center gap-1">
                        <Globe className="w-3 h-3" /> {session.ip_address}
                    </span>
                    <span className="flex items-center gap-1">
                        <Monitor className="w-3 h-3" /> {device}
                    </span>
                    <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {fmtDuration(session.durationMinutes)}
                    </span>
                </div>
            </div>

            {/* Right side */}
            <div className="text-right shrink-0 hidden sm:block">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Login</p>
                <p className="text-xs font-bold text-gray-600">{fmtTime(session.login_at)}</p>
                <p className="text-[10px] text-gray-400">{fmtDate(session.login_at)}</p>
            </div>

            {/* Force logout */}
            <button
                onClick={() => onForceLogout(session.id, session.email)}
                className="shrink-0 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                title="Force logout"
            >
                <LogOut className="w-4 h-4" />
            </button>
        </div>
    );
};

const FeedItem: React.FC<{ item: ActivityFeedItem }> = ({ item }) => {
    const cfg = activityLabel[item.activity_type] || { label: item.activity_type, color: 'bg-gray-100 text-gray-600' };
    return (
        <div className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
            <div className="shrink-0 mt-0.5">
                <div className={`text-[10px] font-black px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</div>
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-700 truncate">{item.email}</p>
                {item.activity_detail && (
                    <p className="text-[11px] text-gray-400 truncate">{item.activity_detail}</p>
                )}
                {item.ip_address && (
                    <p className="text-[10px] text-gray-300 font-mono truncate">{item.ip_address}</p>
                )}
            </div>
            <div className="shrink-0 text-[10px] text-gray-400 font-medium tabular-nums">
                {fmtTime(item.timestamp)}
            </div>
        </div>
    );
};

const VercelSection: React.FC<{ deployments: VercelDeployment[] }> = ({ deployments }) => {
    const hasToken = !!(import.meta.env.VITE_VERCEL_TOKEN && import.meta.env.VITE_VERCEL_PROJECT_ID);

    if (!hasToken) {
        return (
            <div className="flex flex-col items-center justify-center h-full py-6 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
                    <Globe className="w-6 h-6 text-gray-300" />
                </div>
                <p className="text-sm font-bold text-gray-400 mb-1">Vercel belum terkonfigurasi</p>
                <p className="text-xs text-gray-300 max-w-[200px]">
                    Tambahkan <code className="bg-gray-100 px-1 rounded">VITE_VERCEL_TOKEN</code> dan{' '}
                    <code className="bg-gray-100 px-1 rounded">VITE_VERCEL_PROJECT_ID</code> ke{' '}
                    <code className="bg-gray-100 px-1 rounded">.env.local</code>
                </p>
            </div>
        );
    }

    if (deployments.length === 0) {
        return (
            <div className="flex items-center justify-center h-full py-6">
                <Loader2 className="w-6 h-6 text-gray-300 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {deployments.map(d => {
                const cfg = vercelStateConfig[d.state] || { label: d.state, color: 'text-gray-500 bg-gray-100', icon: <Activity className="w-4 h-4" /> };
                return (
                    <a
                        key={d.uid}
                        href={`https://${d.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group"
                    >
                        <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${cfg.color}`}>
                            {cfg.icon} {cfg.label}
                        </span>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-gray-700 truncate">{d.name}</p>
                            <p className="text-[10px] text-gray-400 truncate">{d.url}</p>
                        </div>
                        <div className="text-[10px] text-gray-400 shrink-0">
                            {d.target === 'production' && (
                                <span className="bg-emerald-50 text-emerald-600 font-bold px-2 py-0.5 rounded-full">prod</span>
                            )}
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-indigo-400 transition-colors shrink-0" />
                    </a>
                );
            })}
        </div>
    );
};

// ── Main Component ────────────────────────────────────────────────────────

interface MonitoringDashboardProps {
    onClose?: () => void;
}

const MonitoringDashboard: React.FC<MonitoringDashboardProps> = ({ onClose }) => {
    const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
    const [confirmLogout, setConfirmLogout] = useState<{ id: string; email: string } | null>(null);
    const [logoutLoading, setLogoutLoading] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const realtimeRef = useRef<any>(null);

    const loadMetrics = useCallback(async (silent = false) => {
        if (!silent) setIsRefreshing(true);
        try {
            const data = await MonitoringService.getAllMetrics();
            setMetrics(data);
            setLastRefresh(new Date());
        } catch (err) {
            console.error('[MonitoringDashboard] loadMetrics error:', err);
        } finally {
            setIsRefreshing(false);
            setIsLoading(false);
        }
    }, []);

    // Initial load
    useEffect(() => {
        loadMetrics(false);
    }, [loadMetrics]);

    // Auto refresh every 30s
    useEffect(() => {
        if (autoRefresh) {
            intervalRef.current = setInterval(() => loadMetrics(true), 30000);
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
        }
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [autoRefresh, loadMetrics]);

    // Supabase Realtime - subscribe to user_sessions changes
    useEffect(() => {
        if (!isSupabaseConfigured || !supabase) return;

        const channel = supabase
            .channel('monitoring-sessions')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'user_sessions' }, () => {
                loadMetrics(true);
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'user_activity_log' }, () => {
                loadMetrics(true);
            })
            .subscribe();

        realtimeRef.current = channel;
        return () => { supabase.removeChannel(channel); };
    }, [loadMetrics]);

    const handleForceLogout = async (sessionId: string, email: string) => {
        setConfirmLogout({ id: sessionId, email });
    };

    const confirmForceLogout = async () => {
        if (!confirmLogout) return;
        setLogoutLoading(true);
        await MonitoringService.forceLogoutSession(confirmLogout.id);
        setLogoutLoading(false);
        setConfirmLogout(null);
        loadMetrics(true);
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-200 animate-pulse">
                    <Activity className="w-8 h-8 text-white" />
                </div>
                <p className="text-gray-400 font-bold animate-pulse">Memuat data monitoring...</p>
            </div>
        );
    }

    const m = metrics!;
    const mem = m.memory;
    const stats = m.supabaseStats;

    return (
        <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">

            {/* ── Header ── */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                        <BarChart2 className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 leading-tight">Monitoring Dashboard</h1>
                        <p className="text-xs text-gray-400 font-medium mt-0.5">
                            Last refresh: {lastRefresh.toLocaleTimeString('id-ID')}
                            {!isSupabaseConfigured && (
                                <span className="ml-2 text-amber-500 font-bold">• Mock Mode</span>
                            )}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Auto-refresh toggle */}
                    <button
                        onClick={() => setAutoRefresh(v => !v)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${autoRefresh
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                                : 'bg-gray-100 text-gray-500 border border-gray-200'
                            }`}
                    >
                        {autoRefresh ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                        Auto
                    </button>

                    {/* Manual refresh */}
                    <button
                        onClick={() => loadMetrics(false)}
                        disabled={isRefreshing}
                        className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-indigo-100"
                    >
                        <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* ── Stat Cards Row ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={<Users className="w-5 h-5" />}
                    label="Sesi Aktif"
                    value={stats.activeSessions}
                    sub={`${stats.totalUsers} total user`}
                    gradient="bg-gradient-to-br from-indigo-500 to-indigo-700"
                    pulse
                />
                <StatCard
                    icon={<Database className="w-5 h-5" />}
                    label="Total Ujian"
                    value={stats.totalExams}
                    sub={`${stats.totalResults} hasil ujian`}
                    gradient="bg-gradient-to-br from-violet-500 to-purple-700"
                />
                <StatCard
                    icon={<TrendingUp className="w-5 h-5" />}
                    label="Activity Logs"
                    value={stats.totalActivityLogs.toLocaleString()}
                    sub={`${stats.totalStudents} siswa · ${stats.totalTeachers} guru`}
                    gradient="bg-gradient-to-br from-sky-500 to-blue-700"
                />
                <StatCard
                    icon={<Zap className="w-5 h-5" />}
                    label="JS Heap Used"
                    value={mem.available ? `${mem.usedMB} MB` : 'N/A'}
                    sub={mem.available ? `${mem.usagePercent}% dari limit` : 'Gunakan Chrome/Edge'}
                    gradient="bg-gradient-to-br from-amber-500 to-orange-600"
                />
            </div>

            {/* ── Resource + Vercel ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* RAM Gauge */}
                <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 bg-amber-50 rounded-xl">
                            <MemoryStick className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                            <h3 className="font-black text-gray-900 text-sm">RAM / JS Heap</h3>
                            <p className="text-[10px] text-gray-400">Browser Performance API</p>
                        </div>
                    </div>
                    <RamGauge
                        usedMB={mem.usedMB}
                        limitMB={mem.limitMB}
                        pct={mem.usagePercent}
                        available={mem.available}
                    />
                    {mem.available && (
                        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                            {[
                                { label: 'Used', val: `${mem.usedMB} MB`, color: 'text-indigo-600' },
                                { label: 'Total', val: `${mem.totalMB} MB`, color: 'text-purple-600' },
                                { label: 'Limit', val: `${mem.limitMB} MB`, color: 'text-gray-500' },
                            ].map(({ label, val, color }) => (
                                <div key={label} className="bg-gray-50 rounded-xl p-2">
                                    <p className={`text-sm font-black ${color}`}>{val}</p>
                                    <p className="text-[10px] text-gray-400 font-medium">{label}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* DB Stats */}
                <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 bg-emerald-50 rounded-xl">
                            <Database className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div>
                            <h3 className="font-black text-gray-900 text-sm">Supabase Database</h3>
                            <p className="text-[10px] text-gray-400">Row counts per tabel</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {[
                            { label: 'Users', val: stats.totalUsers, color: 'bg-indigo-500' },
                            { label: 'Siswa', val: stats.totalStudents, color: 'bg-sky-500' },
                            { label: 'Guru', val: stats.totalTeachers, color: 'bg-purple-500' },
                            { label: 'Ujian', val: stats.totalExams, color: 'bg-violet-500' },
                            { label: 'Hasil Ujian', val: stats.totalResults, color: 'bg-emerald-500' },
                            { label: 'Activity Logs', val: stats.totalActivityLogs, color: 'bg-amber-500' },
                        ].map(({ label, val, color }) => {
                            const maxVal = Math.max(stats.totalActivityLogs, 1);
                            const pct = Math.min(Math.round((val / maxVal) * 100), 100);
                            return (
                                <div key={label}>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs font-bold text-gray-600">{label}</span>
                                        <span className="text-xs font-black text-gray-900">{val.toLocaleString()}</span>
                                    </div>
                                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${color} rounded-full transition-all duration-700`}
                                            style={{ width: `${Math.max(pct, val > 0 ? 4 : 0)}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {!isSupabaseConfigured && (
                        <p className="text-xs text-amber-500 font-bold mt-4 text-center">
                            ⚠ Mock Mode - data tidak nyata
                        </p>
                    )}
                </div>

                {/* Vercel */}
                <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 bg-gray-900/5 rounded-xl">
                            <Globe className="w-5 h-5 text-gray-700" />
                        </div>
                        <div>
                            <h3 className="font-black text-gray-900 text-sm">Vercel Deployments</h3>
                            <p className="text-[10px] text-gray-400">5 deployment terbaru</p>
                        </div>
                    </div>
                    <VercelSection deployments={m.vercelDeployments} />
                </div>
            </div>

            {/* ── Active Users ── */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 rounded-xl">
                            <Shield className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <h3 className="font-black text-gray-900">User Aktif Sekarang</h3>
                            <p className="text-xs text-gray-400">
                                {m.activeSessions.length} sesi aktif
                                {autoRefresh && <span className="ml-2 text-emerald-500 font-bold">• Auto-refresh ON</span>}
                            </p>
                        </div>
                    </div>
                    <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping inline-block" />
                        Real-time
                    </span>
                </div>

                {m.activeSessions.length === 0 ? (
                    <div className="text-center py-12">
                        <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                        <p className="text-gray-400 font-bold text-sm">Tidak ada sesi aktif saat ini</p>
                        {!isSupabaseConfigured && (
                            <p className="text-xs text-amber-500 mt-1">Supabase belum dikonfigurasi</p>
                        )}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {m.activeSessions.map(session => (
                            <SessionRow
                                key={session.id}
                                session={session}
                                onForceLogout={handleForceLogout}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* ── Activity Feed ── */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                    <div className="p-2 bg-sky-50 rounded-xl">
                        <Activity className="w-5 h-5 text-sky-600" />
                    </div>
                    <div>
                        <h3 className="font-black text-gray-900">Activity Feed</h3>
                        <p className="text-xs text-gray-400">30 aktivitas terbaru</p>
                    </div>
                </div>

                {m.activityFeed.length === 0 ? (
                    <div className="text-center py-12">
                        <Activity className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                        <p className="text-gray-400 font-bold text-sm">Belum ada aktivitas tercatat</p>
                    </div>
                ) : (
                    <div className="max-h-[360px] overflow-y-auto pr-1">
                        {m.activityFeed.map(item => (
                            <FeedItem key={item.id} item={item} />
                        ))}
                    </div>
                )}
            </div>

            {/* ── Force Logout Confirm Modal ── */}
            {confirmLogout && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full">
                        <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <LogOut className="w-7 h-7 text-red-500" />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 text-center mb-2">Force Logout?</h3>
                        <p className="text-gray-400 text-sm text-center mb-6">
                            Paksa logout user <span className="font-bold text-gray-700">{confirmLogout.email}</span>?
                            Sesi mereka akan langsung berakhir.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmLogout(null)}
                                className="flex-1 py-3 rounded-2xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50 transition-all"
                            >
                                Batal
                            </button>
                            <button
                                onClick={confirmForceLogout}
                                disabled={logoutLoading}
                                className="flex-1 py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-black transition-all disabled:opacity-60"
                            >
                                {logoutLoading ? 'Memproses...' : 'Ya, Logout'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MonitoringDashboard;
