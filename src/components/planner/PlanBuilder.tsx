import { useState } from 'react';
import { ListChecks, Play, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useFocus } from '../../context/FocusContext';
import { useNow } from '../../hooks/useNow';
import { Button } from '../ui/Button';
import { Chip, Field, Input, Segmented, Select } from '../ui/Form';
import { EmptyState, SubjectDot } from '../ui/Display';
import { buildPlan, type Bias, type PlanResult } from '../../utils/scheduler';
import { ceilTo, formatMinutes, formatTime, minutesNow, minutesToTime, timeToMinutes, todayStr } from '../../utils/format';

function defaultStart(date: string): string {
  if (date !== todayStr()) return '09:00';
  const m = ceilTo(minutesNow() + 1, 15);
  return minutesToTime(Math.min(m, 23 * 60));
}
const PACES = { '25/5': [25, 5], '50/10': [50, 10], '60/15': [60, 15] } as const;

export function PlanBuilder({ fixedDate, compact, onSaved }: { fixedDate?: string; compact?: boolean; onSaved?: () => void }) {
  const { tasks, subjects, exams, sessions, blocks, profile, planDate, setPlanDate, addBlocks, addToast, setActivePage } = useApp();
  const { openFocus } = useFocus();
  const nowMs = useNow(60000);
  const [date, setDate] = useState(fixedDate ?? planDate);
  const [start, setStart] = useState(() => defaultStart(fixedDate ?? planDate));
  const [hours, setHours] = useState(() => String(Math.min(4, Math.max(1, Math.round(profile.dailyGoalHours * 2) / 2))));
  const [pace, setPace] = useState<keyof typeof PACES>('50/10');
  const [subjectIds, setSubjectIds] = useState<string[]>([]);
  const [bias, setBias] = useState<Bias>('balanced');
  const [preview, setPreview] = useState<PlanResult | null>(null);
  const [error, setError] = useState('');

  const pending = tasks.filter((t) => !t.completed);

  const generate = () => {
    const h = Number(hours);
    if (!Number.isFinite(h) || h < 0.5 || h > 12) return setError('Available time should be between 0.5 and 12 hours.');
    setError('');
    setPreview(buildPlan({ date, nowMs, startMinutes: timeToMinutes(start), windowMinutes: Math.round(h * 60), focusMin: PACES[pace][0], breakMin: PACES[pace][1], subjectIds, bias }, { tasks, subjects, exams, sessions, blocks }));
  };
  const save = (startFirst: boolean) => {
    if (!preview || preview.blocks.length === 0) return;
    addBlocks(preview.blocks);
    setPlanDate(date);
    const first = preview.blocks.find((b) => !b.isBreak);
    addToast('Plan added to your schedule', preview.summary, 'success');
    setPreview(null);
    onSaved?.();
    if (startFirst && first) openFocus({ taskId: first.taskId, subjectId: first.subjectId, blockId: first.id, minutes: first.durationMinutes });
    else if (compact) setActivePage('planner');
  };

  if (pending.length === 0 && exams.length === 0) {
    return <EmptyState icon={ListChecks} title="Nothing to plan yet" description="Add a task with a due date and StudyFlow will turn your workload into a realistic schedule." action={<Button variant="primary" onClick={() => setActivePage('tasks')}>Go to tasks</Button>} />;
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {!fixedDate && <Field label="Date">{(id) => <Input id={id} type="date" value={date} onChange={(e) => { setDate(e.target.value); setStart(defaultStart(e.target.value)); setPreview(null); }} />}</Field>}
        <Field label="Start time">{(id) => <Input id={id} type="time" value={start} onChange={(e) => { setStart(e.target.value); setPreview(null); }} />}</Field>
        <Field label="Time available">{(id) => (
          <Select id={id} value={hours} onChange={(e) => { setHours(e.target.value); setPreview(null); }}>
            {['0.5', '1', '1.5', '2', '3', '4', '6'].map((h) => <option key={h} value={h}>{h === '0.5' ? '30 minutes' : `${h} hour${h === '1' ? '' : 's'}`}</option>)}
          </Select>
        )}</Field>
        <Field label="Pace" className={fixedDate ? '' : 'sm:col-span-1'}>{(id) => (
          <Select id={id} value={pace} onChange={(e) => { setPace(e.target.value as keyof typeof PACES); setPreview(null); }}>
            <option value="25/5">Pomodoro · 25 focus / 5 break</option>
            <option value="50/10">Deep · 50 focus / 10 break</option>
            <option value="60/15">Long · 60 focus / 15 break</option>
          </Select>
        )}</Field>
      </div>
      {!compact && (
        <>
          <div>
            <span className="mb-1.5 block text-[13px] font-medium text-fg-2">Subjects <span className="font-normal text-fg-3">(none selected = all)</span></span>
            <div className="flex flex-wrap gap-2">
              {subjects.map((s) => <Chip key={s.id} active={subjectIds.includes(s.id)} onClick={() => { setSubjectIds((p) => (p.includes(s.id) ? p.filter((x) => x !== s.id) : [...p, s.id])); setPreview(null); }}>{s.code || s.name}</Chip>)}
            </div>
          </div>
          <div>
            <span className="mb-1.5 block text-[13px] font-medium text-fg-2">Prioritise</span>
            <Segmented<Bias> label="Prioritise" value={bias} onChange={(v) => { setBias(v); setPreview(null); }} options={[{ value: 'balanced', label: 'Balanced' }, { value: 'deadline', label: 'Deadlines' }, { value: 'exam', label: 'Exams' }, { value: 'difficulty', label: 'Hard subjects' }]} />
          </div>
        </>
      )}
      {error && <p role="alert" className="text-[13px] text-bad">{error}</p>}
      <Button variant="primary" icon={<Sparkles size={15} aria-hidden />} onClick={generate}>{preview ? 'Regenerate plan' : 'Generate plan'}</Button>

      {preview && (
        <div className="animate-pop rounded-xl border border-line bg-bg-2/50">
          <div className="border-b border-line-2 px-4 py-3">
            <p className="text-sm font-semibold text-fg">Suggested plan</p>
            <p className="text-[13px] text-fg-2">{preview.summary}. This is a preview and nothing is saved yet.</p>
          </div>
          {preview.blocks.length === 0 ? (
            <p className="px-4 py-6 text-sm text-fg-2">No free time fits in this window. Try a longer window, an earlier start, or a different date.</p>
          ) : (
            <ul className="divide-y divide-line-2">
              {preview.blocks.map((b) => {
                const sub = subjects.find((s) => s.id === b.subjectId);
                return b.isBreak ? (
                  <li key={b.id} className="flex gap-3 px-4 py-2 text-[13px] text-fg-3"><span className="w-20 shrink-0 tabular-nums">{formatTime(b.startTime)}</span>Break · {formatMinutes(b.durationMinutes)}</li>
                ) : (
                  <li key={b.id} className="flex gap-3 px-4 py-2.5">
                    <span className="w-20 shrink-0 text-[13px] font-medium tabular-nums text-fg">{formatTime(b.startTime)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-fg">{b.title}</p>
                      <p className="flex flex-wrap items-center gap-x-2 text-[13px] text-fg-2">{sub && <span className="inline-flex items-center gap-1.5"><SubjectDot color={sub.color} />{sub.code || sub.name}</span>}<span>{formatMinutes(b.durationMinutes)}</span></p>
                      {b.note && <p className="text-[13px] text-fg-3">Why: {b.note}</p>}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {preview.unplaced.length > 0 && <p className="border-t border-line-2 px-4 py-3 text-[13px] text-warn">Didn't fit: {preview.unplaced.map((t) => t.title).join(', ')}. Add more time or move them to another day.</p>}
          {preview.blocks.length > 0 && (
            <div className="flex flex-wrap gap-2 border-t border-line-2 px-4 py-3">
              <Button variant="primary" onClick={() => save(false)}>Add to my schedule</Button>
              <Button icon={<Play size={14} aria-hidden />} onClick={() => save(true)}>Add &amp; start first session</Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
