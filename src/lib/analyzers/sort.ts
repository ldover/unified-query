import type { Segment, ParseError, ParsedKeyword } from '../parsers/types.js';
import type { SortArg } from '../parsers/types.js';

/* recognised sortable fields */
const FIELDS = ['name', 'created', 'updated', 'deleted', 'archived', 'completed'] as const;
type Field = typeof FIELDS[number];

function isField(x: string): x is Field {
  return (FIELDS as readonly string[]).includes(x);
}

export function analyzeSort(seg: Segment): ParsedKeyword<'sort', SortArg[]> {
  const list: SortArg[] = [];
  const errors: ParseError[] = [];

  if (seg.tokens.length === 0) list.push({ field: 'name', dir: 'asc' });

  for (const tok of seg.tokens) {
    if (tok.kind !== 'string') { errors.push(invalid(tok)); continue; }

    const [fieldRaw, dirRaw] = tok.value.split(':', 2);
    if (!isField(fieldRaw)) { errors.push(badField(tok)); continue; }

    let dir: 'asc' | 'desc' | undefined;
    if (dirRaw) {
      if (dirRaw === 'asc' || dirRaw === 'desc') dir = dirRaw;
      else { errors.push(badDir(tok)); continue; }
    }

    list.push({ field: fieldRaw, dir });
  }

  seg.errors.push(...errors);
  return { keyword:'sort', parsed:list, from:seg.from, to:seg.to, raw:seg.raw };

  /* helpers */
  function invalid(tok) {
    return { message:`invalid token "${tok.raw}" for @sort`, token:tok.raw,
             from:tok.from, to:tok.to } as ParseError;
  }
  function badDir(tok) {
    return { message:`invalid sort direction in "${tok.raw}"`,
             token:tok.raw, from:tok.from, to:tok.to } as ParseError;
  }
  function badField(tok) {
    return { message:`unrecognised sort field "${tok.raw.split(':')[0]}"`,
             token:tok.raw, from:tok.from, to:tok.to } as ParseError;
  }
}
