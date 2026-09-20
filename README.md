# StudyFlow

An adaptive study planner: decide what to study, focus on it, track what you did, and re-plan when things slip.
Everything runs in the browser and is stored in `localStorage`. There is no backend, no account, and no API key.

## Run

```bash
npm install
npm run dev      # development
npm run build    # type-check + production build
npm run lint
```

## The core loop

Subjects, tasks and exams feed the **Planner**, which packs sessions and breaks into free time and saves them as
*planned blocks*. **Focus mode** logs real sessions against a task or block. **Progress** and the **Dashboard** are
computed from those sessions. When a planned block is missed or a task goes overdue, **Adjust your schedule**
proposes conflict-free new slots (respecting deadlines and your daily study limit) and only applies them after you
confirm.

## Architecture

| Area | Where |
| --- | --- |
| Shared data model (subjects, tasks, sessions, **planned blocks**, exams) | `src/types`, `src/context/AppProvider.tsx` |
| Ranking and "why this task" text | `src/utils/priority.ts` |
| Schedule builder (local, deterministic) | `src/utils/scheduler.ts` |
| Missed/overdue detection and rescheduling | `src/utils/reschedule.ts` |
| Natural-language Quick capture | `src/utils/quickCapture.ts` |
| Exam → learn/practice/revise/mock tasks | `src/utils/examPlan.ts` |
| Focus timer (timestamp-based, survives reloads) | `src/context/FocusProvider.tsx` |
| Design tokens (light + dark) | `src/index.css` |
| Reusable UI (Button, Modal, Form, Display, Toast) | `src/components/ui` |

Dates are always local-timezone `YYYY-MM-DD` strings (`src/utils/format.ts`), never UTC.

## Notes

- The planner is a local algorithm, not a language model. Nothing leaves the device.
- Data from the previous version (`*_v1` keys) is migrated on first load. Old "baseline" subject hours are not carried over;
  progress is now derived from logged sessions.
- Use **Settings → Export backup** before clearing browser data.
