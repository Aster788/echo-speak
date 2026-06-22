# Import Page — Design Assets

Archive ceremony UI for `/import`.

Full spec: `docs/design-system.md` → **Import Page**.

## Assets

| Asset | Role |
|-------|------|
| `letter-paper.jpeg` | Full letter paper background; book stack bottom-left |
| `sticky-note.png` | Import / Extract button surface |
| `pen-button.png` | Choose-file row icon |

## Layout

Overlay slots calibrated in `src/lib/import-letter-layout.ts` against source art **736×1069**, tuned for iPhone 15 Plus (**430×932**).

Import / Extract receipt text overlays the blank lines to the right of the book stack illustration.

## Components

```text
src/components/import/   Paper shell, line fields, file picker, sticky-note buttons, receipt
src/app/import/          Page + form orchestration
```
