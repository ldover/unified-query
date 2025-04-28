// tests/date-timeAnalyze.spec.ts
import { describe, it, expect } from 'vitest';
import { tokenizeBody } from '$lib/parsers/parse.js';
import { analyzeTime }  from './time.js';
import { scan } from '$lib/parsers/scanner.js';

function run(str: string, analyzer) {
  const seg = scan(str).segments[0];
  seg.tokens = tokenizeBody(seg);
  return { seg, result: analyzer(seg) };
}

/* -------------------------------------------------------------------------- */
/* @time analyzer – accepts only TimeValue tokens                             */
/* -------------------------------------------------------------------------- */
describe('@time analyzer', () => {
  it('collects multiple time tokens', () => {
    const { result, seg } = run('@time 12 09:15 3pm', analyzeTime);

    expect(result.parsed).toEqual([
      { h: 12, clock: '24h' },
      { h: 9,  m: 15, clock: '24h' },
      { h: 15, clock: '12h' },               // 3 pm normalised to 15h by parser
    ]);
    expect(seg.errors).toHaveLength(0);
  });

  it('flags non-time tokens as invalid', () => {
    const { seg } = run('@time 2025/04/26 12:00', analyzeTime);
    expect(seg.errors).toHaveLength(1);
    expect(seg.errors[0].message).toMatch(/invalid token "2025\\/04\\/26"/i);
  });
});
