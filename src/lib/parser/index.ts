import type { ParseError, ParseResult, Token } from "./parse.js";
import { registry } from "./registry.js";
import { scan } from "./scanner.js";


export function parse(input: string): ParseResult {
const { segments, errors: scanErrors } = scan(input);

const tokens: Token[] = [];
const errors: ParseError[] = [...scanErrors];

for (const seg of segments) {
    const kw = seg.keyword;        // already "head" or raw keyword w/o '@'
    const fn = registry[kw] ?? registry.__unknown;
    const { tokens: tk, errors: er } = fn(seg);
    tokens.push(...tk);
    errors.push(...er);
}

// Preserve original order: scanner already walked left→right
return { tokens, errors };
}