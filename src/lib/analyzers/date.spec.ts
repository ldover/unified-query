// tests/date-timeAnalyze.spec.ts
import { describe, it, expect } from 'vitest';
import { tokenizeBody } from '$lib/parsers/parse.js';
import { analyzeDate }  from './date.js';
import { scan } from '$lib/parsers/scanner.js';

function run(str: string, analyzer) {
  const seg = scan(str).segments[0];
  seg.tokens = tokenizeBody(seg);
  return { seg, result: analyzer(seg) };
}

/* -------------------------------------------------------------------------- */
/* @date analyzer – accepts only DateValue tokens                             */
/* -------------------------------------------------------------------------- */
describe('@date analyzer', () => {
  it('collects multiple date tokens', () => {
    const { result, seg } = run('@date 2025 2025/04 2025/04/26', analyzeDate);

    expect(result.parsed).toEqual([
      { y: 2025 },
      { y: 2025, m: 4 },
      { y: 2025, m: 4, d: 26 },
    ]);
    expect(seg.errors).toHaveLength(0);
  });

  it('flags non-date tokens as invalid', () => {
    const { seg } = run('@date 12:00 2025/04/26', analyzeDate);
    expect(seg.errors).toHaveLength(1);
    expect(seg.errors[0].message).toMatch(/invalid token "12:00"/i);
  });
});
