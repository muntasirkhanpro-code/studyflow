import { useRef, useState } from 'react';
import { Download, Moon, RotateCcw, Sun, Upload, Wand2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Field, Input, Segmented } from '../components/ui/Form';
import { ErrorNotice, PageHeader, Section } from '../components/ui/Display';
import { ConfirmModal } from '../components/ui/Confirm';
import { todayStr } from '../utils/format';

export function Settings() {
  const app = useApp();
  const { profile, theme } = app;
  const fileRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState('');
  const [confirm, setConfirm] = useState<'sample' | 'reset' | null>(null);

  const exportData = () => {
    const blob = new Blob([app.exportJSON()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `studyflow-backup-${todayStr()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    app.addToast('Backup downloaded', undefined, 'success');
  };
  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const res = app.importJSON(await file.text());
      setImportError(res.ok ? '' : res.error ?? 'Import failed.');
    } catch {
      setImportError("We couldn't read that file. Choose a StudyFlow backup (.json) and try again.");
    }
  };

  return (
    <div className="max-w-2xl">
      <PageHeader title="Settings" subtitle="Your profile, appearance and data. Everything is stored in this browser." />
      <div className="space-y-10">
        <Section title="Profile">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name">{(id) => <Input id={id} value={profile.name} onChange={(e) => app.updateProfile({ name: e.target.value })} maxLength={40} />}</Field>
            <Field label="Daily study goal (hours)" hint="Used as the daily limit when rescheduling.">{(id) => <Input id={id} type="number" min={0.5} max={12} step={0.5} value={profile.dailyGoalHours} onChange={(e) => app.updateProfile({ dailyGoalHours: Math.min(12, Math.max(0.5, Number(e.target.value) || 0.5)) })} />}</Field>
          </div>
        </Section>

        <Section title="Appearance">
          <Segmented<'light' | 'dark'> label="Theme" value={theme} onChange={app.setTheme} options={[{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]} />
          <p className="mt-2 flex items-center gap-1.5 text-[13px] text-fg-3">{theme === 'dark' ? <Moon size={13} aria-hidden /> : <Sun size={13} aria-hidden />}Dark mode is easier on the eyes for evening sessions.</p>
        </Section>

        <Section title="Your data">
          <div className="flex flex-wrap gap-2">
            <Button icon={<Download size={15} aria-hidden />} onClick={exportData}>Export backup</Button>
            <Button icon={<Upload size={15} aria-hidden />} onClick={() => fileRef.current?.click()}>Import backup</Button>
            <input ref={fileRef} type="file" accept="application/json,.json" className="sr-only" aria-label="Choose backup file" tabIndex={-1} onChange={onFile} />
          </div>
          {importError && <div className="mt-3"><ErrorNotice title="Import failed" description={importError} action={<Button size="sm" onClick={() => fileRef.current?.click()}>Try another file</Button>} /></div>}
          <div className="mt-6 flex flex-wrap gap-2 border-t border-line-2 pt-6">
            <Button icon={<Wand2 size={15} aria-hidden />} onClick={() => setConfirm('sample')}>Load sample data</Button>
            <Button variant="danger" icon={<RotateCcw size={15} aria-hidden />} onClick={() => setConfirm('reset')}>Reset everything</Button>
          </div>
        </Section>
      </div>
      <ConfirmModal open={confirm === 'sample'} title="Replace your data with the sample workspace?" description="Your current subjects, tasks, exams, schedule and sessions will be replaced. Export a backup first if you want to keep them." confirmLabel="Load sample data" danger onConfirm={() => app.loadSample()} onClose={() => setConfirm(null)} />
      <ConfirmModal open={confirm === 'reset'} title="Reset StudyFlow?" description="This permanently deletes all subjects, tasks, exams, schedule and study history from this browser." confirmLabel="Reset everything" danger onConfirm={() => app.resetAll()} onClose={() => setConfirm(null)} />
    </div>
  );
}
