import type {
    Segment,
    ParseError,
    ParsedKeyword,
  } from '../parsers/types.js';
  

export function analyzeDraft(
  seg: Segment
): ParsedKeyword<'draft', boolean | undefined> {
  let value: boolean | undefined = undefined;
  const errors: ParseError[] = [];
  let seenBool = false;

  for (const tok of seg.tokens) {
    if (tok.kind === 'boolean') {
      if (!seenBool) {
        value = tok.value;
        seenBool = true;
      } else {
        errors.push(dupBoolErr(tok));
      }
      continue;
    }

    // any non-boolean token
    errors.push(invalidTokErr(tok));
  }

  seg.errors.push(...errors);

  return {
    keyword: 'draft',
    parsed: value,     // true | false | undefined
    from: seg.from,
    to:   seg.to,
    raw:  seg.raw,
  };
}

/* -------------------------------------------------------------------------- */
/* helpers                                                                    */
/* -------------------------------------------------------------------------- */
function dupBoolErr(tok): ParseError {
  return {
    message: `duplicate boolean flag "${tok.raw}" for @draft`,
    token: tok.raw,
    from: tok.from,
    to:   tok.to,
  };
}

function invalidTokErr(tok): ParseError {
  return {
    message: `invalid token "${tok.raw}" for @draft (expects a single boolean)`,
    token: tok.raw,
    from: tok.from,
    to:   tok.to,
  };
}
