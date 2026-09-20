import { createContext, useContext } from 'react';
import type { BlockStatus, Exam, Goal, NewTask, PageId, PlannedBlock, StudySession, Subject, Task, ToastMessage, UserProfile } from '../types';
import type { Move } from '../utils/reschedule';

export interface OnboardingSetup {
  name: string;
  goal: Goal;
  dailyGoalHours: number;
  subjects: { name: string; examDate?: string }[];
  useSample: boolean;
}
export interface TaskEditorState {
  open: boolean;
  task: Task | null;
  preset?: Partial<NewTask>;
}

export interface AppApi {
  activePage: PageId;
  setActivePage: (p: PageId) => void;
  theme: 'light' | 'dark';
  setTheme: (t: 'light' | 'dark') => void;

  subjects: Subject[];
  tasks: Task[];
  sessions: StudySession[];
  blocks: PlannedBlock[];
  exams: Exam[];
  profile: UserProfile;
  onboardingDone: boolean;

  planDate: string;
  setPlanDate: (d: string) => void;
  taskEditor: TaskEditorState;
  openTaskEditor: (task?: Task | null, preset?: Partial<NewTask>) => void;
  closeTaskEditor: () => void;
  quickCaptureOpen: boolean;
  setQuickCaptureOpen: (v: boolean) => void;
  rescheduleOpen: boolean;
  setRescheduleOpen: (v: boolean) => void;
  generateDayOpen: boolean;
  setGenerateDayOpen: (v: boolean) => void;
  rescheduleDismissedOn: string | null;
  dismissReschedule: () => void;

  addSubject: (data: Omit<Subject, 'id'>) => Subject;
  updateSubject: (id: string, patch: Partial<Subject>) => void;
  deleteSubject: (id: string) => void;
  addTask: (data: NewTask) => Task;
  addTasks: (list: NewTask[]) => Task[];
  updateTask: (id: string, patch: Partial<Task>) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  addSession: (data: Omit<StudySession, 'id'>) => void;
  deleteSession: (id: string) => void;
  addBlocks: (list: PlannedBlock[]) => void;
  setBlockStatus: (id: string, status: BlockStatus) => void;
  removeBlock: (id: string) => void;
  applyReschedule: (moves: Move[]) => void;
  addExam: (data: Omit<Exam, 'id'>) => Exam;
  updateExam: (id: string, patch: Partial<Exam>) => void;
  deleteExam: (id: string) => void;
  toggleExamTopic: (examId: string, topicId: string) => void;
  addExamTopic: (examId: string, name: string) => void;
  removeExamTopic: (examId: string, topicId: string) => void;
  generateExamTasks: (examId: string) => number;
  updateProfile: (patch: Partial<UserProfile>) => void;
  completeOnboarding: (setup: OnboardingSetup) => { subjects: Subject[]; tasks: Task[]; exams: Exam[] };
  loadSample: () => { subjects: Subject[]; tasks: Task[]; exams: Exam[] };
  resetAll: () => void;
  exportJSON: () => string;
  importJSON: (text: string) => { ok: boolean; error?: string };

  toasts: ToastMessage[];
  addToast: (title: string, message?: string, type?: ToastMessage['type'], action?: ToastMessage['action']) => void;
  removeToast: (id: string) => void;
}

export const AppContext = createContext<AppApi | null>(null);
export function useApp(): AppApi {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
