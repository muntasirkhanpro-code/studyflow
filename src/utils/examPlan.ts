import type { Exam, NewTask, Task } from '../types';
import { addDays, daysUntil, todayStr } from './format';

/** Builds learn → practice → revise → mock-test tasks spread evenly up to the day before the exam. */
export function buildExamTasks(exam: Exam, existing: Task[], today: string = todayStr()): NewTask[] {
  const daysLeft = daysUntil(exam.date, today);
  if (daysLeft < 0) return [];
  const lastDay = Math.max(0, daysLeft - 1);
  const urgent = daysLeft <= 3;
  const open = exam.topics.filter((t) => !t.completed);

  const base: Omit<NewTask, 'deadline'>[] = [
    ...open.map((t) => ({ title: `Learn: ${t.name}`, subjectId: exam.subjectId, priority: (urgent ? 'High' : 'Medium') as NewTask['priority'], estimatedTime: 60, examId: exam.id, kind: 'learn' as const })),
    ...open.map((t) => ({ title: `Practice: ${t.name}`, subjectId: exam.subjectId, priority: 'Medium' as const, estimatedTime: 45, examId: exam.id, kind: 'practice' as const })),
    { title: `Revise: ${exam.name}`, subjectId: exam.subjectId, priority: 'High', estimatedTime: 60, examId: exam.id, kind: 'revision' },
    { title: `Mock test: ${exam.name}`, subjectId: exam.subjectId, priority: 'High', estimatedTime: 90, examId: exam.id, kind: 'mock' },
  ];
  const have = new Set(existing.filter((t) => t.examId === exam.id).map((t) => t.title));
  const fresh = base.filter((b) => !have.has(b.title));
  const n = fresh.length;
  return fresh.map((b, i) => ({ ...b, deadline: addDays(today, n <= 1 ? lastDay : Math.round((i * lastDay) / (n - 1))) }));
}
