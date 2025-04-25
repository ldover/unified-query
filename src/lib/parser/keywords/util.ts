// src/parser/keywords/util.ts
export const unescapeAt = (str: string): string =>
  str
    .replace(/\\\\/g, '\\')   // double back-slash first
    .replace(/\\@/g, '@');    // then escaped '@'
