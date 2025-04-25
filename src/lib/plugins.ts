import { RangeSet, RangeSetBuilder } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';

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
