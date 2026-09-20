import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppContext, type AppApi, type OnboardingSetup, type TaskEditorState } from './AppContext';
import type { BlockStatus, Exam, NewTask, PageId, PlannedBlock, StudySession, Subject, Task, ToastMessage, UserProfile } from '../types';
import { KEYS, loadAll, sanitizeBlocks, sanitizeExams, sanitizeProfile, sanitizeSessions, sanitizeSubjects, sanitizeTasks, writeJSON } from '../utils/storage';
import { addDays, initials, todayStr } from '../utils/format';
import { uid } from '../utils/id';
import { buildSampleData } from '../data/sample';
import { SUBJECT_COLORS } from '../data/constants';
import { buildExamTasks } from '../utils/examPlan';
import type { Move } from '../utils/reschedule';

const PAGES: PageId[] = ['dashboard', 'tasks', 'planner', 'calendar', 'subjects', 'exams', 'progress', 'settings'];
function pageFromHash(): PageId {
  const h = window.location.hash.replace(/^#\/?/, '') as PageId;
  return PAGES.includes(h) ? h : 'dashboard';
}
function readTheme(): 'light' | 'dark' {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(loadAll);
  const [subjects, setSubjects] = useState<Subject[]>(initial.subjects);
  const [tasks, setTasks] = useState<Task[]>(initial.tasks);
  const [sessions, setSessions] = useState<StudySession[]>(initial.sessions);
  const [blocks, setBlocks] = useState<PlannedBlock[]>(initial.blocks);
  const [exams, setExams] = useState<Exam[]>(initial.exams);
  const [profile, setProfile] = useState<UserProfile>(initial.profile);
  const [onboardingDone, setOnboardingDone] = useState(initial.onboardingDone);
  const [theme, setThemeState] = useState<'light' | 'dark'>(readTheme);
  const [activePage, setPage] = useState<PageId>(pageFromHash);
  const [planDate, setPlanDate] = useState(todayStr);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [taskEditor, setTaskEditor] = useState<TaskEditorState>({ open: false, task: null });
  const [quickCaptureOpen, setQuickCaptureOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [generateDayOpen, setGenerateDayOpen] = useState(false);
  const [rescheduleDismissedOn, setDismissedOn] = useState<string | null>(null);

  // ---- toasts
  const removeToast = useCallback((id: string) => setToasts((p) => p.filter((t) => t.id !== id)), []);
  const addToast = useCallback<AppApi['addToast']>((title, message, type = 'info', action) => {
    const id = uid('toast');
    setToasts((p) => [...p.slice(-3), { id, title, message, type, action }]);
    window.setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), action ? 7000 : 4000);
  }, []);

  // ---- persistence (reports failures instead of silently losing data)
  const warnedRef = useRef(false);
  const onSaveError = useCallback(() => {
    if (warnedRef.current) return;
    warnedRef.current = true;
    window.setTimeout(() => addToast("Couldn't save your changes", 'Browser storage may be full or blocked. Export a backup from Settings.', 'error'), 0);
  }, [addToast]);
  useEffect(() => { if (!writeJSON(KEYS.subjects, subjects)) onSaveError(); }, [subjects, onSaveError]);
  useEffect(() => { if (!writeJSON(KEYS.tasks, tasks)) onSaveError(); }, [tasks, onSaveError]);
  useEffect(() => { if (!writeJSON(KEYS.sessions, sessions)) onSaveError(); }, [sessions, onSaveError]);
  useEffect(() => { if (!writeJSON(KEYS.blocks, blocks)) onSaveError(); }, [blocks, onSaveError]);
  useEffect(() => { if (!writeJSON(KEYS.exams, exams)) onSaveError(); }, [exams, onSaveError]);
  useEffect(() => { if (!writeJSON(KEYS.profile, profile)) onSaveError(); }, [profile, onSaveError]);
  useEffect(() => { writeJSON(KEYS.onboarding, onboardingDone); }, [onboardingDone]);

  // ---- theme + routing
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try { localStorage.setItem(KEYS.theme, theme); } catch { /* ignore */ }
  }, [theme]);
  useEffect(() => {
    const sync = () => setPage(pageFromHash());
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);
  const setActivePage = useCallback((p: PageId) => {
    setPage(p);
    if (window.location.hash !== `#/${p}`) window.history.pushState(null, '', `#/${p}`);
    window.scrollTo({ top: 0 });
  }, []);

  // ---- subjects
  const addSubject = (data: Omit<Subject, 'id'>) => {
    const s = { ...data, id: uid('sub') };
    setSubjects((p) => [...p, s]);
    addToast('Subject added', s.name, 'success');
    return s;
  };
  const updateSubject = (id: string, patch: Partial<Subject>) => setSubjects((p) => p.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const deleteSubject = (id: string) => {
    const name = subjects.find((s) => s.id === id)?.name;
    setSubjects((p) => p.filter((s) => s.id !== id));
    setTasks((p) => p.filter((t) => t.subjectId !== id));
    setBlocks((p) => p.filter((b) => b.subjectId !== id));
    setExams((p) => p.filter((e) => e.subjectId !== id));
    setSessions((p) => p.filter((s) => s.subjectId !== id));
    addToast('Subject deleted', name, 'info');
  };

  // ---- tasks
  const addTask = (data: NewTask): Task => {
    const t: Task = { ...data, id: uid('task'), completed: false };
    setTasks((p) => [t, ...p]);
    addToast('Task added', t.title, 'success');
    return t;
  };
  const addTasks = (list: NewTask[]): Task[] => {
    const created = list.map((d) => ({ ...d, id: uid('task'), completed: false }) as Task);
    setTasks((p) => [...created, ...p]);
    return created;
  };
  const updateTask = (id: string, patch: Partial<Task>) => setTasks((p) => p.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  const toggleTask = (id: string) => {
    const t = tasks.find((x) => x.id === id);
    if (!t) return;
    const done = !t.completed;
    setTasks((p) => p.map((x) => (x.id === id ? { ...x, completed: done, completedAt: done ? new Date().toISOString() : undefined } : x)));
    if (done) {
      setBlocks((p) => p.map((b) => (b.taskId === id && b.status === 'planned' ? { ...b, status: 'done' } : b)));
      addToast('Task completed', t.title, 'success');
    }
  };
  const deleteTask = (id: string) => {
    const t = tasks.find((x) => x.id === id);
    if (!t) return;
    const related = blocks.filter((b) => b.taskId === id);
    setTasks((p) => p.filter((x) => x.id !== id));
    setBlocks((p) => p.filter((b) => b.taskId !== id));
    addToast('Task deleted', t.title, 'info', {
      label: 'Undo',
      onClick: () => {
        setTasks((p) => [t, ...p]);
        setBlocks((p) => [...p, ...related]);
      },
    });
  };

  // ---- sessions & blocks
  const addSession = (data: Omit<StudySession, 'id'>) => setSessions((p) => [...p, { ...data, id: uid('sess') }]);
  const deleteSession = (id: string) => setSessions((p) => p.filter((s) => s.id !== id));
  const addBlocks = (list: PlannedBlock[]) => setBlocks((p) => [...p, ...list]);
  const setBlockStatus = (id: string, status: BlockStatus) => setBlocks((p) => p.map((b) => (b.id === id ? { ...b, status } : b)));
  const removeBlock = (id: string) => setBlocks((p) => p.filter((b) => b.id !== id));
  const applyReschedule = (moves: Move[]) => {
    const placed = moves.filter((m) => m.to);
    setBlocks((p) => [
      ...p.map((b) => (placed.some((m) => m.blockId === b.id) ? { ...b, status: 'moved' as const } : b)),
      ...placed.map((m): PlannedBlock => ({ id: uid('blk'), taskId: m.task?.id, subjectId: m.subjectId, title: m.title, date: m.to!.date, startTime: m.to!.startTime, durationMinutes: m.durationMinutes, isBreak: false, status: 'planned', source: 'reschedule', note: m.reason })),
    ]);
    setTasks((p) => p.map((t) => { const m = placed.find((x) => x.task?.id === t.id && x.deadlineTo); return m ? { ...t, deadline: m.deadlineTo as string } : t; }));
    addToast('Schedule adjusted', `${placed.length} item${placed.length === 1 ? '' : 's'} moved to new time slots.`, 'success');
  };

  // ---- exams
  const addExam = (data: Omit<Exam, 'id'>) => {
    const e = { ...data, id: uid('exam') };
    setExams((p) => [...p, e]);
    addToast('Exam added', e.name, 'success');
    return e;
  };
  const updateExam = (id: string, patch: Partial<Exam>) => setExams((p) => p.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  const deleteExam = (id: string) => {
    setExams((p) => p.filter((e) => e.id !== id));
    addToast('Exam removed', undefined, 'info');
  };
  const mapExam = (id: string, fn: (e: Exam) => Exam) => setExams((p) => p.map((e) => (e.id === id ? fn(e) : e)));
  const toggleExamTopic = (examId: string, topicId: string) => mapExam(examId, (e) => ({ ...e, topics: e.topics.map((t) => (t.id === topicId ? { ...t, completed: !t.completed } : t)) }));
  const addExamTopic = (examId: string, name: string) => mapExam(examId, (e) => ({ ...e, topics: [...e.topics, { id: uid('top'), name, completed: false }] }));
  const removeExamTopic = (examId: string, topicId: string) => mapExam(examId, (e) => ({ ...e, topics: e.topics.filter((t) => t.id !== topicId) }));
  const generateExamTasks = (examId: string): number => {
    const exam = exams.find((e) => e.id === examId);
    if (!exam) return 0;
    const fresh = buildExamTasks(exam, tasks);
    if (fresh.length) addTasks(fresh);
    return fresh.length;
  };

  // ---- profile / onboarding / data
  const updateProfile = (patch: Partial<UserProfile>) => setProfile((p) => ({ ...p, ...patch }));
  const applySample = () => {
    const d = buildSampleData();
    setSubjects(d.subjects); setTasks(d.tasks); setSessions(d.sessions); setBlocks(d.blocks); setExams(d.exams);
    return d;
  };
  const loadSample = () => {
    const d = applySample();
    setProfile((p) => ({ ...p, name: p.name || 'Alex' }));
    setOnboardingDone(true);
    addToast('Sample workspace loaded', 'Explore with realistic subjects, tasks and history.', 'success');
    return { subjects: d.subjects, tasks: d.tasks, exams: d.exams };
  };
  const completeOnboarding = (setup: OnboardingSetup) => {
    setProfile({ name: setup.name.trim(), goal: setup.goal, dailyGoalHours: setup.dailyGoalHours });
    setOnboardingDone(true);
    if (setup.useSample) {
      const d = applySample();
      return { subjects: d.subjects, tasks: d.tasks, exams: d.exams };
    }
    const today = todayStr();
    const subs: Subject[] = setup.subjects.map((s, i) => ({ id: uid('sub'), name: s.name, code: initials(s.name).slice(0, 5) || s.name.slice(0, 3).toUpperCase(), color: SUBJECT_COLORS[i % SUBJECT_COLORS.length], difficulty: 'Medium', targetHours: 20 }));
    const newTasks: Task[] = subs.map((s) => ({ id: uid('task'), title: `Outline key topics: ${s.name}`, subjectId: s.id, deadline: addDays(today, 2), priority: 'Medium', estimatedTime: 30, completed: false }));
    const newExams: Exam[] = setup.subjects.flatMap((s, i) => (s.examDate ? [{ id: uid('exam'), subjectId: subs[i].id, name: `${s.name} exam`, date: s.examDate, topics: [] }] : []));
    setSubjects(subs); setTasks(newTasks); setExams(newExams); setSessions([]); setBlocks([]);
    return { subjects: subs, tasks: newTasks, exams: newExams };
  };
  const resetAll = () => {
    setSubjects([]); setTasks([]); setSessions([]); setBlocks([]); setExams([]);
    setProfile({ name: '', dailyGoalHours: 3 });
    try { localStorage.removeItem(KEYS.focus); } catch { /* ignore */ }
    setOnboardingDone(false);
    addToast('Everything was reset', undefined, 'info');
  };
  const exportJSON = () => JSON.stringify({ app: 'studyflow', version: 3, exportedAt: new Date().toISOString(), profile, subjects, tasks, sessions, blocks, exams }, null, 2);
  const importJSON = (text: string) => {
    let data: unknown;
    try { data = JSON.parse(text); } catch { return { ok: false, error: "That file isn't valid JSON." }; }
    if (typeof data !== 'object' || data === null) return { ok: false, error: "This doesn't look like a StudyFlow backup." };
    const o = data as Record<string, unknown>;
    if (!Array.isArray(o.subjects) && !Array.isArray(o.tasks)) return { ok: false, error: "This doesn't look like a StudyFlow backup." };
    setSubjects(sanitizeSubjects(o.subjects)); setTasks(sanitizeTasks(o.tasks)); setSessions(sanitizeSessions(o.sessions));
    setBlocks(sanitizeBlocks(o.blocks)); setExams(sanitizeExams(o.exams));
    if (o.profile) setProfile(sanitizeProfile(o.profile));
    setOnboardingDone(true);
    addToast('Backup imported', undefined, 'success');
    return { ok: true };
  };

  const value: AppApi = {
    activePage, setActivePage, theme, setTheme: setThemeState,
    subjects, tasks, sessions, blocks, exams, profile, onboardingDone,
    planDate, setPlanDate,
    taskEditor, openTaskEditor: (task = null, preset) => setTaskEditor({ open: true, task, preset }),
    closeTaskEditor: () => setTaskEditor((s) => ({ ...s, open: false })),
    quickCaptureOpen, setQuickCaptureOpen, rescheduleOpen, setRescheduleOpen, generateDayOpen, setGenerateDayOpen,
    rescheduleDismissedOn, dismissReschedule: () => setDismissedOn(todayStr()),
    addSubject, updateSubject, deleteSubject, addTask, addTasks, updateTask, toggleTask, deleteTask,
    addSession, deleteSession, addBlocks, setBlockStatus, removeBlock, applyReschedule,
    addExam, updateExam, deleteExam, toggleExamTopic, addExamTopic, removeExamTopic, generateExamTasks,
    updateProfile, completeOnboarding, loadSample, resetAll, exportJSON, importJSON,
    toasts, addToast, removeToast,
  };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
