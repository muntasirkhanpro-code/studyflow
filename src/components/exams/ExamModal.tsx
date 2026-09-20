import { useState } from 'react';
import { GraduationCap } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Field, Input, Select, Textarea } from '../ui/Form';
import { EmptyState } from '../ui/Display';
import { addDays, todayStr } from '../../utils/format';
import { uid } from '../../utils/id';
import type { Exam } from '../../types';

function Form({ exam, onClose }: { exam: Exam | null; onClose: () => void }) {
  const { subjects, addExam, updateExam } = useApp();
  const [subjectId, setSubjectId] = useState(exam?.subjectId ?? subjects[0]?.id ?? '');
  const [name, setName] = useState(exam?.name ?? '');
  const [date, setDate] = useState(exam?.date ?? addDays(todayStr(), 14));
  const [topics, setTopics] = useState('');
  const [error, setError] = useState('');
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError('Give the exam a name.');
    if (!subjectId) return setError('Choose a subject.');
    if (exam) updateExam(exam.id, { name: name.trim(), subjectId, date });
    else addExam({ subjectId, name: name.trim(), date, topics: topics.split('\n').map((t) => t.trim()).filter(Boolean).map((t) => ({ id: uid('top'), name: t, completed: false })) });
    onClose();
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Exam name" error={error}>{(id) => <Input id={id} data-autofocus value={name} onChange={(e) => { setName(e.target.value); setError(''); }} placeholder="e.g. Data Structures Midterm" maxLength={80} />}</Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Subject">{(id) => <Select id={id} value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>{subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select>}</Field>
        <Field label="Exam date">{(id) => <Input id={id} type="date" value={date} onChange={(e) => setDate(e.target.value)} required />}</Field>
      </div>
      {!exam && <Field label="Topics (one per line)" hint="You can add or tick off topics later.">{(id) => <Textarea id={id} rows={5} value={topics} onChange={(e) => setTopics(e.target.value)} placeholder={'Arrays\nLinked lists\nTrees'} />}</Field>}
      <div className="flex justify-end gap-2"><Button onClick={onClose}>Cancel</Button><Button type="submit" variant="primary">{exam ? 'Save changes' : 'Add exam'}</Button></div>
    </form>
  );
}

export function ExamModal({ open, exam, onClose }: { open: boolean; exam: Exam | null; onClose: () => void }) {
  const { subjects, setActivePage } = useApp();
  return (
    <Modal open={open} onClose={onClose} title={exam ? 'Edit exam' : 'New exam'}>
      {subjects.length === 0 ? <EmptyState icon={GraduationCap} title="Add a subject first" description="Exams belong to a subject." action={<Button variant="primary" onClick={() => { onClose(); setActivePage('subjects'); }}>Go to subjects</Button>} /> : <Form key={exam?.id ?? 'new'} exam={exam} onClose={onClose} />}
    </Modal>
  );
}
