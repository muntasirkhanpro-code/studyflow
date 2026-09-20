export type Priority = 'Low' | 'Medium' | 'High';
export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export type TaskKind = 'learn' | 'practice' | 'revision' | 'mock';
export type SessionType = 'Deep Work' | 'Revision' | 'Practice' | 'Exam Prep';

export interface Subject {
  id: string;
  name: string;
  code: string;
  color: string;
  difficulty: Difficulty;
  targetHours: number;
  description?: string;
}

export interface Task {
  id: string;
  title: string;
  subjectId: string;
  deadline: string; // YYYY-MM-DD (local)
  priority: Priority;
  estimatedTime: number; // minutes
  completed: boolean;
  completedAt?: string; // ISO
  notes?: string;
  difficulty?: Difficulty;
  examId?: string;
  kind?: TaskKind;
}
export type NewTask = Omit<Task, 'id' | 'completed' | 'completedAt'>;

export interface StudySession {
  id: string;
  subjectId: string;
  date: string; // YYYY-MM-DD (local)
  durationMinutes: number;
  plannedMinutes?: number;
  type: SessionType;
  notes?: string;
  taskId?: string;
  blockId?: string;
  startedAt?: string; // ISO
}

/** The single schedule entity: planner, calendar, reschedule and focus all use it. */
export type BlockStatus = 'planned' | 'done' | 'moved';
export interface PlannedBlock {
  id: string;
  taskId?: string;
  subjectId?: string;
  title: string;
  date: string;
  startTime: string; // HH:MM
  durationMinutes: number;
  isBreak: boolean;
  status: BlockStatus;
  source: 'planner' | 'reschedule';
  note?: string;
}

export interface ExamTopic {
  id: string;
  name: string;
  completed: boolean;
}
export interface Exam {
  id: string;
  subjectId: string;
  name: string;
  date: string;
  topics: ExamTopic[];
  targetScore?: string;
}

export type Goal = 'Exams' | 'Skills' | 'Projects' | 'General';
export interface UserProfile {
  name: string;
  dailyGoalHours: number;
  goal?: Goal;
}

export type PageId = 'dashboard' | 'tasks' | 'planner' | 'calendar' | 'subjects' | 'exams' | 'progress' | 'settings';

export interface ToastMessage {
  id: string;
  title: string;
  message?: string;
  type?: 'success' | 'info' | 'warning' | 'error';
  action?: { label: string; onClick: () => void };
}
