import { CalendarClock, ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useFocus } from '../context/FocusContext';
import { useNow } from '../hooks/useNow';
import { Button, IconButton } from '../components/ui/Button';
import { EmptyState, PageHeader, Section, Surface } from '../components/ui/Display';
import { PlanBuilder } from '../components/planner/PlanBuilder';
import { BlockList } from '../components/planner/BlockList';
import { addDays, formatDateLong, formatMinutes, relativeDay, todayStr } from '../utils/format';

export function Planner() {
  const { blocks, tasks, subjects, planDate, setPlanDate, setBlockStatus, removeBlock } = useApp();
  const { openFocus } = useFocus();
  const nowMs = useNow(30000);
  const day = blocks.filter((b) => b.date === planDate && b.status !== 'moved');
  const study = day.filter((b) => !b.isBreak);
  const total = study.reduce((a, b) => a + b.durationMinutes, 0);
  return (
    <div>
      <PageHeader title="Planner" subtitle="Turn your tasks, deadlines and exams into a realistic schedule. Planning runs on your device using your own data." />
      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-2"><Section title="Build a plan"><PlanBuilder key={planDate} /></Section></div>
        <div className="lg:col-span-3">
          <Section
            title="Schedule"
            action={
              <div className="flex items-center gap-1">
                <IconButton label="Previous day" onClick={() => setPlanDate(addDays(planDate, -1))}><ChevronLeft size={18} aria-hidden /></IconButton>
                <span className="min-w-28 text-center text-sm font-medium text-fg">{relativeDay(planDate)}</span>
                <IconButton label="Next day" onClick={() => setPlanDate(addDays(planDate, 1))}><ChevronRight size={18} aria-hidden /></IconButton>
                {planDate !== todayStr() && <Button size="sm" variant="ghost" onClick={() => setPlanDate(todayStr())}>Today</Button>}
              </div>
            }
          >
            <p className="mb-2 text-[13px] text-fg-2">{formatDateLong(planDate)}{total > 0 ? ` · ${formatMinutes(total)} planned` : ''}</p>
            <Surface>
              {study.length === 0 ? (
                <EmptyState icon={CalendarClock} title="Nothing scheduled for this day" description="Generate a plan on the left and add it to your schedule." />
              ) : (
                <BlockList blocks={day} subjects={subjects} tasks={tasks} nowMs={nowMs}
                  onStart={(b) => openFocus({ taskId: b.taskId, subjectId: b.subjectId, blockId: b.id, minutes: b.durationMinutes })}
                  onDone={(b) => setBlockStatus(b.id, 'done')} onRemove={(b) => removeBlock(b.id)} />
              )}
            </Surface>
          </Section>
        </div>
      </div>
    </div>
  );
}
