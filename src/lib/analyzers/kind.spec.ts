import { describe, it, expect } from 'vitest';
import { tokenizeBody } from '$lib/parsers/parse.js';
import { analyzeKind } from './kind.js';
import { scan } from '$lib/parsers/scanner.js';

function run(str: string) {
  const seg = scan(str).segments[0];
  seg.tokens = tokenizeBody(seg);
  return { seg, result: analyzeKind(seg) };
}

// a couple of supported kinds we’ll use in the happy-path test
const K1 = 'note';
const K2 = 'log';
const K3 = 'task';

describe('@kind analyzer', () => {
  it('collects valid kind strings in order', () => {
    const { result, seg } = run(`@kind ${K1} ${K2} ${K3}`);
    expect(result.parsed).toEqual([K1, K2, K3]);
    expect(seg.errors).toHaveLength(0);
  });

  it('flags unsupported kind strings', () => {
    const { seg } = run('@kind foo note');
    expect(seg.errors).toHaveLength(1);
    expect(seg.errors[0].message).toMatch(/unsupported kind "foo"/i);
  });
});
