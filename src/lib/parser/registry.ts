import { parseId }   from './keywords/id.js';
import { parseKind } from './keywords/kind.js';
import { parseIn }   from './keywords/in.js';
import type { Segment } from './scanner.js';
import type { ParseError, Token } from './parse.js';
// …

export type KeywordParser = (seg: Segment) => { tokens: Token[]; errors: ParseError[] };


export const registry: Record<string, KeywordParser> = {
  id:        parseId,
  kind:      parseKind,
  in:        parseIn,
  // aliases / shorthands
  note:      parseKind,
  log:       parseKind,
  space:     parseKind,
  // …
};
