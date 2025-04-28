// src/lib/analyzers/timestamp.ts
import type {
    DateValue,
    TimeValue,
    DateTimeValue,
    DateUtility,
    Cmp,
    LexToken,
    ParseError,
    Segment,
    TimestampValue,
  } from '../parsers/types.js';
  
  /* ------------------------------------------------------------ */
  /* helper union used by callers                                 */
  /* ------------------------------------------------------------ */
  type Acceptable =
    | TimestampValue                // date / time / datetime  (unchanged)
    | DateUtility;                  // single utility object
  
  /* -------------------------------------------------------------------------- */
  /* analyser                                                                   */
  /* -------------------------------------------------------------------------- */
  export function timestampAnalyzer(
    seg: Segment,
    { allowBoolean = false }: { allowBoolean?: boolean }
  ): { parsed: boolean | Acceptable[] | DateUtility | undefined; errors: ParseError[] } {
  
    const timestamps: Acceptable[] = [];
    const errors: ParseError[] = [];
  
    /* operator duplication guards */
    let seenLt = false;
    let seenGt = false;
  
    /* utility token exclusive branch */
    let utilValue: DateUtility | undefined;
  
    /* boolean branch */
    let booleanValue: boolean | undefined;
  
    /* ------------------------------------------------------------------ */
    /* iterate with index so we can enforce “utility must be first”       */
    /* ------------------------------------------------------------------ */
    seg.tokens.forEach((tok, idx) => {
      /* -------- date / time / datetime -------------------------------- */
      if (tok.kind === 'date' || tok.kind === 'time' || tok.kind === 'datetime') {
        if (utilValue) { errors.push(utilMixErr(tok)); return; }
        if (booleanValue !== undefined) { errors.push(combineErr(tok)); return; }
  
        if (tok.op) {
          if (tok.op === '<') {
            if (seenLt) { errors.push(dupErr(tok, '<')); return; }
            seenLt = true;
          } else {
            if (seenGt) { errors.push(dupErr(tok, '>')); return; }
            seenGt = true;
          }
          timestamps.push({ op: tok.op, value: tok.value });
        } else {
          timestamps.push(tok.value as DateValue | TimeValue | DateTimeValue);
        }
        return;
      }
  
      /* -------- date utility ------------------------------------------ */
      if (tok.kind === 'dateutil') {
        // must be first and exclusive; utilities cannot have op
        if (idx !== 0)                { errors.push(utilFirstErr(tok)); return; }
        if (tok.op)                   { errors.push(utilOpErr(tok));    return; }
        if (seg.tokens.length > 1)    { errors.push(utilMixErr(tok));   return; }
        utilValue = tok.value as DateUtility;
        return;
      }
  
      /* -------- boolean ------------------------------------------------ */
      if (allowBoolean && tok.kind === 'boolean') {
        if (utilValue) { errors.push(utilMixErr(tok)); return; }
        if (timestamps.length) { errors.push(combineErr(tok)); return; }
        if (booleanValue !== undefined) {
          errors.push({
            message: 'duplicate boolean flag',
            token: tok.raw, from: tok.from, to: tok.to,
          });
          return;
        }
        booleanValue = tok.value;
        return;
      }
  
      /* -------- anything else ----------------------------------------- */
      errors.push({
        message: `invalid token "${tok.raw}"`,
        token: tok.raw, from: tok.from, to: tok.to,
      });
    });
  
    /* ------------------------------------------------------------------ */
    /* derive parsed result                                               */
    /* ------------------------------------------------------------------ */
    let parsed: boolean | Acceptable[] | DateUtility | undefined;
  
    if (utilValue)                 parsed = utilValue;
    else if (booleanValue !== undefined) parsed = booleanValue;
    else if (timestamps.length)    parsed = timestamps;
    else if (allowBoolean)         parsed = undefined;   // no-arg case for @deleted
    else                           parsed = timestamps;  // empty list (created/etc.)
  
    return { parsed, errors };
  
    /* ------------------------------------------------------------------ */
    /* helpers                                                            */
    /* ------------------------------------------------------------------ */
    function dupErr(tok: LexToken, op: string): ParseError {
      return {
        message: `duplicate "${op}" operator`,
        token: tok.raw, from: tok.from, to: tok.to,
      };
    }
    function combineErr(tok: LexToken): ParseError {
      return {
        message: 'cannot combine boolean flag with timestamps',
        token: tok.raw, from: tok.from, to: tok.to,
      };
    }
    function utilFirstErr(tok: LexToken): ParseError {
      return {
        message: 'utility value must be first token',
        token: tok.raw, from: tok.from, to: tok.to,
      };
    }
    function utilMixErr(tok: LexToken): ParseError {
      return {
        message: 'cannot combine utility value with other arguments',
        token: tok.raw, from: tok.from, to: tok.to,
      };
    }
    function utilOpErr(tok: LexToken): ParseError {
      return {
        message: 'comparison operators are not allowed on utility values',
        token: tok.raw, from: tok.from, to: tok.to,
      };
    }
  }
  