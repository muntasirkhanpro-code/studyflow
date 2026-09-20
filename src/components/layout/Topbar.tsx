import { Menu, Moon, Plus, Sun, Timer, Zap } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useFocus } from '../../context/FocusContext';
import { Button, IconButton } from '../ui/Button';
import { formatDateLong, todayStr } from '../../utils/format';

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { theme, setTheme, openTaskEditor, setQuickCaptureOpen } = useApp();
  const { run, remainingMs, running, setOpen } = useFocus();
  const s = Math.ceil(remainingMs / 1000);
  const time = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-line bg-bg/90 px-3 backdrop-blur-sm sm:px-6 lg:px-8">
      <IconButton label="Open navigation" className="lg:hidden" onClick={onMenu}><Menu size={20} aria-hidden /></IconButton>
      <p className="hidden text-sm text-fg-2 sm:block">{formatDateLong(todayStr())}</p>
      <div className="flex-1" />
      {run && (
        <button type="button" onClick={() => setOpen(true)} className="flex h-9 items-center gap-2 rounded-lg bg-accent-soft px-3 text-[13px] font-medium text-accent-text transition-colors hover:brightness-95" aria-label={`Focus session ${running ? 'running' : 'paused'}, ${time} left. Open focus mode`}>
          <Timer size={15} aria-hidden />
          <span className="tabular-nums">{run.phase === 'break' ? 'Break ' : ''}{time}</span>
          {!running && <span className="text-fg-2">paused</span>}
        </button>
      )}
      <Button size="sm" icon={<Zap size={15} aria-hidden />} onClick={() => setQuickCaptureOpen(true)} className="hidden sm:inline-flex">Quick capture<kbd className="ml-1 hidden rounded border border-line px-1 text-xs text-fg-3 lg:inline">Ctrl K</kbd></Button>
      <IconButton label="Quick capture" className="sm:hidden" onClick={() => setQuickCaptureOpen(true)}><Zap size={18} aria-hidden /></IconButton>
      <Button variant="primary" size="sm" icon={<Plus size={15} aria-hidden />} onClick={() => openTaskEditor()}><span className="hidden sm:inline">New task</span><span className="sm:hidden">Task</span></Button>
      <IconButton label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
        {theme === 'dark' ? <Sun size={18} aria-hidden /> : <Moon size={18} aria-hidden />}
      </IconButton>
    </header>
  );
}
