// src/lib/analyzers/registry.ts
import type { ParsedKeyword, Segment } from '$lib/parsers/types.js';

/* -------------------------------------------------------------------------- */
/* Individual analysers                                                       */
/* -------------------------------------------------------------------------- */
import { analyzeArchived  } from './archived.js';
import { analyzeChanged   } from './changed.js';
import { analyzeDone } from './done.js';
import { analyzeContent   } from './content.js';
import { analyzeCreated   } from './created.js';
import { analyzeDate      } from './date.js';
import { analyzeDeleted   } from './deleted.js';
import { analyzeId        } from './id.js';
import { analyzeIn        } from './in.js';
import { analyzeName      } from './name.js';
import { analyzeTime      } from './time.js';
import { analyzeUpdated   } from './updated.js';

/* -------------------------------------------------------------------------- */
/* Shared signature                                                           */
/* -------------------------------------------------------------------------- */
export type KeywordAnalyser = (seg: Segment) => ParsedKeyword;

/* -------------------------------------------------------------------------- */
/* Central dispatch table: keyword → analyser                                 */
/* -------------------------------------------------------------------------- */
export const registry: Record<string, KeywordAnalyser> = {
  /* identity / meta ------------------------------------------------------- */
  id:       analyzeId,
  name:     analyzeName,
  content:  analyzeContent,

  /* relation -------------------------------------------------------------- */
  in:       analyzeIn,

  /* timestamps ------------------------------------------------------------ */
  created:  analyzeCreated,
  updated:  analyzeUpdated,
  changed:  analyzeChanged,
  deleted:  analyzeDeleted,
  archived: analyzeArchived,

  date:     analyzeDate,
  time:     analyzeTime,

  /* workflow -------------------------------------------------------------- */
  completed: analyzeDone,
  // done / todo / draft, sort, limit … will be added as their analysers land
};
