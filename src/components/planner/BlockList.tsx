import { Check, Play, X } from 'lucide-react';
import type { PlannedBlock, Subject, Task } from '../../types';
import { Badge, SubjectDot } from '../ui/Display';
import { IconButton } from '../ui/Button';
import { blockStartMs, formatMinutes, formatTime, minutesToTime, timeToMinutes } from '../../utils/format';

interface Props {
  blocks: PlannedBlock[];
  subjects: Subject[];
  tasks: Task[];
  nowMs: number;
  onStart: (b: PlannedBlock) => void;
  onDone: (b: PlannedBlock) => void;
  onRemove: (b: PlannedBlock) => void;
}
export function BlockList({ blocks, subjects, tasks, nowMs, onStart, onDone, onRemove }: Props) {
  const list = blocks.filter((b) => b.status !== 'moved').sort((a, b) => a.startTime.localeCompare(b.startTime));
  return (
    <ul className="divide-y divide-line-2">
      {list.map((b) => {
        const end = minutesToTime(timeToMinutes(b.startTime) + b.durationMinutes);
        if (b.isBreak) {
          return (
            <li key={b.id} className="flex items-center gap-3 px-4 py-2 text-[13px] text-fg-3">
              <span className="w-28 shrink-0 tabular-nums">{formatTime(b.startTime)}</span>
              <span>Break · {formatMinutes(b.durationMinutes)}{b.note ? ` — ${b.note}` : ''}</span>
            </li>
          );
        }
        const sub = subjects.find((s) => s.id === b.subjectId);
        const task = tasks.find((t) => t.id === b.taskId);
        const done = b.status === 'done' || !!task?.completed;
        const missed = !done && blockStartMs(b) + b.durationMinutes * 60000 < nowMs;
        return (
          <li key={b.id} className="flex items-start gap-3 px-4 py-3">
            <div className="w-28 shrink-0 pt-0.5 text-[13px] tabular-nums text-fg-2">
              <span className="font-medium text-fg">{formatTime(b.startTime)}</span>
              <span className="block text-fg-3">to {formatTime(end)}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-medium ${done ? 'text-fg-3 line-through' : 'text-fg'}`}>{b.title}</p>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-fg-2">
                {sub && <span className="inline-flex items-center gap-1.5"><SubjectDot color={sub.color} />{sub.code || sub.name}</span>}
                <span>{formatMinutes(b.durationMinutes)}</span>
                {done && <Badge tone="ok">Done</Badge>}
                {missed && <Badge tone="bad">Missed</Badge>}
                {b.source === 'reschedule' && !done && !missed && <Badge tone="accent">Rescheduled</Badge>}
              </p>
              {b.note && !done && <p className="mt-0.5 text-[13px] text-fg-3">{b.note}</p>}
            </div>
            <div className="flex shrink-0 items-center">
              {!done && <IconButton label={`Start focus: ${b.title}`} onClick={() => onStart(b)}><Play size={16} aria-hidden /></IconButton>}
              {!done && <IconButton label={`Mark done: ${b.title}`} onClick={() => onDone(b)}><Check size={16} aria-hidden /></IconButton>}
              <IconButton label={`Remove from schedule: ${b.title}`} tone="danger" onClick={() => onRemove(b)}><X size={16} aria-hidden /></IconButton>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
