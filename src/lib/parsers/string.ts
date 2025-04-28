import type { MicroParser, LexToken } from './types.js';

/**
 * Fallback string parser.  Only job (beyond token book-keeping) is to
 * **un-escape `\\@` → `@`** per the query-language spec.
 *
 * NOTE: keep this *last* in the `microParsers` array so it only fires when all
 * the specialised parsers (date/time/uuid/boolean/…) have rejected.
 */
export const stringParser: MicroParser = (word, pos) => {
  const value = word.replace(/\\@/g, '@');

  return {
    kind:  'string',
    value,            // un-escaped
    raw:   word,      // original, for error/highlighting
    from:  pos,
    to:    pos + word.length,
  } satisfies LexToken;
};
