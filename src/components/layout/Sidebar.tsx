import { CalendarDays, CheckSquare, GraduationCap, LayoutDashboard, Settings, Sparkles, Target, TrendingUp, BookOpen, Flame, Timer, X, type LucideIcon } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useFocus } from '../../context/FocusContext';
import type { PageId } from '../../types';
import { computeStreak } from '../../utils/stats';
import { todayStr } from '../../utils/format';

const NAV: { id: PageId; label: string; icon: LucideIcon }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'planner', label: 'Planner', icon: Sparkles },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'subjects', label: 'Subjects', icon: BookOpen },
  { id: 'exams', label: 'Exams', icon: GraduationCap },
  { id: 'progress', label: 'Progress', icon: TrendingUp },
];

function NavItem({ id, label, icon: Icon, badge, onNavigate }: { id: PageId; label: string; icon: LucideIcon; badge?: number; onNavigate?: () => void }) {
  const { activePage, setActivePage } = useApp();
  const active = activePage === id;
  return (
    <button
      type="button"
      aria-current={active ? 'page' : undefined}
      onClick={() => { setActivePage(id); onNavigate?.(); }}
      className={`flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors duration-200 ${active ? 'bg-accent-soft text-accent-text' : 'text-fg-2 hover:bg-hover hover:text-fg'}`}
    >
      <Icon size={18} aria-hidden />
      <span className="flex-1 text-left">{label}</span>
      {badge ? <span className="rounded-md bg-bg-2 px-1.5 text-xs text-fg-2">{badge}</span> : null}
    </button>
  );
}

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { tasks, sessions, profile } = useApp();
  const { run, remainingMs, setOpen } = useFocus();
  const pending = tasks.filter((t) => !t.completed).length;
  const streak = computeStreak(sessions, todayStr());
  const mm = Math.ceil(remainingMs / 1000);
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center gap-2.5 px-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-on-accent"><Target size={17} aria-hidden /></span>
        <span className="text-[17px] font-semibold tracking-tight text-fg">StudyFlow</span>
      </div>
      <nav aria-label="Main" className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
        {NAV.map((n) => <NavItem key={n.id} {...n} badge={n.id === 'tasks' ? pending : undefined} onNavigate={onNavigate} />)}
      </nav>
      <div className="space-y-1 border-t border-line-2 p-3">
        <button type="button" onClick={() => { setOpen(true); onNavigate?.(); }} className="flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-fg-2 transition-colors duration-200 hover:bg-hover hover:text-fg">
          <Timer size={18} aria-hidden />
          <span className="flex-1 text-left">Focus mode</span>
          {run && <span className="text-xs tabular-nums text-accent-text">{String(Math.floor(mm / 60)).padStart(2, '0')}:{String(mm % 60).padStart(2, '0')}</span>}
        </button>
        <NavItem id="settings" label="Settings" icon={Settings} onNavigate={onNavigate} />
        <div className="flex items-center gap-3 px-3 pt-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-bg-2 text-[13px] font-semibold text-fg-2">{(profile.name.trim()[0] ?? 'S').toUpperCase()}</span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-fg">{profile.name.trim() || 'Student'}</p>
            <p className="flex items-center gap-1 text-xs text-fg-3"><Flame size={12} aria-hidden />{streak > 0 ? `${streak}-day streak` : 'No streak yet'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Sidebar() {
  return <aside aria-label="Sidebar" className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-line bg-surface lg:block"><SidebarContent /></aside>;
}

export function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 lg:hidden" onKeyDown={(e) => e.key === 'Escape' && onClose()}>
      <div className="absolute inset-0 bg-black/45 animate-fade" onClick={onClose} aria-hidden />
      <div role="dialog" aria-modal="true" aria-label="Navigation" className="absolute inset-y-0 left-0 w-72 border-r border-line bg-surface animate-fade">
        <button type="button" aria-label="Close navigation" onClick={onClose} className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-lg text-fg-3 hover:bg-hover hover:text-fg"><X size={18} aria-hidden /></button>
        <SidebarContent onNavigate={onClose} />
      </div>
    </div>
  );
}
