import { BarChart3, CalendarDays, CheckSquare, GraduationCap, LayoutDashboard, Settings, Sparkles, BookOpen, type LucideIcon } from 'lucide-react';
import type { PageId } from '../../types';

export const NAV: { id: PageId; label: string; icon: LucideIcon }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'planner', label: 'Planner', icon: Sparkles },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'subjects', label: 'Subjects', icon: BookOpen },
  { id: 'exams', label: 'Exams', icon: GraduationCap },
  { id: 'progress', label: 'Progress', icon: BarChart3 },
];
export const SETTINGS_NAV = { id: 'settings' as PageId, label: 'Settings', icon: Settings };
export const MOBILE_NAV: PageId[] = ['dashboard', 'tasks', 'planner', 'calendar'];
