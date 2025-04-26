// src/parse/keywords/in.ts
import type { Segment }    from '../scanner.js';
import type { Token, ParseError } from '../parse.js';
import type { InArg } from '../parse.js';   // {id:string; deep:boolean}

const UUID_V4_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const parseIn = (seg: Segment) => {
  const args: InArg[] = [];
  const errors: ParseError[] = [];

  let cursor = seg.from + seg.keyword.length + 2;   // skip "@in "
  const parts = seg.body.trim().split(/\s+/);

  for (const part of parts) {
    if (!part) continue;

    const deep = part.endsWith('*');
    const id   = deep ? part.slice(0, -1) : part;

    if (UUID_V4_RE.test(id)) {
      args.push({ id, deep });
    } else {
      errors.push({
        message: `invalid UUID: ${part}`,
        token: part,
        from: cursor,
        to: cursor + part.length
      });
    }
    cursor += part.length + 1;                 // advance incl. space
  }

  const tokens: Token[] = [
    { keyword: 'in', parsed: args, from: seg.from, to: seg.to, raw: seg.raw }
  ];

  return { tokens, errors };
};
