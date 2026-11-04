const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const pad = (n: number) => String(n).padStart(2, '0');

export const toISO = (d: Date): string =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const parseISO = (s: string): Date => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const addDays = (d: Date, n: number): Date =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

/** Weeks start on Monday. */
export const startOfWeek = (d: Date): Date => addDays(d, -((d.getDay() + 6) % 7));

export const weekDates = (anchorISO: string): Date[] => {
  const start = startOfWeek(parseISO(anchorISO));
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
};

export const dayShort = (d: Date) => DAYS_SHORT[d.getDay()];

/** "Tue 4 Nov" */
export const formatDay = (iso: string): string => {
  const d = parseISO(iso);
  return `${DAYS_SHORT[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
};

/** "Tuesday, 4 Nov" */
export const formatLongDay = (iso: string): string => {
  const d = parseISO(iso);
  return `${DAYS_LONG[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
};

/** "3–9 Nov" or "28 Oct – 3 Nov" */
export const formatRange = (dates: Date[]): string => {
  const a = dates[0];
  const b = dates[dates.length - 1];
  if (a.getMonth() === b.getMonth()) {
    return `${a.getDate()}–${b.getDate()} ${MONTHS[b.getMonth()]}`;
  }
  return `${a.getDate()} ${MONTHS[a.getMonth()]} – ${b.getDate()} ${MONTHS[b.getMonth()]}`;
};
