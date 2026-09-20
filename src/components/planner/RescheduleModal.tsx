import { useState } from 'react';
import { CalendarCheck2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useNow } from '../../hooks/useNow';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Checkbox } from '../ui/Form';
import { EmptyState } from '../ui/Display';
import { proposeReschedule } from '../../utils/reschedule';

function Body({ onClose }: { onClose: () => void }) {
  const { blocks, tasks, subjects, exams, sessions, profile, applyReschedule, dismissReschedule, setActivePage } = useApp();
  const nowMs = useNow(60000);
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const { moves, unplaced } = proposeReschedule({ blocks, tasks, subjects, exams, sessions }, nowMs, Math.round(profile.dailyGoalHours * 60));

  if (moves.length === 0 && unplaced.length === 0) {
    return <EmptyState icon={CalendarCheck2} title="You're on track" description="No missed sessions or overdue tasks need moving right now." action={<Button onClick={onClose}>Close</Button>} />;
  }
  const chosen = moves.filter((m) => !skipped.has(m.key));
  const toggle = (k: string) => setSkipped((p) => { const n = new Set(p); if (n.has(k)) n.delete(k); else n.add(k); return n; });

  return (
    <div>
      <p className="text-sm text-fg-2">StudyFlow found free time that avoids conflicts, respects deadlines and stays within your daily study limit. Nothing changes until you confirm.</p>
      <ul className="mt-4 divide-y divide-line-2 rounded-xl border border-line">
        {moves.map((m) => (
          <li key={m.key} className="flex items-start gap-3 px-4 py-3">
            <div className="pt-0.5"><Checkbox checked={!skipped.has(m.key)} onChange={() => toggle(m.key)} label={`Include: ${m.title}`} /></div>
            <div className="min-w-0"><p className="text-sm font-medium text-fg">{m.title}</p><p className="mt-0.5 text-[13px] text-fg-2">{m.reason}</p></div>
          </li>
        ))}
      </ul>
      {unplaced.length > 0 && (
        <div className="mt-3 rounded-xl border border-line bg-warn-soft p-3 text-[13px] text-fg-2">
          <p className="font-medium text-fg">Couldn't fit {unplaced.length} item{unplaced.length === 1 ? '' : 's'}</p>
          <ul className="mt-1 list-disc pl-5">{unplaced.map((u) => <li key={u.key}>{u.title}</li>)}</ul>
          <p className="mt-1">Raise your daily goal in Settings or move them by hand.</p>
        </div>
      )}
      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <Button variant="ghost" onClick={() => { dismissReschedule(); onClose(); }}>Ignore</Button>
        <Button onClick={() => { onClose(); setActivePage('tasks'); }}>Choose manually</Button>
        <Button variant="primary" disabled={chosen.length === 0} onClick={() => { applyReschedule(chosen); onClose(); }}>Auto reschedule{chosen.length ? ` (${chosen.length})` : ''}</Button>
      </div>
    </div>
  );
}

export function RescheduleModal() {
  const { rescheduleOpen, setRescheduleOpen } = useApp();
  return (
    <Modal open={rescheduleOpen} onClose={() => setRescheduleOpen(false)} title="Adjust your schedule" subtitle="Move missed and overdue work to times that fit.">
      <Body onClose={() => setRescheduleOpen(false)} />
    </Modal>
  );
}
