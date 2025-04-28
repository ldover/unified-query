import { describe, it, expect } from 'vitest';
import { scan } from './scanner.js';

/**
 * Helper to make the assertions terser.
 * We only care about the tuple [keyword, body] in order,
 * not all offset metadata.
 */
function mapSegs(input: string) {
  return scan(input).segments.map(s => [s.keyword, s.body] as [string, string]);
}

describe('scanner – head & keyword splitting', () => {

  it('plain head only', () => {
    expect(mapSegs('Buy milk and bread')).toEqual([
      ['head', 'Buy milk and bread']
    ]);
  });

  it('simple keyword + body', () => {
    expect(mapSegs('@kind note log')).toEqual([
      ['kind', 'note log']
    ]);
  });

  it('head followed by keyword', () => {
    expect(mapSegs('Project X @id 123')).toEqual([
      ['head', 'Project X '],
      ['id',   '123']
    ]);
  });

  it('body with escaped @ inside quotes', () => {
    expect(mapSegs('@content "foo\\@bar.com" @kind note')).toEqual([
      ['content', '"foo\\@bar.com" '],   // trailing space is part of body
      ['kind',    'note']
    ]);
  });

  it('escaped @ outside quotes', () => {
    expect(mapSegs('@content foo\\@bar @name test')).toEqual([
      ['content', 'foo\\@bar '],
      ['name',    'test']
    ]);
  });

  it('multiple keywords, mixed quoting', () => {
    const q = 'head text @id a b @content "alpha \\@ beta" @in uid1* uid2';
    expect(mapSegs(q)).toEqual([
      ['head',   'head text '],
      ['id',     'a b '],
      ['content','"alpha \\@ beta" '],
      ['in',     'uid1* uid2']
    ]);
  });

  it('double-escaped @ (\\\\@) keeps literal \\@ in body', () => {
    expect(mapSegs('@name foo\\\\@bar')).toEqual([
      ['name', 'foo\\\\@bar']
    ]);
  });

  it('dangling back-slash at end of body is kept verbatim', () => {
    expect(mapSegs('@content path\\')).toEqual([
      ['content', 'path\\']
    ]);
  });
});