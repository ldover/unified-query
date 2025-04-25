// src/parse/keywords/id.ts

import type { ParseError, Token } from "../parse.js";
import type { Segment } from "../scanner.js";


const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const parseId = (seg: Segment) => {
  const ids: string[] = [];
  const errors: ParseError[] = [];

  let cursor = seg.from + seg.keyword.length + 2; // "@id " length
  for (const tok of seg.body.trim().split(/\s+/)) {
    if (!tok) continue;
    if (UUID_RE.test(tok)) ids.push(tok);
    else
      errors.push({
        message: `invalid UUID: ${tok}`,
        token: tok,
        from: cursor,
        to: cursor + tok.length,
      });
    cursor += tok.length + 1; // + space
  }

  const tokens: Token[] = [{ keyword: 'id', parsed: ids, from: seg.from, to: seg.to, raw: seg.raw }];
  return { tokens, errors };
};
