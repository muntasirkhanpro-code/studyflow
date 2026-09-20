import { useFocus } from '../../context/FocusContext';
import { formatClock } from '../../utils/format';

/** Compact live clock for the sidebar/topbar while a session runs. */
export function FocusClock() {
  const { run, running, remainingMs } = useFocus();
  if (!run) return null;
  const label = run.phase === 'focus' ? 'Focus' : 'Break';
  return <span className="tabular-nums">{label} {formatClock(remainingMs)}{!running ? ' (paused)' : ''}</span>;
}
