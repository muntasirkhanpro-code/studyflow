import { useEffect, useEffectEvent, useState, type ReactNode } from 'react';
import { useApp } from './AppContext';
import { FocusContext, type FocusApi, type FocusConfig, type FocusRun, type FocusSummary, type FocusTarget } from './FocusContext';
import { KEYS, readJSON } from '../utils/storage';
import { toDateStr } from '../utils/format';
import { focusedMinutes, remainingMinutes } from '../utils/priority';
import type { SessionType, TaskKind } from '../types';

const KIND_TYPE: Record<TaskKind, SessionType> = { learn: 'Deep Work', practice: 'Practice', revision: 'Revision', mock: 'Exam Prep' };

function loadRun(): FocusRun | null {
  const v = readJSON(KEYS.focus) as Partial<FocusRun> | undefined;
  if (!v || (v.phase !== 'focus' && v.phase !== 'break') || typeof v.totalMs !== 'number' || typeof v.accumMs !== 'number') return null;
  return v as FocusRun;
}
const mmss = (ms: number) => {
  const s = Math.ceil(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

export function FocusProvider({ children }: { children: ReactNode }) {
  const { subjects, tasks, sessions, addSession, setBlockStatus, addToast } = useApp();
  const [open, setOpen] = useState(false);
  const [config, setConfigState] = useState<FocusConfig>({ subjectId: '', taskId: '', preset: 'pomodoro', focusMin: 25, breakMin: 5 });
  const [run, setRun] = useState<FocusRun | null>(loadRun);
  const [summary, setSummary] = useState<FocusSummary | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const running = !!run && run.segStart !== null;
  const elapsed = run ? run.accumMs + (run.segStart !== null ? Math.max(0, now - run.segStart) : 0) : 0;
  const remainingMs = run ? Math.max(0, run.totalMs - elapsed) : 0;

  useEffect(() => {
    try {
      if (run) localStorage.setItem(KEYS.focus, JSON.stringify(run));
      else localStorage.removeItem(KEYS.focus);
    } catch { /* ignore */ }
  }, [run]);
  useEffect(() => {
    if (!run) return;
    document.title = `${running ? '' : 'Paused · '}${mmss(remainingMs)} ${run.phase === 'focus' ? 'Focus' : 'Break'} — StudyFlow`;
    return () => { document.title = 'StudyFlow — Adaptive study planner'; };
  }, [run, running, remainingMs]);

  const setConfig = (patch: Partial<FocusConfig>) => setConfigState((c) => ({ ...c, ...patch }));

  const openFocus = (target?: FocusTarget) => {
    setOpen(true);
    if (run) return;
    setSummary(null);
    const task = target?.taskId ? tasks.find((t) => t.id === target.taskId) : undefined;
    const subjectId = target?.subjectId ?? task?.subjectId ?? (subjects.some((s) => s.id === config.subjectId) ? config.subjectId : subjects[0]?.id ?? '');
    if (target && (task || target.minutes)) {
      const mins = target.minutes ?? (task ? remainingMinutes(task, sessions) : 25);
      setConfigState((c) => ({ ...c, subjectId, taskId: task?.id ?? '', blockId: target.blockId, preset: 'custom', focusMin: Math.min(180, Math.max(5, Math.round(mins))), breakMin: c.breakMin }));
    } else {
      setConfigState((c) => ({ ...c, subjectId, taskId: target?.taskId ?? c.taskId, blockId: target?.blockId }));
    }
  };

  const start = () => {
    const subjectId = config.subjectId || subjects[0]?.id;
    if (!subjectId) {
      addToast('Add a subject first', 'Focus sessions are logged against a subject.', 'warning');
      return;
    }
    const t = Date.now();
    setNow(t);
    setSummary(null);
    setRun({ phase: 'focus', totalMs: config.focusMin * 60000, accumMs: 0, segStart: t, startedAt: new Date(t).toISOString(), plannedMin: config.focusMin, breakMin: config.breakMin, taskId: config.taskId, subjectId, blockId: config.blockId });
  };
  const pause = () => {
    const t = Date.now();
    setRun((r) => (r && r.segStart !== null ? { ...r, accumMs: r.accumMs + (t - r.segStart), segStart: null } : r));
  };
  const resume = () => {
    const t = Date.now();
    setNow(t);
    setRun((r) => (r && r.segStart === null ? { ...r, segStart: t } : r));
  };
  const finish = () => {
    if (!run || run.phase !== 'focus') return;
    const t = Date.now();
    const ms = run.accumMs + (run.segStart !== null ? t - run.segStart : 0);
    const mins = Math.round(ms / 60000);
    setRun(null);
    if (mins < 1) {
      addToast('Session discarded', 'Less than a minute was focused, so nothing was logged.', 'info');
      return;
    }
    const task = tasks.find((x) => x.id === run.taskId);
    addSession({ subjectId: run.subjectId, taskId: task?.id, blockId: run.blockId, date: toDateStr(new Date(run.startedAt ?? t)), durationMinutes: mins, plannedMinutes: run.plannedMin, type: task?.kind ? KIND_TYPE[task.kind] : 'Deep Work', startedAt: run.startedAt });
    if (run.blockId) setBlockStatus(run.blockId, 'done');
    setSummary({
      plannedMin: run.plannedMin,
      focusedMin: mins,
      taskId: run.taskId,
      taskTitle: task?.title,
      taskEstimate: task?.estimatedTime,
      taskFocusedTotal: task ? focusedMinutes(task.id, sessions) + mins : undefined,
      taskCompleted: !!task?.completed,
      subjectName: subjects.find((s) => s.id === run.subjectId)?.name,
      breakMin: run.breakMin,
    });
  };
  const startBreak = () => {
    const brk = summary?.breakMin ?? config.breakMin;
    const t = Date.now();
    setNow(t);
    setSummary(null);
    setRun({ phase: 'break', totalMs: brk * 60000, accumMs: 0, segStart: t, plannedMin: 0, breakMin: brk, taskId: '', subjectId: config.subjectId });
  };
  const endBreak = useEffectEvent(() => {
    setRun(null);
    addToast('Break over', 'Ready for the next focus block?', 'info');
  });
  const expire = useEffectEvent(() => {
    if (run?.phase === 'break') endBreak();
    else {
      finish();
      addToast('Focus session complete', 'Nice work. Open Focus to see your summary.', 'success');
    }
  });
  // Timestamp-based ticking: accurate even if the tab was throttled or the page reloaded.
  const tick = useEffectEvent(() => {
    const t = Date.now();
    setNow(t);
    if (run && run.segStart !== null && run.totalMs - (run.accumMs + t - run.segStart) <= 0) expire();
  });
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => tick(), 250);
    return () => window.clearInterval(id);
  }, [running]);
  const api: FocusApi = {
    open, setOpen, openFocus, config, setConfig, run, remainingMs, running, summary,
    start, pause, resume, finish,
    cancel: () => setRun(null),
    startBreak,
    skipBreak: () => setRun(null),
    dismissSummary: () => setSummary(null),
  };
  return <FocusContext.Provider value={api}>{children}</FocusContext.Provider>;
}
