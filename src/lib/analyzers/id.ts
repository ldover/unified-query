// src/lib/analyzers/id.ts
import type {
    LexToken,
    Segment,
    ParseError,
    ParsedKeyword,
  } from '../parsers/types.js';
  
  /**
   * Semantic analyser for `@id`.
   *
   * • Accepts only `uuid` tokens and returns their `.value` strings in order.  
   * • Any other token kind is reported as an “invalid token for @id” error.  
   */
  export function analyzeId(seg: Segment): ParsedKeyword<'id', string[]> {
    const ids: string[] = [];
    const errors: ParseError[] = [];
  
    for (const tok of seg.tokens) {
      if (tok.kind === 'uuid') {
        ids.push(tok.value);
        continue;
      }
  
      errors.push({
        message: `invalid token "${tok.raw}" for @id`,
        token: tok.raw,
        from: tok.from,
        to: tok.to,
      });
    }
  
    // Surface semantic errors for CodeMirror linter
    seg.errors.push(...errors);
  
    return {
      keyword: 'id',
      parsed: ids,
      from: seg.from,
      to: seg.to,
      raw: seg.raw,
    };
  }
  