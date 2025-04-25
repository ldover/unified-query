import { describe, it, expect } from 'vitest';
import { scan } from '../parser/scanner.js';         // ← update relative path if needed

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
    const segs = mapSegs('Buy milk and bread');
    expect(segs).toEqual([
      ['head', 'Buy milk and bread']
    ]);
  });

  it('simple keyword + body', () => {
    const segs = mapSegs('@kind note log');
    expect(segs).toEqual([
      ['kind', 'note log']
    ]);
  });

  it('head followed by keyword', () => {
    const segs = mapSegs('Project X @id 123');
    expect(segs).toEqual([
      ['head', 'Project X '],
      ['id',   '123']
    ]);
  });

  it('quoted body containing @', () => {
    const segs = mapSegs('@content "foo@bar.com" @kind note');
    expect(segs).toEqual([
      ['content', '"foo@bar.com" '],   // trailing space is part of body
      ['kind',    'note']
    ]);
  });

  it('escaped @ outside quotes', () => {
    const segs = mapSegs('@content foo\\@bar @name test');
    expect(segs).toEqual([
      ['content', 'foo\\@bar '],
      ['name',    'test']
    ]);
  });

  it('escaped quote inside quoted body', () => {
    const segs = mapSegs('@name "He said \\"hi\\"" @kind note');
    expect(segs).toEqual([
      ['name', '"He said \\"hi\\"" '],
      ['kind', 'note']
    ]);
  });

  it('multiple keywords, mixed quoting', () => {
    const q = 'head text @id a b @content "alpha @ beta" @in uid1* uid2';
    const segs = mapSegs(q);
    expect(segs).toEqual([
      ['head',   'head text '],
      ['id',     'a b '],
      ['content','"alpha @ beta" '],
      ['in',     'uid1* uid2']
    ]);
  });

  it('unterminated quote yields scan error', () => {
    const { segments, errors } = scan('@content "oops');
    expect(errors.length).toBe(1);
    expect(errors[0].message).toMatch(/unterminated/i);
    // segments should still include best-effort slice
    expect(segments[0].keyword).toBe('content');
  });

  // TODO: should we handle extra edge cases with weird sequences of @ like @@@?
  // it('', () => {
  // });
});

