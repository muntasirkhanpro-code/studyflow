import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BarChart3, Plus, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button, IconButton } from '../components/ui/Button';
import { EmptyState, PageHeader, ProgressBar, Section, SubjectDot, Surface } from '../components/ui/Display';
import { LogSessionModal } from '../components/progress/LogSessionModal';
import { addDays, daysUntil, formatMinutes, monthDay, todayStr, weekdayShort } from '../utils/format';
import { bestFocusWindow, computeStreak, lastDates, minutesOn, plannedOn, subjectMinutes } from '../utils/stats';

export function ProgressPage() {
  const { sessions, subjects, tasks, blocks, exams, deleteSession } = useApp();
  const [logOpen, setLogOpen] = useState(false);
  const today = todayStr();
  const days = lastDates(7, today);
  const weekSessions = sessions.filter((s) => s.date >= days[0] && s.date <= today);
  const weekMin = weekSessions.reduce((a, s) => a + s.durationMinutes, 0);
  const weekDone = tasks.filter((t) => t.completed && t.completedAt && t.completedAt.slice(0, 10) >= addDays(today, -8)).length;
  const dueWeek = tasks.filter((t) => t.deadline >= days[0] && t.deadline <= today);
  const rate = dueWeek.length ? Math.round((dueWeek.filter((t) => t.completed).length / dueWeek.length) * 100) : null;
  const streak = computeStreak(sessions, today);

  const chart = days.map((d) => ({ day: weekdayShort(d), planned: +(plannedOn(blocks, d) / 60).toFixed(2), actual: +(minutesOn(sessions, d) / 60).toFixed(2) }));
  const hasChart = chart.some((c) => c.planned > 0 || c.actual > 0);

  const mins = subjectMinutes(sessions);
  const rows = subjects.map((s) => ({ s, m: mins.get(s.id) ?? 0 })).sort((a, b) => b.m - a.m);
  const weekBySubject = new Map<string, number>();
  for (const s of weekSessions) weekBySubject.set(s.subjectId, (weekBySubject.get(s.subjectId) ?? 0) + s.durationMinutes);

  // Insights: only statements backed by data
  const insights: string[] = [];
  const win = bestFocusWindow(sessions);
  if (win) insights.push(`You focus most between ${win.label}.`);
  const plannedWeek = days.reduce((a, d) => a + plannedOn(blocks, d), 0);
  if (plannedWeek >= 60) insights.push(`You've focused for ${Math.round((weekMin / plannedWeek) * 100)}% of the study time you planned this week.`);
  const overdue = tasks.filter((t) => !t.completed && daysUntil(t.deadline) < 0).length;
  if (overdue > 0) insights.push(`You have ${overdue} overdue task${overdue === 1 ? '' : 's'}.`);
  const top = [...weekBySubject.entries()].sort((a, b) => b[1] - a[1])[0];
  if (top) insights.push(`${subjects.find((s) => s.id === top[0])?.name ?? 'A subject'} got the most focus this week (${formatMinutes(top[1])}).`);
  const nextExam = exams.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date))[0];
  if (nextExam) insights.push(`${nextExam.name} is your closest exam, in ${daysUntil(nextExam.date)} day${daysUntil(nextExam.date) === 1 ? '' : 's'}.`);
  const recent = [...sessions].sort((a, b) => (b.startedAt ?? b.date).localeCompare(a.startedAt ?? a.date)).slice(0, 8);

  return (
    <div>
      <PageHeader title="Progress" subtitle="What you've studied and how it compares with your plan." actions={<Button icon={<Plus size={15} aria-hidden />} onClick={() => setLogOpen(true)} disabled={subjects.length === 0}>Log session</Button>} />
      {sessions.length === 0 && tasks.length === 0 ? (
        <Surface><EmptyState icon={BarChart3} title="No progress to show yet" description="Complete a focus session or log study time and your trends will appear here." action={<Button variant="primary" onClick={() => setLogOpen(true)} disabled={subjects.length === 0}>Log a session</Button>} /></Surface>
      ) : (
        <div className="space-y-10">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-5 border-y border-line-2 py-5 sm:grid-cols-4">
            {[['Focused this week', formatMinutes(weekMin)], ['Tasks completed', String(weekDone)], ['Completion rate', rate === null ? '—' : `${rate}%`], ['Study streak', streak > 0 ? `${streak} day${streak === 1 ? '' : 's'}` : '0 days']].map(([k, v]) => (
              <div key={k}><dt className="text-[13px] text-fg-3">{k}</dt><dd className="mt-1 text-2xl font-semibold tabular-nums text-fg">{v}</dd></div>
            ))}
          </dl>

          <Section title="Planned vs actual" action={<span className="text-[13px] text-fg-3">Last 7 days, hours</span>}>
            {hasChart ? (
              <div className="h-56 w-full" role="img" aria-label={`Bar chart of planned versus actual study hours for the last seven days. ${chart.map((c) => `${c.day}: planned ${c.planned}, actual ${c.actual}`).join('; ')}`}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chart} margin={{ top: 8, right: 4, left: -20, bottom: 0 }} barGap={3}>
                    <CartesianGrid vertical={false} stroke="var(--line-2)" />
                    <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: 'var(--fg-3)', fontSize: 12 }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fill: 'var(--fg-3)', fontSize: 12 }} allowDecimals={false} />
                    <Tooltip cursor={{ fill: 'var(--hover)' }} contentStyle={{ background: 'var(--elevated)', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, color: 'var(--fg)' }} labelStyle={{ color: 'var(--fg-2)' }} formatter={(v, n) => [`${v}h`, n === 'planned' ? 'Planned' : 'Focused']} />
                    <Bar dataKey="planned" name="planned" fill="var(--line)" radius={[4, 4, 0, 0]} maxBarSize={22} />
                    <Bar dataKey="actual" name="actual" fill="var(--accent)" radius={[4, 4, 0, 0]} maxBarSize={22} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : <p className="text-sm text-fg-2">No planned or focused time in the last 7 days.</p>}
            <p className="mt-2 flex gap-4 text-[13px] text-fg-3"><span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-line" />Planned</span><span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-accent" />Focused</span></p>
          </Section>

          <div className="grid gap-10 lg:grid-cols-2">
            <Section title="Subject progress">
              {rows.length === 0 ? <p className="text-sm text-fg-2">Add subjects to track time per subject.</p> : (
                <ul className="space-y-4">
                  {rows.map(({ s, m }) => {
                    const pct = Math.round(Math.min(100, (m / 60 / s.targetHours) * 100));
                    return (
                      <li key={s.id}>
                        <div className="mb-1.5 flex items-center gap-2 text-sm"><SubjectDot color={s.color} /><span className="flex-1 truncate font-medium text-fg">{s.name}</span><span className="tabular-nums text-fg-2">{formatMinutes(m)}</span><span className="w-10 text-right tabular-nums text-fg">{pct}%</span></div>
                        <ProgressBar value={pct} label={`${s.name}: ${pct}% of ${s.targetHours} hour target`} />
                      </li>
                    );
                  })}
                </ul>
              )}
              <p className="mt-3 text-[13px] text-fg-3">Percentage is focused time against each subject's target hours.</p>
            </Section>

            <Section title="Insights">
              {insights.length === 0 ? <p className="text-sm text-fg-2">Insights appear once you have a few sessions. They only ever describe what your data shows.</p> : (
                <ul className="space-y-2.5">{insights.map((i) => <li key={i} className="border-l-2 border-accent pl-3 text-sm text-fg">{i}</li>)}</ul>
              )}
            </Section>
          </div>

          <Section title="Recent sessions">
            {recent.length === 0 ? <p className="text-sm text-fg-2">No sessions yet.</p> : (
              <Surface>
                <ul className="divide-y divide-line-2">
                  {recent.map((s) => {
                    const sub = subjects.find((x) => x.id === s.subjectId);
                    const t = tasks.find((x) => x.id === s.taskId);
                    return (
                      <li key={s.id} className="flex items-center gap-3 px-4 py-2.5">
                        <SubjectDot color={sub?.color} />
                        <div className="min-w-0 flex-1"><p className="truncate text-sm text-fg">{t?.title ?? sub?.name ?? 'Session'}</p><p className="text-[13px] text-fg-3">{monthDay(s.date)} · {s.type}{s.plannedMinutes ? ` · planned ${formatMinutes(s.plannedMinutes)}` : ''}</p></div>
                        <span className="text-sm tabular-nums text-fg-2">{formatMinutes(s.durationMinutes)}</span>
                        <IconButton label="Delete session" tone="danger" onClick={() => deleteSession(s.id)}><Trash2 size={15} aria-hidden /></IconButton>
                      </li>
                    );
                  })}
                </ul>
              </Surface>
            )}
          </Section>
        </div>
      )}
      <LogSessionModal open={logOpen} onClose={() => setLogOpen(false)} />
    </div>
  );
}
