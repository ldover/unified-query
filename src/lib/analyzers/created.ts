// analyzers/created.ts
import type { TimestampValue, ParsedKeyword, Segment } from '../parsers/types.js';
import { timestampAnalyzer } from './timestamp.js';

export function analyzeCreated(seg: Segment): ParsedKeyword<'created', TimestampValue[]> {
  const { parsed, errors } = timestampAnalyzer(seg, { allowBoolean: false });
  seg.errors.push(...errors);

  return {
    keyword: 'created',
    parsed: parsed as TimestampValue[],   // ensured by allowBoolean=false
    from: seg.from,
    to:   seg.to,
    raw:  seg.raw,
  };
}
