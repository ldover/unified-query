import { parseId }   from './keywords/id.js';
import type { Segment } from './scanner.js';
import type { ParseError, Token } from './parse.js';
import { parseName } from './keywords/name.js';
import { parseContent } from './keywords/content.js';
import { makeTimestampParser } from './timestamp.js';

export type KeywordParser = (seg: Segment) => { tokens: Token[]; errors: ParseError[] };


export const registry: Record<string, KeywordParser> = {
  id:        parseId,
  name:      parseName,
  content: parseContent,
};

registry.completed = makeTimestampParser({ keyword:'completed', allowBoolean:true        });
registry.archived  = makeTimestampParser({ keyword:'archived',  allowBoolean:true        });
registry.deleted   = makeTimestampParser({ keyword:'deleted',   allowBoolean:true        });

registry.created   = makeTimestampParser({ keyword:'created',   allowBoolean:false       });
registry.updated   = makeTimestampParser({ keyword:'updated',   allowBoolean:false       });
registry.changed   = makeTimestampParser({ keyword:'changed',   allowBoolean:false       });

registry.date      = makeTimestampParser({ keyword:'date',      allowBoolean:false, kindFilter:['date'] });
registry.time      = makeTimestampParser({ keyword:'time',      allowBoolean:false, kindFilter:['time'] });
