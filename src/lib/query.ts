// query.ts

import type {
  Segment,
  LexToken,
  Keyword,
  DateUtility,
  DateRangeUtility,
  DateValue,
  DatePointUtility,
  DateTimeValue,
  CmpOp,
  TimeValue,
  ParseResult,
  ParsedKeyword,
} from './parsers/types.js';
import moment from 'moment';


export interface SearchQuery {
    /* Specify id to retrieve specific entities */
    id?: string[];

    /* List of kinds: note, log, task, issue, etc. to include*/
    kind?: string[];

    /* Empty string will search for unnamed entities */
    name?: string;

    /* Retrieve entities that have content field and the query matches substring in the content. SearchResult will also return match indices for `content` and `name`*/
    content?: string;

    /* Retrieve the results from the interval: [inclusive, exclusive]. This applies to all intervals in this spec. The number is unix in seconds */
    created_at?: [number, number];
    deleted_at?: [number, number];
    updated_at?: [number, number];

    /* changed_at refers to the max value of created_at, deleted_at, updated_at, completed_at, archived_at.*/
    changed_at?: [number, number];

    /* If the field is  missing will be inferred from updated_at*/
    archived_at?: [number, number];
    /* If the field is  missing will be inferred from updated_at*/
    completed_at?: [number, number];

    /** For entities with `date` field like log. The date string is YYYY/MM/DD format */
    date?: [string, string];

    /** For entities with `time` field like log. The time string is HH:mm format. */
    time?: [string, string];

    /** Returns entities that have been completed/resolved: tasks, issues, projects; this field when specified automatically narrows down the query to completeable/resolvable entities */
    completed?: boolean;

    /** Self explanatory*/
    archived?: boolean;
    deleted?: boolean;
    draft?: boolean;

    /** Return entities in either of the parents. */
    parent?: string[]  // 

    limit?: number;

    /** Sorted from by priority from first to last field*/
    sort?: SortArg[]

    /** Whether to include the entity in the SearchResult or only the id */
    include_entity?: boolean
}


interface SortArg {
    field: SortField
    dir?: 'asc' | 'desc'  // Defaults to asc
}


