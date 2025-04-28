// src/lib/analyzers/timestamp.ts
import type {
    DateValue,
    TimeValue,
    DateTimeValue,
    Cmp,
    LexToken,
    ParseError,
    Segment,
    TimestampValue,
  } from '../parsers/types.js';
  
  /**
   * Shared analyser for keywords that accept timestamp tokens and (optionally)
   * a single boolean flag.
   *
   * @param seg          The segment produced by scanner+tokeniser.
   * @param allowBoolean Whether this keyword should accept a boolean instead of
   *                     timestamp tokens (eg. @deleted).
   *
   * @returns `{ parsed, errors }`
   *          • `parsed` is either:
   *              – `undefined`   when there were no tokens at all
   *              – `boolean`     if a boolean was supplied / defaulted
   *              – `TimestampValue[]` array of timestamp or comparison objects
   *          • `errors`   list of semantic errors generated inside the helper
   */
  export function timestampAnalyzer(
    seg: Segment,
    { allowBoolean = false }: { allowBoolean?: boolean }
  ): { parsed: boolean | TimestampValue[] | undefined; errors: ParseError[] } {

  
    const timestamps: TimestampValue[] = [];
    const errors: ParseError[] = [];
  
    /* Flags for “one per operator” invariant */
    let seenLt = false;
    let seenGt = false;
  
    /* Boolean branch control */
    let booleanValue: boolean | undefined;
  
    /* ---------------------------------------------------------------------- */
    /* Walk tokens                                                            */
    /* ---------------------------------------------------------------------- */
    for (const tok of seg.tokens) {
      /* ---------------- timestamp tokens ---------------- */
      if (
        tok.kind === 'date' ||
        tok.kind === 'time' ||
        tok.kind === 'datetime'
      ) {
        if (booleanValue !== undefined) {
          errors.push(combineErr(tok));
          continue;
        }
  
        // handle comparison op
        if (tok.op) {
          if (tok.op === '<') {
            if (seenLt) {
              errors.push(dupErr(tok, '<'));
              continue;
            }
            seenLt = true;
          } else {
            if (seenGt) {
              errors.push(dupErr(tok, '>'));
              continue;
            }
            seenGt = true;
          }
          timestamps.push({ op: tok.op, value: tok.value });
        } else {
          timestamps.push(tok.value as DateValue | TimeValue | DateTimeValue);
        }
        continue;
      }
  
      /* ---------------- boolean token ---------------- */
      if (allowBoolean && tok.kind === 'boolean') {
        if (booleanValue !== undefined) {
          errors.push({
            message: 'duplicate boolean flag',
            token: tok.raw,
            from: tok.from,
            to: tok.to,
          });
          continue;
        }
        if (timestamps.length) {
          errors.push(combineErr(tok));
          continue;
        }
        booleanValue = tok.value;
        continue;
      }
  
      /* ---------------- everything else ---------------- */
      errors.push({
        message: `invalid token "${tok.raw}"`,
        token: tok.raw,
        from: tok.from,
        to: tok.to,
      });
    }
  
    /* ---------------------------------------------------------------------- */
    /* Derive final parsed value                                              */
    /* ---------------------------------------------------------------------- */
    let parsed: boolean | TimestampValue[] | undefined;
    if (booleanValue !== undefined) {
      parsed = booleanValue;
    } else if (timestamps.length) {
      parsed = timestamps;
    } else {
      // no tokens provided
      parsed = allowBoolean ? undefined : timestamps; // undefined for @deleted
    }
  
    // caller decides whether to push errors into seg.errors
    return { parsed, errors };
  
    /* -------------------------------------------------------------------- */
    /* helpers                                                              */
    /* -------------------------------------------------------------------- */
    function dupErr(tok: LexToken, op: string): ParseError {
      return {
        message: `duplicate "${op}" operator`,
        token: tok.raw,
        from: tok.from,
        to: tok.to,
      };
    }
  
    function combineErr(tok: LexToken): ParseError {
      return {
        message: 'cannot combine boolean flag with timestamps',
        token: tok.raw,
        from: tok.from,
        to: tok.to,
      };
    }
  }
  