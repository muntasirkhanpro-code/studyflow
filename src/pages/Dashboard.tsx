import { AlertCircle, ArrowRight, CheckCircle2, Play, Sparkles, Zap } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useFocus } from '../context/FocusContext';
import { useNow } from '../hooks/useNow';
import { Button } from '../components/ui/Button';
import { Checkbox } from '../components/ui/Form';
import { EmptyState, PageHeader, PriorityBadge, ProgressBar, Section, SubjectDot, Surface } from '../components/ui/Display';
import { dueClass } from '../components/ui/dueClass';
import { TaskRow } from '../components/tasks/TaskRow';
import { blockEndMs, daysUntil, formatDue, formatMinutes, formatTime, greeting, monthDay, relativeDay, toDateStr, todayStr } from '../utils/format';
import { describeTask, focusedMinutes, rankTasks } from '../utils/priority';
import { findMissed } from '../utils/reschedule';
import { minutesOn } from '../utils/stats';

export function Dashboard() {
  const app = useApp();
  const { tasks, subjects, exams, sessions, blocks, profile } = app;
  const { openFocus } = useFocus();
  const nowMs = useNow(30000);
  const today = todayStr();
  const ctx = { subjects, exams, sessions };
  const subj = (id: string) => subjects.find((s) => s.id === id);

  const todayBlocks = blocks.filter((b) => b.date === today && !b.isBreak && b.status !== 'moved').sort((a, b) => a.startTime.localeCompare(b.startTime));
  const blockTaskIds = new Set(todayBlocks.map((b) => b.taskId));
  const unscheduled = rankTasks(tasks.filter((t) => daysUntil(t.deadline) <= 0 && !blockTaskIds.has(t.id)), ctx);
  const doneToday = tasks.filter((t) => t.completed && t.completedAt && toDateStr(new Date(t.completedAt)) === today && !blockTaskIds.has(t.id));

  const nextBlock = todayBlocks.find((b) => b.status === 'planned' && blockEndMs(b) > nowMs && !tasks.find((t) => t.id === b.taskId)?.completed);
  const nextTask = nextBlock?.taskId ? tasks.find((t) => t.id === nextBlock.taskId) : rankTasks(tasks, ctx)[0];

  const rowsTotal = todayBlocks.length + unscheduled.length + doneToday.length;
  const rowsDone = todayBlocks.filter((b) => b.status === 'done' || tasks.find((t) => t.id === b.taskId)?.completed).length + doneToday.length;
  const pct = rowsTotal ? Math.round((rowsDone / rowsTotal) * 100) : 0;
  const planned = todayBlocks.reduce((a, b) => a + b.durationMinutes, 0) || unscheduled.reduce((a, t) => a + t.estimatedTime, 0);
  const focused = minutesOn(sessions, today);

  const { missedBlocks, overdueTasks } = findMissed({ blocks, tasks }, nowMs);
  const needsAttention = missedBlocks.length + overdueTasks.length;

  const upcoming = [
    ...exams.filter((e) => e.date >= today && daysUntil(e.date) <= 14).map((e) => ({ key: e.id, date: e.date, title: e.name, kind: 'Exam' as const, subjectId: e.subjectId })),
    ...tasks.filter((t) => !t.completed && daysUntil(t.deadline) > 0 && daysUntil(t.deadline) <= 7).map((t) => ({ key: t.id, date: t.deadline, title: t.title, kind: 'Due' as const, subjectId: t.subjectId })),
  ].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 6);

  return (
    <div>
      <PageHeader
        title={greeting(profile.name)}
        subtitle="Here's what needs your attention today."
        actions={<>
          <Button icon={<Zap size={15} aria-hidden />} onClick={() => app.setQuickCaptureOpen(true)}>Quick capture</Button>
          <Button variant="primary" icon={<Sparkles size={15} aria-hidden />} onClick={() => app.setGenerateDayOpen(true)}>Generate my day</Button>
        </>}
      />

      {needsAttention > 0 && app.rescheduleDismissedOn !== today && (
        <div role="region" aria-label="Schedule needs attention" className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-line bg-warn-soft px-4 py-3">
          <AlertCircle size={18} className="shrink-0 text-warn" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-fg">{missedBlocks.length > 0 ? `You missed ${missedBlocks.length} planned session${missedBlocks.length === 1 ? '' : 's'}` : `${overdueTasks.length} task${overdueTasks.length === 1 ? ' is' : 's are'} overdue`}{missedBlocks.length > 0 && overdueTasks.length > 0 ? ` and ${overdueTasks.length} overdue task${overdueTasks.length === 1 ? '' : 's'}` : ''}.</p>
            <p className="text-[13px] text-fg-2">Want StudyFlow to find new times that avoid conflicts and respect deadlines?</p>
          </div>
          <div className="flex gap-2"><Button size="sm" variant="ghost" onClick={app.dismissReschedule}>Ignore</Button><Button size="sm" variant="primary" onClick={() => app.setRescheduleOpen(true)}>Review &amp; reschedule</Button></div>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <Section title="Next up">
            {nextTask ? (
              <Surface className="p-5">
                <p className="text-xs font-semibold tracking-wide text-accent-text">NEXT UP{nextBlock ? ` · ${formatTime(nextBlock.startTime)}` : ''}</p>
                <h3 className="mt-2 text-xl font-semibold text-fg">{nextTask.title}</h3>
                <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-fg-2">
                  <span className="inline-flex items-center gap-1.5"><SubjectDot color={subj(nextTask.subjectId)?.color} />{subj(nextTask.subjectId)?.name}</span>
                  <span>·</span><span>{formatMinutes(nextBlock?.durationMinutes ?? nextTask.estimatedTime)}</span><span>·</span><PriorityBadge priority={nextTask.priority} />
                </p>
                <p className="mt-2 text-[13px] text-fg-3">{describeTask(nextTask, ctx)}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="primary" icon={<Play size={15} aria-hidden />} onClick={() => openFocus({ taskId: nextTask.id, blockId: nextBlock?.id, minutes: nextBlock?.durationMinutes })}>Start focus session</Button>
                  <Button onClick={() => app.toggleTask(nextTask.id)}>Mark complete</Button>
                </div>
              </Surface>
            ) : (
              <Surface><EmptyState icon={CheckCircle2} title="You're all caught up" description="Nothing needs your attention right now. Add a task or plan ahead." action={<Button variant="primary" onClick={() => app.openTaskEditor()}>Add task</Button>} /></Surface>
            )}
          </Section>

          <Section title="Today's focus" action={<Button variant="ghost" size="sm" onClick={() => app.setActivePage('planner')} icon={<ArrowRight size={14} aria-hidden />}>Planner</Button>}>
            {rowsTotal === 0 ? (
              <Surface><EmptyState icon={Sparkles} title="Nothing planned for today" description="Generate a plan from your tasks and deadlines, or add something to work on." action={<Button variant="primary" onClick={() => app.setGenerateDayOpen(true)}>Generate my day</Button>} /></Surface>
            ) : (
              <Surface>
                <ul className="divide-y divide-line-2">
                  {todayBlocks.map((b) => {
                    const t = tasks.find((x) => x.id === b.taskId);
                    if (t) return <TaskRow key={b.id} task={t} subject={subj(t.subjectId)} focusedMin={focusedMinutes(t.id, sessions)} time={formatTime(b.startTime)} hideDue onToggle={() => app.toggleTask(t.id)} onFocus={() => openFocus({ taskId: t.id, blockId: b.id, minutes: b.durationMinutes })} />;
                    const done = b.status === 'done';
                    return (
                      <li key={b.id} className="flex items-start gap-3 px-4 py-3">
                        <div className="pt-0.5"><Checkbox checked={done} onChange={() => app.setBlockStatus(b.id, done ? 'planned' : 'done')} label={`Mark ${done ? 'not done' : 'done'}: ${b.title}`} /></div>
                        <div className="min-w-0 flex-1"><p className={`text-sm font-medium ${done ? 'text-fg-3 line-through' : 'text-fg'}`}>{b.title}</p><p className="text-[13px] text-fg-2"><span className="font-medium text-fg">{formatTime(b.startTime)}</span> · {formatMinutes(b.durationMinutes)}{b.note ? ` · ${b.note}` : ''}</p></div>
                      </li>
                    );
                  })}
                  {unscheduled.map((t) => <TaskRow key={t.id} task={t} subject={subj(t.subjectId)} focusedMin={focusedMinutes(t.id, sessions)} onToggle={() => app.toggleTask(t.id)} onFocus={() => openFocus({ taskId: t.id })} />)}
                  {doneToday.map((t) => <TaskRow key={t.id} task={t} subject={subj(t.subjectId)} onToggle={() => app.toggleTask(t.id)} />)}
                </ul>
              </Surface>
            )}
          </Section>
        </div>

        <div className="space-y-8">
          <Section title="Today's progress">
            <div className="space-y-3">
              <div className="flex items-end justify-between"><p className="text-3xl font-semibold tabular-nums text-fg">{pct}%</p><p className="pb-1 text-[13px] text-fg-2">{rowsDone} of {rowsTotal} done</p></div>
              <ProgressBar value={pct} label="Today's completion" tone="ok" />
              <dl className="grid grid-cols-2 gap-3 pt-1 text-[13px]">
                <div><dt className="text-fg-3">Planned</dt><dd className="text-sm font-medium text-fg">{planned ? formatMinutes(planned) : '—'}</dd></div>
                <div><dt className="text-fg-3">Focused</dt><dd className="text-sm font-medium text-fg">{focused ? formatMinutes(focused) : '—'}</dd></div>
              </dl>
            </div>
          </Section>

          <Section title="Upcoming">
            {upcoming.length === 0 ? <p className="text-sm text-fg-2">No deadlines or exams in the next week.</p> : (
              <ul className="divide-y divide-line-2 border-y border-line-2">
                {upcoming.map((u) => (
                  <li key={u.key} className="flex items-center gap-3 py-2.5">
                    <div className="w-12 shrink-0 text-[13px]"><p className="font-medium text-fg">{relativeDay(u.date)}</p><p className="text-fg-3">{monthDay(u.date)}</p></div>
                    <div className="min-w-0 flex-1"><p className="truncate text-sm text-fg">{u.title}</p><p className={`text-[13px] ${u.kind === 'Exam' ? 'font-medium text-warn' : dueClass(formatDue(u.date).tone)}`}>{u.kind === 'Exam' ? 'Exam' : 'Deadline'}{subj(u.subjectId) ? ` · ${subj(u.subjectId)?.code}` : ''}</p></div>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}
