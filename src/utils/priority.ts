import type { Exam, PlannedBlock, StudySession, Subject, Task } from '../types';
import { blockEndMs, daysUntil, formatMinutes, todayStr } from './format';

export interface Ctx {
  subjects: Subject[];
  exams: Exam[];
  sessions: StudySession[];
}

export function focusedMinutes(taskId: string, sessions: StudySession[]): number {
  return sessions.reduce((a, s) => (s.taskId === taskId ? a + s.durationMinutes : a), 0);
}
export function remainingMinutes(task: Task, sessions: StudySession[]): number {
  return Math.max(10, task.estimatedTime - focusedMinutes(task.id, sessions));
}
/** Minutes of this task already sitting in future planned blocks. */
export function plannedMinutesFor(taskId: string, blocks: PlannedBlock[], nowMs: number): number {
  return blocks
    .filter((b) => b.taskId === taskId && b.status === 'planned' && !b.isBreak && blockEndMs(b) >= nowMs)
    .reduce((a, b) => a + b.durationMinutes, 0);
}
export function nextExamFor(subjectId: string, exams: Exam[], today: string = todayStr()): Exam | undefined {
  return exams
    .filter((e) => e.subjectId === subjectId && e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))[0];
}

export function scoreTask(task: Task, ctx: Ctx, today: string = todayStr()): number {
  const d = daysUntil(task.deadline, today);
  const subject = ctx.subjects.find((s) => s.id === task.subjectId);
  let score = d < 0 ? 120 + Math.min(30, -d * 5) : d === 0 ? 90 : d === 1 ? 70 : d <= 3 ? 45 : d <= 7 ? 25 : 10;
  score += task.priority === 'High' ? 35 : task.priority === 'Medium' ? 18 : 5;
  const diff = task.difficulty ?? subject?.difficulty;
  score += diff === 'Hard' ? 15 : diff === 'Medium' ? 8 : 0;
  const exam = nextExamFor(task.subjectId, ctx.exams, today);
  if (exam) {
    const ed = daysUntil(exam.date, today);
    if (ed <= 3) score += 35;
    else if (ed <= 14) score += 25;
  }
  if (remainingMinutes(task, ctx.sessions) <= 45 && score >= 90) score += 8;
  return score;
}

export function rankTasks(tasks: Task[], ctx: Ctx): Task[] {
  return tasks
    .filter((t) => !t.completed)
    .map((t) => ({ t, s: scoreTask(t, ctx) }))
    .sort((a, b) => b.s - a.s)
    .map((x) => x.t);
}
export function recommendNext(tasks: Task[], ctx: Ctx): Task | undefined {
  return rankTasks(tasks, ctx)[0];
}

/** Human-readable reason, e.g. "Due tomorrow · High priority · ~60 min". */
export function describeTask(task: Task, ctx: Ctx): string {
  const d = daysUntil(task.deadline);
  const parts: string[] = [];
  parts.push(d < 0 ? (d === -1 ? 'Overdue by 1 day' : `Overdue by ${-d} days`) : d === 0 ? 'Due today' : d === 1 ? 'Due tomorrow' : `Due in ${d} days`);
  const exam = nextExamFor(task.subjectId, ctx.exams);
  if (exam) {
    const ed = daysUntil(exam.date);
    if (ed <= 7) parts.push(ed === 0 ? 'Exam today' : `Exam in ${ed}d`);
  }
  parts.push(`${task.priority} priority`);
  parts.push(`~${formatMinutes(remainingMinutes(task, ctx.sessions))}`);
  return parts.join(' · ');
}
