import { describe, it, expect } from 'vitest';
import { dateParser, datetimeParser, timeParser } from './date.js';

// Helper wrappers – default `pos` to 0 so individual test cases stay concise
const d  = (raw: string, pos = 0) => dateParser(raw, pos);
const dt = (raw: string, pos = 0) => datetimeParser(raw, pos);
const tm = (raw: string, pos = 0) => timeParser(raw, pos);

const must = <T>(tok: T | null): T => {
  expect(tok).not.toBeNull();
  return tok as T;
};
/* -------------------------------------------------------------------------- */
// Date parser tests
/* -------------------------------------------------------------------------- */
describe('dateParser', () => {
  it('parses YYYY', () => {
    const tok = must(d('2024'));
    expect(tok.kind).toBe('date');
    expect(tok.value).toEqual({ y: 2024 });
    expect(tok.from).toBe(0);
    expect(tok.to).toBe(4);
  });

  it('parses YYYY/MM', () => {
    const tok = must(d('2024/01'));
    expect(tok.value).toEqual({ y: 2024, m: 1 });
  });

  it('parses YYYY/M/D', () => {
    const tok = must(d('2024/1/5'));
    expect(tok.value).toEqual({ y: 2024, m: 1, d: 5 });
  });

  it('accepts comparison operators', () => {
    const before = must(d('<2023'));
    expect(before.op).toBe('<');
    expect(before.value).toEqual({ y: 2023 });

    const after = must(d('>2024/12/31'));
    expect(after.op).toBe('>');
    expect(after.value).toEqual({ y: 2024, m: 12, d: 31 });
  });

  it('respects position argument', () => {
    const tok = must(d('2024', 5));
    expect(tok.from).toBe(5);
    expect(tok.to).toBe(9);
  });

  it('rejects malformed dates', () => {
    expect(d('202')).toBeNull();
    expect(d('2024-01')).toBeNull();
    expect(d('2024/13')).toBeNull();
    expect(d('2024/02/30')).toBeNull();
  });
});

/* -------------------------------------------------------------------------- */
/* Datetime parser tests                                                      */
/* -------------------------------------------------------------------------- */
describe('datetimeParser', () => {
  it('parses long form “YYYY/MM/DD-HH:mm”', () => {
    const tok = must(dt('2024/06/15-09:30'));
    expect(tok.kind).toBe('datetime');
    expect(tok.value).toEqual({ y: 2024, m: 6, d: 15, h: 9, min: 30 });
    expect(tok.from).toBe(0);
    expect(tok.to).toBe(16);          // "2024/06/15-09:30".length
  });

  it('accepts single-digit month / day', () => {
    const tok = must(dt('2024/6/1-0:00'));
    expect(tok.value).toEqual({ y: 2024, m: 6, d: 1, h: 0, min: 0 });
  });

  it('accepts comparison operators', () => {
    const before = must(dt('<2023/12/31-23:59'));
    expect(before.op).toBe('<');
    expect(before.value).toEqual({ y: 2023, m: 12, d: 31, h: 23, min: 59 });

    const after = must(dt('>2025/01/01-00:00'));
    expect(after.op).toBe('>');
    expect(after.value).toEqual({ y: 2025, m: 1, d: 1, h: 0, min: 0 });
  });

  it('respects position argument', () => {
    const tok = must(dt('2024/02/29-12:45', 7));
    expect(tok.from).toBe(7);
    expect(tok.to).toBe(23);          // 7 + 16 chars
  });

  it('rejects malformed datetimes', () => {
    // missing time part
    expect(dt('2024/01/01')).toBeNull();
    // wrong separator between date & time
    expect(dt('2024/01/01 12:00')).toBeNull();
    // invalid hour / minute
    expect(dt('2024/01/01-24:00')).toBeNull();
    expect(dt('2024/01/01-12:60')).toBeNull();
    // invalid date component
    expect(dt('2024/13/01-00:00')).toBeNull();
    expect(dt('2024/02/30-00:00')).toBeNull();
  });
});

/* -------------------------------------------------------------------------- */
/* Time parser tests                                                          */
/* -------------------------------------------------------------------------- */
describe('timeParser', () => {
  // ── 24-hour clock ────────────────────────────────────────────────────────
  it('parses “HH” (24-hour, minutes default 0)', () => {
    const tok = must(tm('09'));
    expect(tok.kind).toBe('time');
    expect(tok.value).toEqual({ h: 9, clock: '24h' });
  });

  it('parses “HH:mm” (24-hour with minutes)', () => {
    const tok = must(tm('23:45'));
    expect(tok.value).toEqual({ h: 23, m: 45, clock: '24h' });
  });

  // ── 12-hour clock with am/pm suffix ──────────────────────────────────────
  it('parses “H(am|pm)”', () => {
    const tok = must(tm('7am'));
    expect(tok.value).toEqual({ h: 7, clock: '12h' });
  });

  it('parses “H:mm(am|pm)”', () => {
    const tok = must(tm('3:05pm'));
    expect(tok.value).toEqual({ h: 15, m: 5, clock: '12h' });
  });

  it('handles noon / midnight edge-cases', () => {
    expect(must(tm('12pm')).value).toEqual({ h: 12, clock: '12h' }); // noon
    expect(must(tm('12am')).value).toEqual({ h: 0,  clock: '12h' }); // midnight
  });

  // ── comparison operators (< / >) ─────────────────────────────────────────
  it('accepts comparison operators', () => {
    const before = must(tm('<12pm'));
    expect(before.op).toBe('<');
    expect(before.value).toEqual({ h: 12, clock: '12h' });

    const after = must(tm('>09:00'));
    expect(after.op).toBe('>');
    expect(after.value).toEqual({ h: 9, m: 0, clock: '24h' });
  });

  // ── position argument respected ──────────────────────────────────────────
  it('respects position argument', () => {
    const tok = must(tm('15:45', 4));
    expect(tok.from).toBe(4);
    expect(tok.to).toBe(9);           // 5 characters long
  });

  // ── malformed inputs are rejected ────────────────────────────────────────
  it('rejects malformed times', () => {
    expect(tm('24')).toBeNull();            // hour out of range
    expect(tm('12:mm')).toBeNull();         // non-numeric minutes
    expect(tm('13pm')).toBeNull();          // 13 with pm suffix not allowed
    expect(tm('3:60pm')).toBeNull();        // minute out of range
    expect(tm('7:15xm')).toBeNull();        // bad suffix
    expect(tm('12:00 PM')).toBeNull();      // space before suffix
    expect(tm('10am:30')).toBeNull();       // suffix before minutes
  });
});

