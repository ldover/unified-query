import { describe, it, expect } from 'vitest';

import { parseId }      from '../parser/keywords/id.js';
import { parseName }    from '../parser/keywords/name.js';
import { parseContent } from '../parser/keywords/content.js';
import { parseIn } from '../parser/keywords/in.js';
import type { Segment } from '../parser/scanner.js';

/* helper – wrap raw body in a Segment stub */
function seg(keyword: string, body: string): Segment {
  return {
    keyword,
    body,
    raw: '@' + keyword + (body ? ' ' + body : ''),
    from: 0,
    to: body.length,
  };
}

/* ─────────────── @id ─────────────── */

describe('@id parser', () => {
  it('accepts multiple UUID-v4 tokens', () => {
    const { tokens, errors } = parseId(
      seg(
        'id',
        'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa  bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb'
      )
    );
    expect(errors).toEqual([]);
    expect(tokens).toHaveLength(1);
    expect(tokens[0]).toMatchObject({
      keyword: 'id',
      parsed: [
        'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
        'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb',
      ],
    });
  });

  it('drops non-UUID tokens and records error', () => {
    const { tokens, errors } = parseId(seg('id', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa not-a-uuid'));
    expect(tokens[0].parsed).toEqual(['aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa']);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toMatch(/invalid uuid/i);
  });
});

/* ─────────────── @name ─────────────── */

describe('@name parser', () => {
  it('captures verbatim body', () => {
    const { tokens, errors } = parseName(seg('name', 'Hello World'));
    expect(errors).toEqual([]);
    expect(tokens[0]).toMatchObject({ keyword: 'name', parsed: 'Hello World' });
  });

  it('unescapes \\@ to @', () => {
    const { tokens } = parseName(seg('name', 'foo\\@bar'));
    expect(tokens[0].parsed).toBe('foo@bar');
  });

  it('unescapes \\@ to @ and leaves quotes intact', () => {
    const { tokens } = parseName(seg('name', 'say\\"hi\\"\\@example'));
    expect(tokens[0].parsed).toBe('say\\"hi\\"@example');
  });
});

/* ─────────────── @content ─────────────── */

describe('@content parser', () => {
  it('keeps quoted @ intact', () => {
    const { tokens } = parseContent(seg('content', '"alpha@beta.com"'));
    expect(tokens[0].parsed).toBe('"alpha@beta.com"');
  });

  it('treats quotes as normal chars and collapses \\@', () => {
    const body = '"alpha\\@beta" stuff';
    const { tokens } = parseContent(seg('content', body));
    expect(tokens[0].parsed).toBe('"alpha@beta" stuff');
  });
});

describe('@in parser', () => {
  it('handles shallow & deep ids', () => {
    const { tokens, errors } = parseIn(seg('in', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb*'));
    expect(errors).toEqual([]);
    expect(tokens[0].parsed).toEqual([
      { id:'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa', deep:false },
      { id:'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb', deep:true }
    ]);
  });
});

