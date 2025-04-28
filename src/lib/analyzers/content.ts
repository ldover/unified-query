// src/parse/analyze/content.ts
import type { Segment, ParseError, ParsedKeyword } from '../parsers/types.js';

// TODO: DRY-up (duplicate from name analyzer)
export function analyzeContent(seg: Segment): ParsedKeyword<'content', string> {
  
  // collapse all the tokens into a string
  let str = seg.tokens.map(t => t.raw).join(' ')

  return {
    keyword: 'content',
    parsed:  str,
    from: seg.from,
    to:   seg.to,
    raw:  seg.raw
  };
}
