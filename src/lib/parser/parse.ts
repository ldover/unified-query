type Keyword =
  | 'head'
  | 'id'       | 'kind'     | 'name'    | 'content'
  | 'in'
  | 'completed'| 'draft'    | 'archived'| 'deleted'
  | 'done'     | 'todo'
  | 'created'  | 'updated'  | 'changed'
  | 'date'     | 'time'
  | 'sort'     | 'limit'
  | `x-${string}`;          // unknown / future keywords


/** Generic carrier for one *occurrence* of a keyword. */
export interface ParsedToken<K extends Keyword = Keyword, V = unknown> {
    keyword: K;               // e.g. "created"
    parsed:  V;               // keyword-specific shape (see union below)
    from:    number;          // absolute offsets for CodeMirror
    to:      number;
    raw:     string;          // original slice (⇢ tooltips, replay, etc.)
  }

  
  /* primitives reused by several keywords */
export interface Cmp<T = string> { op?: '<' | '>'; value: T }
export interface InArg   { id: string; deep: boolean }
export interface SortArg { field: string; dir?: 'asc' | 'desc' }

/* discriminated union — each variant is a ParsedToken with a narrow 'parsed' */
export type Token =
  | ParsedToken<'head',     string>
  | ParsedToken<'id',       string[]>            // one @id block
  | ParsedToken<'kind',     string[]>
  | ParsedToken<'name',     string>
  | ParsedToken<'content',  string>
  | ParsedToken<'in',       InArg[]>
  | ParsedToken<'completed', (Cmp | boolean)[]>
  | ParsedToken<'draft',    boolean>
  | ParsedToken<'archived', (Cmp | boolean)[]>
  | ParsedToken<'deleted',  (Cmp | boolean)[]>
  | ParsedToken<'done',     null>
  | ParsedToken<'todo',     null>
  | ParsedToken<'created',  Cmp[]>
  | ParsedToken<'updated',  Cmp[]>
  | ParsedToken<'changed',  Cmp[]>
  | ParsedToken<'date',     Cmp[]>
  | ParsedToken<'time',     Cmp[]>       // keep HH:mm raw
  | ParsedToken<'sort',     SortArg[]>
  | ParsedToken<'limit',    number>
  | ParsedToken<`x-${string}`, string[]>;        // unknown keyword payload


  export interface ParseError {
    from: number;
    to:   number;
    message: string;
    token: string;
  }
  
  export interface ParseResult {
    tokens: Token[];          // ordered left→right exactly as typed
    errors: ParseError[];     // syntactic issues only
  }
  

