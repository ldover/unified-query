import { describe, it, expect } from 'vitest';
import { tokenizeBody } from '$lib/parsers/parse.js';
import { analyzeSort } from './sort.js';
import { scan } from '$lib/parsers/scanner.js';

function run(q: string) {
  const seg = scan(q).segments[0];
  seg.tokens = tokenizeBody(seg);
  return { seg, result: analyzeSort(seg) };
}

describe('@sort analyzer', () => {
  it('defaults to name asc when empty', () => {
    const { result } = run('@sort');
    expect(result.parsed).toEqual([{ field: 'name', dir: 'asc' }]);
  });

  it('parses recognised field:dir pairs', () => {
    const { result } = run('@sort name created:asc updated:desc');
    expect(result.parsed).toEqual([
      { field: 'name' },                 // dir undefined → asc downstream
      { field: 'created', dir: 'asc' },
      { field: 'updated', dir: 'desc' },
    ]);
  });

  it('flags unrecognised fields', () => {
    const { seg } = run('@sort created_at');
    expect(seg.errors).toHaveLength(1);
    expect(seg.errors[0].message).toMatch(/unrecognised sort field "created_at"/i);
  });

  it('flags bad direction values', () => {
    const { seg } = run('@sort created:down');
    expect(seg.errors).toHaveLength(1);
    expect(seg.errors[0].message).toMatch(/invalid sort direction/i);
  });

  it('flags non-string tokens', () => {
    const { seg } = run('@sort 2024/01/01');
    expect(seg.errors).toHaveLength(1);
  });
});
