/* --------------------------------------------------------------------------
 * Unified‑Search ‑ theme API
 * --------------------------------------------------------------------------
 * Exports a tiny `createSearchTheme` factory that returns a CodeMirror
 * extension.  It supports:
 *   • Basic palette, font & sizing options
 *   • Autocomplete tooltip styling (inc. per‑option icons)
 *   • Decoration classes `.cm-entity-name` and `.cm-qs-keyword`
 *
 * Compared with unified‑text this is intentionally minimal – we only expose
 * the levers that matter for the search box.
 * -------------------------------------------------------------------------- */

import { EditorView } from '@codemirror/view';
import type { Extension } from '@codemirror/state';
import type { StyleSpec } from 'style-mod';

export interface SearchThemeOptions {
  /** Light or dark variant (affects default tooltip shadow, etc.) */
  dark?: boolean;

  /* ------------------------------------------------------------------ */
  /* Typography                                                         */
  /* ------------------------------------------------------------------ */
  /** Main font family for the query input */
  fontFamily?: string;
  /** Font size (e.g. "16px") */
  fontSize?: string;

  /* ------------------------------------------------------------------ */
  /* Palette                                                            */
  /* ------------------------------------------------------------------ */
  background?: string;
  foreground?: string;
  selection?: string;
  caret?: string;

  /* ------------------------------------------------------------------ */
  /* Autocomplete                                                       */
  /* ------------------------------------------------------------------ */
  autocomplete?: {
    background?: string;
    border?: string;
    selectionBackground?: string;
    foreground?: string;
  };

  /* ------------------------------------------------------------------ */
  /* Icons for autocomplete – key = icon‑type                           */
  /* ------------------------------------------------------------------ */
  icons?: Record<string, string>; // base64‑encoded SVG strings

  /* ------------------------------------------------------------------ */
  /* Decoration classes                                                 */
  /* ------------------------------------------------------------------ */
  entityName?: StyleSpec;   // `.cm-entity-name`
  keyword?: StyleSpec;      // `.cm-qs-keyword`
}

/* -------------------------------------------------------------------------- */
/* Default values                                                             */
/* -------------------------------------------------------------------------- */
const defaults: Required<SearchThemeOptions> = {
  dark: false,
  fontFamily: 'Inter, sans-serif',
  fontSize: '15px',
  background: '#ffffff',
  foreground: '#1f1f1f',
  selection: '#cce0ff',
  caret: '#000000',
  autocomplete: {
    background: '#ffffff',
    border: '#d4d4d8',
    selectionBackground: '#e4e4e7',
    foreground: '#1f1f1f'
  },
  icons: {},
  entityName: {
    color: '#0d9488',
    fontWeight: '500'
  },
  keyword: {
    color: '#7c3aed',
    fontWeight: '500'
  }
};

/* -------------------------------------------------------------------------- */
/* Factory                                                                    */
/* -------------------------------------------------------------------------- */
export function createTheme(opts: SearchThemeOptions = {}): Extension {
  const o: SearchThemeOptions = { ...defaults, ...opts, autocomplete: { ...defaults.autocomplete, ...(opts.autocomplete ?? {}) } };

  /* Build dynamic icon selectors */
  const iconStyles = []
  if (o.icons) {
    for (const [iconType, base64String] of Object.entries(o.icons)) {
      iconStyles.push([
        `.cm-completionIcon-${iconType}`,
        {
          "&:after": {
            content: `url('data:image/svg+xml;base64,${base64String}')`,
            verticalAlign: "middle"
          }
        }
      ])
    }
  }

	const addStyles = Object.fromEntries(iconStyles)

  const css: Record<string, StyleSpec> = {
    // Root panel styled like an input
    '&': {
      backgroundColor: o.background,
      border: '1px solid #ccc',
      borderRadius: '4px',
      padding: '2px 6px',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      color: o.foreground,
      fontFamily: o.fontFamily,
      fontSize: o.fontSize
    },
    '&.cm-focused': { outline: 'none' },
    '.cm-content': { 
      padding: '4px 0', 
			fontFamily: opts.fontFamily,
    },
    '.cm-activeLine': { backgroundColor: 'transparent' },
    '.cm-gutters': { display: 'none' },

    // Decorations
    '.cm-entity-name': o.entityName,
    '.cm-qs-keyword': o.keyword,

    // Matched selection
    '&.cm-focused .cm-matchingBracket, &.cm-focused .cm-nonmatchingBracket': {
			backgroundColor: 'transparent' // Override highlighting for matching bracket
		},
		'.cm-selectionMatch': {
      backgroundColor: 'transparent' // Override highlighting text that matches selection
		},
    /* ----------------------- Autocomplete tooltip -------------------- */
    '.cm-tooltip': {
      border: `1px solid ${o.autocomplete.border}`,
      backgroundColor: o.autocomplete.background,
      boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
      borderRadius: '8px',
      padding: '6px'
    },
    ...addStyles,
		".cm-completionIcon": {
			fontSize: "90%",
			width: "1em",
			display: "inline-block",
			textAlign: "center",
			paddingRight: ".6em",
			opacity: "1.0",
			boxSizing: "content-box",
			transform: "scale(0.8)"
		},
    '.cm-tooltip-autocomplete': {
			'& > ul > li > .cm-completionLabel': {
				fontFamily: o.fontFamily,
				color: o.autocomplete.foreground,
				fontSize: '14px'
			},
			'& > ul > li > .cm-completionDetail': {
				fontStyle: 'normal',
        fontFamily: o.fontFamily,
				color: o.autocomplete.foreground,
				opacity: 0.5,
				fontSize: '12px',
				fontWeight: 'light'
			},
			'& > ul > li > .cm-completionLabel > .cm-completionMatchedText': {
				fontWeight: 'bold',
				textDecoration: 'none'
			},
			'& > ul > li[aria-selected]': {
				backgroundColor: o.autocomplete?.selectionBackground,
				color: o.autocomplete.foreground,
				borderRadius: '4px'
			}
		},
  };

  return EditorView.theme(css, { dark: o.dark });
}

export default createTheme;
