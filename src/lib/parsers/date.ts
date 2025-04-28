/* -------------------------------------------------------------------------- */
/*  Date / time micro-parsers                                                 */
/* -------------------------------------------------------------------------- */

import type {
  MicroParser,
  DateValue,
  TimeValue,
  DateTimeValue,
  LexToken,
  CmpOp,
} from './types.js';

/* ───────── helpers ───────── */

const daysInMonth = (y: number, m: number) =>
  new Date(y, m, 0).getDate(); // JS months are 1-based if day = 0

function cmpOp(word: string): [CmpOp | undefined, string] {
  if (word[0] === '<' || word[0] === '>') return [word[0] as CmpOp, word.slice(1)];
  return [undefined, word];
}

/* -------------------------------------------------------------------------- */
/*  DATE  YYYY | YYYY/MM | YYYY/MM/DD                                         */
/* -------------------------------------------------------------------------- */

export const dateParser: MicroParser = (raw, startPos) => {
  const [op, word] = cmpOp(raw);
  const parts = word.split('/');

  /* Fast structural checks first */
  if (parts.length < 1 || parts.length > 3) return null;
  if (!/^\d{4}$/.test(parts[0])) return null; // year must be 4 digits

  const year = +parts[0];
  let month: number | undefined;
  let day: number | undefined;

  if (parts.length >= 2) {
    if (!/^(0?[1-9]|1[0-2])$/.test(parts[1])) return null;
    month = +parts[1];
  }
  if (parts.length === 3) {
    if (!/^(0?[1-9]|[12]\d|3[01])$/.test(parts[2])) return null;
    day = +parts[2];
    if (!month) return null; // day without month impossible
    if (day > daysInMonth(year, month)) return null;
  }

  const value: DateValue = { y: year };
  if (month !== undefined) value.m = month;
  if (day !== undefined) value.d = day;

  return {
    kind: 'date',
    op,
    value,
    raw,
    from: startPos,
    to: startPos + raw.length,
  } satisfies LexToken;
};

/* -------------------------------------------------------------------------- */
/*  DATETIME  YYYY/MM/DD-HH:mm                                                */
/* -------------------------------------------------------------------------- */

export const datetimeParser: MicroParser = (raw, startPos) => {
  const [op, word] = cmpOp(raw);
  const [datePart, timePart] = word.split('-');
  if (!timePart) return null;

  const dateTok = dateParser(datePart, startPos);
  if (!dateTok) return null;

  /* 24-hour HH:mm exactly two components */
  const m = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(timePart);
  if (!m) return null;

  const h = +m[1];
  const min = +m[2];

  const value: DateTimeValue = {
    y: (dateTok as any).value.y,
    m: (dateTok as any).value.m!,
    d: (dateTok as any).value.d!,
    h,
    min,
  };

  return {
    kind: 'datetime',
    op,
    value,
    raw,
    from: startPos,
    to: startPos + raw.length,
  } satisfies LexToken;
};

/* -------------------------------------------------------------------------- */
/*  TIME (24h or 12h with am/pm)                                              */
/* -------------------------------------------------------------------------- */

export const timeParser: MicroParser = (raw, startPos) => {
  const [op, word] = cmpOp(raw);

  /* ---------- 24-hour HH or HH:mm -------- */
  let m = /^([01]?\d|2[0-3])(?::([0-5]\d))?$/.exec(word);
  if (m) {
    const h = +m[1];
    const min = m[2] === undefined ? undefined : +m[2];
    const value: TimeValue = { h, clock: '24h' };
    if (min !== undefined) value.m = min;

    return {
      kind: 'time',
      op,
      value,
      raw,
      from: startPos,
      to: startPos + raw.length,
    } satisfies LexToken;
  }

  /* ---------- 12-hour H or H:mm am/pm ---- */
  m = /^(0?\d|1[0-2])(?::([0-5]\d))?(am|pm)$/i.exec(word);
  if (!m) return null;

  let h12 = +m[1];
  const min12 = m[2] === undefined ? undefined : +m[2];
  const suffix = m[3].toLowerCase();

  // Convert 12am -> 0, 12pm stays 12
  if (suffix === 'am') {
    if (h12 === 12) h12 = 0;
  } else {
    // pm
    if (h12 !== 12) h12 += 12;
  }

  const value: TimeValue = { h: h12, clock: '12h' };
  if (min12 !== undefined) value.m = min12;

  return {
    kind: 'time',
    op,
    value,
    raw,
    from: startPos,
    to: startPos + raw.length,
  } satisfies LexToken;
};
