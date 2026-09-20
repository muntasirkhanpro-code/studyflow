import type { Exam, PlannedBlock, StudySession, Subject, Task, UserProfile } from '../types';
import { uid } from './id';
import { todayStr } from './format';

export const KEYS = {
  subjects: 'studyflow_v2_subjects',
  tasks: 'studyflow_v2_tasks',
  sessions: 'studyflow_v2_sessions',
  blocks: 'studyflow_v2_blocks',
  exams: 'studyflow_v2_exams',
  profile: 'studyflow_v2_profile',
  onboarding: 'studyflow_v2_onboarding',
  theme: 'studyflow_theme_v1',
  focus: 'studyflow_v2_focus',
} as const;
const V1 = {
  subjects: 'studyflow_subjects_v1',
  tasks: 'studyflow_tasks_v1',
  sessions: 'studyflow_sessions_v1',
  exams: 'studyflow_exams_v1',
  profile: 'studyflow_profile_v1',
  onboarding: 'studyflow_onboarding_v1',
};

export function readJSON(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? undefined : JSON.parse(raw);
  } catch {
    return undefined;
  }
}
export function writeJSON(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

type R = Record<string, unknown>;
const isObj = (v: unknown): v is R => typeof v === 'object' && v !== null && !Array.isArray(v);
const list = (v: unknown): R[] => (Array.isArray(v) ? v.filter(isObj) : []);
const str = (v: unknown, d = '') => (typeof v === 'string' ? v : d);
const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
const bool = (v: unknown) => v === true;
const oneOf = <T extends string>(v: unknown, opts: readonly T[], d: T): T => (opts.includes(v as T) ? (v as T) : d);
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^\d{2}:\d{2}$/;
const date = (v: unknown, d: string) => (typeof v === 'string' && DATE.test(v) ? v : d);
const DIFFS = ['Easy', 'Medium', 'Hard'] as const;
const PRIOS = ['Low', 'Medium', 'High'] as const;
const KINDS = ['learn', 'practice', 'revision', 'mock'] as const;
const TYPES = ['Deep Work', 'Revision', 'Practice', 'Exam Prep'] as const;
const GOALS = ['Exams', 'Skills', 'Projects', 'General'] as const;

export function sanitizeSubjects(v: unknown): Subject[] {
  return list(v).map((o) => ({
    id: str(o.id) || uid('sub'),
    name: str(o.name, 'Untitled subject'),
    code: str(o.code),
    color: str(o.color, '#5558e8'),
    difficulty: oneOf(o.difficulty, DIFFS, 'Medium'),
    targetHours: Math.max(1, num(o.targetHours, 20)),
    description: typeof o.description === 'string' ? o.description : undefined,
  }));
}
export function sanitizeTasks(v: unknown): Task[] {
  return list(v)
    .filter((o) => typeof o.title === 'string' && o.title.trim())
    .map((o) => ({
      id: str(o.id) || uid('task'),
      title: str(o.title),
      subjectId: str(o.subjectId),
      deadline: date(o.deadline, todayStr()),
      priority: oneOf(o.priority, PRIOS, 'Medium'),
      estimatedTime: Math.max(5, num(o.estimatedTime, 45)),
      completed: bool(o.completed),
      completedAt: typeof o.completedAt === 'string' ? o.completedAt : undefined,
      notes: typeof o.notes === 'string' ? o.notes : undefined,
      difficulty: DIFFS.includes(o.difficulty as never) ? (o.difficulty as Task['difficulty']) : undefined,
      examId: typeof o.examId === 'string' ? o.examId : undefined,
      kind: KINDS.includes(o.kind as never) ? (o.kind as Task['kind']) : undefined,
    }));
}
export function sanitizeSessions(v: unknown): StudySession[] {
  return list(v)
    .filter((o) => num(o.durationMinutes, 0) > 0)
    .map((o) => ({
      id: str(o.id) || uid('sess'),
      subjectId: str(o.subjectId),
      date: date(o.date, todayStr()),
      durationMinutes: num(o.durationMinutes, 0),
      plannedMinutes: typeof o.plannedMinutes === 'number' ? o.plannedMinutes : undefined,
      type: oneOf(o.type, TYPES, 'Deep Work'),
      notes: typeof o.notes === 'string' ? o.notes : undefined,
      taskId: typeof o.taskId === 'string' ? o.taskId : undefined,
      blockId: typeof o.blockId === 'string' ? o.blockId : undefined,
      startedAt: typeof o.startedAt === 'string' ? o.startedAt : undefined,
    }));
}
export function sanitizeBlocks(v: unknown): PlannedBlock[] {
  return list(v)
    .filter((o) => typeof o.date === 'string' && DATE.test(o.date) && typeof o.startTime === 'string' && TIME.test(o.startTime))
    .map((o) => ({
      id: str(o.id) || uid('blk'),
      taskId: typeof o.taskId === 'string' ? o.taskId : undefined,
      subjectId: typeof o.subjectId === 'string' ? o.subjectId : undefined,
      title: str(o.title, 'Study block'),
      date: str(o.date),
      startTime: str(o.startTime),
      durationMinutes: Math.max(5, num(o.durationMinutes, 30)),
      isBreak: bool(o.isBreak),
      status: oneOf(o.status, ['planned', 'done', 'moved'] as const, 'planned'),
      source: oneOf(o.source, ['planner', 'reschedule'] as const, 'planner'),
      note: typeof o.note === 'string' ? o.note : undefined,
    }));
}
export function sanitizeExams(v: unknown): Exam[] {
  return list(v).map((o) => ({
    id: str(o.id) || uid('exam'),
    subjectId: str(o.subjectId),
    name: str(o.name, 'Exam'),
    date: date(o.date, todayStr()),
    targetScore: typeof o.targetScore === 'string' ? o.targetScore : undefined,
    topics: list(o.topics).map((t) => ({ id: str(t.id) || uid('top'), name: str(t.name, 'Topic'), completed: bool(t.completed) })),
  }));
}
export function sanitizeProfile(v: unknown): UserProfile {
  const o = isObj(v) ? v : {};
  return {
    name: str(o.name),
    dailyGoalHours: Math.min(12, Math.max(0.5, num(o.dailyGoalHours, 3))),
    goal: GOALS.includes(o.goal as never) ? (o.goal as UserProfile['goal']) : undefined,
  };
}

function pick<T>(k2: string, k1: string | undefined, fn: (v: unknown) => T): T {
  const a = readJSON(k2);
  if (a !== undefined) return fn(a);
  const b = k1 ? readJSON(k1) : undefined;
  return fn(b);
}

/** Loads v2 data, falling back to (sanitised) v1 data so existing users keep their work. */
export function loadAll() {
  const onboarding = readJSON(KEYS.onboarding);
  return {
    subjects: pick(KEYS.subjects, V1.subjects, sanitizeSubjects),
    tasks: pick(KEYS.tasks, V1.tasks, sanitizeTasks),
    sessions: pick(KEYS.sessions, V1.sessions, sanitizeSessions),
    blocks: pick(KEYS.blocks, undefined, sanitizeBlocks),
    exams: pick(KEYS.exams, V1.exams, sanitizeExams),
    profile: pick(KEYS.profile, V1.profile, sanitizeProfile),
    onboardingDone: onboarding === true || readJSON(V1.onboarding) === true,
  };
}
