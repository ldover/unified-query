// src/parse/__tests__/timestamp.spec.ts
import { describe, it, expect } from 'vitest';
import { makeTimestampParser, parseTimestampToken } from '../parser/timestamp.js';
import { seg } from './util.js';


/* ──────────────────── parseTimestampToken ─────────────────── */

describe('parseTimestampToken', () => {
  it('recognises YYYY/MM/DD', () => {
    const r = parseTimestampToken('2024/05/10', 0);
    expect(r).toEqual({ ok: true, kind: 'date' });
  });

  it('recognises YYYY only', () => {
    expect(parseTimestampToken('1999', 0)).toEqual({ ok: true, kind: 'date' });
  });

  it('recognises 24-hour time', () => {
    expect(parseTimestampToken('23:59', 0)).toEqual({ ok: true, kind: 'time' });
  });

  it('recognises 12-hour time', () => {
    expect(parseTimestampToken('7pm', 0)).toEqual({ ok: true, kind: 'time' });
  });

  it('recognises datetime long form', () => {
    expect(parseTimestampToken('2025/04/26-12:00', 0)).toEqual({
      ok: true,
      kind: 'datetime',
    });
  });

  it('rejects malformed token', () => {
    const r = parseTimestampToken('2024-13-40', 5);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.from).toBe(5);
      expect(r.token).toBe('2024-13-40');
    }
  });
});

/* ───────────────── makeTimestampParser ───────────────────── */

describe('makeTimestampParser', () => {
  const completed = makeTimestampParser({ keyword: 'completed', allowBoolean: true });

  it('empty body → empty parsed array', () => {
    const { tokens, errors } = completed(seg('completed', ''));
    expect(errors).toEqual([]);
    expect(tokens[0].parsed).toEqual([]);
  });

  it('boolean true accepted (when allowed)', () => {
    const { tokens } = completed(seg('completed', 'true'));
    expect(tokens[0].parsed).toEqual([true]);
  });

  it('boolean blocked when allowBoolean = false', () => {
    const created = makeTimestampParser({ keyword: 'created', allowBoolean: false });
    const { errors } = created(seg('created', 'false'));
    expect(errors[0].message).toMatch(/invalid date\/time/i);
  });

  it('collects comparison tokens', () => {
    const { tokens, errors } = completed(seg('completed', '>2024 2025/01'));
    expect(errors).toEqual([]);
    expect(tokens[0].parsed).toEqual([
      { op: '>', value: '2024' },
      { op: undefined, value: '2025/01' },
    ]);
  });

  it('kindFilter=date rejects time token', () => {
    const dateOnly = makeTimestampParser({
      keyword: 'date',
      allowBoolean: false,
      kindFilter: ['date'],
    });
    const { errors } = dateOnly(seg('date', '12:00'));
    expect(errors.length).toBe(1);
  });
});
