# unified-search

> ⚠️ **Work in progress**\
> *unified-search* is still under active development and forms part of the **Unified Data System** (not yet open‑sourced). Breaking changes are likely until that foundation is public.

Svelte search input powered by CodeMirror 6 and a custom query language for the Unified Data System.

---

## Install

```bash
npm i unified-search
```

## Quick start

```svelte
const theme = createTheme({
    icons,
    fontFamily: 'Roboto, sans-serif',
    keyword: { color: '#268bd2', fontWeight: '600' },
    entityName: { color: 'black' }
})

const search = new Search({ 
    element: e, 
    query: '@kind note @yesterday',
    onChange: (q) => handleSearch(q), 
    theme 
})
```

## Query language spec

### Basics

- The **head of the string** searches by name, e.g. `Search: apple` ⇒ `@name apple`.

### Keywords

| Keyword                      | Usage                                                       | Notes |
| ---------------------------- | ----------------------------------------------------------- | ----- |
| `@id <id…>`                  | Match specific entity IDs (UUID v4).                        |       |
| `@name <text>`               | Exact‑match name. Alias of `@content`.                      |       |
| `@content <text>`            | Reads until the next `@`. Escape `@` with `\@`.             |       |
| `@kind <kind…>`              | Filter by kinds (`note`, `log`, `space`, …).                |       |
| `@in <id…>`                  | Contained in parent IDs. Add `*` for deep search (`id2*`).  |       |
| `@todo`                      | Shortcut for `@completed false`.                            |       |
| `@done <date…>\|<bool>`      | Completed on date(s) or flag. Narrows to completable kinds. |       |
| `@draft [bool]`              | Draft flag (default `true`).                                |       |
| `@archived [date…]\|[bool]`  | Archive date or flag.                                       |       |
| `@deleted [date…]\|[bool]`   | Deletion date or flag (default `true`).                     |       |
| `@created <date…>`           | Creation date(s).                                           |       |
| `@updated <date…>`           | Update date(s).                                             |       |
| `@changed <date…>`           | Any of created/updated/deleted/archived on date(s).         |       |
| `@date <date…>`              | Explicit date field (e.g., logs).                           |       |
| `@time <time…>`              | Explicit time field.                                        |       |
| `@sort <field[:asc\|desc]…>` | Default: `name asc`.                                        |       |
| `@limit [n]`                 | Default `100`.                                              |       |
| Shorthands                   | `@note`, `@log`, … ⇒ `@kind note log`.                      |       |

### Intervals

Use `<` or `>` before a value:

- `<2024/01` — before January 2024 (exclusive)
- `>12:00`   — after 12:00 (inclusive)

Only one `<` and one `>` per field.

### Date formats

- `YYYY`          → `2024`
- `YYYY/MM`      → `2024/01`
- `YYYY/MM/DD` → `2024/01/01`

These map to half‑open ranges: `2024` ⇒ `>2024 <2025`.

### Time formats

- `HH[:mm]` (24h) — `12`, `12:01`
- `h[:mm][am\|pm]` (12h) — `12pm`, `12:00am`

Example: `12pm` ⇒ `>12:00 <13:00`.

### Date + time

Combine freely, e.g.:

```
@created 2024 >12pm   # entities created in the afternoon of 2024
```

### Date‑time literal

Use long form:

- `YYYY/MM/DD-HH:mm` — `>2024/01/01-12:00`

### Timezone

Currently assumed **user‑local**. Cross‑TZ querying is TBD.

### Utility tokens

Valid after time fields (`@created`, `@updated`, `@deleted`, `@archived`, `@changed`, `@completed`):

- `today`, `yesterday`
- `lastNdays`, `lastNweeks`
- Weekdays: `mon`‑`sun` / `Monday`‑`Sunday`
- Months: `jan`‑`dec` / `January`‑`December`
