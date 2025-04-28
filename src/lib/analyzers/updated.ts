// analyzers/updated.ts
import type { TimestampValue, ParsedKeyword, Segment } from '../parsers/types.js';
import { timestampAnalyzer } from './timestamp.js';

export function analyzeUpdated(seg: Segment): ParsedKeyword<'updated', TimestampValue[]> {
  const { parsed, errors } = timestampAnalyzer(seg, { allowBoolean: false });
  seg.errors.push(...errors);

  return {
    keyword: 'updated',
    parsed: parsed as TimestampValue[],
    from: seg.from,
    to:   seg.to,
    raw:  seg.raw,
  };
}
