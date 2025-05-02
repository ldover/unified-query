// query.test.ts
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';

import moment from 'moment';
import { toQuery } from './query.js';
import type {
  Segment,
  LexToken,
  DateValue,
  DatePointUtility,
  DateRangeUtility,
} from './parsers/types.js';

/* ───────────────────────────────────────── helpers ───────────────────────────────────────── */

// Freeze “now” so utility‑date tests are deterministic — May 2 2025 10:00 UTC
const NOW = moment('2025-05-02T10:00:00Z');

let dateNowSpy: ReturnType<typeof vi.spyOn>;

beforeAll(() => {
  dateNowSpy = vi.spyOn(Date, 'now').mockImplementation(() => NOW.valueOf());
});

afterAll(() => {
  dateNowSpy.mockRestore();
});

function seg(partial: Partial<Segment>): Segment {
  return {
    keyword: 'head',
    tokens: [],
    errors: [],
    from: 0,
    to: 0,
    body: '',
    raw: '',
    ignored: false,
    ...partial,
  } as Segment;
}

function uuidTok(id: string): LexToken {
  return { kind: 'uuid', value: id, deep: false, from: 0, to: 0, raw: id } as any;
}

function dateTok(op: '' | '<' | '>', dv: DateValue): LexToken {
  return { kind: 'date', op, value: dv, from: 0, to: 0, raw: '' } as any;
}

function dateUtilTok(util: DatePointUtility | DateRangeUtility): LexToken {
  return { kind: 'dateutil', value: util, from: 0, to: 0, raw: '' } as any;
}

/* ───────────────────────────────────────── test cases ───────────────────────────────────── */

describe('toQuery – basic keyword mapping', () => {
  it('maps head to name', () => {
    const q = toQuery([
      seg({ keyword: 'head', body: 'quick brown fox' }),
    ]);
    expect(q).toEqual({ name: 'quick brown fox' });
  });

  it('maps @kind segment', () => {
    const q = toQuery([
      seg({
        keyword: 'kind',
        tokens: [
          { kind: 'string', value: 'note', from: 0, to: 0, raw: 'note' } as any,
          { kind: 'string', value: 'log',  from: 0, to: 0, raw: 'log'  } as any,
        ],
      }),
    ]);
    expect(q.kind).toEqual(['note', 'log']);
  });
});

describe('toQuery – timestamp keywords', () => {
  it('@created 2024 → full‑year interval', () => {
    const q = toQuery([
      seg({
        keyword: 'created',
        tokens: [dateTok('', { y: 2024 })],
      }),
    ]);

    const start = moment('2024-01-01T00:00:00Z').unix();
    const end   = moment('2025-01-01T00:00:00Z').unix();
    expect(q.created_at).toEqual([start, end]);
  });

  it('@updated >2024/01/01 <2024/01/10', () => {
    const q = toQuery([
      seg({
        keyword: 'updated',
        tokens: [
          dateTok('>', { y: 2024, m: 1, d: 1  }),
          dateTok('<', { y: 2024, m: 1, d: 10 }),
        ],
      }),
    ]);
    const start = moment('2024-01-01T00:00:00Z').unix();
    const end   = moment('2024-01-10T00:00:00Z').unix();
    expect(q.updated_at).toEqual([start, end]);
  });

  it('@changed today utility', () => {
    const q = toQuery([
      seg({
        keyword: 'changed',
        tokens: [dateUtilTok({ util: 'today' })],
      }),
    ]);

    const start = NOW.clone().startOf('day').unix();
    const end   = NOW.clone().startOf('day').add(1, 'day').unix();
    expect(q.changed_at).toEqual([start, end]);
  });
});

describe('toQuery – completed/done helpers', () => {
  it('@todo sets completed: false', () => {
    const q = toQuery([seg({ keyword: 'todo', tokens: [] })]);
    expect(q.completed).toBe(false);
  });

  it('@done with date adds completed_at interval', () => {
    const q = toQuery([
      seg({ keyword: 'done', tokens: [dateTok('', { y: 2023 })] }),
    ]);

    expect(q.completed).toBe(true);
    expect(q.completed_at![0]).toBe(moment('2023-01-01T00:00:00Z').unix());
  });
});
