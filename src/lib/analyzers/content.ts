// src/parse/analyze/created.ts
import { unescapeAt } from '$lib/analyzers/util.js';
import type { Segment, ParseError, ParsedKeyword } from '../parsers/types.js';

// TODO: DRY-up w/ analyzeName in name.ts
export function analyzeContent(seg: Segment): ParsedKeyword<'content', string> {
  
  // collapse all the tokens into a string
  let str = seg.tokens.map(t => t.raw).join()
  // Escape \@
  str = unescapeAt(str)

  // Maybe push error for the dangling \\

  return {
    keyword: 'content',
    parsed:  str,
    from: seg.from,
    to:   seg.to,
    raw:  seg.raw
  };
}
