// src/Search.ts
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, ViewUpdate } from '@codemirror/view';
import { defaultKeymap } from '@codemirror/commands';
import { basicSetup } from 'codemirror';
import {
  autocompletion,
  CompletionContext,
} from '@codemirror/autocomplete';
import { highlighter } from './plugins.js';
import { theme } from './theme.js';
import { searchLinter } from './lint.js';
import { registry } from './analyzers/registry.js';

export interface SearchOptions {
  /** The DOM element to mount the editor into */
  element: HTMLElement;
  /** Called whenever the query text changes */
  onChange: (query: string) => void;
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
              this.opts.onChange(q);
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

