import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Chip, Field, Input, Segmented, Select, Textarea } from '../ui/Form';
import { EmptyState } from '../ui/Display';
import { BookOpen } from 'lucide-react';
import type { Difficulty, Priority, Task } from '../../types';
import { addDays, todayStr } from '../../utils/format';

function TaskForm({ task, preset, onClose }: { task: Task | null; preset?: Partial<Task>; onClose: () => void }) {
  const { subjects, addTask, updateTask } = useApp();
  const [title, setTitle] = useState(task?.title ?? preset?.title ?? '');
  const [subjectId, setSubjectId] = useState(task?.subjectId ?? preset?.subjectId ?? subjects[0]?.id ?? '');
  const [deadline, setDeadline] = useState(task?.deadline ?? preset?.deadline ?? addDays(todayStr(), 1));
  const [priority, setPriority] = useState<Priority>(task?.priority ?? preset?.priority ?? 'Medium');
  const [minutes, setMinutes] = useState(String(task?.estimatedTime ?? preset?.estimatedTime ?? 45));
  const [difficulty, setDifficulty] = useState<'' | Difficulty>(task?.difficulty ?? '');
  const [notes, setNotes] = useState(task?.notes ?? '');
  const [error, setError] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const est = Math.round(Number(minutes));
    if (!title.trim()) return setError('Give the task a title.');
    if (!subjectId) return setError('Choose a subject.');
    if (!Number.isFinite(est) || est < 5 || est > 600) return setError('Estimated time should be between 5 and 600 minutes.');
    const data = { title: title.trim(), subjectId, deadline, priority, estimatedTime: est, difficulty: difficulty || undefined, notes: notes.trim() || undefined };
    if (task) updateTask(task.id, data);
    else addTask({ ...data, examId: preset?.examId, kind: preset?.kind });
    onClose();
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Title" error={error}>{(id) => <Input id={id} data-autofocus value={title} onChange={(e) => { setTitle(e.target.value); setError(''); }} placeholder="e.g. Finish OS assignment" maxLength={140} />}</Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Subject">{(id) => <Select id={id} value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>{subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select>}</Field>
        <Field label="Due date">{(id) => <Input id={id} type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} required />}</Field>
      </div>
      <div className="flex flex-wrap gap-2" aria-label="Quick due dates">
        <Chip active={deadline === todayStr()} onClick={() => setDeadline(todayStr())}>Today</Chip>
        <Chip active={deadline === addDays(todayStr(), 1)} onClick={() => setDeadline(addDays(todayStr(), 1))}>Tomorrow</Chip>
        <Chip active={deadline === addDays(todayStr(), 7)} onClick={() => setDeadline(addDays(todayStr(), 7))}>Next week</Chip>
      </div>
      <div>
        <span className="mb-1.5 block text-[13px] font-medium text-fg-2">Priority</span>
        <Segmented<Priority> label="Priority" value={priority} onChange={setPriority} options={[{ value: 'Low', label: 'Low' }, { value: 'Medium', label: 'Medium' }, { value: 'High', label: 'High' }]} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Estimated time (minutes)">{(id) => <Input id={id} type="number" inputMode="numeric" min={5} max={600} step={5} value={minutes} onChange={(e) => setMinutes(e.target.value)} />}</Field>
        <Field label="Difficulty" hint="Leave on subject default unless this task is harder or easier.">{(id) => <Select id={id} value={difficulty} onChange={(e) => setDifficulty(e.target.value as '' | Difficulty)}><option value="">Subject default</option><option>Easy</option><option>Medium</option><option>Hard</option></Select>}</Field>
      </div>
      <Field label="Notes (optional)">{(id) => <Textarea id={id} value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />}</Field>
      <div className="flex justify-end gap-2 pt-1">
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="primary">{task ? 'Save changes' : 'Add task'}</Button>
      </div>
    </form>
  );
}

export function TaskModal() {
  const { taskEditor, closeTaskEditor, subjects, setActivePage } = useApp();
  const { open, task, preset } = taskEditor;
  return (
    <Modal open={open} onClose={closeTaskEditor} title={task ? 'Edit task' : 'New task'}>
      {subjects.length === 0 ? (
        <EmptyState icon={BookOpen} title="Add a subject first" description="Tasks belong to a subject so StudyFlow can plan and track your time." action={<Button variant="primary" onClick={() => { closeTaskEditor(); setActivePage('subjects'); }}>Go to subjects</Button>} />
      ) : (
        <TaskForm key={task?.id ?? 'new'} task={task} preset={preset} onClose={closeTaskEditor} />
      )}
    </Modal>
  );
}
