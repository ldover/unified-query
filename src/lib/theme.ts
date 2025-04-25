// src/theme.ts
import { EditorView } from '@codemirror/view';

export const theme = EditorView.theme({
    // root styling to look like an input
    '&': {
      backgroundColor: '#ffffff',
      border: '1px solid #ccc',
      borderRadius: '4px',
      padding: '2px 6px',
      // ensure it doesn’t expand to multiple lines
      whiteSpace: 'nowrap',
      overflow: 'hidden',
    },
    // the editable content area
    '.cm-content': {
      padding: '4px 0',
      fontFamily: 'inherit',
      fontSize: 'inherit',
    },
    '.cm-activeLine': {
        backgroundColor: 'transparent' // Don't show active line
    },
    // hide the gutters (line numbers, fold markers, etc)
    '.cm-gutters': {
      display: 'none',
    },
    // remove default focus outline
    '&.cm-focused': {
      outline: 'none',
    }
  }, { dark: false });