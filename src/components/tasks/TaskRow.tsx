import { CalendarClock, Pencil, Play, Trash2 } from 'lucide-react';
import type { Subject, Task } from '../../types';
import { Checkbox } from '../ui/Form';
import { IconButton } from '../ui/Button';
import { PriorityBadge, SubjectDot } from '../ui/Display';
import { dueClass } from '../ui/dueClass';
import { formatDue, formatMinutes } from '../../utils/format';

interface Props {
  task: Task;
  subject?: Subject;
  focusedMin?: number;
  time?: string;
  hideDue?: boolean;
  onToggle: () => void;
  onFocus?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onMove?: () => void;
}
export function TaskRow({ task, subject, focusedMin = 0, time, hideDue, onToggle, onFocus, onEdit, onDelete, onMove }: Props) {
  const due = formatDue(task.deadline);
  const done = task.completed;
  return (
    <li className="group flex items-start gap-3 px-4 py-3 transition-colors duration-200 hover:bg-hover/60">
      <div className="pt-0.5"><Checkbox checked={done} onChange={onToggle} label={`${done ? 'Mark incomplete' : 'Mark complete'}: ${task.title}`} /></div>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium ${done ? 'text-fg-3 line-through' : 'text-fg'}`}>{task.title}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px] text-fg-2">
          {time && <span className="font-medium text-fg">{time}</span>}
          {subject && <span className="inline-flex items-center gap-1.5"><SubjectDot color={subject.color} />{subject.code || subject.name}</span>}
          <span>{formatMinutes(task.estimatedTime)}</span>
          {focusedMin > 0 && !done && <span className="text-accent-text">{formatMinutes(focusedMin)} focused</span>}
          {!hideDue && !done && <span className={dueClass(due.tone)}>{due.label}</span>}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {!done && <PriorityBadge priority={task.priority} />}
        <div className="flex items-center md:opacity-0 md:transition-opacity md:group-focus-within:opacity-100 md:group-hover:opacity-100">
          {!done && onFocus && <IconButton label={`Start focus session: ${task.title}`} onClick={onFocus}><Play size={16} aria-hidden /></IconButton>}
          {!done && onMove && <IconButton label={`Move to tomorrow: ${task.title}`} onClick={onMove}><CalendarClock size={16} aria-hidden /></IconButton>}
          {onEdit && <IconButton label={`Edit: ${task.title}`} onClick={onEdit}><Pencil size={16} aria-hidden /></IconButton>}
          {onDelete && <IconButton label={`Delete: ${task.title}`} tone="danger" onClick={onDelete}><Trash2 size={16} aria-hidden /></IconButton>}
        </div>
      </div>
    </li>
  );
}
