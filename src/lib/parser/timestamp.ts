// src/parse/timestamp.ts
import type { Cmp, ParseError, Token } from './parse.js';
import type { Segment } from './scanner.js';

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


export interface TSOptions {
  allowBoolean: boolean;          // completed / archived / deleted
  keyword:      string;           // injected so raw slice stays correct
  kindFilter?:  TimestampKind[];  // e.g. ['date'] for @date, ['time'] for @time
}

export const makeTimestampParser =
  ({ keyword, allowBoolean, kindFilter }: TSOptions) =>
  (seg: Segment) => {
    const parts   = seg.body.trim().split(/\s+/).filter(Boolean);
    const tokens: Token[] = [];
    const errors: ParseError[] = [];

    if (parts.length === 0) {
      tokens.push({ keyword, parsed: [], from: seg.from, to: seg.to, raw: seg.raw });
      return { tokens, errors };
    }


    // Boolean lane
    if (allowBoolean && parts.length === 1 && /^(true|false)$/i.test(parts[0])) {
      tokens.push({ keyword, parsed:[parts[0].toLowerCase()==='true'], from:seg.from, to:seg.to, raw:seg.raw });
      return { tokens, errors };
    }

    // Date / time comparisons
    const cmps: Cmp[] = [];
    let cursor = seg.from + keyword.length + 2;

    for (const raw of parts) {
      const op  = raw[0] === '<' || raw[0] === '>' ? (raw[0] as '<'|'>') : undefined;
      const val = op ? raw.slice(1) : raw;

      const res = parseTimestampToken(val, cursor + (op ? 1 : 0));
      cursor   += raw.length + 1;

      if (res.ok && (!kindFilter || kindFilter.includes(res.kind))) {
        cmps.push({ op, value: val });
      } else {
        // TODO: this message is too general. For @time keywork it should write invalid time token      
        errors.push({
          message: 'invalid date/time token',
          token: raw,
          from:   cursor - raw.length - 1,
          to:     cursor - 1
        });
      }
    }

    tokens.push({ keyword, parsed: cmps, from: seg.from, to: seg.to, raw: seg.raw });
    return { tokens, errors };
  };
