/* -------------------------------------------------------------------------- */
/* Boolean & String parser tests                                              */
/* -------------------------------------------------------------------------- */

import { describe, it, expect } from 'vitest';

import { booleanParser } from './boolean.js';
import { stringParser  } from './string.js';

const must = <T>(tok: T | null): T => {
    expect(tok).not.toBeNull();
    return tok as T;
  };
  
const bool = (raw: string, pos = 0) => booleanParser(raw, pos);
const str  = (raw: string, pos = 0) => stringParser(raw, pos);

describe('booleanParser', () => {
  it('parses "true" and "false"', () => {
    expect(must(bool('true' )).value).toBe(true);
    expect(must(bool('false')).value).toBe(false);
  });

  it('respects position argument', () => {
    const tok = must(bool('true', 3));
    expect(tok.from).toBe(3);
    expect(tok.to).toBe(7);
  });

  it('rejects anything else', () => {
    expect(bool('True')).toBeNull();
    expect(bool('yes')).toBeNull();
  });
});

describe('stringParser', () => {
  it('returns the raw word when no escapes present', () => {
    const tok = must(str('hello'));
    expect(tok.kind).toBe('string');
    expect(tok.value).toBe('hello');
    expect(tok.raw).toBe('hello');
  });

  it('un-escapes \\@ sequences', () => {
    const tok = must(str('foo\\@bar'));
    expect(tok.value).toBe('foo@bar');   // un-escaped
    expect(tok.raw  ).toBe('foo\\@bar'); // original
  });

  it('respects position argument', () => {
    const tok = must(str('baz', 5));
    expect(tok.from).toBe(5);
    expect(tok.to).toBe(8);
  });
});
