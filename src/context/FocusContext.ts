import { createContext, useContext } from 'react';

export interface FocusConfig {
  subjectId: string;
  taskId: string;
  blockId?: string;
  preset: 'pomodoro' | 'long' | 'custom';
  focusMin: number;
  breakMin: number;
}
export interface FocusRun {
  phase: 'focus' | 'break';
  totalMs: number;
  accumMs: number;
  segStart: number | null;
  startedAt?: string;
  plannedMin: number;
  breakMin: number;
  taskId: string;
  subjectId: string;
  blockId?: string;
}
export interface FocusSummary {
  plannedMin: number;
  focusedMin: number;
  taskId: string;
  taskTitle?: string;
  taskEstimate?: number;
  taskFocusedTotal?: number;
  taskCompleted: boolean;
  subjectName?: string;
  breakMin: number;
}
export interface FocusTarget {
  taskId?: string;
  subjectId?: string;
  blockId?: string;
  minutes?: number;
}
export interface FocusApi {
  open: boolean;
  setOpen: (v: boolean) => void;
  openFocus: (target?: FocusTarget) => void;
  config: FocusConfig;
  setConfig: (patch: Partial<FocusConfig>) => void;
  run: FocusRun | null;
  remainingMs: number;
  running: boolean;
  summary: FocusSummary | null;
  start: () => void;
  pause: () => void;
  resume: () => void;
  finish: () => void;
  cancel: () => void;
  startBreak: () => void;
  skipBreak: () => void;
  dismissSummary: () => void;
}
export const FocusContext = createContext<FocusApi | null>(null);
export function useFocus(): FocusApi {
  const ctx = useContext(FocusContext);
  if (!ctx) throw new Error('useFocus must be used inside FocusProvider');
  return ctx;
}
