// src/parse/analyze/name.ts
import type { Segment, ParseError, ParsedKeyword } from '../parsers/types.js';

export function analyzeName(seg: Segment): ParsedKeyword<'name', string> {
  
  // collapse all the tokens into a string
  let str = seg.tokens.map(t => t.raw).join(' ')

  return {
    keyword: 'name',
    parsed:  str,
    from: seg.from,
    to:   seg.to,
    raw:  seg.raw
  };
}
