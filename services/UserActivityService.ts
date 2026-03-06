import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { generateUUID } from '../lib/uuid';

export interface UserSession {
  id: string;
  user_id: string;
  email: string;
  device_id: string;
  ip_address: string;
  user_agent: string;
  login_at: string;
  last_activity_at: string;
  is_active: boolean;
  status: 'active' | 'inactive' | 'rejected';
}

export interface ActivityLog {
  id: string;
  user_id: string;
  email: string;
  activity_type: string;
  activity_detail?: string;
  ip_address?: string;
  device_id?: string;
  device_info?: string;
  timestamp: string;
  exam_id?: string;
  session_id?: string;
}

export interface ExamSubmissionRecord {
  id: string;
  exam_result_id: string;
  exam_id: string;
  student_id: string;
  student_name: string;
  exam_title: string;
  score: number;
  total_points: number;
  status: string;
  submitted_at: string;
  duration_taken_minutes: number;
  violation_count: number;
  ip_address?: string;
  device_id?: string;
}

/**
 * Service untuk mengelola session user, device tracking, dan activity logging
 */
export class UserActivityService {
  // Keep aligned with frontend auto-logout (5 minutes) plus grace for timer/network jitter.
  private static readonly SESSION_IDLE_TIMEOUT_MS = 5 * 60 * 1000;
  private static readonly SESSION_IDLE_GRACE_MS = 2 * 60 * 1000;
  
  private static getSessionActivityTimestamp(session: Partial<UserSession> & { login_at?: string; last_activity_at?: string }): number {
    const activitySource = session.last_activity_at || session.login_at;
    if (!activitySource) return 0;
    const ts = new Date(activitySource).getTime();
    return Number.isFinite(ts) ? ts : 0;
  }

  private static isSessionStale(session: Partial<UserSession> & { login_at?: string; last_activity_at?: string }, now: number): boolean {
    const lastActivityTs = this.getSessionActivityTimestamp(session);
    if (!lastActivityTs) return false;
    return now - lastActivityTs > (this.SESSION_IDLE_TIMEOUT_MS + this.SESSION_IDLE_GRACE_MS);
  }
  
