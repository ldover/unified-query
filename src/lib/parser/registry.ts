import { parseId }   from './keywords/id.js';
import type { Segment } from './scanner.js';
import type { ParseError, Token } from './parse.js';
import { parseName } from './keywords/name.js';
import { parseContent } from './keywords/content.js';

export type KeywordParser = (seg: Segment) => { tokens: Token[]; errors: ParseError[] };


export const registry: Record<string, KeywordParser> = {
  id:        parseId,
  name:      parseName,
  content: parseContent,
};
