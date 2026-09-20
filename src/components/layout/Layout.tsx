import { useEffect, useState, type ReactNode } from 'react';
import { CalendarDays, CheckSquare, LayoutDashboard, Menu, Sparkles, TrendingUp, type LucideIcon } from 'lucide-react';
import { Sidebar, MobileDrawer } from './Sidebar';
import { Topbar } from './Topbar';
import { ToastContainer } from '../ui/Toast';
import { useApp } from '../../context/AppContext';
import type { PageId } from '../../types';
import { TaskModal } from '../tasks/TaskModal';
import { QuickCaptureModal } from '../capture/QuickCaptureModal';
import { RescheduleModal } from '../planner/RescheduleModal';
import { GenerateDayModal } from '../planner/GenerateDayModal';
import { OnboardingModal } from '../onboarding/OnboardingModal';
import { FocusModal } from '../focus/FocusModal';

const MOBILE: { id: PageId; label: string; icon: LucideIcon }[] = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'planner', label: 'Planner', icon: Sparkles },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'progress', label: 'Progress', icon: TrendingUp },
];

export function Layout({ children }: { children: ReactNode }) {
  const { activePage, setActivePage, setQuickCaptureOpen } = useApp();
  const [drawer, setDrawer] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setQuickCaptureOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setQuickCaptureOpen]);

  return (
    <div className="min-h-dvh bg-bg">
      <a href="#main" className="sr-only rounded-lg bg-accent px-3 py-2 text-on-accent focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[70]">Skip to content</a>
      <Sidebar />
      <MobileDrawer open={drawer} onClose={() => setDrawer(false)} />
      <div className="lg:pl-60">
        <Topbar onMenu={() => setDrawer(true)} />
        <main id="main" className="mx-auto w-full max-w-5xl px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-12">{children}</main>
      </div>

      <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden">
        {MOBILE.map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" aria-current={activePage === id ? 'page' : undefined} onClick={() => setActivePage(id)} className={`flex h-14 flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors ${activePage === id ? 'text-accent-text' : 'text-fg-3 hover:text-fg'}`}>
            <Icon size={20} aria-hidden />{label}
          </button>
        ))}
        <button type="button" onClick={() => setDrawer(true)} className="flex h-14 flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium text-fg-3 hover:text-fg"><Menu size={20} aria-hidden />More</button>
      </nav>

      <TaskModal />
      <QuickCaptureModal />
      <RescheduleModal />
      <GenerateDayModal />
      <OnboardingModal />
      <FocusModal />
      <ToastContainer />
    </div>
  );
}
