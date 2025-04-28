import type {
    Segment,
    ParseError,
    ParsedKeyword,
  } from '../parsers/types.js';
  
  const KINDS = [
    'note',
    'log',
    'project',
    'space',
    'collection',
    'issue',
    'task',
    'tab',
    'concept',
    'idea' // TODO: check that all kinds are here
];

  /**
   * `@kind` analyser
   * • Accepts only string tokens.
   * • Each string must be present in the KINDS allow-list.
   */
  export function analyzeKind(
    seg: Segment
  ): ParsedKeyword<'kind', string[]> {
    const kinds: string[] = [];
    const errors: ParseError[] = [];
  
    for (const tok of seg.tokens) {
      if (tok.kind === 'string') {
        if (KINDS.includes(tok.value)) {
          kinds.push(tok.value);
        } else {
          errors.push(unsupportedErr(tok));
        }
        continue;
      }
  
      errors.push(invalidTokErr(tok));
    }
  
    seg.errors.push(...errors);
  
    return {
      keyword: 'kind',
      parsed: kinds,
      from: seg.from,
      to: seg.to,
      raw: seg.raw,
    };
  }
  
  /* -------------------------------------------------------------------------- */
  /* helpers                                                                    */
  /* -------------------------------------------------------------------------- */
  function unsupportedErr(tok): ParseError {
    return {
      message: `unsupported kind "${tok.raw}"`,
      token: tok.raw,
      from: tok.from,
      to: tok.to,
    };
  }
  
  function invalidTokErr(tok): ParseError {
    return {
      message: `invalid token "${tok.raw}" for @kind (expects string kinds)`,
      token: tok.raw,
      from: tok.from,
      to: tok.to,
    };
  }
  