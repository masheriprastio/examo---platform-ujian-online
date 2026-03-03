import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { UserTracking } from '../types';

// ── Types ──────────────────────────────────────────────────────────────────

export interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  usedMB: number;
  totalMB: number;
  limitMB: number;
  usagePercent: number;
  available: boolean;
}

export interface ActiveUserSession {
  id: string;
  user_id: string;
  email: string;
  name?: string;
  role?: string;
  device_id: string;
  ip_address: string;
  user_agent: string;
  login_at: string;
  last_activity_at: string;
  is_active: boolean;
  status: string;
  durationMinutes: number;
}

export interface SupabaseStats {
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
  totalExams: number;
  totalResults: number;
  activeSessions: number;
  totalActivityLogs: number;
}

export interface VercelDeployment {
  uid: string;
  name: string;
  url: string;
  state: 'READY' | 'BUILDING' | 'ERROR' | 'QUEUED' | 'CANCELED' | string;
  createdAt: number;
  target: string | null;
}

export interface ActivityFeedItem {
  id: string;
  user_id: string;
  email: string;
  activity_type: string;
  activity_detail?: string;
  ip_address?: string;
  timestamp: string;
}

export interface RealtimeExamProgressItem {
  exam_id: string;
  student_id: string;
  current_question_index: number;
  last_ping_at: string;
  student_name: string;
  exam_title: string;
}

export interface SystemMetrics {
  memory: MemoryInfo;
  supabaseStats: SupabaseStats;
  activeSessions: ActiveUserSession[];
  vercelDeployments: VercelDeployment[];
  activityFeed: ActivityFeedItem[];
  realtimeExams: RealtimeExamProgressItem[];
  fetchedAt: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function minutesDiff(isoA: string, isoB: string): number {
  return Math.round((new Date(isoB).getTime() - new Date(isoA).getTime()) / 60000);
}

// ── Service ────────────────────────────────────────────────────────────────

export class MonitoringService {
  /**
   * Get browser RAM info (Chrome/Edge only, via performance.memory)
   */
  static getMemoryInfo(): MemoryInfo {
    const mem = (performance as any).memory;
    if (!mem) {
      return {
        usedJSHeapSize: 0,
        totalJSHeapSize: 0,
        jsHeapSizeLimit: 0,
        usedMB: 0,
        totalMB: 0,
        limitMB: 0,
        usagePercent: 0,
        available: false,
      };
    }
    const usedMB = Math.round(mem.usedJSHeapSize / 1048576);
    const totalMB = Math.round(mem.totalJSHeapSize / 1048576);
    const limitMB = Math.round(mem.jsHeapSizeLimit / 1048576);
    return {
      usedJSHeapSize: mem.usedJSHeapSize,
      totalJSHeapSize: mem.totalJSHeapSize,
      jsHeapSizeLimit: mem.jsHeapSizeLimit,
      usedMB,
      totalMB,
      limitMB,
      usagePercent: limitMB > 0 ? Math.round((usedMB / limitMB) * 100) : 0,
      available: true,
    };
  }

