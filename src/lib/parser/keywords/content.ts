// src/parse/keywords/content.ts
import type { Segment } from '../scanner.js';
import { parseName } from './name.js';

// For now content parser is same as name; later the spec might change
export const parseContent = (seg: Segment) => {
    const res = parseName(seg)
    if (res.errors[0]) {
        res.errors[0].message = res.errors[0].message.replace('name', 'content')
    }

    return res
};
