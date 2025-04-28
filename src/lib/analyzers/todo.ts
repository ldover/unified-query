import type {
    Segment,
    ParseError,
    ParsedKeyword,
  } from '../parsers/types.js';
  
  /**
   * `@todo` is a parameter-less flag (alias for “@completed false”).
   * • If *no* tokens follow → parsed = true (flag enabled).
   * • Any token present → semantic error.
   */
  export function analyzeTodo(seg: Segment): ParsedKeyword<'todo', undefined> {
    const errors: ParseError[] = [];
  
    if (seg.tokens.length) {
      for (const tok of seg.tokens) {
        errors.push({
          message: `invalid token "${tok.raw}" for @todo (no arguments allowed)`,
          token: tok.raw,
          from: tok.from,
          to: tok.to,
        });
      }
    }
  
    seg.errors.push(...errors);
  
    return {
      keyword: 'todo',
      parsed: undefined,
      from: seg.from,
      to: seg.to,
      raw: seg.raw,
    };
  }
  