// src/index.ts
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, ViewUpdate } from '@codemirror/view';
import { defaultKeymap } from '@codemirror/commands';
import { basicSetup } from 'codemirror';
import {
  autocompletion,
  CompletionContext,
} from '@codemirror/autocomplete';
import { highlighter, uuidNamePlugin } from './plugins.js';
import { theme } from './theme.js';
import { searchLinter } from './lint.js';
import { registry } from './analyzers/registry.js';

export interface SearchOptions {
  /** The DOM element to mount the editor into */
  element: HTMLElement;
  /** Called whenever the query text changes */
  onChange: (query: string) => void;
  collections?: Map<string, Collection>
}

// Define available keywords
const KEYWORDS = [
    ...Object.keys(registry)
].map((k) => '@' + k);


type Collection = {
    id: string
    name: string
}

export class Search {
  private view: EditorView;
  private collections?: Map<string, Collection>

  constructor(private opts: SearchOptions) {
    this.collections = opts.collections

    this.view = new EditorView({
      state: EditorState.create({
        doc: '',
        extensions: [
          basicSetup,
          keymap.of(defaultKeymap),
          theme,
          searchLinter,
          highlighter,
          uuidNamePlugin(opts.collections ?? new Map()),
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

  setCollections(names: Map<string, Collection>) {
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
        // Examine only the text before the cursor on the current line – we don't
        // care about multiline matches here and this keeps the regex simpler.
        const line = context.state.doc.lineAt(context.pos);
        const beforeCursor = line.text.slice(0, context.pos - line.from);
    
        /*
         * Regex breakdown:
         *   @in                – literal "@in"
         *   (?:\s+[\w-]+)*    – zero or more full words already typed (each
         *                        preceded by whitespace)
         *   \s+([\w-]*)        – the *current* (possibly empty) partial word right
         *                        before the cursor which we capture for replacement
         *   $                   – ensure we're at the end of the string (cursor)
         */
        const match = /@in(?:\s+[\w-]+)*\s+([\w-]*)$/.exec(beforeCursor);
        if (!match) return null; // Not in an "@in" clause
    
        const partial = match[1] ?? '';
        const from = context.pos - partial.length;
    
        const options = this.collections
          ? [...this.collections.values()].map(c => ({
              label: c.name,
              type: 'constant',
              apply: c.id
            }))
          : [];
    
        return { from, options };
      }
}

export {toQuery} from './query.js'
export {parse} from './parsers/index.js'