# Import Page Assets

URL-served static files for the Import notebook UI.

Paths used in app: `/import/<filename>`

## Shipped assets

| File | Role |
|------|------|
| `notebook.png` | Spiral notebook background (736×608 source) |
| `page-flag.png` | Import / Extract button (dashed capsule + tape) |
| `pen-button.png` | File picker row icon |
| `sticky-notes.png` | Bottom status strip background |

## Sources

| Source | Notes |
|--------|-------|
| `docs/design/phase-4-review/sources/notebook.jpeg` | Edge flood-fill → transparent outer white |
| `docs/design/phase-4-review/sources/page-flag.png` | Optimized copy |
| `docs/design/phase-4-review/sources/pen-button.jpeg` | White removed, cropped to reduce watermark |
| `docs/design/phase-4-review/sources/sticky-notes.jpeg` | White background removed |

Regenerate: `npm run process-import-assets`

Layout calibration: `src/lib/import-notebook-layout.ts`

Naming: URL-safe (`[a-zA-Z0-9._-]` only).
