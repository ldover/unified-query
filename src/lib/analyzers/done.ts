// analyzers/done.ts
import type { TimestampValue, ParsedKeyword, Segment } from '../parsers/types.js';
import { timestampAnalyzer } from './timestamp.js';

export function analyzeDone(
  seg: Segment
): ParsedKeyword<'done', boolean | TimestampValue[] | undefined> {
  const { parsed, errors } = timestampAnalyzer(seg, { allowBoolean: true });

  seg.errors.push(...errors);

  return {
    keyword: 'done',
    parsed,            // boolean | timestamps[] | undefined
    from: seg.from,
    to:   seg.to,
    raw:  seg.raw,
  };
}
