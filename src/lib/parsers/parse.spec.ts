// src/lib/parsers/parse.spec.ts
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

  it('flags duplicate keywords and ignores the later segment', () => {
    const query = '@created 2024/01/01 @created 2025/01/01';
    const res   = parse(query);

    /* only first @created kept */
    expect(res.keywords).toHaveLength(1);
    expect(res.keywords[0].parsed).toEqual([{ y: 2024, m: 1, d: 1 }]);

    /* one duplicate-keyword diagnostic */
    const dupErrs = res.errors.filter(e => /duplicate keyword/i.test(e.message));
    expect(dupErrs).toHaveLength(1);

    /* error range must point at the *second* “@created” */
    const secondStart = query.indexOf('@created', query.indexOf('@created') + 1);
    const err = dupErrs[0];

    expect(err.from).toBe(secondStart);
    expect(err.to).toBe(secondStart + '@created'.length);
    expect(query.slice(err.from, err.to)).toBe('@created');
  });
});
