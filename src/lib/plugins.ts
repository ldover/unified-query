// src/lib/plugins.ts
import { Decoration, ViewPlugin, ViewUpdate, EditorView } from '@codemirror/view';
import { RangeSetBuilder, RangeSet } from '@codemirror/state';
import { parse } from '$lib/parsers/index.js';

/* reusable decorations -------------------------------------------------- */
const decoKeyword = Decoration.mark({ class: 'cm-qs-keyword' });
const decoArg     = Decoration.mark({ class: 'cm-qs-arg' });
const decoIgnored = Decoration.line({ class: 'cm-qs-ignored' });

export const highlighter = ViewPlugin.fromClass(
  class {
    decorations: RangeSet<Decoration>;
    constructor(view: EditorView) { this.decorations = this.build(view); }
    update(u: ViewUpdate) {
      if (u.docChanged || u.viewportChanged) this.decorations = this.build(u.view);
    }

    /* ------------------------------------------------------------------ */
    /* build decorations for visible segments                             */
    /* ------------------------------------------------------------------ */
    build(view: EditorView): RangeSet<Decoration> {
      const visFrom = view.visibleRanges[0]?.from ?? 0;
      const visTo   = view.visibleRanges.at(-1)?.to ?? view.state.doc.length;

      const builder = new RangeSetBuilder<Decoration>();
      const { segments } = parse(view.state.doc.toString());
      

      console.log({segments})
      for (const seg of segments) {
        if (seg.to < visFrom || seg.from > visTo) continue; // outside viewport

        if (seg.keyword != 'head') {
            /* keyword span (“@” + ident) ----------------------------------- */
            console.log(seg.keyword, seg.from, seg.from + seg.keyword.length)
            builder.add(seg.from, seg.from + seg.keyword.length + 1, decoKeyword)
        }
      }

      return builder.finish();
    }
  },
  { decorations: v => v.decorations }
);
