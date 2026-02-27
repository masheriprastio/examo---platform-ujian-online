import { Exam } from '../types';

/**
 * Hitung "effective status" di sisi client sebagai fallback.
 * - Jika exam.status === 'published' -> 'published'
 * - Jika startDate/endDate tersedia: 'scheduled' | 'active' | 'expired'
 * - Kalau tidak ada info waktu dan status !== 'published' -> 'draft'
 *
 * Mengasumsikan tanggal tersimpan dalam ISO8601 (prefer UTC). Jika tidak ada timezone
 * pada string, fungsi ini akan menganggapnya sebagai UTC.
 */
export function getEffectiveStatus(exam: Exam): 'published' | 'scheduled' | 'active' | 'expired' | 'draft' {
  if (exam.status === 'published') return 'published';

  const now = new Date();

  const parseAsUTC = (s?: string | undefined): Date | null => {
    if (!s) return null;
    // Jika string mengandung Z atau offset, Date otomatis meng-handle zone.
    // Jika tidak ada offset, treat as UTC by appending 'Z'
    const hasTZ = /[zZ]|[+\-]\d{2}:\d{2}$/.test(s);
    const iso = hasTZ ? s : s + 'Z';
    const d = new Date(iso);
    return isNaN(d.getTime()) ? null : d;
  };

  const start = parseAsUTC(exam.startDate);
  const end = parseAsUTC(exam.endDate);

  if (start && end) {
    if (now < start) return 'scheduled';
    if (now >= start && now <= end) return 'active';
    return 'expired';
  }

  // Fallback: jika hanya start atau only end
  if (start && !end) {
    if (now < start) return 'scheduled';
    return 'active';
  }
  if (!start && end) {
    if (now <= end) return 'active';
    return 'expired';
  }

  return 'draft';
}