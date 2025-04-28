// lib/parsers/parse.ts

import type { LexToken, Segment } from "./types.js";
import { dateParser, datetimeParser, timeParser } from './date.js'


const microParsers = [dateParser, datetimeParser, timeParser, booleanParser];

export function tokenizeBody(seg: Segment): LexToken[] {
    // start after “@” + keyword + single space
    let tokens: LexToken[] = []
    let cur = seg.from + seg.keyword.length + 2;
    for (const word of seg.body.split(/\s+/)) {
      if (!word) continue;
      tokens.push(lexWord(word, cur));
      cur += word.length + 1;
    }

    return tokens
}

export function lexWord(word: string, pos: number): LexToken {
    for (const fn of microParsers) {
        const tok = fn(word, pos);
        if (tok) return tok;          // return first match
    }
    // fallback:
    return { kind: 'string', value: word, raw: word, from: pos, to: pos + word.length };
}