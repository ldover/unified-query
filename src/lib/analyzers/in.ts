// analyzers/in.ts
import type { Segment, ParseError, ParsedKeyword } from '../parsers/types.js';
import type { InArg } from '../parsers/types.js';

export function analyzeIn(seg: Segment): ParsedKeyword<'in', InArg[]> {
  const list: InArg[] = [];
  const errs: ParseError[] = [];

  for (const tok of seg.tokens) {
    if (tok.kind === 'uuid') {
      list.push({ id: tok.value, deep: !!tok.deep });
    } else {
      errs.push({
        message: `invalid token "${tok.raw}" for @in`,
        token: tok.raw, from: tok.from, to: tok.to
      });
    }
  }

  seg.errors.push(...errs);
  return { keyword:'in', parsed:list, from:seg.from, to:seg.to, raw:seg.raw };
}
