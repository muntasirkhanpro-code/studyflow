import type { Exam, PlannedBlock, StudySession, Subject, Task } from '../types';
import { addDays, blockEndMs, ceilTo, daysUntil, formatTime, minutesToTime, timeToMinutes, todayStr, weekdayShort, monthDay } from './format';
import { remainingMinutes, scoreTask } from './priority';
import { isBlockMissed } from './scheduler';

export interface RescheduleData {
  blocks: PlannedBlock[];
  tasks: Task[];
  subjects: Subject[];
  exams: Exam[];
  sessions: StudySession[];
}
export interface Move {
  key: string;
  blockId?: string;
  task?: Task;
  subjectId?: string;
  title: string;
  durationMinutes: number;
  from?: { date: string; startTime: string };
  to?: { date: string; startTime: string };
  deadlineTo?: string;
  reason: string;
}

export function findMissed(data: Pick<RescheduleData, 'blocks' | 'tasks'>, nowMs: number) {
  const covered = new Set(
    data.blocks.filter((b) => b.status === 'planned' && !b.isBreak && b.taskId && blockEndMs(b) >= nowMs).map((b) => b.taskId as string),
  );
  const missedBlocks = data.blocks.filter((b) => {
    if (!isBlockMissed(b, nowMs)) return false;
    const t = b.taskId ? data.tasks.find((x) => x.id === b.taskId) : undefined;
    if (b.taskId && (!t || t.completed || covered.has(b.taskId))) return false;
    return true;
  });
  const missedTaskIds = new Set(missedBlocks.map((b) => b.taskId));
  const overdueTasks = data.tasks.filter((t) => !t.completed && daysUntil(t.deadline) < 0 && !missedTaskIds.has(t.id) && !covered.has(t.id));
  return { missedBlocks, overdueTasks };
}

const DAY_START = 9 * 60;
const DAY_END = 21 * 60 + 30;
const label = (date: string, time: string) => `${daysUntil(date) === 0 ? 'today' : daysUntil(date) === 1 ? 'tomorrow' : `${weekdayShort(date)} ${monthDay(date)}`} at ${formatTime(time)}`;

/** Finds conflict-free future slots (respecting deadlines and a daily study cap) for missed/overdue work. */
export function proposeReschedule(data: RescheduleData, nowMs: number, dailyMinutes: number): { moves: Move[]; unplaced: Move[] } {
  const { missedBlocks, overdueTasks } = findMissed(data, nowMs);
  const ctx = { subjects: data.subjects, exams: data.exams, sessions: data.sessions };
  const today = todayStr();
  const nowMin = (nowMs - new Date(today + 'T00:00:00').getTime()) / 60000;

  const items: { move: Move; score: number; deadline?: string }[] = [];
  for (const b of missedBlocks) {
    const task = b.taskId ? data.tasks.find((t) => t.id === b.taskId) : undefined;
    items.push({
      move: { key: `b-${b.id}`, blockId: b.id, task, subjectId: b.subjectId, title: b.title, durationMinutes: b.durationMinutes, from: { date: b.date, startTime: b.startTime }, reason: 'Missed session' },
      score: task ? scoreTask(task, ctx) : 40,
      deadline: task?.deadline,
    });
  }
  for (const t of overdueTasks) {
    const dur = Math.min(90, Math.max(15, Math.round(remainingMinutes(t, data.sessions) / 5) * 5));
    items.push({ move: { key: `t-${t.id}`, task: t, subjectId: t.subjectId, title: t.title, durationMinutes: dur, reason: `Overdue since ${monthDay(t.deadline)}` }, score: scoreTask(t, ctx), deadline: t.deadline });
  }
  items.sort((a, b) => b.score - a.score);

  const busy = new Map<string, { start: number; end: number }[]>();
  const add = (date: string, start: number, end: number) => busy.set(date, [...(busy.get(date) ?? []), { start, end }]);
  for (const b of data.blocks) {
    if (b.isBreak || b.status === 'moved' || b.date < today) continue;
    add(b.date, timeToMinutes(b.startTime), timeToMinutes(b.startTime) + b.durationMinutes);
  }
  const load = (date: string) => (busy.get(date) ?? []).reduce((a, x) => a + (x.end - x.start), 0);

  const place = (date: string, dur: number): number | null => {
    const bound = date === today ? Math.max(DAY_START, ceilTo(nowMin + 10, 5)) : DAY_START;
    if (load(date) + dur > dailyMinutes) return null;
    const list = [...(busy.get(date) ?? [])].sort((a, b) => a.start - b.start);
    let s = bound;
    for (let i = 0; i < 60; i++) {
      if (s + dur > DAY_END) return null;
      const clash = list.find((x) => s < x.end + 5 && s + dur > x.start - 5);
      if (!clash) return s;
      s = ceilTo(clash.end + 5, 5);
    }
    return null;
  };

  const moves: Move[] = [];
  const unplaced: Move[] = [];
  for (const { move, deadline } of items) {
    const limit = deadline && deadline >= today ? deadline : addDays(today, 6);
    const span = daysUntil(limit);
    let placed: { date: string; start: number; late: boolean } | null = null;
    for (let i = 0; i <= span + 7 && !placed; i++) {
      const date = addDays(today, i);
      const start = place(date, move.durationMinutes);
      if (start !== null) placed = { date, start, late: i > span && !!deadline && deadline >= today };
    }
    if (!placed) {
      unplaced.push({ ...move, reason: `${move.reason}. No free time in the next two weeks within your daily limit.` });
      continue;
    }
    add(placed.date, placed.start, placed.start + move.durationMinutes);
    const time = minutesToTime(placed.start);
    const overdue = !!deadline && deadline < today;
    const deadlineTo = overdue || placed.late ? placed.date : undefined;
    const tail = overdue ? ` New due date: ${monthDay(placed.date)}.` : placed.late ? ` No room before the deadline, so the due date moves to ${monthDay(placed.date)}.` : deadline ? ' Fits before the deadline.' : '';
    moves.push({
      ...move,
      to: { date: placed.date, startTime: time },
      deadlineTo,
      reason: `${move.reason} → ${label(placed.date, time)}.${tail}`,
    });
  }
  return { moves, unplaced };
}
