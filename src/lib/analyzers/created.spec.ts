// tests/createdAnalyze.spec.ts
import { describe, it, expect } from 'vitest';
import { tokenizeBody } from '$lib/parsers/parse.js';
import { analyzeCreated } from './created.js';
import { scan } from '$lib/parsers/scanner.js';

function run(str: string) {
  const seg = scan(str).segments[0];
  seg.tokens = tokenizeBody(seg);
  return { seg, result: analyzeCreated(seg) };
}

describe('@created analyzer (simple version)', () => {
  it('collects full dates', () => {
    const { result } = run('@created 2025/04/26 2025/05/01');
    expect(result.parsed).toEqual([
      { y: 2025, m: 4, d: 26 },
      { y: 2025, m: 5, d: 1 }
    ]);
  });

  it('flags boolean as invalid', () => {
    const { seg } = run('@created true 2025/04/26');
    expect(seg.errors.length).toBe(1);
    expect(seg.errors[0].message).toMatch(/invalid token "true"/i);
  });

  /* ---------------------------------------------------------------------- */
  /* NEW tests                                                              */
  /* ---------------------------------------------------------------------- */

  it('collects comparison operators', () => {
    const { result } = run('@created >2024/06/01 <2024/07');
    expect(result.parsed).toEqual([
      { op: '>', value: { y: 2024, m: 6, d: 1 } },
      { op: '<', value: { y: 2024, m: 7            } }
    ]);
  });

  // TODO: this one doesn't make sense, but maybe we let it fly at this layer?
  it('accepts time, datetime and date in one query', () => {
    const { result } = run('@created 12:00 2024/06/15-09:30 2024');
    expect(result.parsed).toEqual([
      { h: 12,  m: 0,        clock: '24h' },                         // time token
      { y: 2024, m: 6, d: 15, h: 9,  min: 30 },                 // datetime
      { y: 2024 }                                              // year-only date
    ]);
  });

  it('flags a second "<" or ">" operator as an error', () => {
    const { seg } = run('@created >2024 >2025');
    // one semantic error expected (“duplicate '>' operator” or similar)
    expect(seg.errors.length).toBe(1);
    expect(seg.errors[0].message).toMatch(/[dD]uplicate/i);
  });
});
