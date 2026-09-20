import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Field, Input, Select } from '../ui/Form';
import { todayStr } from '../../utils/format';
import type { SessionType } from '../../types';

function Form({ onClose }: { onClose: () => void }) {
  const { subjects, addSession, addToast } = useApp();
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? '');
  const [date, setDate] = useState(todayStr());
  const [minutes, setMinutes] = useState('45');
  const [type, setType] = useState<SessionType>('Deep Work');
  const [error, setError] = useState('');
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const m = Math.round(Number(minutes));
    if (!subjectId) return setError('Choose a subject.');
    if (!Number.isFinite(m) || m < 1 || m > 720) return setError('Enter between 1 and 720 minutes.');
    if (date > todayStr()) return setError("Sessions can't be logged in the future.");
    addSession({ subjectId, date, durationMinutes: m, type });
    addToast('Session logged', `${m} min added to your progress.`, 'success');
    onClose();
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Subject">{(id) => <Select id={id} data-autofocus value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>{subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select>}</Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Date">{(id) => <Input id={id} type="date" max={todayStr()} value={date} onChange={(e) => setDate(e.target.value)} />}</Field>
        <Field label="Minutes studied">{(id) => <Input id={id} type="number" min={1} max={720} value={minutes} onChange={(e) => { setMinutes(e.target.value); setError(''); }} />}</Field>
      </div>
      <Field label="Type" error={error}>{(id) => <Select id={id} value={type} onChange={(e) => setType(e.target.value as SessionType)}><option>Deep Work</option><option>Revision</option><option>Practice</option><option>Exam Prep</option></Select>}</Field>
      <div className="flex justify-end gap-2"><Button onClick={onClose}>Cancel</Button><Button type="submit" variant="primary">Log session</Button></div>
    </form>
  );
}
export function LogSessionModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return <Modal open={open} onClose={onClose} title="Log a study session" subtitle="For time you studied outside Focus mode."><Form onClose={onClose} /></Modal>;
}
