import { useState } from 'react';
import { ChevronLeft, ChevronRight, GraduationCap, Plus, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useFocus } from '../context/FocusContext';
import { useNow } from '../hooks/useNow';
import { Button, IconButton } from '../components/ui/Button';
import { Badge, PageHeader, Section, Surface } from '../components/ui/Display';
import { TaskRow } from '../components/tasks/TaskRow';
import { BlockList } from '../components/planner/BlockList';
import { formatDateLong, parseDate, toDateStr, todayStr } from '../utils/format';
import { focusedMinutes } from '../utils/priority';

const WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function Calendar() {
  const app = useApp();
  const { tasks, subjects, exams, sessions, blocks } = app;
  const { openFocus } = useFocus();
  const nowMs = useNow(60000);
  const today = todayStr();
  const [selected, setSelected] = useState(today);
  const [cursor, setCursor] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const lead = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = [...Array(lead).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => toDateStr(new Date(year, month, i + 1)))];
  while (cells.length % 7) cells.push(null);

  const info = (date: string) => ({
    due: tasks.filter((t) => !t.completed && t.deadline === date).length,
    plan: blocks.filter((b) => b.date === date && !b.isBreak && b.status !== 'moved').length,
    exam: exams.filter((e) => e.date === date).length,
    done: sessions.filter((s) => s.date === date).length,
  });

  const selBlocks = blocks.filter((b) => b.date === selected && b.status !== 'moved');
  const selDue = tasks.filter((t) => t.deadline === selected);
  const selExams = exams.filter((e) => e.date === selected);
  const selSessions = sessions.filter((s) => s.date === selected);
  const nothing = selBlocks.length === 0 && selDue.length === 0 && selExams.length === 0 && selSessions.length === 0;
  const shift = (n: number) => setCursor(new Date(year, month + n, 1));

  return (
    <div>
      <PageHeader title="Calendar" subtitle="Deadlines, exams, planned sessions and completed focus time in one place." />
      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-fg">{cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2>
            <div className="flex items-center gap-1">
              <IconButton label="Previous month" onClick={() => shift(-1)}><ChevronLeft size={18} aria-hidden /></IconButton>
              <Button size="sm" variant="ghost" onClick={() => { setCursor(new Date(parseDate(today).getFullYear(), parseDate(today).getMonth(), 1)); setSelected(today); }}>Today</Button>
              <IconButton label="Next month" onClick={() => shift(1)}><ChevronRight size={18} aria-hidden /></IconButton>
            </div>
          </div>
          <Surface className="overflow-hidden">
            <div className="grid grid-cols-7 border-b border-line-2 bg-bg-2/60 text-center text-xs font-medium text-fg-3">{WEEK.map((d) => <div key={d} className="py-2">{d}</div>)}</div>
            <div className="grid grid-cols-7">
              {cells.map((date, i) => {
                if (!date) return <div key={i} className="min-h-14 border-b border-r border-line-2 bg-bg-2/30 sm:min-h-20" />;
                const n = info(date);
                const isSel = date === selected;
                const label = `${formatDateLong(date)}${n.exam ? `, ${n.exam} exam` : ''}${n.due ? `, ${n.due} due` : ''}${n.plan ? `, ${n.plan} planned` : ''}`;
                return (
                  <button key={date} type="button" aria-label={label} aria-pressed={isSel} aria-current={date === today ? 'date' : undefined} onClick={() => setSelected(date)}
                    className={`flex min-h-14 flex-col items-start gap-1 border-b border-r border-line-2 p-1.5 text-left transition-colors duration-200 sm:min-h-20 sm:p-2 ${isSel ? 'bg-accent-soft' : 'hover:bg-hover'}`}>
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[13px] ${date === today ? 'bg-accent font-semibold text-on-accent' : 'text-fg'}`}>{Number(date.slice(8))}</span>
                    <span className="flex flex-wrap gap-1" aria-hidden>
                      {n.exam > 0 && <span className="h-1.5 w-1.5 rounded-full bg-warn" />}
                      {n.due > 0 && <span className="h-1.5 w-1.5 rounded-full bg-fg-3" />}
                      {n.plan > 0 && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
                      {n.done > 0 && <span className="h-1.5 w-1.5 rounded-full bg-ok" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </Surface>
          <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-fg-3">
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-warn" />Exam</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-fg-3" />Task due</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-accent" />Planned</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-ok" />Studied</span>
          </p>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <Section title={formatDateLong(selected)} action={<div className="flex gap-1"><Button size="sm" icon={<Sparkles size={14} aria-hidden />} onClick={() => { app.setPlanDate(selected); app.setActivePage('planner'); }}>Plan</Button><Button size="sm" icon={<Plus size={14} aria-hidden />} onClick={() => app.openTaskEditor(null, { deadline: selected })}>Task</Button></div>}>
            {nothing ? <p className="text-sm text-fg-2">Nothing scheduled. Use Plan to build a schedule for this day.</p> : (
              <div className="space-y-5">
                {selExams.length > 0 && (
                  <ul className="space-y-2">{selExams.map((e) => <li key={e.id} className="flex items-center gap-2 rounded-lg bg-warn-soft px-3 py-2 text-sm text-fg"><GraduationCap size={16} className="text-warn" aria-hidden /><span className="flex-1">{e.name}</span><Badge tone="warn">Exam</Badge></li>)}</ul>
                )}
                {selBlocks.some((b) => !b.isBreak) && (
                  <div><h3 className="mb-1.5 text-[13px] font-semibold text-fg-2">Planned sessions</h3><Surface><BlockList blocks={selBlocks} subjects={subjects} tasks={tasks} nowMs={nowMs} onStart={(b) => openFocus({ taskId: b.taskId, subjectId: b.subjectId, blockId: b.id, minutes: b.durationMinutes })} onDone={(b) => app.setBlockStatus(b.id, 'done')} onRemove={(b) => app.removeBlock(b.id)} /></Surface></div>
                )}
                {selDue.length > 0 && (
                  <div><h3 className="mb-1.5 text-[13px] font-semibold text-fg-2">Due</h3><Surface><ul className="divide-y divide-line-2">{selDue.map((t) => <TaskRow key={t.id} task={t} subject={subjects.find((s) => s.id === t.subjectId)} focusedMin={focusedMinutes(t.id, sessions)} hideDue onToggle={() => app.toggleTask(t.id)} onFocus={() => openFocus({ taskId: t.id })} onEdit={() => app.openTaskEditor(t)} />)}</ul></Surface></div>
                )}
                {selSessions.length > 0 && (
                  <div><h3 className="mb-1.5 text-[13px] font-semibold text-fg-2">Studied</h3>
                    <ul className="space-y-1 text-[13px] text-fg-2">{selSessions.map((s) => <li key={s.id} className="flex justify-between"><span>{tasks.find((t) => t.id === s.taskId)?.title ?? subjects.find((x) => x.id === s.subjectId)?.name}</span><span className="tabular-nums">{s.durationMinutes} min</span></li>)}</ul>
                  </div>
                )}
              </div>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}
