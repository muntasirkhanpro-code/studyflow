import { lazy, Suspense } from 'react';
import { AppProvider } from './context/AppProvider';
import { FocusProvider } from './context/FocusProvider';
import { useApp } from './context/AppContext';
import { Layout } from './components/layout/Layout';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { PageSkeleton } from './components/ui/Display';
import { Dashboard } from './pages/Dashboard';
import { Tasks } from './pages/Tasks';
import { Planner } from './pages/Planner';
import { Calendar } from './pages/Calendar';
import { Subjects } from './pages/Subjects';
import { Exams } from './pages/Exams';
import { Settings } from './pages/Settings';

// Charts are the heaviest dependency, so the Progress page is loaded on demand.
const ProgressPage = lazy(() => import('./pages/Progress').then((m) => ({ default: m.ProgressPage })));

function Pages() {
  const { activePage } = useApp();
  return (
    <ErrorBoundary key={activePage}>
      <Suspense fallback={<PageSkeleton />}>
        {activePage === 'dashboard' && <Dashboard />}
        {activePage === 'tasks' && <Tasks />}
        {activePage === 'planner' && <Planner />}
        {activePage === 'calendar' && <Calendar />}
        {activePage === 'subjects' && <Subjects />}
        {activePage === 'exams' && <Exams />}
        {activePage === 'progress' && <ProgressPage />}
        {activePage === 'settings' && <Settings />}
      </Suspense>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <AppProvider>
      <FocusProvider>
        <Layout>
          <Pages />
        </Layout>
      </FocusProvider>
    </AppProvider>
  );
}
