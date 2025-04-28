// src/lib/analyzers/created.ts
import type {
  DateValue,
  TimeValue,
  DateTimeValue,
  Cmp,
  LexToken,
  Segment,
  ParseError,
  ParsedKeyword,
} from '../parsers/types.js';

type Acceptable =
  | DateValue
  | TimeValue
  | DateTimeValue
  | Cmp<DateValue | TimeValue | DateTimeValue>;

export function analyzeCreated(
  seg: Segment
): ParsedKeyword<'created', Acceptable[]> {
  const parsed: Acceptable[] = [];
  const errors: ParseError[] = [];

  let seenLt = false;
  let seenGt = false;

  for (const tok of seg.tokens) {
    /* -------------------------------------------------- */
    /* Supported token kinds                              */
    /* -------------------------------------------------- */
    const isStamp =
      tok.kind === 'date' || tok.kind === 'time' || tok.kind === 'datetime';

    if (isStamp) {
      // handle comparison operator wrapper
      if (tok.op) {
        if (tok.op === '<') {
          if (seenLt) {
            errors.push(dupErr(tok, "'<'"));
            continue;
          }
          seenLt = true;
        } else {
          // '>'
          if (seenGt) {
            errors.push(dupErr(tok, "'>'"));
            continue;
          }
          seenGt = true;
        }
        parsed.push({ op: tok.op, value: tok.value });
      } else {
        parsed.push(tok.value as DateValue | TimeValue | DateTimeValue);
      }
      continue;
    }

    /* -------------------------------------------------- */
    /* Anything else = semantic error                     */
    /* -------------------------------------------------- */
    errors.push({
      message: `invalid token "${tok.raw}" for @created`,
      token: tok.raw,
      from: tok.from,
      to: tok.to,
    });
  }

  seg.errors.push(...errors);

  return {
    keyword: 'created',
    parsed,
    from: seg.from,
    to: seg.to,
    raw: seg.raw,
  };
}

/* -------------------------------------------------------------------------- */
/* helpers                                                                    */
/* -------------------------------------------------------------------------- */
function dupErr(tok: LexToken, op: string): ParseError {
  return {
    message: `duplicate ${op} operator in @created`,
    token: tok.raw,
    from: tok.from,
    to: tok.to,
  };
}
