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
});
