// tests/createdAnalyze.spec.ts
import { describe, it, expect } from 'vitest';
import { tokenizeBody } from '$lib/parsers/parse.js';
import { scan } from '$lib/parsers/scanner.js';
import { analyzeName } from './name.js';

function run(str: string) {
  const seg = scan(str).segments[0];
  seg.tokens = tokenizeBody(seg);
  return { seg, result: analyzeName(seg) };
}

describe('@name analyzer', () => {

  it('captures verbatim body', () => {
    const { result } = run('@name Hello World')
    expect(result.parsed).toEqual('Hello World');
  });

  it('unescapes \\@ to @', () => {
    const { result } = run('@name Hello foo\\@bar')
    expect(result.parsed).toEqual('foo@bar');
  });

  it('unescapes \\@ to @ and leaves quotes intact', () => {
    const { result } = run('@name say\\"hi\\"\\@example')
    expect(result.parsed).toEqual('say\\"hi\\"@example');
  });
});

