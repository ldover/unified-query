// src/parse/scanner.ts
import type { ParseError, Segment } from './types.js';

interface ScanResult {
  segments: Segment[];
  errors: ParseError[];       // always [], kept for future symmetry
}

const isIdent = (c: string) => /[A-Za-z0-9_-]/.test(c);

export const VALID_KEYWORDS = [
  'id','name','content','in','kind',
  'created','updated','changed','deleted','archived','completed',
  'date','time','sort',
  // TODO: add limit when implemented
  // 'limit'
  'todo','done','draft'
] as const;


/**
 * Pass-1 scanner
 *   • head  = everything before the first un-escaped '@'
 *   • each keyword = '@' + IDENT
 *   • body = runs until the next un-escaped '@' or EOS
 *   • the only escape sequence recognised is '\@'  (=> literal '@')
 */
// src/lib/parsers/scanner.ts  (relevant excerpt)

interface ScanResult { segments: Segment[]; errors: ParseError[] }

/**
 * Pass-1 scanner (handles only '\@' escapes).
 *
 * • head   : text before first un-escaped '@'
 * • keyword: '@' IDENT
 * • body   : up to next un-escaped '@' or EOS
 */
export function scan(input: string): ScanResult {
  const segments: Segment[] = [];
  const errors:   ParseError[] = [];
  const seen = new Set<string>();                 // track first keyword uses

  let i = 0;
  let segStart = 0;

  const push = (keyword: string, bodyStart: number, bodyEnd: number) => {
    segments.push({
      keyword: keyword as any,
      tokens: [],
      errors: [],
      body: input.slice(bodyStart, bodyEnd),
      from: segStart,
      to:   bodyEnd,
      raw:  input.slice(segStart, bodyEnd),
      ignored: false,               // default; may flip below
    });
  };

  /* ── HEAD ─────────────────────────────────────────────── */
  while (i < input.length && !(input[i] === '@' && (i === 0 || input[i - 1] !== '\\'))) i++;
  if (i > 0) push('head', segStart, i);

  /* ── KEYWORD BLOCKS ───────────────────────────────────── */
  while (i < input.length) {
    segStart = i;           // '@'
    i++;                    // skip '@'

    // keyword ident
    const kwStart = i;
    while (i < input.length && isIdent(input[i])) i++;
    const keyword = input.slice(kwStart, i);

    // optional space
    while (i < input.length && input[i] === ' ') i++;
    const bodyStart = i;

    // body until next un-escaped '@' or EOS
    while (i < input.length && !(input[i] === '@' && input[i - 1] !== '\\')) i++;
    push(keyword, bodyStart, i);
  }

  /* ── Validation pass (unknown / duplicate) ───────────── */
  for (const seg of segments) {
    if (seg.keyword === 'head') continue;

    const kwFrom = seg.from + 1;                    // position of first letter
    const kwTo   = kwFrom + seg.keyword.length;

    if (!VALID_KEYWORDS.includes(seg.keyword as any)) {
      seg.ignored = true;
      addErr(`unknown keyword "@${seg.keyword}"`, kwFrom - 1, kwTo);
    } else if (seen.has(seg.keyword)) {
      seg.ignored = true;
      addErr(`duplicate keyword "@${seg.keyword}" ignored`, kwFrom - 1, kwTo);
    } else {
      seen.add(seg.keyword);
    }
  }

  return { segments, errors };

  /* helper */
  function addErr(message: string, from: number, to: number) {
    errors.push({ message, token: input.slice(from, to), from, to });
  }
}


