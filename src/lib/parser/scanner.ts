// src/parse/scanner.ts
import type { ParseError } from './parse.js';

export interface Segment {
  keyword: 'head' | string;   // "head" for leading text, otherwise the keyword (no '@')
  from: number;               // absolute start-offset of this segment
  to: number;                 // absolute end-offset (exclusive)
  body: string;               // text following the keyword (may contain spaces)
  raw: string;                // exact slice [from, to)
}

interface ScanResult {
  segments: Segment[];
  errors: ParseError[];       // always [], kept for future symmetry
}

const isIdent = (c: string) => /[A-Za-z0-9_-]/.test(c);

/**
 * Pass-1 scanner
 *   • head  = everything before the first un-escaped '@'
 *   • each keyword = '@' + IDENT
 *   • body = runs until the next un-escaped '@' or EOS
 *   • the only escape sequence recognised is '\@'  (=> literal '@')
 */
export function scan(input: string): ScanResult {
  const segments: Segment[] = [];

  let i = 0;                  // cursor
  let segStart = 0;           // segment start

  // helper to push a segment
  const push = (keyword: string, bodyStart: number, bodyEnd: number) => {
    segments.push({
      keyword: keyword as any,
      body: input.slice(bodyStart, bodyEnd),
      from: segStart,
      to: bodyEnd,
      raw: input.slice(segStart, bodyEnd)
    });
  };

  /* 1 ── HEAD ───────────────────────────────────────────── */
  while (i < input.length) {
    if (input[i] === '@' && (i === 0 || input[i - 1] !== '\\')) break;
    i++;
  }
  if (i > 0) push('head', segStart, i);

  /* 2 ── KEYWORD BLOCKS ────────────────────────────────── */
  while (i < input.length) {
    segStart = i;       // '@'
    i++;                // skip '@'

    // keyword ident
    const kwStart = i;
    while (i < input.length && isIdent(input[i])) i++;
    const keyword = input.slice(kwStart, i);

    // optional space after keyword
    while (i < input.length && input[i] === ' ') i++;
    const bodyStart = i;

    // body until next un-escaped '@' or EOS
    while (i < input.length) {
      if (input[i] === '@' && input[i - 1] !== '\\') break;
      i++;
    }
    push(keyword, bodyStart, i);
  }

  return { segments, errors: [] };
}
