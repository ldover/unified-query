// src/parse/keywords/id.ts

import type { MicroParser } from "./types.js";


// uuid micro-parser tweak
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\*?$/i;
export const uuidParser: MicroParser = (word, pos) => {
  const m = UUID_RE.exec(word);
  if (!m) return null;
  const hasStar = word.endsWith('*');
  const id = hasStar ? word.slice(0, -1) : word;
  return { kind: 'uuid', value: id, deep: hasStar, raw: word, from: pos, to: pos + word.length };
};
