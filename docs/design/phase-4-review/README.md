# Design assets — sources → public

Master map for vintage UI assets. **Sources** live here; **production** files are URL-safe names under `public/`.

Regenerate: `npm run audit:filenames` after any add/rename.

## Folders

| Path | Role |
|------|------|
| `references/` | Mood boards — **never** imported in app code |
| `sources/` | Original art before optimize → `public/*/` |
| `public/<area>/` | Shipped static files → URL `/<area>/...` |

## Pipelines (by page)

| Page | Script | Source dir | Output dir |
|------|--------|------------|------------|
| Review | `npm run process-review-assets` | `sources/` | `public/review/` |
| Collections | `npm run process-collections-assets` | `sources/` | `public/collections/` |
| Home | `npm run process-home-assets` | `sources/` | `public/home/` |
| Import | `npm run process-import-assets` | `sources/` | `public/import/` |
| Settings | `npm run process-settings-assets` | `sources/` | `public/settings/` |
| Navbar brand | `npm run process-nav-assets` | `sources/` | `public/nav/` |

Detail per area: `public/review/README.md`, `public/import/README.md`, `public/nav/README.md`.

## Review (`public/review/`)

| Public file | Source | Notes |
|-------------|--------|-------|
| `sticky-note.png` | `sticky-note.png` | Scope picker; white flood-fill → transparent |
| `confused.png` | `confused.png` | Card report button |
| `paper.png` | `paper.jpeg` | Report dialog |
| `broken-heart.png` | `broken-heart.png` | Unsure feedback |
| `congrats.png` | `congrats.jpeg` | Finish page hero |
| `microphone-button.png` | `microphone-button.png` | Video Mode icon |
| `mic-button.png` | `mic-button.png` | Topic Mode icon |
| `review-background-alphabet.png` | `review-background-alphabet.png` | Empty-state background |

## Collections (`public/collections/`)

| Public file | Source |
|-------------|--------|
| `arrow.png` | `arrow.jpeg` |
| `back.png` | `back.png` |
| `bin.png` | `bin.png` |
| `down-arrow.png` | `down-arrow.png` |
| `input.png` | `input.jpeg` |
| `move.png` | `move.png` |
| `paper.png` | `paper.jpeg` |
| `rectangle.png` | `Rectangle.jpeg` |
| `target.png` | `target.png` |
| `title.png` | `title.jpeg` |

## Home (`public/home/`)

| Public file | Source |
|-------------|--------|
| `hello.png` | `Hello.jpeg` |

## Settings (`public/settings/`)

| Public file | Source |
|-------------|--------|
| `frame.png` | `input.jpeg` (label frame) |
| `input.png` | `input.jpeg` (value frame) |

## Import (`public/import/`)

See `docs/design/import-page/README.md` and `public/import/README.md`.

## Navbar (`public/nav/`)

Brand letters from `A.png`, `C.png`, `E.png`, `H.png`, `K.png`, `O.png`, `P.png`, `S.png`; `sign-button.png` from sources.

## References only (not shipped)

| File | Use |
|------|-----|
| `tarot-ace-of-cups-ref.png` | Card layout reference |
| `collections-page-*.png` | Collections layout refs |
| `echo-speak-homepage-ref.png` | Home layout ref |
| `settings-page-ref.png` | Settings layout ref |
| `review-page-finish-ref.png` | Finish page ref |
| `import-page-ref.jpg` | Import layout ref |

## Components

```text
src/components/review/       Review UI
src/components/collections/  Collections UI
src/components/settings/     Settings UI
src/components/import/       Import UI
```

Full UI rules: `docs/design-system.md`.
