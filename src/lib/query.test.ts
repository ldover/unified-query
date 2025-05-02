// query.test.ts • Vitest
// run: npx vitest run src/query.test.ts
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';

import moment from 'moment';
import { parse } from './parsers/index.js';   // → ParseResult
import { toQuery } from './query.js';         // new signature accepts ParseResult

/* ──────────────────────────── time‑freeze helper ─────────────────────────── */

// deterministic utilities — May 2 2025 10 :00 UTC
const NOW = moment('2025-05-02T10:00:00Z');
let dateNowSpy: ReturnType<typeof vi.spyOn>;

beforeAll(() => {
  dateNowSpy = vi.spyOn(Date, 'now').mockImplementation(() => NOW.valueOf());
});
afterAll(() => dateNowSpy.mockRestore());

/* ─────────────────────────────────── tests ───────────────────────────────── */

describe('toQuery – basic keyword mapping', () => {
  it('maps head → name', () => {
    const res = parse('quick brown fox');
    const q   = toQuery(res);
    expect(q).toEqual({ name: 'quick brown fox' });
  });

  it('maps @kind segment', () => {
    const res = parse('@kind note log unknown');
    const q   = toQuery(res);
    expect(q.kind).toEqual(['note', 'log']);
  });
});

describe('toQuery – timestamp keywords', () => {
  it('@created 2024 → full‑year interval (end‑exclusive)', () => {
    const res = parse('@created 2024');
    const q   = toQuery(res);

    const start = moment('2024-01-01T00:00:00Z').unix();
    const end   = moment('2025-01-01T00:00:00Z').unix(); // end‑exclusive
    expect(q.created_at).toEqual([start, end]);
  });

  it('@updated >2024/01/01 <2024/01/10', () => {
    const res = parse('@updated >2024/01/01 <2024/01/10');
    const q   = toQuery(res);

    const start = moment('2024-01-01T00:00:00Z').unix();        // inclusive
    const end   = moment('2024-01-10T00:00:00Z').unix();        // exclusive
    expect(q.updated_at).toEqual([start, end]);
  });

  it('@changed today utility', () => {
    const res = parse('@changed today');
    const q   = toQuery(res);

    const start = NOW.clone().startOf('day').unix();
    const end   = NOW.clone().add(1, 'day').startOf('day').unix(); // next midnight
    expect(q.changed_at).toEqual([start, end]);
  });
});

describe('toQuery – completed / done helpers', () => {
  it('@todo sets completed: false', () => {
    const q = toQuery(parse('@todo'));
    expect(q.completed).toBe(false);
  });

  it('@done with date adds completed_at interval', () => {
    const q = toQuery(parse('@done 2023'));

    const start2023 = moment('2023-01-01T00:00:00Z').unix();
    expect(q.completed).toBe(true);
    expect(q.completed_at![0]).toBe(start2023);
  });
});
