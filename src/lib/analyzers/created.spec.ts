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

  it('accepts the "today" utility token (alone)', () => {
    const { result, seg } = run('@created today');
    expect(result.parsed).toEqual({ util: 'today' });
    expect(seg.errors).toHaveLength(0);
  });

  it('accepts the "yesterday" utility token (alone)', () => {
    const { result } = run('@created yesterday');
    expect(result.parsed).toEqual({ util: 'yesterday' });
  });

  it('accepts the "lastNdays" utility token (alone)', () => {
    const { result } = run('@created last30days');
    expect(result.parsed).toEqual({ util: 'last', n: 30, unit: 'days' });
  });

  it('rejects mixing a utility token with other timestamps', () => {
    const { seg } = run('@created today 2024/01/01');
    expect(seg.errors).toHaveLength(1);
    expect(seg.errors[0].message).toMatch(/cannot combine/i);
  });

  it('rejects a utility token that is not first', () => {
    const { seg } = run('@created 2024/01/01 yesterday');
    expect(seg.errors).toHaveLength(1);
    expect(seg.errors[0].message).toMatch(/must be first/i);
  });

  it('rejects comparison operators on utility values', () => {
    const { seg } = run('@created >today');
    expect(seg.errors).toHaveLength(1);
    expect(seg.errors[0].message).toMatch(/comparison operators are not allowed/i);

    const { seg: seg2 } = run('@created <last7days');
    expect(seg2.errors).toHaveLength(1);
    expect(seg2.errors[0].message).toMatch(/comparison operators are not allowed/i);
  });
});
