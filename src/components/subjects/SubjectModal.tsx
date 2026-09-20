import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Field, Input, Select } from '../ui/Form';
import type { Difficulty, Subject } from '../../types';
import { SUBJECT_COLORS } from '../../data/constants';
import { initials } from '../../utils/format';

function Form({ subject, count, onSave, onClose }: { subject: Subject | null; count: number; onSave: (d: Omit<Subject, 'id'>) => void; onClose: () => void }) {
  const [name, setName] = useState(subject?.name ?? '');
  const [code, setCode] = useState(subject?.code ?? '');
  const [color, setColor] = useState(subject?.color ?? SUBJECT_COLORS[count % SUBJECT_COLORS.length]);
  const [difficulty, setDifficulty] = useState<Difficulty>(subject?.difficulty ?? 'Medium');
  const [target, setTarget] = useState(String(subject?.targetHours ?? 20));
  const [error, setError] = useState('');
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = Number(target);
    if (!name.trim()) return setError('Give the subject a name.');
    if (!Number.isFinite(t) || t < 1 || t > 1000) return setError('Target hours should be between 1 and 1000.');
    onSave({ name: name.trim(), code: (code.trim() || initials(name).slice(0, 5)).toUpperCase(), color, difficulty, targetHours: t });
    onClose();
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Subject name" error={error}>{(id) => <Input id={id} data-autofocus value={name} onChange={(e) => { setName(e.target.value); setError(''); }} maxLength={60} placeholder="e.g. Operating Systems" />}</Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Short code" hint="Shown in lists. Auto-filled if empty.">{(id) => <Input id={id} value={code} onChange={(e) => setCode(e.target.value)} maxLength={6} placeholder={initials(name).slice(0, 5) || 'OS'} />}</Field>
        <Field label="Difficulty">{(id) => <Select id={id} value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)}><option>Easy</option><option>Medium</option><option>Hard</option></Select>}</Field>
      </div>
      <Field label="Target study hours" hint="Used to show progress on the Subjects and Progress pages.">{(id) => <Input id={id} type="number" min={1} max={1000} value={target} onChange={(e) => setTarget(e.target.value)} />}</Field>
      <div>
        <span className="mb-1.5 block text-[13px] font-medium text-fg-2">Colour</span>
        <div role="radiogroup" aria-label="Colour" className="flex flex-wrap gap-2">
          {SUBJECT_COLORS.map((c) => (
            <button key={c} type="button" role="radio" aria-checked={color === c} aria-label={c} onClick={() => setColor(c)} className={`h-8 w-8 rounded-full border-2 transition-transform ${color === c ? 'scale-110 border-fg' : 'border-transparent'}`} style={{ background: c }} />
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-1"><Button onClick={onClose}>Cancel</Button><Button type="submit" variant="primary">{subject ? 'Save changes' : 'Add subject'}</Button></div>
    </form>
  );
}

export function SubjectModal({ open, subject, count, onSave, onClose }: { open: boolean; subject: Subject | null; count: number; onSave: (d: Omit<Subject, 'id'>) => void; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title={subject ? 'Edit subject' : 'New subject'}>
      <Form key={subject?.id ?? 'new'} subject={subject} count={count} onSave={onSave} onClose={onClose} />
    </Modal>
  );
}
