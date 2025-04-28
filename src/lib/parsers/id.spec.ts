// tests/dateFull.spec.ts
import { describe, it, expect } from 'vitest';
import { uuidParser } from './id.js';

describe('uuid parser', () => {
  it('accepts valid UUID-v4', () => {
    const tok = uuidParser('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa', 10)!;
    expect(tok.kind).toBe('uuid');
    expect(tok.value).toEqual('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa');
    expect(tok.from).toBe(10);
    expect(tok.to).toBe(10 + 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa'.length);
  });

  it('ignores invalid UUID-v4', () => {
    expect(uuidParser('non-uuid', 10)).toEqual(null)
  });
});

