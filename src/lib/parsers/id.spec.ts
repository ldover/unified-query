// src/lib/parsers/id.spec.ts
import { describe, it, expect } from 'vitest';
import { uuidParser } from './id.js';

const UUID = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';

describe('uuid parser', () => {
  it('accepts valid UUID-v4', () => {
    const tok = uuidParser(UUID, 10)!;
    expect(tok.kind).toBe('uuid');
    expect(tok.value).toBe(UUID);      // no star
    expect(tok.deep).toBeFalsy();  // default
    expect(tok.from).toBe(10);
    expect(tok.to).toBe(10 + UUID.length);
  });

  it('accepts UUID-v4 followed by "*" (deep containment)', () => {
    const tok = uuidParser(`${UUID}*`, 0)!;
    expect(tok.value).toBe(UUID);      // star stripped off
    expect(tok.deep).toBe(true);
    expect(tok.to).toBe(UUID.length + 1); // +1 for the star
  });

  it('ignores invalid UUID-v4 strings', () => {
    expect(uuidParser('non-uuid', 0)).toBeNull();
    expect(uuidParser(`${UUID}**`, 0)).toBeNull(); // double star invalid
    expect(uuidParser(`*${UUID}`, 0)).toBeNull();  // star in wrong place
  });
});
