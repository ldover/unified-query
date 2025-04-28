// src/parse/analyze/created.ts
import type { Segment, ParseError, ParsedKeyword } from '../parsers/types.js';

export function analyzeId(seg: Segment): ParsedKeyword<'id', string[]> {
  const ids: string[] = [];
  const errors: ParseError[] = [];

  for (const tok of seg.tokens) {
    if (tok.kind === 'uuid') {
      ids.push(tok.value);
    }

    errors.push({
      message: `invalid token "${tok.raw}" for @id`,
      token: tok.raw,
      from: tok.from,
      to: tok.to
    });
  }

  seg.errors.push(...errors);

  return {
    keyword: 'id',
    parsed:  ids,
    from: seg.from,
    to:   seg.to,
    raw:  seg.raw
  };
}
