import { describe, it, expect } from 'vitest';
import { tokenizeBody } from '$lib/parsers/parse.js';
import { analyzeDraft } from './draft.js';
import { scan } from '$lib/parsers/scanner.js';

function run(str: string) {
  const seg = scan(str).segments[0];
  seg.tokens = tokenizeBody(seg);
  return { seg, result: analyzeDraft(seg) };
}

describe('@draft analyzer', () => {
  it('defaults to true when no argument supplied', () => {
    const { result, seg } = run('@draft');
    expect(result.parsed).toBeUndefined();
    expect(seg.errors).toHaveLength(0);
  });

  it('accepts explicit boolean true / false', () => {
    expect(run('@draft true').result.parsed).toBe(true);
    expect(run('@draft false').result.parsed).toBe(false);
  });

  it('flags more than one token or non-boolean as invalid', () => {
    const { seg } = run('@draft false true extra');
    expect(seg.errors).toHaveLength(2);
    expect(seg.errors[0].message).toMatch(/duplicate boolean/i);
    expect(seg.errors[1].message).toMatch(/invalid token/i);


    const { seg: seg2 } = run('@draft 123');
    expect(seg2.errors).toHaveLength(1);
    expect(seg2.errors[0].message).toMatch(/invalid token/i);
  });
});
