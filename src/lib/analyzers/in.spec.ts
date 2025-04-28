// tests/createdAnalyze.spec.ts
import { describe, it, expect } from 'vitest';
import { tokenizeBody } from '$lib/parsers/parse.js';
import { scan } from '$lib/parsers/scanner.js';
import { analyzeIn } from './in.js';

function run(str: string) {
  const seg = scan(str).segments[0];
  seg.tokens = tokenizeBody(seg);
  return { seg, result: analyzeIn(seg) };
}

describe('@in analyzer', () => {

  it('handles shallow & deep ids', () => {
    const { result } = run('@in aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb*')
    expect(result.parsed).toEqual([
      { id:'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa', deep:false },
      { id:'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb', deep:true }
    ]);
  });
});

