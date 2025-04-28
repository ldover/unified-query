// tests/deletedAnalyze.spec.ts
import { describe, it, expect } from 'vitest';
import { tokenizeBody } from '$lib/parsers/parse.js';
import { analyzeDeleted } from './deleted.js';
import { scan } from '$lib/parsers/scanner.js';

function run(str: string) {
  const seg = scan(str).segments[0];
  seg.tokens = tokenizeBody(seg);
  return { seg, result: analyzeDeleted(seg) };
}

describe('@deleted analyzer – boolean behaviour', () => {
  it('returns undefined when no arguments are given', () => {
    const { result, seg } = run('@deleted');
    expect(result.parsed).toBeUndefined();
    expect(seg.errors).toHaveLength(0);
  });

  it('accepts explicit boolean true / false', () => {
    expect(run('@deleted true').result.parsed).toBe(true);
    expect(run('@deleted false').result.parsed).toBe(false);
  });

  it('flags mixing boolean with timestamps as invalid', () => {
    const { seg } = run('@deleted true 2024/01/01');
    expect(seg.errors).toHaveLength(1);
    expect(seg.errors[0].message).toMatch(/cannot combine/i);
  });
});
