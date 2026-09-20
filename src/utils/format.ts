const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const pad = (n: number) => String(n).padStart(2, '0');

/** Local-timezone YYYY-MM-DD (never UTC). */
export function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
export function todayStr(): string {
  return toDateStr(new Date());
}
export function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}
export function addDays(s: string, n: number): string {
  const d = parseDate(s);
  d.setDate(d.getDate() + n);
  return toDateStr(d);
}
export function daysUntil(s: string, from: string = todayStr()): number {
  return Math.round((parseDate(s).getTime() - parseDate(from).getTime()) / 86400000);
}
export function weekdayShort(s: string): string {
  return WEEKDAYS[parseDate(s).getDay()];
}
export function monthDay(s: string): string {
  const d = parseDate(s);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}
export function formatDateLong(s: string): string {
  return parseDate(s).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

export function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}
export function minutesToTime(m: number): string {
  const x = ((Math.round(m) % 1440) + 1440) % 1440;
  return `${pad(Math.floor(x / 60))}:${pad(x % 60)}`;
}
export function formatTime(t: string): string {
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${pad(m)} ${h >= 12 ? 'PM' : 'AM'}`;
}
export function blockStartMs(b: { date: string; startTime: string }): number {
  const d = parseDate(b.date);
  d.setMinutes(timeToMinutes(b.startTime));
  return d.getTime();
}
export function blockEndMs(b: { date: string; startTime: string; durationMinutes: number }): number {
  return blockStartMs(b) + b.durationMinutes * 60000;
}
export function minutesNow(): number {
  const n = new Date();
  return n.getHours() * 60 + n.getMinutes();
}
export function ceilTo(n: number, step: number): number {
  return Math.ceil(n / step) * step;
}

export function formatMinutes(min: number): string {
  const m = Math.round(min);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r === 0 ? `${h}h` : `${h}h ${r}m`;
}

export type DueTone = 'overdue' | 'today' | 'soon' | 'later';
export function formatDue(dateStr: string): { label: string; tone: DueTone } {
  const d = daysUntil(dateStr);
  if (d < 0) return { label: d === -1 ? 'Overdue by 1 day' : `Overdue by ${-d} days`, tone: 'overdue' };
  if (d === 0) return { label: 'Due today', tone: 'today' };
  if (d === 1) return { label: 'Due tomorrow', tone: 'soon' };
  if (d <= 6) return { label: `Due ${weekdayShort(dateStr)}`, tone: 'soon' };
  return { label: `Due ${monthDay(dateStr)}`, tone: 'later' };
}
export function relativeDay(dateStr: string): string {
  const d = daysUntil(dateStr);
  if (d === 0) return 'Today';
  if (d === 1) return 'Tomorrow';
  if (d === -1) return 'Yesterday';
  if (d > 1 && d <= 6) return weekdayShort(dateStr);
  return monthDay(dateStr);
}

export function greeting(name: string): string {
  const h = new Date().getHours();
  const part = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  return name.trim() ? `${part}, ${name.trim().split(' ')[0]}` : part;
}
export function initials(name: string): string {
  const stop = new Set(['and', 'of', 'the', '&', 'to', 'in']);
  return name
    .split(/[\s/-]+/)
    .filter((w) => w && !stop.has(w.toLowerCase()))
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export function formatClock(ms: number): string {
  const sec = Math.ceil(ms / 1000);
  return `${pad(Math.floor(sec / 60))}:${pad(sec % 60)}`;
}
