// tests/createdAnalyze.spec.ts
import { describe, it, expect } from 'vitest';
import { tokenizeBody } from '../parsers/parse.js';
import { scan } from '../parsers/scanner.js';
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

  it('leaves quotes intact', () => {
    const { result } = run('@name "Hello World"')
    expect(result.parsed).toEqual('"Hello World"');
  });

  it('converts different tokens into raw string', () => {
    const { result } = run('@name true 2024')
    expect(result.parsed).toEqual('true 2024');
  });
});

