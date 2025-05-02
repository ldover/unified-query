// src/lib/analyzers/time.ts
import type {
    TimeValue,
    LexToken,
    Segment,
    ParseError,
    ParsedKeyword,
    Cmp,
  } from '../parsers/types.js';
  
  /**
   * Semantic analyser for `@time`.
   * Accepts only tokens of kind `"time"`.  Any other token is reported
   * as a semantic error (“invalid token for @time”).
   */
  export function analyzeTime(
    seg: Segment
  ): ParsedKeyword<'time', (TimeValue | Cmp<TimeValue>)[] > {
    const times: (TimeValue | Cmp<TimeValue>)[] = [];
    const errors: ParseError[] = [];
  
    for (const tok of seg.tokens) {
      if (tok.kind === 'time') {
        if (tok.op) {
          times.push({op: tok.op, ...tok.value })
        } else {
          times.push(tok.value);
        }
        continue;
      }
  
      // anything else -> semantic error
      errors.push({
        message: `invalid token "${tok.raw}" for @time`,
        token: tok.raw,
        from: tok.from,
        to: tok.to,
      });
    }
  
    // expose semantic errors for the CodeMirror linter
    seg.errors.push(...errors);
  
    return {
      keyword: 'time',
      parsed: times,
      from: seg.from,
      to: seg.to,
      raw: seg.raw,
    };
  }
  