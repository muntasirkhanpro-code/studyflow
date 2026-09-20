import { useState } from 'react';
import { Coffee, Pause, Play, Square, Timer, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useFocus } from '../../context/FocusContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Field, Input, Segmented, Select } from '../ui/Form';
import { ProgressBar, SubjectDot } from '../ui/Display';
import { formatMinutes, formatTime, todayStr } from '../../utils/format';

const mmss = (ms: number) => {
  const s = Math.ceil(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

export function FocusModal() {
  const f = useFocus();
  const { subjects, tasks, sessions, toggleTask } = useApp();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const { run, summary, config } = f;

  const subject = subjects.find((s) => s.id === (run?.subjectId ?? config.subjectId));
  const task = tasks.find((t) => t.id === (run?.taskId ?? config.taskId));
  const today = sessions.filter((s) => s.date === todayStr()).slice(-5).reverse();
  const total = run ? run.totalMs : config.focusMin * 60000;
  const pct = run ? ((total - f.remainingMs) / total) * 100 : 0;

  const timer = (
    <div className="py-6 text-center">
      <p className="mb-1 text-[13px] font-medium uppercase tracking-wide text-fg-3">{run ? (run.phase === 'break' ? 'Break' : f.running ? 'Focusing' : 'Paused') : 'Ready'}</p>
      <p className="text-6xl font-semibold tabular-nums tracking-tight text-fg sm:text-7xl" aria-live="off">{run ? mmss(f.remainingMs) : mmss(config.focusMin * 60000)}</p>
      {run && <div className="mx-auto mt-5 max-w-xs"><ProgressBar value={pct} label="Session progress" /></div>}
    </div>
  );

  let body;
  if (summary) {
    const under = summary.focusedMin < summary.plannedMin;
    body = (
      <div className="py-2 text-center">
        <h3 className="text-lg font-semibold text-fg">Session complete</h3>
        <p className="mt-1 text-sm text-fg-2">{summary.taskTitle ?? summary.subjectName}</p>
        <dl className="mx-auto mt-5 grid max-w-xs grid-cols-2 gap-3 text-left">
          <div className="rounded-lg bg-bg-2 p-3"><dt className="text-xs text-fg-3">Planned</dt><dd className="text-lg font-semibold text-fg">{formatMinutes(summary.plannedMin)}</dd></div>
          <div className="rounded-lg bg-bg-2 p-3"><dt className="text-xs text-fg-3">Focused</dt><dd className="text-lg font-semibold text-fg">{formatMinutes(summary.focusedMin)}</dd></div>
        </dl>
        {summary.taskEstimate && summary.taskFocusedTotal !== undefined && (
          <div className="mx-auto mt-4 max-w-xs text-left">
            <p className="mb-1.5 text-[13px] text-fg-2">Task progress: {formatMinutes(summary.taskFocusedTotal)} of {formatMinutes(summary.taskEstimate)}</p>
            <ProgressBar value={(summary.taskFocusedTotal / summary.taskEstimate) * 100} label="Task progress" tone="ok" />
          </div>
        )}
        {under && <p className="mt-3 text-[13px] text-fg-3">You finished a little early. That still counts.</p>}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {summary.taskId && !summary.taskCompleted && <Button variant="primary" onClick={() => { toggleTask(summary.taskId); f.dismissSummary(); }}>Mark task complete</Button>}
          <Button icon={<Coffee size={15} aria-hidden />} onClick={f.startBreak}>Start {summary.breakMin}-min break</Button>
          <Button variant="ghost" onClick={f.dismissSummary}>Done</Button>
        </div>
      </div>
    );
  } else if (run) {
    body = (
      <div>
        <p className="text-center text-sm text-fg-2">
          {run.phase === 'break' ? 'Step away for a moment. Your next block is waiting.' : (
            <span className="inline-flex items-center gap-2">{subject && <SubjectDot color={subject.color} />}<span className="font-medium text-fg">{task?.title ?? subject?.name}</span></span>
          )}
        </p>
        {timer}
        <div className="flex flex-wrap justify-center gap-2">
          {run.phase === 'focus' ? (
            <>
              {f.running ? <Button size="lg" icon={<Pause size={16} aria-hidden />} onClick={f.pause}>Pause</Button> : <Button size="lg" variant="primary" icon={<Play size={16} aria-hidden />} onClick={f.resume}>Resume</Button>}
              <Button size="lg" variant="primary" icon={<Square size={14} aria-hidden />} onClick={f.finish}>Finish</Button>
              {confirmCancel ? (
                <Button size="lg" variant="danger" onClick={() => { f.cancel(); setConfirmCancel(false); }}>Discard session?</Button>
              ) : (
                <Button size="lg" variant="ghost" icon={<X size={15} aria-hidden />} onClick={() => setConfirmCancel(true)}>Cancel</Button>
              )}
            </>
          ) : (
            <Button size="lg" onClick={f.skipBreak}>Skip break</Button>
          )}
        </div>
      </div>
    );
  } else {
    const subjectTasks = tasks.filter((t) => !t.completed && (!config.subjectId || t.subjectId === config.subjectId));
    body = (
      <div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Subject">{(id) => (
            <Select id={id} value={config.subjectId} onChange={(e) => f.setConfig({ subjectId: e.target.value, taskId: '', blockId: undefined })}>
              {subjects.length === 0 && <option value="">No subjects yet</option>}
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          )}</Field>
          <Field label="Task (optional)">{(id) => (
            <Select id={id} value={config.taskId} onChange={(e) => { const t = tasks.find((x) => x.id === e.target.value); f.setConfig({ taskId: e.target.value, blockId: undefined, subjectId: t?.subjectId ?? config.subjectId }); }}>
              <option value="">No specific task</option>
              {subjectTasks.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
            </Select>
          )}</Field>
        </div>
        <div className="mt-4">
          <Segmented<'pomodoro' | 'long' | 'custom'> label="Session length" value={config.preset} onChange={(v) => f.setConfig(v === 'pomodoro' ? { preset: v, focusMin: 25, breakMin: 5 } : v === 'long' ? { preset: v, focusMin: 50, breakMin: 10 } : { preset: v })} options={[{ value: 'pomodoro', label: '25 / 5' }, { value: 'long', label: '50 / 10' }, { value: 'custom', label: 'Custom' }]} />
        </div>
        {config.preset === 'custom' && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Field label="Focus (minutes)">{(id) => <Input id={id} type="number" inputMode="numeric" min={5} max={180} value={config.focusMin} onChange={(e) => f.setConfig({ focusMin: Math.min(180, Math.max(1, Number(e.target.value) || 1)) })} />}</Field>
            <Field label="Break (minutes)">{(id) => <Input id={id} type="number" inputMode="numeric" min={1} max={60} value={config.breakMin} onChange={(e) => f.setConfig({ breakMin: Math.min(60, Math.max(1, Number(e.target.value) || 1)) })} />}</Field>
          </div>
        )}
        {timer}
        <div className="flex justify-center"><Button size="lg" variant="primary" icon={<Play size={16} aria-hidden />} onClick={f.start} disabled={subjects.length === 0}>Start focus session</Button></div>
        <div className="mt-8 border-t border-line-2 pt-4">
          <h3 className="mb-2 text-[13px] font-semibold text-fg-2">Today's sessions</h3>
          {today.length === 0 ? <p className="text-[13px] text-fg-3">Nothing logged yet today. Your first session will show up here.</p> : (
            <ul className="space-y-1.5">
              {today.map((s) => {
                const sub = subjects.find((x) => x.id === s.subjectId);
                const t = tasks.find((x) => x.id === s.taskId);
                return (
                  <li key={s.id} className="flex items-center gap-2 text-[13px]">
                    <SubjectDot color={sub?.color} />
                    <span className="min-w-0 flex-1 truncate text-fg">{t?.title ?? sub?.name ?? 'Session'}</span>
                    {s.startedAt && <span className="text-fg-3">{formatTime(`${String(new Date(s.startedAt).getHours()).padStart(2, '0')}:${String(new Date(s.startedAt).getMinutes()).padStart(2, '0')}`)}</span>}
                    <span className="tabular-nums text-fg-2">{formatMinutes(s.durationMinutes)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    );
  }

  return (
    <Modal open={f.open} onClose={() => { setConfirmCancel(false); f.setOpen(false); }} title="Focus mode" subtitle={run ? 'Closing this window keeps your timer running.' : 'One task, no distractions.'} size="md">
      {body}
      {!run && !summary && subjects.length === 0 && <p className="mt-3 flex items-center justify-center gap-1.5 text-[13px] text-fg-3"><Timer size={14} aria-hidden />Add a subject to start tracking focus time.</p>}
    </Modal>
  );
}
