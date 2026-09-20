import type { Priority, Subject } from '../types';
import { addDays, initials, toDateStr } from './format';

export interface Parsed {
  title: string;
  subjectId: string | null;
  deadline: string;
  duration: number;
  priority: Priority;
  found: { subject: boolean; deadline: boolean; duration: boolean; priority: boolean };
}

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

export function parseQuickCapture(text: string, subjects: Subject[], today: string): Parsed {
  let rest = ` ${text} `;
  const cut = (re: RegExp) => {
    const m = rest.match(re);
    if (m) rest = rest.replace(re, ' ');
    return m;
  };

  // duration
  let duration = 45;
  let fDuration = true;
  const hm = cut(/\b(?:for\s+)?(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\b(?:\s*(?:and\s*)?(\d+)\s*(?:minutes?|mins?|m)\b)?/i);
  if (hm) duration = Math.round(parseFloat(hm[1]) * 60 + (hm[2] ? parseInt(hm[2], 10) : 0));
  else {
    const mm = cut(/\b(?:for\s+)?(\d+)\s*(?:minutes?|mins?|m)\b/i);
    if (mm) duration = parseInt(mm[1], 10);
    else if (cut(/\b(?:for\s+)?an?\s+hour\b/i)) duration = 60;
    else fDuration = false;
  }
  duration = Math.min(480, Math.max(5, duration));

  // priority
  let priority: Priority = 'Medium';
  let fPriority = true;
  if (cut(/\b(?:urgent|asap|important|high\s+priority)\b/i)) priority = 'High';
  else if (cut(/\b(?:low\s+priority|whenever|someday)\b/i)) priority = 'Low';
  else fPriority = false;

  // deadline
  let deadline = addDays(today, 1);
  let fDeadline = true;
  const base = new Date(today + 'T00:00:00');
  let m: RegExpMatchArray | null;
  if (cut(/\b(?:by\s+|due\s+|on\s+)?(?:today|tonight)\b/i)) deadline = today;
  else if (cut(/\b(?:by\s+|due\s+|on\s+)?(?:tomorrow|tmrw)\b/i)) deadline = addDays(today, 1);
  else if ((m = cut(/\bin\s+(\d+)\s+days?\b/i))) deadline = addDays(today, parseInt(m[1], 10));
  else if (cut(/\b(?:by\s+|due\s+)?next\s+week\b/i)) deadline = addDays(today, 7);
  else if ((m = cut(/\b(?:by\s+|due\s+|on\s+)?(next\s+)?(sun|mon|tue|tues|wed|thu|thur|thurs|fri|sat)[a-z]*\b/i))) {
    const target = DAYS.findIndex((d) => d.startsWith(m![2].toLowerCase().slice(0, 3)));
    let diff = (target - base.getDay() + 7) % 7;
    if (diff === 0 || m[1]) diff = diff === 0 ? 7 : diff;
    deadline = addDays(today, diff);
  } else if ((m = cut(/\b(?:by\s+|due\s+|on\s+)?(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{1,2})(?:st|nd|rd|th)?\b/i))) {
    const mon = MONTHS.indexOf(m[1].toLowerCase());
    let d = new Date(base.getFullYear(), mon, parseInt(m[2], 10));
    if (toDateStr(d) < today) d = new Date(base.getFullYear() + 1, mon, parseInt(m[2], 10));
    deadline = toDateStr(d);
  } else fDeadline = false;

  // subject: code, name, initials (OS, DSA…), or a distinctive name word
  const tokens = new Set(text.toLowerCase().match(/[a-z0-9+#]+/g) ?? []);
  let best: { id: string; score: number } | null = null;
  for (const s of subjects) {
    let score = 0;
    const code = s.code.toLowerCase();
    const name = s.name.toLowerCase();
    if (code && tokens.has(code)) score = 10;
    else if (name && text.toLowerCase().includes(name)) score = 9;
    else {
      const ini = initials(s.name).toLowerCase();
      if (ini.length >= 2 && tokens.has(ini)) score = 9;
      else if (name.split(/[\s/&-]+/).some((w) => w.length >= 4 && (tokens.has(w) || tokens.has(w.replace(/s$/, ''))))) score = 4;
    }
    if (score > 0 && (!best || score > best.score)) best = { id: s.id, score };
  }

  let title = rest
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[\s,;:-]+$/g, '')
    .replace(/\b(?:for|by|on|due|at|in)$/i, '')
    .trim();
  if (!title) title = text.trim();
  title = title.charAt(0).toUpperCase() + title.slice(1);

  return { title, subjectId: best?.id ?? null, deadline, duration, priority, found: { subject: !!best, deadline: fDeadline, duration: fDuration, priority: fPriority } };
}
