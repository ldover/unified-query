export type Kind = 'note' |
  'log' |
  'project' |
  'space' |
  'collection' |
  'issue' |
  'task' |
  'tab' |
  'concept' |
  'idea' |
  'aichat' |
  'aiprompt' |
  'airesponse'

export type Keyword =
    | 'head'
    | 'id' | 'kind' | 'name' | 'content'
    | 'in'
    | 'draft' | 'archived' | 'deleted'
    | 'done' | 'todo'
    | 'created' | 'updated' | 'changed'
    | 'date' | 'time'
    | 'sort' | 'limit'
    | 'today' | 'yesterday'
    | Kind


/* ----- shared base ----- */
interface BaseTok {
    from: number;
    to:   number;
    raw:  string;
  }

/** single calendar points */
export type DatePointUtility =
  | { util: 'today' }
  | { util: 'yesterday' };

/** closed interval ending “now” */
export type DateRangeUtility = {
  util: 'last';
  unit: 'days' | 'weeks' | 'months' | 'years';
  n: number;
};

export type DateUtility = DatePointUtility | DateRangeUtility
  
  /* ----- structured values ----- */
  export type DateValue     = { y: number; m?: number; d?: number };
  export type TimeValue     = { h: number; m?: number; clock: '24h' | '12h' };
  export type DateTimeValue = { y: number; m: number; d: number; h: number; min: number };
  
  export type TimestampValue =
  | DateValue
  | TimeValue
  | DateTimeValue
  | Cmp<DateValue | TimeValue | DateTimeValue>;
  
  export type CmpOp = '<' | '>';
  
  /* ----- lexical token union ----- */
  export type LexToken =
    | ({ kind:'date';     op?: CmpOp; value: DateValue     } & BaseTok)
    | ({ kind:'time';     op?: CmpOp; value: TimeValue     } & BaseTok)
    | ({ kind:'datetime'; op?: CmpOp; value: DateTimeValue } & BaseTok)
    | ({ kind: 'dateutil'; op?: CmpOp; value: DateUtility } & BaseTok)
    | ({ kind:'boolean';  value: boolean                   } & BaseTok)
    | ({
      kind: 'uuid';
      value: string;        // canonical UUID
      deep: boolean;       // `true` when the original token ended with "*"
    } & BaseTok)
    | ({ kind:'string';   value: string                    } & BaseTok); 


/* ---------- helper signature each micro-parser implements ---------- */
export type MicroParser = (word: string, pos: number) => LexToken | null;


export interface ParsedKeyword<K extends Keyword = Keyword, V = unknown> {
    keyword: K;
    parsed:  V;
    from:    number;
    to:      number;
    raw:     string;
  }  


export type Cmp<V> = { op: CmpOp, value: V}

export interface InArg { id: string; deep: boolean }
export interface SortArg { field: string; dir?: 'asc' | 'desc' }


export interface ParseError {
    from: number;
    to: number;
    message: string;
    token: string;
}

export interface ParseResult {
    segments: Segment[]
    keywords: ParsedKeyword[]
    errors: ParseError[];     // syntactic issues only
}

export interface Segment {
    keyword: 'head' | string;   // "head" for leading text, otherwise the keyword (no '@')
    tokens: LexToken[]
    errors: ParseError[]
    from: number;               // absolute start-offset of this segment
    to: number;                 // absolute end-offset (exclusive)
    body: string;               // text following the keyword (may contain spaces)
    raw: string;                // exact slice [from, to)
    ignored: boolean            // for duplicate or unknown keywords
  }