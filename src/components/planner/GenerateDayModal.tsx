import { useApp } from '../../context/AppContext';
import { Modal } from '../ui/Modal';
import { PlanBuilder } from './PlanBuilder';
import { todayStr } from '../../utils/format';

export function GenerateDayModal() {
  const { generateDayOpen, setGenerateDayOpen } = useApp();
  return (
    <Modal open={generateDayOpen} onClose={() => setGenerateDayOpen(false)} title="Generate my day" subtitle="A realistic plan from your tasks, deadlines and exams." size="lg">
      <PlanBuilder fixedDate={todayStr()} compact onSaved={() => setGenerateDayOpen(false)} />
    </Modal>
  );
}
