import type { Exam, PlannedBlock, StudySession, Subject, Task } from '../types';
import { uid } from './id';
import { blockEndMs, daysUntil, formatMinutes, minutesToTime, timeToMinutes } from './format';
import { describeTask, nextExamFor, plannedMinutesFor, remainingMinutes, scoreTask } from './priority';

export type Bias = 'balanced' | 'deadline' | 'exam' | 'difficulty';
export interface PlanOptions {
  date: string;
  nowMs: number;
  startMinutes: number;
  windowMinutes: number;
  focusMin: number;
  breakMin: number;
  subjectIds: string[];
  bias: Bias;
}
export interface PlanData {
  tasks: Task[];
  subjects: Subject[];
  exams: Exam[];
  sessions: StudySession[];
  blocks: PlannedBlock[];
}
export interface PlanResult {
  blocks: PlannedBlock[];
  studyMinutes: number;
  breakMinutes: number;
  unplaced: Task[];
  summary: string;
}
interface Item {
  taskId?: string;
  subjectId: string;
  title: string;
  remaining: number;
  reason: string;
  score: number;
}
const TIPS = ['Stretch and drink some water', 'Rest your eyes for a minute', 'Step away from the screen', 'Take a short walk'];
const r5 = (n: number) => Math.round(n / 5) * 5;

/**
 * Deterministic local planner. Ranks pending tasks (deadline, priority, difficulty, exams),
 * subtracts time already focused/planned, and packs sessions + breaks into free time.
 */
export function buildPlan(opts: PlanOptions, data: PlanData): PlanResult {
  const { date, nowMs, startMinutes, windowMinutes, focusMin, breakMin, subjectIds, bias } = opts;
  const ctx = { subjects: data.subjects, exams: data.exams, sessions: data.sessions };
  const windowEnd = Math.min(startMinutes + windowMinutes, 24 * 60);

  const busy = data.blocks
    .filter((b) => b.date === date && b.status !== 'moved' && !b.isBreak)
    .map((b) => ({ start: timeToMinutes(b.startTime), end: timeToMinutes(b.startTime) + b.durationMinutes }))
    .sort((a, b) => a.start - b.start);

  const queue: Item[] = data.tasks
    .filter((t) => !t.completed && (subjectIds.length === 0 || subjectIds.includes(t.subjectId)))
    .map((t) => {
      const sub = data.subjects.find((s) => s.id === t.subjectId);
      const exam = nextExamFor(t.subjectId, data.exams, date);
      let score = scoreTask(t, ctx, date);
      if (bias === 'exam' && exam && daysUntil(exam.date, date) <= 14) score += 30;
      if (bias === 'difficulty' && (t.difficulty ?? sub?.difficulty) === 'Hard') score += 25;
      if (bias === 'deadline') score += Math.max(0, 30 - 5 * Math.max(0, daysUntil(t.deadline, date)));
      return {
        taskId: t.id,
        subjectId: t.subjectId,
        title: t.title,
        remaining: remainingMinutes(t, data.sessions) - plannedMinutesFor(t.id, data.blocks, nowMs),
        reason: describeTask(t, ctx),
        score,
      };
    })
    .filter((x) => x.remaining >= 10)
    .sort((a, b) => b.score - a.score);

  const out: PlannedBlock[] = [];
  let cursor = startMinutes;
  let lastEnd = -1;
  let breakIdx = 0;

  const nextStart = (from: number, len: number): number | null => {
    let s = from;
    for (let i = 0; i < 100; i++) {
      if (s + len > windowEnd) return null;
      const clash = busy.find((b) => s < b.end && s + len > b.start);
      if (!clash) return s;
      s = clash.end;
    }
    return null;
  };

  const run = (items: Item[], once: boolean): Item[] => {
    for (let guard = 0; guard < 200 && items.length; guard++) {
      const item = items[0];
      let want = item.remaining <= focusMin * 1.25 ? item.remaining : focusMin;
      want = Math.max(15, r5(want));
      const needBreak = out.length > 0 && lastEnd === cursor;
      const s = cursor + (needBreak ? breakMin : 0);
      const st = nextStart(s, 15);
      if (st === null) break;
      const nextBusy = busy.find((b) => b.start > st);
      const free = Math.min(windowEnd, nextBusy ? nextBusy.start : Infinity) - st;
      const len = Math.min(want, Math.floor(free / 5) * 5);
      const breakFree = !busy.some((b) => cursor < b.end && s > b.start);
      if (needBreak && st === s && breakFree) {
        out.push({ id: uid('blk'), title: 'Break', date, startTime: minutesToTime(cursor), durationMinutes: breakMin, isBreak: true, status: 'planned', source: 'planner', note: TIPS[breakIdx++ % TIPS.length] });
      }
      out.push({ id: uid('blk'), taskId: item.taskId, subjectId: item.subjectId, title: item.title, date, startTime: minutesToTime(st), durationMinutes: len, isBreak: false, status: 'planned', source: 'planner', note: item.reason });
      cursor = st + len;
      lastEnd = cursor;
      items.shift();
      item.remaining -= len;
      if (!once && item.remaining >= 10) items.push(item);
    }
    return items;
  };

  const leftover = run(queue, false);

  // Spare time and nothing left to do: use it for revision of the nearest exam.
  if (leftover.length === 0 && cursor + 25 <= windowEnd) {
    const today = date;
    const cand = data.exams
      .filter((e) => e.date >= today && daysUntil(e.date, today) <= 21 && (subjectIds.length === 0 || subjectIds.includes(e.subjectId)) && e.topics.some((t) => !t.completed))
      .sort((a, b) => a.date.localeCompare(b.date))[0];
    if (cand) {
      const topic = cand.topics.find((t) => !t.completed)!;
      const d = daysUntil(cand.date, today);
      run([{ subjectId: cand.subjectId, title: `Revise: ${topic.name}`, remaining: 45, reason: `${cand.name} ${d === 0 ? 'is today' : `in ${d} day${d === 1 ? '' : 's'}`}`, score: 0 }], true);
    }
  }

  const study = out.filter((b) => !b.isBreak);
  const studyMinutes = study.reduce((a, b) => a + b.durationMinutes, 0);
  const breakMinutes = out.filter((b) => b.isBreak).reduce((a, b) => a + b.durationMinutes, 0);
  const unplaced = leftover.map((i) => data.tasks.find((t) => t.id === i.taskId)).filter((t): t is Task => !!t);
  const summary = study.length
    ? `${formatMinutes(studyMinutes)} of study in ${study.length} session${study.length === 1 ? '' : 's'}${breakMinutes ? `, ${formatMinutes(breakMinutes)} of breaks` : ''}`
    : 'Nothing could be scheduled in this window';
  return { blocks: out, studyMinutes, breakMinutes, unplaced, summary };
}

export function isBlockMissed(b: PlannedBlock, nowMs: number): boolean {
  return !b.isBreak && b.status === 'planned' && blockEndMs(b) < nowMs;
}
