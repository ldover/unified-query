import { describe, it, expect } from 'vitest';
import { tokenizeBody } from '$lib/parsers/parse.js';
import { analyzeTodo } from './todo.js';
import { scan } from '$lib/parsers/scanner.js';

function run(str: string) {
  const seg = scan(str).segments[0];
  seg.tokens = tokenizeBody(seg);
  return { seg, result: analyzeTodo(seg) };
}

describe('@todo analyzer', () => {
  it('accepts zero arguments (flag form)', () => {
    const { result, seg } = run('@todo');
    expect(result.parsed).toBeUndefined();
    expect(seg.errors).toHaveLength(0);
  });

  it('flags any extra token as invalid', () => {
    const { seg } = run('@todo unexpected');
    expect(seg.errors).toHaveLength(1);
    expect(seg.errors[0].message).toMatch(/invalid token/i);
  });
});
