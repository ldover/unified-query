import type {
    Segment,
    ParseError,
    ParsedKeyword,
    Keyword,
    LexToken,
  } from '../parsers/types.js';
  

export function createUtilAnalyzer<K extends Keyword>(keyword: K) {
  return function(
    seg: Segment
  ): ParsedKeyword<K, undefined> {
    const errors: ParseError[] = [];
  
    for (const tok of seg.tokens) {
      // any token
      errors.push(invalidTokErr(tok, keyword));
    }
  
    seg.errors.push(...errors);
  
    return {
      keyword: keyword,
      parsed: undefined,
      from: seg.from,
      to:   seg.to,
      raw:  seg.raw,
    };
  }
}

/* -------------------------------------------------------------------------- */
/* helpers                                                                    */
/* -------------------------------------------------------------------------- */
function invalidTokErr(tok: LexToken, keyword: string): ParseError {
  return {
    message: `invalid token "${tok.raw}" for @${keyword} (expects a single boolean)`,
    token: tok.raw,
    from: tok.from,
    to:   tok.to,
  };
}
