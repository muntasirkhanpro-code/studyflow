let counter = 0;
export function uid(prefix = 'id'): string {
  const rand =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : `${Math.random().toString(36).slice(2, 8)}${(counter++).toString(36)}`;
  return `${prefix}-${rand}`;
}
