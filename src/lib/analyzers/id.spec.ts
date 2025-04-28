// tests/idAnalyze.spec.ts
import { describe, it, expect } from 'vitest';
import { tokenizeBody } from '$lib/parsers/parse.js';
import { analyzeId } from './id.js';
import { scan } from '$lib/parsers/scanner.js';

function run(str: string) {
  const seg = scan(str).segments[0];
  seg.tokens = tokenizeBody(seg);
  return { seg, result: analyzeId(seg) };
}

const ID1 = '11111111-1111-4111-8111-111111111111'; // valid v4
const ID2 = '22222222-2222-4222-8222-222222222222';
const MIX = 'aBcDeF12-3456-4ABC-9def-ABCDEFabcdef';

describe('@id analyzer', () => {
  it('collects multiple UUID tokens in order', () => {
    const { result, seg } = run(`@id ${ID1} ${ID2} ${MIX}`);
    expect(result.parsed).toEqual([ID1, ID2, MIX]);
    expect(seg.errors).toHaveLength(0);
  });

  it('flags non-UUID tokens as invalid', () => {
    const { seg } = run(`@id ${ID1} not-a-uuid ${ID2}`);
    expect(seg.errors).toHaveLength(1);
    expect(seg.errors[0].message).toMatch(/invalid token "not-a-uuid"/i);
  });
});
