import { useMemo, useState } from 'react';
import { BookOpen } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Field, Input, Segmented, Select } from '../ui/Form';
import { Badge, EmptyState } from '../ui/Display';
import { parseQuickCapture } from '../../utils/quickCapture';
import { todayStr } from '../../utils/format';
import type { Priority } from '../../types';

interface Edits { title?: string; subjectId?: string; deadline?: string; duration?: number; priority?: Priority }

function Body({ onClose }: { onClose: () => void }) {
  const { subjects, addTask, setActivePage } = useApp();
  const [text, setText] = useState('');
  const [edits, setEdits] = useState<Edits>({});
  const parsed = useMemo(() => parseQuickCapture(text, subjects, todayStr()), [text, subjects]);
  const v = {
    title: edits.title ?? parsed.title,
    subjectId: edits.subjectId ?? parsed.subjectId ?? '',
    deadline: edits.deadline ?? parsed.deadline,
    duration: edits.duration ?? parsed.duration,
    priority: edits.priority ?? parsed.priority,
  };
  const hasText = text.trim().length > 0;
  const missingSubject = hasText && !v.subjectId;

  if (subjects.length === 0) {
    return <EmptyState icon={BookOpen} title="Add a subject first" description="Quick capture files each task under a subject." action={<Button variant="primary" onClick={() => { onClose(); setActivePage('subjects'); }}>Go to subjects</Button>} />;
  }
  const detected = (ok: boolean) => <Badge tone={ok ? 'ok' : 'neutral'}>{ok ? 'Detected' : 'Default'}</Badge>;

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!v.title.trim() || !v.subjectId) return;
    addTask({ title: v.title.trim(), subjectId: v.subjectId, deadline: v.deadline, priority: v.priority, estimatedTime: v.duration });
    onClose();
  };

  return (
    <form onSubmit={save} className="space-y-4">
      <Field label="Describe the task" hint="Try: Finish OS assignment tomorrow for 1 hour">
        {(id) => <Input id={id} data-autofocus value={text} onChange={(e) => { setText(e.target.value); setEdits({}); }} placeholder="What do you need to do, and by when?" maxLength={200} />}
      </Field>
      {hasText && (
        <div className="animate-pop space-y-3 rounded-xl border border-line bg-bg-2/50 p-4">
          <p className="text-[13px] font-medium text-fg-2">Review before saving. You can edit any field.</p>
          <Field label="Task">{(id) => <Input id={id} value={v.title} onChange={(e) => setEdits((p) => ({ ...p, title: e.target.value }))} />}</Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Subject" error={missingSubject ? "No subject detected. Choose one." : undefined}>
              {(id) => <Select id={id} value={v.subjectId} onChange={(e) => setEdits((p) => ({ ...p, subjectId: e.target.value }))}><option value="">Choose a subject…</option>{subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select>}
            </Field>
            <Field label="Due date" hint={parsed.found.deadline ? undefined : 'No date found, so tomorrow is suggested.'}>{(id) => <Input id={id} type="date" value={v.deadline} onChange={(e) => setEdits((p) => ({ ...p, deadline: e.target.value }))} />}</Field>
            <Field label="Duration (minutes)" hint={parsed.found.duration ? undefined : 'No duration found, so 45 min is suggested.'}>{(id) => <Input id={id} type="number" min={5} max={480} step={5} value={v.duration} onChange={(e) => setEdits((p) => ({ ...p, duration: Math.max(5, Number(e.target.value) || 5) }))} />}</Field>
            <div>
              <span className="mb-1.5 block text-[13px] font-medium text-fg-2">Priority</span>
              <Segmented<Priority> label="Priority" value={v.priority} onChange={(p) => setEdits((e) => ({ ...e, priority: p }))} options={[{ value: 'Low', label: 'Low' }, { value: 'Medium', label: 'Medium' }, { value: 'High', label: 'High' }]} />
            </div>
          </div>
          <p className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-fg-3">Subject {detected(parsed.found.subject)} Due date {detected(parsed.found.deadline)} Duration {detected(parsed.found.duration)} Priority {detected(parsed.found.priority)}</p>
        </div>
      )}
      <div className="flex justify-end gap-2">
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="primary" disabled={!hasText || !v.title.trim() || !v.subjectId}>Add task</Button>
      </div>
    </form>
  );
}

export function QuickCaptureModal() {
  const { quickCaptureOpen, setQuickCaptureOpen } = useApp();
  return (
    <Modal open={quickCaptureOpen} onClose={() => setQuickCaptureOpen(false)} title="Quick capture" subtitle="Type naturally and StudyFlow fills in the details.">
      <Body onClose={() => setQuickCaptureOpen(false)} />
    </Modal>
  );
}
