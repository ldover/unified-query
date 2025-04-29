// lib/parsers/parse.ts

import type { LexToken, MicroParser, Segment } from "./types.js";
import { dateParser, datetimeParser, timeParser } from './date.js'
import { booleanParser } from "./boolean.js";
import { stringParser } from "./string.js";
import { uuidParser } from "./id.js";
import { utilityDateParser } from "./utility.js";


const defaultParsers  = [
  dateParser, datetimeParser, timeParser,
  utilityDateParser, booleanParser, uuidParser
];

const STRING_ONLY: MicroParser[]     = [];                // falls through to stringParser
const ID_ONLY         = [uuidParser];      // used by @id, @in

export const lexerProfiles = {
  head:         defaultParsers,  // free text
  name:         STRING_ONLY,
  content:      STRING_ONLY,
  kind:         STRING_ONLY,
  id:           ID_ONLY,
  in:           ID_ONLY,
  sort:         STRING_ONLY,
  // every other keyword → defaultParsers (inherits dates etc.)
} as const;


export function tokenizeBody(seg: Segment): LexToken[] {
    const profile = lexerProfiles[seg.keyword as keyof typeof lexerProfiles] 
                    ?? defaultParsers;
  
    const tokens: LexToken[] = [];
    let cur = seg.from + seg.keyword.length + 2;
  
    for (const word of seg.body.split(/\s+/)) {
      if (!word) continue;
      tokens.push(lexWord(word, cur, profile));
      cur += word.length + 1;
    }
    return tokens;
}
  
function lexWord(word: string, pos: number, parsers: MicroParser[]): LexToken {
    for (const fn of parsers) {
        const tok = fn(word, pos);
        if (tok) return tok;
    }
    return stringParser(word, pos)!;   // fallback
}
  