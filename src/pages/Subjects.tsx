import { useState } from 'react';
import { BookOpen, Pencil, Plus, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button, IconButton } from '../components/ui/Button';
import { EmptyState, PageHeader, ProgressBar, SubjectDot, Surface, Badge } from '../components/ui/Display';
import { SubjectModal } from '../components/subjects/SubjectModal';
import { ConfirmModal } from '../components/ui/Confirm';
import { daysUntil, formatMinutes, todayStr } from '../utils/format';
import { nextExamFor } from '../utils/priority';
import { subjectMinutes } from '../utils/stats';
import type { Subject } from '../types';

export function Subjects() {
  const app = useApp();
  const { subjects, tasks, exams, sessions } = app;
  const [editing, setEditing] = useState<Subject | null>(null);
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState<Subject | null>(null);
  const mins = subjectMinutes(sessions);

  return (
    <div>
      <PageHeader title="Subjects" subtitle="Everything you're studying, and how much time you've put in." actions={<Button variant="primary" icon={<Plus size={15} aria-hidden />} onClick={() => { setEditing(null); setOpen(true); }}>New subject</Button>} />
      <Surface>
        {subjects.length === 0 ? (
          <EmptyState icon={BookOpen} title="Add your first subject" description="Subjects organise your tasks, exams and focus time." action={<Button variant="primary" onClick={() => { setEditing(null); setOpen(true); }}>Add subject</Button>} />
        ) : (
          <ul className="divide-y divide-line-2">
            {subjects.map((s) => {
              const m = mins.get(s.id) ?? 0;
              const pct = Math.min(100, (m / 60 / s.targetHours) * 100);
              const pending = tasks.filter((t) => t.subjectId === s.id && !t.completed).length;
              const exam = nextExamFor(s.id, exams);
              return (
                <li key={s.id} className="group flex items-center gap-4 px-4 py-4">
                  <SubjectDot color={s.color} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1"><p className="text-sm font-medium text-fg">{s.name}</p><span className="text-[13px] text-fg-3">{s.code}</span><Badge>{s.difficulty}</Badge>{exam && <Badge tone="warn">Exam in {daysUntil(exam.date, todayStr())}d</Badge>}</div>
                    <div className="mt-2 flex items-center gap-3"><div className="max-w-xs flex-1"><ProgressBar value={pct} label={`${s.name} progress toward target hours`} /></div><p className="text-[13px] text-fg-2">{formatMinutes(m)} of {s.targetHours}h · {pending} task{pending === 1 ? '' : 's'} left</p></div>
                  </div>
                  <div className="flex shrink-0 md:opacity-0 md:transition-opacity md:group-focus-within:opacity-100 md:group-hover:opacity-100">
                    <IconButton label={`Edit ${s.name}`} onClick={() => { setEditing(s); setOpen(true); }}><Pencil size={16} aria-hidden /></IconButton>
                    <IconButton label={`Delete ${s.name}`} tone="danger" onClick={() => setDeleting(s)}><Trash2 size={16} aria-hidden /></IconButton>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Surface>
      <SubjectModal open={open} subject={editing} count={subjects.length} onClose={() => setOpen(false)} onSave={(d) => (editing ? app.updateSubject(editing.id, d) : app.addSubject(d))} />
      <ConfirmModal open={!!deleting} danger title={`Delete ${deleting?.name ?? 'subject'}?`} confirmLabel="Delete subject"
        description={deleting ? `This also removes ${tasks.filter((t) => t.subjectId === deleting.id).length} task(s), ${exams.filter((e) => e.subjectId === deleting.id).length} exam(s), planned sessions and ${sessions.filter((x) => x.subjectId === deleting.id).length} logged session(s) for this subject.` : ''}
        onConfirm={() => deleting && app.deleteSubject(deleting.id)} onClose={() => setDeleting(null)} />
    </div>
  );
}