  /**
   * Get active user sessions from Supabase
   */
  static async getActiveSessions(): Promise<ActiveUserSession[]> {
    if (!isSupabaseConfigured || !supabase) return [];

    try {
      // Get active sessions joined with user info
      const { data: sessions, error: sessErr } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('is_active', true)
        .gte('last_activity_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())
        .order('last_activity_at', { ascending: false });

      if (sessErr || !sessions) return [];

      // Fetch user names/roles
      const userIds = sessions.map((s: any) => s.user_id);
      let userMap: Record<string, { name: string; role: string }> = {};

      if (userIds.length > 0) {
        const { data: users } = await supabase
          .from('users')
          .select('id, name, role')
          .in('id', userIds);

        if (users) {
          users.forEach((u: any) => {
            userMap[u.id] = { name: u.name, role: u.role };
          });
        }
      }

      const now = new Date().toISOString();
      return sessions.map((s: any): ActiveUserSession => ({
        id: s.id,
        user_id: s.user_id,
        email: s.email,
        name: userMap[s.user_id]?.name,
        role: userMap[s.user_id]?.role,
        device_id: s.device_id,
        ip_address: s.ip_address,
        user_agent: s.user_agent,
        login_at: s.login_at,
        last_activity_at: s.last_activity_at,
        is_active: s.is_active,
        status: s.status,
        durationMinutes: minutesDiff(s.login_at, now),
      }));
    } catch (err) {
      console.error('[MonitoringService] getActiveSessions error:', err);
      return [];
    }
  }

  /**
   * Get Supabase table stats (row counts)
   */
  static async getSupabaseStats(): Promise<SupabaseStats> {
    const defaults: SupabaseStats = {
      totalUsers: 0,
      totalStudents: 0,
      totalTeachers: 0,
      totalExams: 0,
      totalResults: 0,
      activeSessions: 0,
      totalActivityLogs: 0,
    };

    if (!isSupabaseConfigured || !supabase) return defaults;

    try {
      const [usersRes, examsRes, resultsRes, sessionsRes, logsRes] = await Promise.all([
        supabase.from('users').select('role', { count: 'exact', head: false }),
        supabase.from('exams').select('id', { count: 'exact', head: true }),
        supabase.from('exam_results').select('id', { count: 'exact', head: true }),
        supabase.from('user_sessions').select('id', { count: 'exact', head: true }).eq('is_active', true).gte('last_activity_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()),
        supabase.from('user_activity_log').select('id', { count: 'exact', head: true }),
      ]);

      const users = usersRes.data || [];
      const students = users.filter((u: any) => u.role === 'student').length;
      const teachers = users.filter((u: any) => u.role === 'teacher').length;

      return {
        totalUsers: usersRes.count ?? users.length,
        totalStudents: students,
        totalTeachers: teachers,
        totalExams: examsRes.count ?? 0,
        totalResults: resultsRes.count ?? 0,
        activeSessions: sessionsRes.count ?? 0,
        totalActivityLogs: logsRes.count ?? 0,
      };
    } catch (err) {
      console.error('[MonitoringService] getSupabaseStats error:', err);
      return defaults;
    }
  }

  /**
   * Get recent activity feed (last 50 items)
   */
  static async getActivityFeed(limit = 50): Promise<ActivityFeedItem[]> {
    if (!isSupabaseConfigured || !supabase) return [];

    try {
      const { data, error } = await supabase
        .from('user_activity_log')
        .select('id, user_id, email, activity_type, activity_detail, ip_address, timestamp')
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) return [];
      return data || [];
    } catch (err) {
      console.error('[MonitoringService] getActivityFeed error:', err);
      return [];
    }
  }

  /**
   * Get Vercel deployments via REST API
   * Requires VITE_VERCEL_TOKEN and VITE_VERCEL_PROJECT_ID env vars
   */
  static async getVercelDeployments(): Promise<VercelDeployment[]> {
    const token = import.meta.env.VITE_VERCEL_TOKEN;
    const projectId = import.meta.env.VITE_VERCEL_PROJECT_ID;

    if (!token || !projectId) return [];

    try {
      const res = await fetch(
        `https://api.vercel.com/v6/deployments?projectId=${projectId}&limit=5`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!res.ok) return [];

      const json = await res.json();
      return (json.deployments || []).map((d: any): VercelDeployment => ({
        uid: d.uid,
        name: d.name,
        url: d.url,
        state: d.state,
        createdAt: d.createdAt,
        target: d.target || null,
      }));
    } catch (err) {
      console.error('[MonitoringService] getVercelDeployments error:', err);
      return [];
    }
  }

  /**
   * Force logout a specific user session (admin action)
   */
  static async forceLogoutSession(sessionId: string): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return false;

    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({ is_active: false, status: 'inactive' })
        .eq('id', sessionId);

      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Fetch Realtime Exam Progress from the newly created table
   */
  static async getRealtimeExamProgress(): Promise<RealtimeExamProgressItem[]> {
    if (!isSupabaseConfigured || !supabase) return [];
    try {
      // Clean up old pings (older than 10 mins) on view if needed, but here we just filter in query
      const { data, error } = await supabase
        .from('exam_realtime_progress')
        .select(`
          exam_id,
          student_id,
          current_question_index,
          last_ping_at,
          exams (title),
          users (name)
        `)
        .gte('last_ping_at', new Date(Date.now() - 10 * 60 * 1000).toISOString())
        .order('last_ping_at', { ascending: false });

      if (error) {
        console.error('[MonitoringService] getRealtimeExamProgress error:', error);
        return [];
      }

      return (data || []).map((row: any) => ({
        exam_id: row.exam_id,
        student_id: row.student_id,
        current_question_index: row.current_question_index,
        last_ping_at: row.last_ping_at,
        student_name: row.users?.name || 'Unknown',
        exam_title: row.exams?.title || 'Unknown'
      }));
    } catch (err) {
      console.error('[MonitoringService] getRealtimeExamProgress exception:', err);
      return [];
    }
  }

  /**
   * Fetch all metrics in one call
   */
  static async getAllMetrics(): Promise<SystemMetrics> {
    const [activeSessions, supabaseStats, activityFeed, vercelDeployments, realtimeExams] = await Promise.all([
      this.getActiveSessions(),
      this.getSupabaseStats(),
      this.getActivityFeed(30),
      this.getVercelDeployments(),
      this.getRealtimeExamProgress(),
    ]);

    return {
      memory: this.getMemoryInfo(),
      supabaseStats,
      activeSessions,
      vercelDeployments,
      activityFeed,
      realtimeExams,
      fetchedAt: new Date().toISOString(),
    };
  }

  /**
   * Parse User-Agent string to human-readable browser + OS
   */
  static parseUserAgent(ua: string): string {
    if (!ua) return 'Unknown';
    let browser = 'Browser';
    let os = 'OS';

    if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
    else if (ua.includes('Edg')) browser = 'Edge';
    else if (ua.includes('OPR') || ua.includes('Opera')) browser = 'Opera';

    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac OS')) os = 'macOS';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
    else if (ua.includes('Linux')) os = 'Linux';

    return `${browser} / ${os}`;
  }

  /**
   * Fetch data from user_tracking_view
   */
  static async getAllUserTracking(): Promise<UserTracking[]> {
    if (!isSupabaseConfigured || !supabase) return [];

    try {
      const { data, error } = await supabase
        .from('user_tracking_view')
        .select('*')
        .order('is_online', { ascending: false })
        .order('last_login_at', { ascending: false });

      if (error) {
        console.error('[MonitoringService] getAllUserTracking error:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('[MonitoringService] getAllUserTracking exception:', err);
      return [];
    }
  }
}

export default MonitoringService;