type SortField = 'created_at' | 'updated_at' | 'deleted_at' |
    'changed_at' | 'archived_at' | 'completed_at' |
    'date' | 'kind'


   
    
    /* ======================================================================= */
    /*                            main converter                              */
    /* ======================================================================= */
    
    export function toQuery(res: ParseResult): SearchQuery {
      const findSeg = (k: ParsedKeyword) => res.segments.find(s => s.keyword == k.keyword) as Segment

      const q: SearchQuery = {};
    
      for (const seg of res.keywords) {
        const kw = seg.keyword as Keyword;
    
        switch (kw) {
          case 'head':
          case 'name':
            q.name = seg.parsed as string
            break;
    
          case 'content':
            q.content = seg.parsed as string
            break;
    
          case 'id':
            if ((seg.parsed as string[]).length) {
                q.id = seg.parsed as string[]
            }
            break;
    
          case 'kind':
            if ((seg.parsed as string[]).length) {
                q.kind = seg.parsed as string[]
            }
            break;
    
          case 'in':
            if ((seg.parsed as ({id: string, deep: boolean})[]).length) {
                // TODO if uuid's deep op (*) is present will have to include all collections 
                // in that parent
                q.parent = (seg.parsed as ({id: string, deep: boolean})[]).map(r => r.id)
            }
            break;
    
          case 'draft':
            q.draft = parseBooleanKeyword(findSeg(seg));
            break;
    
          case 'archived':
            parseBooleanOrTimestamp('archived', findSeg(seg), q);
            break;
    
          case 'deleted':
            parseBooleanOrTimestamp('deleted', findSeg(seg), q);
            break;
    
          case 'todo':
            q.completed = false;
            break;
    
          case 'done':
            q.completed = parseBooleanKeyword(findSeg(seg));
            applyTimestampIfPresent('completed_at', findSeg(seg), q);
            break;
    
          case 'created':
          case 'updated':
          case 'changed': {
            const f = `${kw}_at` as keyof SearchQuery;
            const iv = timestampSegmentToInterval(findSeg(seg));
            if (iv) mergeIntervalField(q, f, iv);
            break;
          }
    
          case 'date': {
            const iv = dateOrTimeSegmentToInterval(findSeg(seg), 'date');
            if (iv) q.date = iv;
            break;
          }
    
          case 'time': {
            const iv = dateOrTimeSegmentToInterval(findSeg(seg), 'time');
            if (iv) q.time = iv;
            break;
          }
    
          case 'sort':
            q.sort = parseSort(findSeg(seg));
            break;
    
            // TODO: implement when added
        //   case 'limit':
            // q.limit = parseInt(seg.body.trim(), 10);
            // break;
    
          default:
            // ignore unknown or future keywords for now
            break;
        }
      }
    
      return q;
    }
    
    // TODO: how does this work?
    function mergeIntervalField(q: SearchQuery, field: keyof SearchQuery, iv: [number, number]) {
      const prev = q[field] as [number, number] | undefined;
      if (!prev) {
        (q as any)[field] = iv;
        return;
      }
      (q as any)[field] = [Math.max(prev[0], iv[0]), Math.min(prev[1], iv[1])];
    }
    
    function parseBooleanKeyword(seg: Segment): boolean {
      const tok = seg.tokens.find((t) => t.kind === 'boolean') as any;
      return tok ? tok.value : true; // default to true if no explicit value
    }
    
    function parseBooleanOrTimestamp(fieldBase: 'archived' | 'deleted', seg: Segment, q: SearchQuery) {
      const boolTok = seg.tokens.find((t) => t.kind === 'boolean') as any;
      if (boolTok) {
        (q as any)[fieldBase] = boolTok.value;
        return;
      }
      (q as any)[fieldBase] = true; // presence implies true
      const iv = timestampSegmentToInterval(seg);
      if (iv) mergeIntervalField(q, `${fieldBase}_at` as keyof SearchQuery, iv);
    }
    
    function applyTimestampIfPresent(field: keyof SearchQuery, seg: Segment, q: SearchQuery) {
      const iv = timestampSegmentToInterval(seg);
      if (iv) mergeIntervalField(q, field, iv);
    }
    
    /* ======================================================================= */
    /*                              helpers                                     */
    /* ======================================================================= */
    
    function timestampSegmentToInterval(seg: Segment): [number, number] | undefined {
      const tsToks = seg.tokens.filter((t) =>
        t.kind === 'date' || t.kind === 'datetime' || t.kind === 'dateutil'
      );
    
      if (tsToks.length === 0 || tsToks.length > 2) return undefined;
    
      if (tsToks.length === 1) {
        return singleTimestampTokenToInterval(tsToks[0] as any);
      }
    
      // Exactly two — merge by intersection
      const a = singleTimestampTokenToInterval(tsToks[0] as any);
      const b = singleTimestampTokenToInterval(tsToks[1] as any);
      if (!a || !b) return undefined;
      return [Math.max(a[0], b[0]), Math.min(a[1], b[1])];
    }
    
    function singleTimestampTokenToInterval(tok: LexToken): [number, number] | undefined {
      switch (tok.kind) {
        case 'dateutil':
          return dateUtilityToInterval(tok.value as DateUtility);
        case 'date':
          return dateValueToInterval(tok.op ?? '', tok.value as DateValue);
        case 'datetime':
          return datetimeToInterval(tok.op ?? '', tok.value as DateTimeValue);
        default:
          return undefined;
      }
    }
    
    /* ───────────────────────────── utilities ─────────────────────────────── */
    
    function dateUtilityToInterval(u: DateUtility): [number, number] {
      const now = moment(); // local time
    
      if ((u as DatePointUtility).util === 'today') {
        return [now.clone().startOf('day').unix(), now.clone().startOf('day').add(1, 'day').unix()];
      }
      if ((u as DatePointUtility).util === 'yesterday') {
        const y = now.clone().subtract(1, 'day');
        return [y.startOf('day').unix(), y.startOf('day').add(1, 'day').unix()];
      }
    
      // lastN{unit}
      const r = u as DateRangeUtility;
      const unitMap: Record<DateRangeUtility['unit'], moment.unitOfTime.StartOf> = {
        days: 'day',
        weeks: 'week',
        months: 'month',
        years: 'year',
      } as const;
    
      const singularUnit = unitMap[r.unit];
      const start = now.clone().subtract(r.n, singularUnit).startOf(singularUnit);
      return [start.unix(), now.clone().endOf('day').unix()];
    }
    
    function dateValueToInterval(op: CmpOp | '', dv: DateValue): [number, number] {
      const ts = moment(`${dv.y}/${dv.m ?? 1}/${dv.d ?? 1}`, 'YYYY/M/D', true);
      const unit: moment.unitOfTime.StartOf = dv.d ? 'day' : dv.m ? 'month' : 'year';
    
      if (op === '>') return [ts.clone().startOf(unit).unix(), Infinity];
      if (op === '<') return [0, ts.clone().startOf(unit).unix()];
    
      return [ts.clone().startOf(unit).unix(), ts.clone().startOf(unit).add(1, unit).unix()];
    }
    
    function datetimeToInterval(op: CmpOp | '', dt: DateTimeValue): [number, number] {
      const ts = moment(`${dt.y}/${dt.m}/${dt.d} ${dt.h}:${dt.min}`, 'YYYY/M/D H:mm', true);
      if (op === '>') return [ts.unix(), Infinity];
      if (op === '<') return [0, ts.unix() - 1];
      return [ts.unix(), ts.clone().add(1, 'minute').unix()];
    }
    
    function dateOrTimeSegmentToInterval(
      seg: Segment,
      kind: 'date' | 'time'
    ): [string, string] | undefined {
      const toks = seg.tokens.filter((t) => t.kind === kind) as any[];
      if (toks.length === 0 || toks.length > 2) return undefined;
    
      const raw = toks.map((t) => t.value);
      if (toks.length === 1) return [raw[0], raw[0]];
      return [raw[0], raw[1]];
    }
    
    function parseSort(seg: Segment): SortArg[] {
      const res: SortArg[] = [];
      for (const t of seg.tokens) {
        if (t.kind !== 'string') continue;
        const [field, dir] = (t as any).value.split(':');
        res.push({ field: field as any, dir: dir as any });
      }
      return res;
    }
    