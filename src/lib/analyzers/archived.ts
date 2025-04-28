// analyzers/archived.ts
import type { ParsedKeyword, Segment, TimestampValue } from '../parsers/types.js';
import { timestampAnalyzer } from './timestamp.js';

export function analyzeArchived(
  seg: Segment
): ParsedKeyword<'archived', boolean | TimestampValue[] | undefined> {
  const { parsed, errors } = timestampAnalyzer(seg, { allowBoolean: true });

  seg.errors.push(...errors);

  return {
    keyword: 'archived',
    parsed,
    from: seg.from,
    to:   seg.to,
    raw:  seg.raw,
  };
}
