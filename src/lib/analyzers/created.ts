// src/parse/analyze/created.ts
import type { DateValue } from '../parsers/types.js';
import type { Segment, ParseError, ParsedKeyword } from '../parsers/types.js';

export function analyzeCreated(seg: Segment): ParsedKeyword<'created', DateValue[]> {
  const dates: DateValue[] = [];
  const errors: ParseError[] = [];

  for (const tok of seg.tokens) {
    if (tok.kind === 'date' && (tok.value as DateValue).d) {
      // only accept full YYYY/MM/DD tokens (day precision)
      dates.push(tok.value as DateValue);
      continue;
    }

    // everything else is currently illegal
    errors.push({
      message: `invalid token "${tok.raw}" for @created`,
      token: tok.raw,
      from: tok.from,
      to: tok.to
    });
  }

  seg.errors.push(...errors);

  return {
    keyword: 'created',
    parsed:  dates,
    from: seg.from,
    to:   seg.to,
    raw:  seg.raw
  };
}
