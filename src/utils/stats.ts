import type { PlannedBlock, StudySession } from '../types';
import { addDays } from './format';

export function minutesOn(sessions: StudySession[], date: string): number {
  return sessions.reduce((a, s) => (s.date === date ? a + s.durationMinutes : a), 0);
}
export function plannedOn(blocks: PlannedBlock[], date: string): number {
  return blocks.filter((b) => b.date === date && !b.isBreak && b.status !== 'moved').reduce((a, b) => a + b.durationMinutes, 0);
}
export function computeStreak(sessions: StudySession[], today: string): number {
  const days = new Set(sessions.filter((s) => s.durationMinutes > 0).map((s) => s.date));
  let d = days.has(today) ? today : addDays(today, -1);
  let n = 0;
  while (days.has(d)) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}
export function lastDates(n: number, today: string): string[] {
  return Array.from({ length: n }, (_, i) => addDays(today, i - (n - 1)));
}
export function subjectMinutes(sessions: StudySession[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const s of sessions) m.set(s.subjectId, (m.get(s.subjectId) ?? 0) + s.durationMinutes);
  return m;
}
const hourLabel = (h: number) => `${h % 12 || 12} ${h >= 12 && h < 24 ? 'PM' : 'AM'}`;
/** Busiest 2-hour window, only when enough timed sessions exist to say something real. */
export function bestFocusWindow(sessions: StudySession[]): { label: string; minutes: number } | null {
  const timed = sessions.filter((s) => s.startedAt);
  if (timed.length < 3) return null;
  const buckets = new Map<number, number>();
  for (const s of timed) {
    const h = Math.floor(new Date(s.startedAt as string).getHours() / 2) * 2;
    buckets.set(h, (buckets.get(h) ?? 0) + s.durationMinutes);
  }
  const [h, minutes] = [...buckets.entries()].sort((a, b) => b[1] - a[1])[0];
  return { label: `${hourLabel(h)} and ${hourLabel((h + 2) % 24)}`, minutes };
}
