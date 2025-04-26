// src/parse/timestamp.ts
import type { ParseError } from './parse.js';

/** Accepted lexical forms (no leading < or >). */
const DATE_RE      = /^\d{4}(?:\/(?:0?[1-9]|1[0-2])(?:\/(?:0?[1-9]|[12]\d|3[01]))?)?$/;
const TIME_24_RE   = /^(?:[01]?\d|2[0-3])(?::[0-5]\d)?$/;           // 0-23(:59)
const TIME_12_RE   = /^(?:0?\d|1[0-2])(?::[0-5]\d)?(?:am|pm)$/i;    // 1-12(:59)am
const DATETIME_RE  = /^\d{4}\/(?:0?[1-9]|1[0-2])\/(?:0?[1-9]|[12]\d|3[01])-(?:[01]?\d|2[0-3]):[0-5]\d$/;

export type TimestampKind = 'date' | 'time' | 'datetime';

export interface TSParseOk {
  ok: true;
  kind: TimestampKind;
}

export interface TSParseErr extends ParseError {
  ok: false;
}

export function parseTimestampToken(token: string, pos: number): TSParseOk | TSParseErr {
  const norm = token.toLowerCase();

  if (DATETIME_RE.test(norm)) return { ok: true, kind: 'datetime' };
  if (DATE_RE.test(norm))     return { ok: true, kind: 'date' };
  if (TIME_24_RE.test(norm) || TIME_12_RE.test(norm)) return { ok: true, kind: 'time' };

  return {
    ok: false,
    message: `invalid date/time token`,
    token,
    from: pos,
    to: pos + token.length
  };
}
