import type { ParseError } from "./parse.js";

export interface Segment {
    keyword: 'head' | string;   // → "head" for leading text, otherwise raw keyword (no '@')
    from: number;               // absolute start pos of keyword (or head)
    to: number;                 // absolute end pos (exclusive, points at whitespace or EOS)
    body: string;               // text immediately following keyword, trimmed-right
    raw: string;                // full slice exactly as typed
  }

  interface ScanResult {
    segments: Segment[];
    errors: ParseError[];
  }


const isIdent = (c: string) => /[A-Za-z0-9_-]/.test(c);

  
  /**
   * Naïve DFA:
   *  • consume until `@` not escaped & not within quotes  -> flush as head/prev body
   *  • read identifier    [A-Za-z0-9_-]+
   *  • consume following run of chars until *next* unescaped `@` or EOS
   *  • repeat
   *
   * Inside quoted spans we honour \" and \\.
   */
  export function scan(input: string): ScanResult {
    const segments: Segment[] = [];
    const errors: ParseError[] = [];
  
    let i = 0;                          // cursor
    let segStart = 0;                   // where current segment starts
    let inQuote = false;
    let escaped = false;
  
    // helper: flush a segment [segStart,i) with given keyword
    const pushSegment = (keyword: string, bodyStart: number, bodyEnd: number) => {
      segments.push({
        keyword: keyword as any,
        body: input.slice(bodyStart, bodyEnd),
        from: segStart,
        to: i,
        raw: input.slice(segStart, i)
      });
    };
  
    // 1) head: consume until first unescaped '@'
    while (i < input.length) {
      const ch = input[i];
      if (ch === '@' && !escaped) break;
      escaped = ch === '\\' && !escaped;
      ++i;
    }
    // push head if any text before @
    if (i > 0) {
      pushSegment('head', segStart, i); // body==raw for head
    }
  
    // 2) walk the rest
    while (i < input.length) {
      segStart = i;          // '@' starts here
      ++i;                   // skip '@'
  
      // read keyword identifier
      const kwStart = i;
      while (i < input.length && isIdent(input[i])) i++;
      const keyword = input.slice(kwStart, i);
  
      // consume following whitespace after keyword (belongs to body)
      while (i < input.length && input[i] === ' ') i++;
      const bodyStart = i;
  
      // now read body until next *unescaped & unquoted* '@' or EOS
      inQuote = false;
      escaped = false;
      while (i < input.length) {
        const ch = input[i];
  
        if (escaped) {
          escaped = false;            // treat char literally
        } else if (ch === '\\') {
          escaped = true;
        } else if (ch === '"') {
          inQuote = !inQuote;         // toggle quote
        } else if (ch === '@' && !inQuote) {
          break;                      // boundary of next segment
        }
        ++i;
      }
      const bodyEnd = i;              // body includes trailing spaces
  
      pushSegment(keyword, bodyStart, bodyEnd);
    }
  
    // unterminated quote error?
    if (inQuote) {
      errors.push({
        from: segStart,
        to: input.length,
        token: input.slice(segStart),
        message: 'unterminated quote'
      });
    }
  
    return { segments, errors };
  }

  