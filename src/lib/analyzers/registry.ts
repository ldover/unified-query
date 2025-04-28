// src/parse/registry.ts

import type { ParsedKeyword, Segment } from "$lib/parsers/types.js";
import { analyzeContent } from "./content.js";
import { analyzeCreated } from "./created.js";
import { analyzeId } from "./id.js";
import { analyzeName } from "./name.js";

/**
 * Signature every analyser must follow.
 * It receives a fully-tokenised Segment and returns a ParsedKeyword
 * (it may also push errors into `segment.errors`).
 */
export type KeywordAnalyser = (seg: Segment) => ParsedKeyword;

/**
 * Central dispatch table: keyword-string ⇒ analyser function.
 * Add new entries here as you implement more keywords.
 */
export const registry: Record<string, KeywordAnalyser> = {
  id: analyzeId,
  name: analyzeName,
  content: analyzeContent,
  created: analyzeCreated
};
