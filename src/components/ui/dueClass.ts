import type { DueTone } from '../../utils/format';

const DUE_STYLE: Record<DueTone, string> = { overdue: 'text-bad font-medium', today: 'text-warn font-medium', soon: 'text-fg-2', later: 'text-fg-3' };
export function dueClass(tone: DueTone): string {
  return DUE_STYLE[tone];
}
