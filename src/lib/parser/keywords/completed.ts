// src/parse/keywords/completed.ts
import { parseTimestampToken } from '../timestamp.js';
import type { Cmp, ParseError, Token } from '../parse.js';
import type { Segment } from '../scanner.js';

const BOOL_RE = /^(true|false)$/i;

export const parseCompleted = (seg: Segment) => {
  const parts = seg.body.trim().split(/\s+/).filter(Boolean);
  const tokens: Token[] = [];
  const errors: ParseError[] = [];

  /* empty → [] */
  if (parts.length === 0) {
    tokens.push({ keyword:'completed', parsed:[], from:seg.from, to:seg.to, raw:seg.raw });
    return { tokens, errors };
  }

  /* boolean */
  if (parts.length === 1 && BOOL_RE.test(parts[0])) {
    tokens.push({
      keyword:'completed',
      parsed:[parts[0].toLowerCase()==='true'],
      from:seg.from, to:seg.to, raw:seg.raw
    });
    return { tokens, errors };
  }

  /* date/datetime tokens */
  const cmps: Cmp[] = [];
  let cur = seg.from + seg.keyword.length + 2;   // cursor for error offsets

  for (const raw of parts) {
    const op = raw.startsWith('<') ? '<' : raw.startsWith('>') ? '>' : undefined;
    const tok = op ? raw.slice(1) : raw;

    const r = parseTimestampToken(tok, cur + (op ? 1 : 0));
    if (r.ok) {
      cmps.push({ op, value: tok });
    } else {
      errors.push(r);
    }
    cur += raw.length + 1;
  }

  tokens.push({ keyword:'completed', parsed:cmps, from:seg.from, to:seg.to, raw:seg.raw });
  return { tokens, errors };
};
