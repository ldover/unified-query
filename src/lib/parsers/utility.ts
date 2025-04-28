import type { CmpOp, DateUtility, MicroParser } from "./types.js";

const TODAY_RE  = /^(today|yesterday)$/i;
const LAST_RE   = /^last(\d+)(days|weeks|months|years)$/i;

export const utilityDateParser: MicroParser = (word, pos) => {
  let op: CmpOp | undefined;
  if (word[0] === '<' || word[0] === '>') {
    op  = word[0] as CmpOp;
    word = word.slice(1);
    pos += 1;
  }

  let m = TODAY_RE.exec(word);
  if (m) {
    const value: DateUtility = { util: m[1].toLowerCase() as 'today'|'yesterday' };
    return { kind: 'dateutil', op, value, raw: word, from: pos, to: pos+word.length };
  }

  m = LAST_RE.exec(word);
  if (m) {
    const value: DateUtility = {
      util: 'last',
      n:    +m[1],
      unit: m[2] as DateUtility['unit'],
    };
    return { kind: 'dateutil', op, value, raw: word, from: pos, to: pos+word.length };
  }

  return null;
};
