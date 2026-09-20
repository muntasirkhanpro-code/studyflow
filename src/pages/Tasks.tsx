import { useState } from 'react';
import { ListChecks, Play, Plus, Search } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useFocus } from '../context/FocusContext';
import { Button } from '../components/ui/Button';
import { Input, Segmented, Select } from '../components/ui/Form';
import { EmptyState, PageHeader, Surface } from '../components/ui/Display';
import { TaskRow } from '../components/tasks/TaskRow';
import { addDays, todayStr } from '../utils/format';
import { describeTask, focusedMinutes, recommendNext, scoreTask } from '../utils/priority';

type View = 'active' | 'done' | 'all';
type Sort = 'smart' | 'deadline' | 'priority';
const PW = { High: 3, Medium: 2, Low: 1 } as const;

export function Tasks() {
  const app = useApp();
  const { tasks, subjects, exams, sessions } = app;
  const { openFocus } = useFocus();
  const [view, setView] = useState<View>('active');
  const [q, setQ] = useState('');
  const [subject, setSubject] = useState('');
  const [sort, setSort] = useState<Sort>('smart');
  const ctx = { subjects, exams, sessions };

  const rec = recommendNext(tasks, ctx);
  const list = tasks
    .filter((t) => (view === 'all' ? true : view === 'done' ? t.completed : !t.completed))
    .filter((t) => !subject || t.subjectId === subject)
    .filter((t) => !q.trim() || t.title.toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => (sort === 'smart' ? scoreTask(b, ctx) - scoreTask(a, ctx) : sort === 'deadline' ? a.deadline.localeCompare(b.deadline) : PW[b.priority] - PW[a.priority] || a.deadline.localeCompare(b.deadline)));
  const pendingCount = tasks.filter((t) => !t.completed).length;

  return (
    <div>
      <PageHeader title="Tasks" subtitle={`${pendingCount} to do · ${tasks.length - pendingCount} completed`} actions={<Button variant="primary" icon={<Plus size={15} aria-hidden />} onClick={() => app.openTaskEditor()}>New task</Button>} />

      {rec && view !== 'done' && (
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-line bg-accent-soft px-4 py-3">
          <div className="min-w-0 flex-1"><p className="text-xs font-semibold tracking-wide text-accent-text">RECOMMENDED NEXT</p><p className="mt-0.5 truncate text-sm font-medium text-fg">{rec.title}</p><p className="text-[13px] text-fg-2">{describeTask(rec, ctx)}</p></div>
          <Button variant="primary" size="sm" icon={<Play size={14} aria-hidden />} onClick={() => openFocus({ taskId: rec.id })}>Start</Button>
        </div>
      )}

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Segmented<View> label="Show" value={view} onChange={setView} options={[{ value: 'active', label: 'Active' }, { value: 'done', label: 'Completed' }, { value: 'all', label: 'All' }]} />
        <div className="relative min-w-40 flex-1 sm:max-w-xs">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-3" aria-hidden />
          <Input aria-label="Search tasks" placeholder="Search tasks" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
        <Select aria-label="Filter by subject" value={subject} onChange={(e) => setSubject(e.target.value)} className="w-auto"><option value="">All subjects</option>{subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select>
        <Select aria-label="Sort tasks" value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="w-auto"><option value="smart">Smart order</option><option value="deadline">Deadline</option><option value="priority">Priority</option></Select>
      </div>

      <Surface>
        {list.length === 0 ? (
          tasks.length === 0 ? (
            <EmptyState icon={ListChecks} title="No tasks yet" description="Add your first task, or type it naturally with Quick capture." action={<Button variant="primary" onClick={() => app.openTaskEditor()}>Add task</Button>} />
          ) : view === 'active' && !q && !subject ? (
            <EmptyState icon={ListChecks} title="You're all caught up" description="Nothing needs your attention right now." action={<Button variant="primary" onClick={() => app.openTaskEditor()}>Add task</Button>} />
          ) : (
            <EmptyState icon={Search} title="No tasks match" description="Try a different filter or search term." action={<Button onClick={() => { setQ(''); setSubject(''); setView('all'); }}>Clear filters</Button>} />
          )
        ) : (
          <ul className="divide-y divide-line-2">
            {list.map((t) => (
              <TaskRow key={t.id} task={t} subject={subjects.find((s) => s.id === t.subjectId)} focusedMin={focusedMinutes(t.id, sessions)}
                onToggle={() => app.toggleTask(t.id)} onFocus={() => openFocus({ taskId: t.id })} onEdit={() => app.openTaskEditor(t)} onDelete={() => app.deleteTask(t.id)}
                onMove={() => { app.updateTask(t.id, { deadline: addDays(todayStr(), 1) }); app.addToast('Moved to tomorrow', t.title, 'success'); }} />
            ))}
          </ul>
        )}
      </Surface>
    </div>
  );
}
