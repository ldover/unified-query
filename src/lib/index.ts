// src/index.ts
import { EditorState, Compartment } from '@codemirror/state';
import { EditorView, keymap, ViewUpdate } from '@codemirror/view';
import { defaultKeymap } from '@codemirror/commands';
import { basicSetup } from 'codemirror';
import {
  autocompletion,
  CompletionContext,
} from '@codemirror/autocomplete';
import { highlighter, uuidNamePlugin } from './plugins.js';
import { createTheme } from './theme.js';
import { searchLinter } from './lint.js';
import { registry } from './analyzers/registry.js';

export interface SearchOptions {
  /** The DOM element to mount the editor into */
  element: HTMLElement;
  /** Called whenever the query text changes */
  onChange: (query: string) => void;
  collections?: Map<string, Collection>
  theme?: any
}

// Define available keywords
const KEYWORDS = [
    ...Object.keys(registry)
].map((k) => '@' + k);


type Collection = {
    id: string
    name: string
    kind: 'space' | 'collection' | 'project'
}

export class Search {
  private view: EditorView;
  private collections?: Map<string, Collection>

  /** Compartment so we can hot‑swap the UUID‑name plugin when collections change */
  private readonly collectionsCompartment = new Compartment();


  constructor(private opts: SearchOptions) {
    this.collections = opts.collections ?? new Map();

    const theme = opts.theme ?? createTheme();
    this.view = new EditorView({
      state: EditorState.create({
        doc: '',
        extensions: [
          basicSetup,
          keymap.of(defaultKeymap),
          theme,
          searchLinter,
          highlighter,
          // Collections‑aware plugin lives in a compartment for easy re‑config
          this.collectionsCompartment.of(uuidNamePlugin(this.collections)),

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
              this.opts.onChange(q);
            }
          })
        ]
      }),
      parent: this.opts.element
    });
  }

	focus(): void {
		this.view.focus();
	}

  /** Replace all collections and refresh dependent plugins */
  setCollections(newCollections: Map<string, Collection>) {
    this.collections = newCollections;
    // Reconfigure just the compartment, cheap & isolated
    this.view.dispatch({
      effects: this.collectionsCompartment.reconfigure(
        uuidNamePlugin(this.collections)
      )
    });
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
        // Examine only the text before the cursor on the current line – we don't
        // care about multiline matches here and this keeps the regex simpler.
        const line = context.state.doc.lineAt(context.pos);
        const beforeCursor = line.text.slice(0, context.pos - line.from);
    
        /*
         * Regex breakdown:
         *   @in                – literal "@in"
         *   (?:\s+[\w-]+\*)*    – zero or more full words w/ optional * already typed (each
         *                        preceded by whitespace)
         *   \s+([\w-]*)        – the *current* (possibly empty) partial word right
         *                        before the cursor which we capture for replacement
         *   $                   – ensure we're at the end of the string (cursor)
         * 
         * Note: Not urgent, but should consider using parsed tokens to simplify completion logic, and in
         * case the syntax changes, this completion source should remain the same.
         */
        const match = /@in(?:\s+[\w-]+\*?)*\s+([\w-]*)$/.exec(beforeCursor);

        // const match = /@in(?:\s+[\w-]+)*\s+([\w-]*)$/.exec(beforeCursor);
        if (!match) return null; // Not in an "@in" clause
    
        const partial = match[1] ?? '';
        const from = context.pos - partial.length;
    
        const options = this.collections
          ? [...this.collections.values()].map(c => ({
              label: c.name,
              type: c.kind,
              apply: c.id
            }))
          : [];
    
        return { from, options };
      }
}


export {toQuery} from './query.js'
export {parse} from './parsers/index.js'
export {createTheme} from './theme.js'