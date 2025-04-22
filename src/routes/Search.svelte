<script lang="ts">
	import { onMount } from 'svelte';
	import { createEventDispatcher } from 'svelte';
	import { EditorState, RangeSet, RangeSetBuilder } from '@codemirror/state';
	import { EditorView, keymap } from '@codemirror/view';
	import { defaultKeymap } from '@codemirror/commands';
	import { basicSetup } from 'codemirror';
	import { autocompletion, CompletionContext } from '@codemirror/autocomplete';
	import { dateQueryToInterval, keywordToInterval, parseDateQueryArg } from '$lib/parsers.js';

	// HighlightPlugin.ts
	import { Decoration, ViewPlugin, ViewUpdate } from '@codemirror/view';

	export const highlightAtKeywords = ViewPlugin.fromClass(
		class {
			decorations: RangeSet<Decoration>
			constructor(view: EditorView) {
				this.decorations = this.buildDecorations(view);
			}
			update(update: ViewUpdate) {
				// Recompute decorations on text or viewport changes
				if (update.docChanged || update.viewportChanged) {
					this.decorations = this.buildDecorations(update.view);
				}
			}
			buildDecorations(view: EditorView) {
				const builder = new RangeSetBuilder<Decoration>();
				const regex = /@\w+/g;

				for (const { from, to } of view.visibleRanges) {
					const text = view.state.doc.sliceString(from, to);
					let match;
					while ((match = regex.exec(text))) {
						const start = from + match.index;
						const end = start + match[0].length;
						builder.add(start, end, Decoration.mark({ class: 'cm-atKeyword' }));
					}
				}

				return builder.finish();
			}
		},
		{
			decorations: (v) => v.decorations
		}
	);

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

	function toSearchQuery(args: ArgMap): Partial<SearchQuery> {
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

		// TODO: Resolve @in <name> ——
		// if (args.in?.length) {
		// 	const wanted = args.in[0].toLowerCase();
		// 	const containers = allEntities.filter((e) =>
		// 		['project', 'space', 'collection'].includes(e.entityId)
		// 	);
		// 	// find first whose name startsWith the token:
		// 	const match = containers.find((e) => e.name.toLowerCase().startsWith(wanted));

		// 	console.log(args.in, { match });
		// 	if (match) {
		// 		query.in = [match.id, true];
		// 	}
		// }

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

	const dispatch = createEventDispatcher();

	let searchQuery = '';
	let editorContainer: HTMLDivElement;

	// Define available keywords
	const KEYWORDS = [
		...KINDS,
		'created',
		'deleted',
		'updated',
		'changed',
		'today',
		'yesterday',
		'in',
		'kind',
		'sort',
		'limit'
	].map((k) => '@' + k);

	// 1) Define your mock collections
	const mockCollections = [
		'collection1',
		'collection2',
		'collection3',
		'collection4',
		'collection5'
	];

	// 2) Create a completion source for "@in <…>"
	function inCompletionSource(context: CompletionContext) {
		// Try to match "@in " plus optional partial word right before the cursor
		const before = context.matchBefore(/@in\s+([\w-]*)$/);
		if (!before) return null;
		// Only trigger when explicitly after "@in "
		// start: the position where the match begins
		const from = before.from + 4; // skip over "@in "
		return {
			from,
			options: mockCollections.map((name) => ({
				label: name,
				type: 'constant',
				apply: name
			}))
		};
	}

	// Completion source for keywords
	function keywordCompletion(context: CompletionContext) {
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

	onMount(() => {
		const view = new EditorView({
			state: EditorState.create({
				doc: searchQuery,
				extensions: [
					basicSetup,
					keymap.of(defaultKeymap),
                    highlightAtKeywords,
					autocompletion({ override: [keywordCompletion, inCompletionSource] }),
					// listen for any changes to the document
					EditorView.updateListener.of((update) => {
						if (update.docChanged) {
							searchQuery = update.state.doc.toString();
							try {
								console.log(toSearchQuery(parseAtArgs(searchQuery)));
							} catch (err) {}
							dispatch('search', searchQuery || '');
						}
					})
				]
			}),
			parent: editorContainer
		});
	});
</script>

<div class="flex flex-grow relative">
	<!-- CodeMirror will mount here -->
	<div
		class="input-outlined px-2 py-1 bg-white rounded-md flex-grow text-sm"
		bind:this={editorContainer}
		aria-label="Search"
	></div>
</div>

<style>
    /* style your highlighted @keywords */
    :global(.cm-atKeyword) {
        color: #0070f3;
        font-weight: 600;
    }
</style>
