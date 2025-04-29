// src/lib/parsers/index.ts

import { registry } from '$lib/analyzers/registry.js';
import { tokenizeBody } from './parse.js';
import { scan } from './scanner.js';
import type { ParseResult, Segment, ParsedKeyword, ParseError } from './types.js';

/* --------------------------------------------------------- */

export function parse(input: string): ParseResult {
  /* 1. low-level scan ---------------------------------------------------- */
  const { segments, errors: scanErrors } = scan(input);

  const keywords: ParsedKeyword[] = [];
  const allErrors: ParseError[]   = [...scanErrors];

  /* 2. tokenise + semantic analyse for each segment ---------------------- */
  for (const seg of segments) {
    if (seg.ignored) continue;           // duplicates skipped

    seg.tokens = tokenizeBody(seg);                                           // fills seg.tokens[]

    const kw = seg.keyword;                                      // 'head' or real
    const analyse = registry[kw as keyof typeof registry];
    if (!analyse) throw new Error('Unknown keywords should be ignored (seg.ignored)')

    const parsed = analyse(seg as Segment);
    keywords.push(parsed);
  }

  /* collect semantic errors from every segment */
  for (const seg of segments) allErrors.push(...seg.errors);

  return {
    segments,          // now include tokens[] & segment.errors
    keywords,          // high-level ParsedKeyword list
    errors: allErrors  // flat array for CodeMirror linter
  };
}
