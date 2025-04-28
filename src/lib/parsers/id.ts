// src/parse/keywords/id.ts

import type { MicroParser } from "./types.js";


const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;


export const uuidParser: MicroParser = (word, pos) => {

  const m =  UUID_RE.exec(word)
  if (!m) return null

  return {
    kind: 'uuid',
    value: word,
    raw: word,
    from: pos,
    to: pos + word.length,
  }
}
