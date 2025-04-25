// src/parse/keywords/name.ts
import type { ParseError, Token } from '../parse.js';
import type { Segment } from '../scanner.js';
import { unescapeAt } from './util.js';

export const parseName = (seg: Segment) => {
  const value = unescapeAt(seg.body);
  const tokens: Token[] = [{ keyword: 'name', parsed: value, from: seg.from, to: seg.to, raw: seg.raw }];

  const errors: ParseError[] =
    value.endsWith('\\')
      ? [
          {
            message: 'dangling back-slash at end of @name value',
            token: '\\',
            from: seg.to - 1,
            to: seg.to,
          },
        ]
      : [];

  return { tokens, errors };
};
