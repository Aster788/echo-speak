# Production review assets

URL-served static files for the Review page.

Paths used in app: `/review/<filename>`

Add optimized assets here after processing from `docs/design/phase-4-review/sources/`.

Naming: URL-safe (`[a-zA-Z0-9._-]` only).

| File | Source | Notes |
|------|--------|-------|
| `sticky-note.png` | `sources/sticky-note.png` | Edge flood-fill white → transparent; scope picker buttons |
| `confused.png` | `sources/confused.png` | Edge flood-fill white → transparent; card report button |
| `paper.png` | `sources/paper.jpeg` | Edge flood-fill white → transparent; card report dialog |
| `broken-heart.png` | `sources/broken-heart.png` | Edge flood-fill white → transparent; unsure feedback |
| `microphone-button.png` | `sources/microphone-button.png` | Mic control |
| `mic-button.png` | `sources/mic-button.png` | Mic control (alt) |
| `review-background-alphabet.png` | `sources/review-background-alphabet.png` | Page background |

Regenerate review assets: `npm run process-review-assets`
