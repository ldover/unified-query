// src/Search.ts
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, ViewUpdate } from '@codemirror/view';
import { defaultKeymap } from '@codemirror/commands';
import { basicSetup } from 'codemirror';
import {
  autocompletion,
  CompletionContext,
} from '@codemirror/autocomplete';
import { parseDateQueryArg, keywordToInterval, dateQueryToInterval  } from './parsers.js';
import { highlighter } from './plugins.js';
import { theme } from './theme.js';
import { searchLinter } from './lint.js';

type Datetime = number;
type Time = string;
type Date = string;

interface SearchQuery {
    id: string[];
    kind: string[];
    name: string;
    content: string;
    created_at: [Datetime, Datetime];
    deleted_at: [Datetime, Datetime];
    updated_at: [Datetime, Datetime];
    changed_at: [Datetime, Datetime];
    date: [Date, Date];
    time: [Time, Time];
    completed: boolean;
    resolved: boolean;
    archived: boolean;
    deleted: boolean;
    draft: boolean;

    in: [string, boolean]; // [collection id, "deep containment" parameter]

    limit: number;
    sort: {
        field: 'created_at' | 'updated_at' | 'deleted_at' | 'changed_at';
        direction: 'asc' | 'desc';
    };
}


interface ArgMap {
    program?: string;
    [key: string]: string[];
}

