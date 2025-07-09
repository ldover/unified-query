// src/editor/lint.ts
import { linter } from '@codemirror/lint';
import { parse } from './parsers/index.js';

export const searchLinter = linter(view => {
  const res = parse(view.state.doc.toString());
  return res.errors.map(e => ({
    from: e.from,
    to:   e.to,
    severity: 'error',
    message: e.message,
    source: 'unified-query'
  }));
});