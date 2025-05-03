// src/lib/plugins.ts
import { Decoration, ViewPlugin, ViewUpdate, EditorView, WidgetType } from '@codemirror/view';
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


/* ---------------------------------------------------------------------- */
/* Widget that renders the entity name in place of a UUID                 */
/* ---------------------------------------------------------------------- */
class EntityNameWidget extends WidgetType {
  constructor(private readonly name: string) { super(); }

  toDOM() {
    const span = document.createElement('span');
    span.textContent = this.name;
    span.className = 'cm-entity-name'; // Style this in your theme / global CSS
    return span;
  }

  ignoreEvent() { return true; }
}

/**
 * CodeMirror view‑plugin factory that replaces UUID tokens with the
 * corresponding entity names.
 *
 * @param entityMap – mapping from canonical UUID strings to Entity objects.
 *                    An `Entity` must provide at least a `name` property.
 */
export function uuidNamePlugin<Entity extends { name: string }>(
  entityMap: Map<string, Entity>
) {
  return ViewPlugin.fromClass(
    class {
      decorations: RangeSet<Decoration>;

      constructor(readonly view: EditorView) {
        this.decorations = this.build(view);
      }

      update(u: ViewUpdate) {
        if (u.docChanged || u.viewportChanged) {
          this.decorations = this.build(u.view);
        }
      }

      /* ------------------------------------------------------------------ */
      /* Build decorations for the visible viewport                         */
      /* ------------------------------------------------------------------ */
      private build(view: EditorView): RangeSet<Decoration> {
        const visFrom = view.visibleRanges[0]?.from ?? 0;
        const visTo   = view.visibleRanges.at(-1)?.to ?? view.state.doc.length;

        const builder = new RangeSetBuilder<Decoration>();
        const { segments } = parse(view.state.doc.toString());

        for (const seg of segments) {
          if (seg.to < visFrom || seg.from > visTo) continue; // outside viewport

          for (const tok of seg.tokens) {
            if (tok.kind !== 'uuid') continue;

            const ent = entityMap.get(tok.value);
            if (!ent) continue; // no mapping

            // Replace the UUID (including a trailing "*" for deep refs) with the entity name.
            const name = ent.name;
            const widget = Decoration.replace({
              widget: new EntityNameWidget(name),
              // Maintain the order with surrounding text to prevent cursor jumps
              side: 0,
            });
            // Subtract 1 for the '*' if present in the uuid token (deep: true flag)
            builder.add(tok.from, tok.to - (tok.deep ? 1 : 0), widget);
          }
        }

        return builder.finish();
      }
    },
    { 
        decorations: v => v.decorations,
        provide: plugin => EditorView.atomicRanges.of(view => {
            return view.plugin(plugin)?.decorations || Decoration.none
        })
    }
  );
}

/* ---------------------------------------------------------------------- */
/* Convenience helper to append/replace the plugin in an extension array. */
/* ---------------------------------------------------------------------- */
export function withUuidNamePlugin<Entity extends { name: string }>(
  ext: readonly any[],
  entityMap: Map<string, Entity>
): any[] {
  return [...ext.filter(e => !(e && (e as any).isUuidNamePlugin)), uuidNamePlugin(entityMap)];
}

// Tag the plugin so we can identify/replace it later (see helper above)
(uuidNamePlugin as any).isUuidNamePlugin = true;
