import { useState } from 'react';
import { Plus, Sparkles, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Field, Input, Segmented, Chip } from '../ui/Form';
import { buildPlan } from '../../utils/scheduler';
import { ceilTo, minutesNow, minutesToTime, todayStr } from '../../utils/format';
import type { Goal } from '../../types';

function Body() {
  const { completeOnboarding, addBlocks, setActivePage, setPlanDate } = useApp();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [subs, setSubs] = useState<{ name: string; examDate?: string }[]>([]);
  const [draft, setDraft] = useState('');
  const [draftExam, setDraftExam] = useState('');
  const [goal, setGoal] = useState<Goal>('Exams');
  const [hours, setHours] = useState(2);
  const [error, setError] = useState('');

  const addSub = () => {
    const n = draft.trim();
    if (!n) return setError('Type a subject name first.');
    if (subs.some((s) => s.name.toLowerCase() === n.toLowerCase())) return setError('You already added that subject.');
    setSubs((p) => [...p, { name: n, examDate: draftExam || undefined }]);
    setDraft(''); setDraftExam(''); setError('');
  };
  const finish = (useSample: boolean) => {
    const res = completeOnboarding({ name, goal, dailyGoalHours: hours, subjects: subs, useSample });
    const today = todayStr();
    const start = minutesToTime(Math.min(ceilTo(minutesNow() + 1, 15), 22 * 60));
    const plan = buildPlan({ date: today, nowMs: Date.now(), startMinutes: (() => { const [h, m] = start.split(':').map(Number); return h * 60 + m; })(), windowMinutes: hours * 60, focusMin: 50, breakMin: 10, subjectIds: [], bias: 'balanced' }, { ...res, sessions: [], blocks: [] });
    if (plan.blocks.length) addBlocks(plan.blocks);
    setPlanDate(today);
    setActivePage(plan.blocks.length ? 'planner' : 'dashboard');
  };

  return (
    <div>
      <p className="mb-4 text-[13px] text-fg-3">Step {step + 1} of 3</p>
      {step === 0 && (
        <div className="space-y-4">
          <Field label="What should we call you? (optional)">{(id) => <Input id={id} data-autofocus value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />}</Field>
          <div>
            <p className="mb-1.5 text-[13px] font-medium text-fg-2">What are you studying?</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input aria-label="Subject name" value={draft} onChange={(e) => { setDraft(e.target.value); setError(''); }} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSub(); } }} placeholder="e.g. Operating Systems" maxLength={60} />
              <Input aria-label="Exam date (optional)" type="date" value={draftExam} onChange={(e) => setDraftExam(e.target.value)} className="sm:w-44" />
              <Button icon={<Plus size={15} aria-hidden />} onClick={addSub}>Add</Button>
            </div>
            {error && <p role="alert" className="mt-1.5 text-[13px] text-bad">{error}</p>}
            {subs.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-2">
                {subs.map((s) => (
                  <li key={s.name} className="flex items-center gap-1.5 rounded-full border border-line bg-bg-2 py-1 pl-3 pr-1 text-[13px] text-fg">
                    {s.name}{s.examDate ? <span className="text-fg-3">· exam {s.examDate}</span> : null}
                    <button type="button" aria-label={`Remove ${s.name}`} onClick={() => setSubs((p) => p.filter((x) => x.name !== s.name))} className="rounded-full p-1 text-fg-3 hover:bg-hover hover:text-fg"><X size={13} aria-hidden /></button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            <button type="button" className="text-[13px] font-medium text-accent-text hover:underline" onClick={() => finish(true)}>Explore with sample data instead</button>
            <Button variant="primary" disabled={subs.length === 0} onClick={() => setStep(1)}>Continue</Button>
          </div>
        </div>
      )}
      {step === 1 && (
        <div className="space-y-4">
          <p className="text-sm font-medium text-fg">What are you working toward?</p>
          <div className="flex flex-wrap gap-2">{(['Exams', 'Skills', 'Projects', 'General'] as Goal[]).map((g) => <Chip key={g} active={goal === g} onClick={() => setGoal(g)}>{g === 'General' ? 'General productivity' : g}</Chip>)}</div>
          <div className="flex justify-between pt-2"><Button variant="ghost" onClick={() => setStep(0)}>Back</Button><Button variant="primary" onClick={() => setStep(2)}>Continue</Button></div>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-4">
          <p className="text-sm font-medium text-fg">How much time can you study each day?</p>
          <Segmented<string> label="Daily study time" value={String(hours)} onChange={(v) => setHours(Number(v))} options={[{ value: '1', label: '1h' }, { value: '2', label: '2h' }, { value: '3', label: '3h+' }]} />
          <p className="text-[13px] text-fg-2">We'll add a starter task for each subject and plan your first session. Edit or delete them any time.</p>
          <div className="flex justify-between pt-2"><Button variant="ghost" onClick={() => setStep(1)}>Back</Button><Button variant="primary" icon={<Sparkles size={15} aria-hidden />} onClick={() => finish(false)}>Generate my first plan</Button></div>
        </div>
      )}
    </div>
  );
}

export function OnboardingModal() {
  const { onboardingDone, completeOnboarding, setActivePage } = useApp();
  return (
    <Modal open={!onboardingDone} onClose={() => { completeOnboarding({ name: '', goal: 'General', dailyGoalHours: 2, subjects: [], useSample: false }); setActivePage('dashboard'); }} title="Welcome to StudyFlow" subtitle="Plan what to study, focus on it, and adapt when things change.">
      <Body />
    </Modal>
  );
}
