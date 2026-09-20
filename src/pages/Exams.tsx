import { useState } from 'react';
import { GraduationCap, Pencil, Plus, Trash2, Wand2, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button, IconButton } from '../components/ui/Button';
import { Checkbox, Input } from '../components/ui/Form';
import { EmptyState, PageHeader, ProgressBar, SubjectDot, Surface } from '../components/ui/Display';
import { ExamModal } from '../components/exams/ExamModal';
import { ConfirmModal } from '../components/ui/Confirm';
import { buildExamTasks } from '../utils/examPlan';
import { daysUntil, formatDateLong } from '../utils/format';
import type { Exam } from '../types';

function ExamCard({ exam, onEdit, onDelete }: { exam: Exam; onEdit: () => void; onDelete: () => void }) {
  const app = useApp();
  const [topic, setTopic] = useState('');
  const subject = app.subjects.find((s) => s.id === exam.subjectId);
  const left = daysUntil(exam.date);
  const done = exam.topics.filter((t) => t.completed).length;
  const cov = exam.topics.length ? Math.round((done / exam.topics.length) * 100) : 0;
  const existing = app.tasks.filter((t) => t.examId === exam.id).length;
  const missing = buildExamTasks(exam, app.tasks).length;

  const generate = () => {
    const n = app.generateExamTasks(exam.id);
    app.addToast(n ? `Created ${n} study task${n === 1 ? '' : 's'}` : 'Nothing to add', n ? 'Learn, practice, revise and a mock test, spread before the exam. Schedule them in the Planner.' : 'All study tasks for this exam already exist.', n ? 'success' : 'info', n ? { label: 'Open planner', onClick: () => app.setActivePage('planner') } : undefined);
  };
  const addTopic = (e: React.FormEvent) => { e.preventDefault(); if (topic.trim()) { app.addExamTopic(exam.id, topic.trim()); setTopic(''); } };

  return (
    <Surface className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-fg">{exam.name}</h3>
          <p className="mt-0.5 flex items-center gap-2 text-[13px] text-fg-2"><SubjectDot color={subject?.color} />{subject?.name} · {formatDateLong(exam.date)}</p>
        </div>
        <div className="flex items-center gap-1">
          <p className={`mr-2 text-sm font-semibold ${left < 0 ? 'text-fg-3' : left <= 3 ? 'text-bad' : 'text-fg'}`}>{left < 0 ? 'Finished' : left === 0 ? 'Today' : `${left} day${left === 1 ? '' : 's'} left`}</p>
          <IconButton label={`Edit ${exam.name}`} onClick={onEdit}><Pencil size={16} aria-hidden /></IconButton>
          <IconButton label={`Delete ${exam.name}`} tone="danger" onClick={onDelete}><Trash2 size={16} aria-hidden /></IconButton>
        </div>
      </div>
      <div className="mt-4">
        <div className="mb-1.5 flex justify-between text-[13px] text-fg-2"><span>Coverage</span><span>{exam.topics.length ? `${done} of ${exam.topics.length} topics · ${cov}%` : 'No topics yet'}</span></div>
        <ProgressBar value={cov} label={`${exam.name} topic coverage`} tone="ok" />
      </div>
      <ul className="mt-3 divide-y divide-line-2">
        {exam.topics.map((t) => (
          <li key={t.id} className="group flex items-center gap-3 py-2">
            <Checkbox checked={t.completed} onChange={() => app.toggleExamTopic(exam.id, t.id)} label={`${t.completed ? 'Uncheck' : 'Check'} topic: ${t.name}`} />
            <span className={`flex-1 text-sm ${t.completed ? 'text-fg-3 line-through' : 'text-fg'}`}>{t.name}</span>
            <IconButton label={`Remove topic ${t.name}`} className="md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100" onClick={() => app.removeExamTopic(exam.id, t.id)}><X size={15} aria-hidden /></IconButton>
          </li>
        ))}
      </ul>
      <form onSubmit={addTopic} className="mt-2 flex gap-2"><Input aria-label="Add a topic" placeholder="Add a topic" value={topic} onChange={(e) => setTopic(e.target.value)} maxLength={80} /><Button type="submit" icon={<Plus size={15} aria-hidden />}>Add</Button></form>
      {left >= 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line-2 pt-4">
          <Button variant="primary" icon={<Wand2 size={15} aria-hidden />} onClick={generate} disabled={missing === 0}>{existing ? 'Add missing study tasks' : 'Generate study plan'}</Button>
          <p className="text-[13px] text-fg-3">{missing === 0 ? 'Study tasks already exist for every topic.' : `Creates ${missing} task${missing === 1 ? '' : 's'}: learn, practice, revise and a mock test.`}</p>
        </div>
      )}
    </Surface>
  );
}

export function Exams() {
  const app = useApp();
  const [editing, setEditing] = useState<Exam | null>(null);
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState<Exam | null>(null);
  const sorted = [...app.exams].sort((a, b) => a.date.localeCompare(b.date));
  return (
    <div>
      <PageHeader title="Exams" subtitle="Track topic coverage and generate study tasks that flow into your planner." actions={<Button variant="primary" icon={<Plus size={15} aria-hidden />} onClick={() => { setEditing(null); setOpen(true); }}>New exam</Button>} />
      {sorted.length === 0 ? (
        <Surface><EmptyState icon={GraduationCap} title="No exams yet" description="Add an exam with its topics and StudyFlow will plan learning, practice, revision and a mock test." action={<Button variant="primary" onClick={() => { setEditing(null); setOpen(true); }}>Add exam</Button>} /></Surface>
      ) : (
        <div className="space-y-4">{sorted.map((e) => <ExamCard key={e.id} exam={e} onEdit={() => { setEditing(e); setOpen(true); }} onDelete={() => setDeleting(e)} />)}</div>
      )}
      <ExamModal open={open} exam={editing} onClose={() => setOpen(false)} />
      <ConfirmModal open={!!deleting} danger title="Delete this exam?" confirmLabel="Delete exam" description="The exam and its topic checklist are removed. Study tasks already generated stay in your task list." onConfirm={() => deleting && app.deleteExam(deleting.id)} onClose={() => setDeleting(null)} />
    </div>
  );
}
