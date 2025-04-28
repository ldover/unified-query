// tests/parse-e2e.spec.ts
import { describe, it, expect } from 'vitest';
import { parse } from './index.js';

describe('parse() end-to-end', () => {
  it('builds keywords array for valid @created', () => {
    const res = parse('@created 2025/04/26 note');
    // keywords
    expect(res.keywords).toHaveLength(1);
    const created = res.keywords[0];
    expect(created.keyword).toBe('created');
    expect(created.parsed).toEqual([{ y: 2025, m: 4, d: 26 }]);

    // segments[0] tokens
    const seg = res.segments[0];
    const dateTok = seg.tokens.find(t => t.kind === 'date');
    expect(dateTok?.value).toEqual({ y: 2025, m: 4, d: 26 });
  });

  it('produces error with correct offsets for bad date', () => {
    const q = '@created wrongdate';
    const res = parse(q);
    expect(res.errors).toHaveLength(1);
    const err = res.errors[0];

    // "wrongdate" starts at index 9 (`@created ` length) and is length 9
    expect(err.from).toBe(9);
    expect(err.to).toBe(18);
    expect(q.slice(err.from, err.to)).toBe('wrongdate');
  });
});
