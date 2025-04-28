// src/lib/analyzers/date.ts
import type {
    DateValue,
    LexToken,
    Segment,
    ParseError,
    ParsedKeyword,
  } from '../parsers/types.js';
  
  /**
   * Semantic analyser for the `@date` keyword.
   * Accepts only tokens produced by `dateParser` (kind === "date").
   * Everything else is reported as an invalid token.
   */
  export function analyzeDate(
    seg: Segment
  ): ParsedKeyword<'date', DateValue[]> {
    const dates: DateValue[] = [];
    const errors: ParseError[] = [];
  
    for (const tok of seg.tokens) {
      if (tok.kind === 'date') {
        dates.push(tok.value as DateValue);
        continue;
      }
  
      errors.push(invalid(tok));
    }
  
    // surface the semantic errors in the segment (for CM linter)
    seg.errors.push(...errors);
  
    return {
      keyword: 'date',
      parsed: dates,
      from: seg.from,
      to: seg.to,
      raw: seg.raw,
    };
  }
  
  /* -------------------------------------------------------------------------- */
  /* helpers                                                                    */
  /* -------------------------------------------------------------------------- */
  function invalid(tok: LexToken): ParseError {
    return {
      message: `invalid token "${tok.raw}" for @date`,
      token: tok.raw,
      from: tok.from,
      to: tok.to,
    };
  }
  