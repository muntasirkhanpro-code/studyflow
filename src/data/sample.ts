import type { Exam, PlannedBlock, StudySession, Subject, Task } from '../types';
import { addDays, pad, todayStr } from '../utils/format';
import { uid } from '../utils/id';

/** Sample workspace, generated relative to today so it never goes stale. */
export function buildSampleData() {
  const today = todayStr();
  const mk = (name: string, code: string, color: string, difficulty: Subject['difficulty'], targetHours: number): Subject => ({ id: uid('sub'), name, code, color, difficulty, targetHours });
  const dsa = mk('Data Structures & Algorithms', 'DSA', '#5558e8', 'Hard', 20);
  const dbms = mk('Database Management', 'DBMS', '#10b981', 'Medium', 15);
  const os = mk('Operating Systems', 'OS', '#f59e0b', 'Medium', 15);
  const cn = mk('Computer Networks', 'CN', '#06b6d4', 'Medium', 12);
  const web = mk('Web Development', 'WEB', '#ec4899', 'Easy', 12);
  const subjects = [dsa, dbms, os, cn, web];

  const topics = (names: string[], done: number) => names.map((n, i) => ({ id: uid('top'), name: n, completed: i < done }));
  const exams: Exam[] = [
    { id: uid('exam'), subjectId: dsa.id, name: 'DSA Midterm', date: addDays(today, 6), topics: topics(['Arrays & strings', 'Linked lists', 'Trees', 'Graphs', 'Dynamic programming', 'Sorting & searching'], 3) },
    { id: uid('exam'), subjectId: dbms.id, name: 'DBMS Quiz', date: addDays(today, 9), topics: topics(['ER modelling', 'Normalization', 'SQL joins', 'Transactions'], 1) },
    { id: uid('exam'), subjectId: os.id, name: 'OS Midterm', date: addDays(today, 13), topics: topics(['Processes & threads', 'CPU scheduling', 'Deadlocks', 'Memory management', 'File systems'], 0) },
  ];

  const t = (title: string, s: Subject, due: number, priority: Task['priority'], est: number, extra: Partial<Task> = {}): Task => ({ id: uid('task'), title, subjectId: s.id, deadline: addDays(today, due), priority, estimatedTime: est, completed: false, ...extra });
  const avl = t('Implement AVL tree rotations', dsa, 1, 'High', 60);
  const nf = t('Normalization problem set (3NF / BCNF)', dbms, 1, 'High', 45);
  const sched = t('CPU scheduling problems (FCFS, SJF, RR)', os, 0, 'High', 50);
  const sidebar = t('Build responsive sidebar component', web, -1, 'Medium', 50);
  const tasks: Task[] = [
    avl, nf, sched, sidebar,
    t('Graph traversal: BFS & DFS', dsa, 4, 'High', 75),
    t('Subnetting practice set', cn, 3, 'Medium', 45),
    t('Deadlocks: detection & avoidance', os, 2, 'Medium', 45),
    t('Revise TCP handshake & congestion control', cn, 5, 'Medium', 40),
    t('Read chapter on B+ trees', dbms, 0, 'Low', 30, { completed: true, completedAt: new Date().toISOString() }),
    t('ACID & serializability notes', dbms, -1, 'Medium', 40, { completed: true, completedAt: new Date(Date.now() - 86400000).toISOString() }),
  ];

  const sessions: StudySession[] = [];
  const plan: [number, Subject, number, number][] = [
    [6, dsa, 18, 60], [5, dbms, 19, 45], [4, os, 18, 50], [3, dsa, 19, 75], [2, cn, 18, 40], [2, dbms, 20, 35], [1, dsa, 19, 55], [0, os, 7, 40],
  ];
  for (const [ago, s, hour, mins] of plan) {
    const date = addDays(today, -ago);
    const [y, m, d] = date.split('-').map(Number);
    sessions.push({ id: uid('sess'), subjectId: s.id, date, durationMinutes: mins, plannedMinutes: mins, type: 'Deep Work', startedAt: new Date(y, m - 1, d, hour, 30).toISOString() });
  }

  const blk = (task: Task, date: string, time: string): PlannedBlock => ({ id: uid('blk'), taskId: task.id, subjectId: task.subjectId, title: task.title, date, startTime: time, durationMinutes: Math.min(task.estimatedTime, 60), isBreak: false, status: 'planned', source: 'planner' });
  const blocks: PlannedBlock[] = [
    blk(sidebar, addDays(today, -1), `${pad(19)}:00`), // missed → shows adaptive rescheduling
    blk(avl, addDays(today, 1), '18:00'),
    blk(nf, addDays(today, 1), '19:15'),
  ];
  return { subjects, exams, tasks, sessions, blocks };
}
