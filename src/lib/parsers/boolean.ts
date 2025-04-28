import type { MicroParser, LexToken } from './types.js';

/** Matches literal `true` or `false` (lower-case, spec-exact). */
export const booleanParser: MicroParser = (word, pos) => {
  if (word !== 'true' && word !== 'false') return null;

  return {
    kind:  'boolean',
    value: word === 'true',
    raw:   word,
    from:  pos,
    to:    pos + word.length,
  } satisfies LexToken;
};