function parseAtArgs(input: string): ArgMap {
    const args: Partial<ArgMap> = {};

    // 1) program = everything before first @
    const atIdx = input.indexOf('@');
    args.program = (atIdx < 0 ? input : input.slice(0, atIdx)).trim();

    // 2) tokenize & assign
    //   group1 = @key
    //   group2 = bracketed [..]
    //   group3 = double‑quoted
    //   group4 = single‑quoted
    //   group5 = bare word
    const tokenRe = /@(\w+)|\[(.+?)\]|"((?:\\.|[^"\\])*)"|'((?:\\.|[^'\\])*)'|([^\s@]+)/g;
    let curKey: string | null = null;
    let m: RegExpExecArray | null;
    while ((m = tokenRe.exec(input)) !== null) {
        if (m[1]) {
            // saw @key
            curKey = m[1];
            args[curKey] = []; // start fresh array
        } else if (curKey) {
            // a token for the current key
            let token: string;
            if (m[2] !== undefined) {
                token = m[2]; // inside [brackets]
            } else if (m[3] !== undefined) {
                token = m[3].replace(/\\"/g, '"'); // double‑quoted, unescape \"
            } else if (m[4] !== undefined) {
                token = m[4].replace(/\\'/g, "'"); // single‑quoted, unescape \'
            } else {
                token = m[5]!; // bare word
            }
            (args[curKey] as string[]).push(token);
        }
        // else: stray tokens before first @ are ignored here
    }

    return args as ArgMap;
}

export interface SearchOptions {
  /** The DOM element to mount the editor into */
  element: HTMLElement;
  /** Called whenever the query text changes */
  onChange: (query: Partial<SearchQuery>) => void;
}

const KINDS = [
    'note',
    'log',
    'project',
    'space',
    'collection',
    'issue',
    'task',
    'tab',
    'concept',
    'idea'
];

function toSearchQuery(args: ArgMap, collections: Collection[]): Partial<SearchQuery> {
    const validKind = (kind: string): boolean => {
        return KINDS.includes(kind);
    };

    let query: Partial<SearchQuery> = {};
    if (!args.name && args.program) {
        query.name = args.program;
    }

    const join = (arr: string[]): string => {
        return arr.join(' ');
    };

    if (args.content?.length) {
        query.content = join(args.content);
    }

    if (args.name?.length) {
        query.name = join(args.name);
    }

    if (args.kind?.length) {
        query.kind = args.kind.filter(validKind);
    }

    // The three date‐filters we want to DRY up:
    const dateFilters = ['created', 'deleted', 'updated'] as const;
    const DATE_KEYWORDS = new Set(['today', 'yesterday']);
    const LAST_REGEX = /^last(\d+)(days?|weeks?|months?)$/i;

    if (args.sort) {
        // for now, we only allow timestamp fields, so default to created_at
        query.sort = { field: 'created_at', direction: 'asc' };
        const dir = args.sort[0]?.toLowerCase();
        if (dir === 'asc' || dir === 'desc') {
            query.sort.direction = dir;
        }
    }

    // Standalone date‐keywords => changed_at
    for (const key of Object.keys(args)) {
        const raw = key.toLowerCase();
        if (DATE_KEYWORDS.has(raw) || LAST_REGEX.test(raw)) {
            query.changed_at = keywordToInterval(raw);
            break; // only one global time filter
        }
    }

    for (const field of dateFilters) {
        const vals = args[field];
        if (!vals?.length) continue;

        try {
            const raw = vals[0].toLowerCase();
            const key = (field + '_at') as keyof SearchQuery;

            if (DATE_KEYWORDS.has(raw) || LAST_REGEX.test(raw)) {
                (query as any)[field + '_at'] = keywordToInterval(raw);
                continue;
            }

            const d1 = parseDateQueryArg(vals[0]);
            const d2 = vals[1] ? parseDateQueryArg(vals[1]) : undefined;
            // e.g. "created" -> "created_at"

            (query as any)[key] = dateQueryToInterval(d1, d2);
            console.log({ [key]: (query as any)[key] });
        } catch {
            // swallow parse errors
        }
    }

    if (args.deleted && !args.deleted.length) {
        query.deleted = true;
    }

    if (args.archived) {
        // TODO: add support for false/true (default is true)
        query.archived = true;
    }

    if (args.draft) {
        // TODO: add support for false/true (default is true)
        query.draft = true;
    }

    if (args.in?.length) {
    	const wanted = args.in[0].toLowerCase();
    	// find first whose name startsWith the token:
    	const match = collections.find((e) => e.name.toLowerCase().startsWith(wanted));

    	console.log(args.in, { match });
    	if (match) {
    		query.in = [match.id, true];
    	}
    }
    

    const extraKinds: string[] = [];
    KINDS.forEach((k) => {
        if (k in args) {
            extraKinds.push(k);
        }
    });

    if (query.kind) {
        // TODO: filter duplicate kinds
        query.kind = [...query.kind, ...extraKinds];
    } else {
        query.kind = extraKinds;
    }
    return query;
}

// Define available keywords
const KEYWORDS = [
    'created',
    'deleted',
    'updated',
    'changed',
    'done',
    'todo',
    'today',
    'yesterday',
    'in',
    'kind',
    'sort',
    'limit'
].map((k) => '@' + k);


type Collection = {
    id: string
    name: string
}

export class Search {
  private view: EditorView;
  private collections: Collection[] = [];

  constructor(private opts: SearchOptions) {
    this.view = new EditorView({
      state: EditorState.create({
        doc: '@sort created',
        extensions: [
          basicSetup,
          keymap.of(defaultKeymap),
          theme,
          searchLinter,
          highlighter,
          autocompletion({
            override: [
              this.keywordCompletion.bind(this),
              this.inCompletionSource.bind(this)
            ]
          }),
          // listen for text changes
          EditorView.updateListener.of((u: ViewUpdate) => {
            if (u.docChanged) {
              const q = u.state.doc.toString();
              try {
                const params = toSearchQuery(parseAtArgs(q), this.collections)
                this.opts.onChange(params);

              } catch (err) {}
            }
          })
        ]
      }),
      parent: this.opts.element
    });
  }

  setCollections(names: Collection[]) {
    this.collections = names;
  }

  destroy() {
    this.view.destroy();
  }

  /** 
   * A simple keyword completer: suggests on `@…`
   * You can expand this list as desired.
   */
	private keywordCompletion(context: CompletionContext) {
		const before = context.matchBefore(/@\w*/);
		if (!before) return null;
		// Only trigger when explicit or at least one char after '@'
		if (before.from === before.to && !context.explicit) return null;
		return {
			from: before.from,
			to: before.to,
			options: KEYWORDS.map((label) => ({ label, type: 'keyword' })),
			validFor: /^@\w*$/
		};
	}


	// 2) Create a completion source for "@in <…>"
	private inCompletionSource(context: CompletionContext) {
		// Try to match "@in " plus optional partial word right before the cursor
		const before = context.matchBefore(/@in\s+([\w-]*)$/);
		if (!before) return null;
		// Only trigger when explicitly after "@in "
		// start: the position where the match begins
		const from = before.from + 4; // skip over "@in "
		return {
			from,
			options: this.collections.map((c) => ({
				label: c.name,
				type: 'constant',
				apply: c.name + ' '
			}))
		};
	}

//   /**
//    * Offers `@in <collection>` completions based on
//    * the current `this.collections` array.
//    */
//   private inCompletionSource(context: CompletionContext) {
//     // look for "@in " plus optionally partial name
//     const m = context.matchBefore(/@in\s+([\w-]*)$/);
//     if (!m) return null;

//     const prefix = m[1] || '';
//     const from = m.from + 4; // position after "@in "

//     const options = this.collections
//       .filter((name) => name.toLowerCase().startsWith(prefix.toLowerCase()))
//       .map((name) => ({
//         label: name,
//         type: 'constant',
//         apply: name + ' '
//       }));

//     return { from, options };
//   }
}

