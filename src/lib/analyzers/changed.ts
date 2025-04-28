// analyzers/changed.ts
import type { TimestampValue, ParsedKeyword, Segment } from '../parsers/types.js';
import { timestampAnalyzer } from './timestamp.js';

export function analyzeChanged(seg: Segment): ParsedKeyword<'changed', TimestampValue[]> {
  const { parsed, errors } = timestampAnalyzer(seg, { allowBoolean: false });
  seg.errors.push(...errors);

  return {
    keyword: 'changed',
    parsed: parsed as TimestampValue[],
    from: seg.from,
    to:   seg.to,
    raw:  seg.raw,
  };
}
