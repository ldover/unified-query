// tests/inAnalyze.spec.ts
import { describe, it, expect } from 'vitest';
import { tokenizeBody } from '$lib/parsers/parse.js';
import { analyzeIn } from './in.js';
import { scan } from '$lib/parsers/scanner.js';

function run(str: string) {
  const seg = scan(str).segments[0];
  seg.tokens = tokenizeBody(seg);
  return { seg, result: analyzeIn(seg) };
}

const ID1  = '11111111-1111-4111-8111-111111111111';
const ID2  = '22222222-2222-4222-8222-222222222222';

describe('@in analyzer', () => {
  it('collects UUID tokens with deep flag when suffixed by "*"', () => {
    const { result, seg } = run(`@in ${ID1} ${ID2}*`);
    expect(result.parsed).toEqual([
      { id: ID1, deep: false },
      { id: ID2, deep: true },
    ]);
    expect(seg.errors).toHaveLength(0);
  });

  it('flags non-UUID tokens as invalid', () => {
    const { seg } = run(`@in ${ID1} not-a-uuid`);
    expect(seg.errors).toHaveLength(1);
    expect(seg.errors[0].message).toMatch(/invalid token "not-a-uuid"/i);
  });

  it('handles an all-deep list', () => {
    const { result } = run(`@in ${ID1}* ${ID2}*`);
    expect(result.parsed).toEqual([
      { id: ID1, deep: true },
      { id: ID2, deep: true },
    ]);
  });
});