  /**
   * Dapatkan IP address pengguna
   */
  static async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip || 'unknown';
    } catch (err) {
      console.error('Failed to get IP:', err);
      return 'unknown';
    }
  }

  /**
   * Generate device ID berdasarkan browser fingerprint
   */
  static generateDeviceId(): string {
    const navigator_data = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemory: (navigator as any).deviceMemory,
      maxTouchPoints: navigator.maxTouchPoints,
    };
    
    const stringified = JSON.stringify(navigator_data);
    let hash = 0;
    
    for (let i = 0; i < stringified.length; i++) {
      const char = stringified.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return 'device_' + Math.abs(hash).toString(16);
  }

  /**
   * Dapatkan informasi device dari browser
   */
  static getDeviceInfo(): string {
    const info = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
    return JSON.stringify(info);
  }

  /**
   * Login user - cek apakah device/IP sudah ada untuk user lain
   * Jika sudah ada active session dari device lain dengan IP lain, tolak login
   */
  static async validateDeviceLogin(
    userId: string,
    email: string,
    currentDeviceId: string,
    currentIP: string
  ): Promise<{ allowed: boolean; message?: string; existingSession?: UserSession }> {
    if (!isSupabaseConfigured || !supabase) {
      return { allowed: true }; // Mock mode: always allow
    }

    // Jika ada login hampir bersamaan dari IP berbeda dalam window ini, anggap mencurigakan
    const SUSPICIOUS_WINDOW_SECONDS = 60;

    try {
      // Ambil active sessions untuk user
      const { data: existingSessions, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) {
        console.error('Error checking sessions:', error);
        return { allowed: true }; // Fallback: allow on error
      }

      if (!existingSessions || existingSessions.length === 0) {
        return { allowed: true };
      }

      const now = Date.now();
      const staleSessions = (existingSessions as any[]).filter(s => this.isSessionStale(s, now));
      const activeRecentSessions = (existingSessions as any[]).filter(s => !this.isSessionStale(s, now));

      // Auto-clean stale sessions so users are not blocked by abandoned tabs/devices.
      if (staleSessions.length > 0) {
        const staleIds = staleSessions.map(s => s.id).filter(Boolean);
        if (staleIds.length > 0) {
          const { error: staleUpdateError } = await supabase
            .from('user_sessions')
            .update({
              is_active: false,
              status: 'inactive',
              last_activity_at: new Date().toISOString()
            })
            .in('id', staleIds);
          if (staleUpdateError) {
            console.error('Failed to auto-deactivate stale sessions:', staleUpdateError);
          }
        }
      }

      if (activeRecentSessions.length === 0) {
        return { allowed: true };
      }

      // Jika ada session yang sama device+IP, izinkan
      const same = activeRecentSessions.find(s => s.device_id === currentDeviceId && s.ip_address === currentIP);
      if (same) return { allowed: true };

      // Deteksi situasi suspicious: ada active session yang login dalam rentang waktu singkat dari IP berbeda
      const isSuspicious = activeRecentSessions.some(s => {
        const loginAt = s.login_at ? new Date(s.login_at).getTime() : 0;
        return Math.abs(now - loginAt) <= SUSPICIOUS_WINDOW_SECONDS * 1000 && s.ip_address !== currentIP;
      });

      if (isSuspicious) {
        // Kembalikan informasi agar frontend bisa menampilkan peringatan / minta verifikasi admin
        const existingSession = activeRecentSessions[0] as UserSession;
        return {
          allowed: false,
          message: `Terdeteksi login bersamaan dari IP berbeda (${existingSession.ip_address}). Jika ini bukan Anda, hubungi admin atau gunakan fitur force logout.`,
          existingSession
        };
      }

      // Jika tidak mencurigakan, otomatis nonaktifkan session lama supaya login baru tidak gagal
      try {
        const { error: rpcErr } = await supabase.rpc('deactivate_sessions_for_user', { p_user_id: userId });
        if (rpcErr) {
          // fallback: update langsung
          await supabase
            .from('user_sessions')
            .update({ is_active: false, status: 'inactive', last_activity_at: new Date().toISOString() })
            .eq('user_id', userId);
        }
      } catch (e) {
        // fallback update on any error
        try {
          await supabase
            .from('user_sessions')
            .update({ is_active: false, status: 'inactive', last_activity_at: new Date().toISOString() })
            .eq('user_id', userId);
        } catch (ee) {
          console.error('Failed to deactivate previous sessions fallback:', ee);
        }
      }

      return { allowed: true };
    } catch (err) {
      console.error('Error validating device login:', err);
      return { allowed: true }; // Fallback: allow on error
    }
  }

  /**
   * Buat session baru setelah login berhasil
   */
  static async createSession(
    userId: string,
    email: string,
    deviceId: string,
    ipAddress: string
  ): Promise<string | null> {
    if (!isSupabaseConfigured || !supabase) {
      return generateUUID(); // Mock mode: return mock ID
    }

    try {
      // Deactivate semua session lama untuk user ini
      const existingSessions = await supabase
        .from('user_sessions')
        .select('id')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (existingSessions.data && existingSessions.data.length > 0) {
        await supabase
          .from('user_sessions')
          .update({ is_active: false })
          .eq('user_id', userId);
      }

      // Buat session baru
      const { data, error } = await supabase
        .from('user_sessions')
        .insert({
          user_id: userId,
          email,
          device_id: deviceId,
          ip_address: ipAddress,
          user_agent: navigator.userAgent,
          is_active: true,
          status: 'active'
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error creating session:', error);
        return null;
      }

      return data?.id || null;
    } catch (err) {
      console.error('Error in createSession:', err);
      return null;
    }
  }

  /**
   * Update last activity untuk session
   */
  static async updateSessionActivity(sessionId: string | null): Promise<void> {
    if (!isSupabaseConfigured || !supabase || !sessionId) return;

    try {
      await supabase
        .from('user_sessions')
        .update({ last_activity_at: new Date().toISOString() })
        .eq('id', sessionId);
    } catch (err) {
      console.error('Error updating session activity:', err);
    }
  }

  /**
   * Catat activity log
   */
  static async logActivity(
    userId: string,
    email: string,
    activityType: string,
    activityDetail?: string,
    ipAddress?: string,
    deviceId?: string,
    examId?: string,
    sessionId?: string
  ): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;

    try {
      await supabase
        .from('user_activity_log')
        .insert({
          user_id: userId,
          email,
          activity_type: activityType,
          activity_detail: activityDetail,
          ip_address: ipAddress,
          device_id: deviceId,
          device_info: this.getDeviceInfo(),
          exam_id: examId,
          session_id: sessionId,
          timestamp: new Date().toISOString()
        });
    } catch (err) {
      console.error('Error logging activity:', err);
    }
  }

  /**
   * Logout - deactivate session
   */
  static async logout(sessionId: string | null, userId: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;

    try {
      if (sessionId) {
        const { error } = await supabase
          .from('user_sessions')
          .update({ is_active: false, status: 'inactive', last_activity_at: new Date().toISOString() })
          .eq('id', sessionId);
        if (error) {
          console.error('Error deactivating session by id on logout:', error);
          await supabase.rpc('deactivate_session_by_id', { p_session_id: sessionId });
        }
      } else {
        // Jika tidak ada sessionId, deactivate semua session untuk user
        const { error } = await supabase
          .from('user_sessions')
          .update({ is_active: false, status: 'inactive', last_activity_at: new Date().toISOString() })
          .eq('user_id', userId);
        if (error) {
          console.error('Error deactivating sessions by user on logout:', error);
          await supabase.rpc('deactivate_sessions_for_user', { p_user_id: userId });
        }
      }

      await this.logActivity(userId, '', 'logout', undefined, undefined, undefined, undefined, sessionId || undefined);
    } catch (err) {
      console.error('Error in logout:', err);
    }
  }

  /**
   * Admin helpers: call DB RPCs to force-deactivate sessions
   */
  static async deactivateSessionsForUser(userId: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const { error } = await supabase.rpc('deactivate_sessions_for_user', { p_user_id: userId });
      if (error) console.error('Error deactivating sessions for user:', error);
    } catch (err) {
      console.error('Error in deactivateSessionsForUser:', err);
    }
  }

  static async deactivateSessionsByIP(ipAddress: string, userId?: string | null): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const params: any = { p_ip: ipAddress };
      if (userId) params.p_user_id = userId;
      const { error } = await supabase.rpc('deactivate_sessions_by_ip', params);
      if (error) console.error('Error deactivating sessions by IP:', error);
    } catch (err) {
      console.error('Error in deactivateSessionsByIP:', err);
    }
  }

  static async deactivateSessionById(sessionId: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const { error } = await supabase.rpc('deactivate_session_by_id', { p_session_id: sessionId });
      if (error) console.error('Error deactivating session by id:', error);
    } catch (err) {
      console.error('Error in deactivateSessionById:', err);
    }
  }

  // Realtime subscriptions helpers (Supabase Realtime)
  static subscribeToUserSessions(handler: (payload: any) => void) {
    if (!isSupabaseConfigured || !supabase) return null;
    try {
      const channel = supabase
        .channel('public:user_sessions')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'user_sessions' },
          (payload) => handler(payload)
        )
        .subscribe();
      return channel;
    } catch (err) {
      console.error('Error subscribing to user_sessions realtime:', err);
      return null;
    }
  }

  static unsubscribeChannel(channel: any) {
    if (!isSupabaseConfigured || !supabase || !channel) return;
    try {
      // supabase v2 channel removal
      supabase.removeChannel(channel);
    } catch (err) {
      console.error('Error removing realtime channel:', err);
    }
  }

  /**
   * Catat exam submission history
   */
  static async recordExamSubmission(
    examResultId: string,
    examId: string,
    studentId: string,
    studentName: string,
    examTitle: string,
    score: number,
    totalPoints: number,
    status: string,
    submittedAt: string,
    durationMinutes: number,
    violationCount: number,
    ipAddress?: string,
    deviceId?: string
  ): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;

    try {
      await supabase
        .from('exam_submission_history')
        .insert({
          exam_result_id: examResultId,
          exam_id: examId,
          student_id: studentId,
          student_name: studentName,
          exam_title: examTitle,
          score,
          total_points: totalPoints,
          status,
          submitted_at: submittedAt,
          duration_taken_minutes: durationMinutes,
          violation_count: violationCount,
          ip_address: ipAddress,
          device_id: deviceId
        });
    } catch (err) {
      console.error('Error recording exam submission:', err);
    }
  }

  /**
   * Dapatkan semua activity log untuk user
   */
  static async getUserActivityLog(userId: string, limit: number = 100): Promise<ActivityLog[]> {
    if (!isSupabaseConfigured || !supabase) return [];

    try {
      const { data, error } = await supabase
        .from('user_activity_log')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching activity log:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Error in getUserActivityLog:', err);
      return [];
    }
  }

  /**
   * Dapatkan session history untuk user
   */
  static async getUserSessions(userId: string): Promise<UserSession[]> {
    if (!isSupabaseConfigured || !supabase) return [];

    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('login_at', { ascending: false });

      if (error) {
        console.error('Error fetching sessions:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Error in getUserSessions:', err);
      return [];
    }
  }

  /**
   * Dapatkan activity summary untuk semua user (untuk admin)
   */
  static async getAllUserActivitySummary(): Promise<any[]> {
    if (!isSupabaseConfigured || !supabase) return [];

    try {
      const { data, error } = await supabase
        .from('user_activity_summary')
        .select('*')
        .order('last_online', { ascending: false });

      if (error) {
        console.error('Error fetching activity summary:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Error in getAllUserActivitySummary:', err);
      return [];
    }
  }

  /**
   * Dapatkan exam submission history untuk student
   */
  static async getStudentExamHistory(studentId: string): Promise<ExamSubmissionRecord[]> {
    if (!isSupabaseConfigured || !supabase) return [];

    try {
      const { data, error } = await supabase
        .from('exam_submission_history')
        .select('*')
        .eq('student_id', studentId)
        .order('submitted_at', { ascending: false });

      if (error) {
        console.error('Error fetching exam history:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Error in getStudentExamHistory:', err);
      return [];
    }
  }

  /**
   * Dapatkan semua activity untuk user dalam range waktu tertentu
   */
  static async getUserActivityInRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<ActivityLog[]> {
    if (!isSupabaseConfigured || !supabase) return [];

    try {
      const { data, error } = await supabase
        .from('user_activity_log')
        .select('*')
        .eq('user_id', userId)
        .gte('timestamp', startDate)
        .lte('timestamp', endDate)
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('Error fetching activity range:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Error in getUserActivityInRange:', err);
      return [];
    }
  }
}

export default UserActivityService;
