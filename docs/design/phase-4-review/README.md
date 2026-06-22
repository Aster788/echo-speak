# Phase 4 — Review UI Assets

Design references and source files for the Active Recall review experience.

Full UI spec: `docs/design-system.md` → **Review Page** / **Review Card**.

## Mode selector icons

| Mode | Asset |
|------|-------|
| Video Mode | `sources/microphone-button.png` |
| Topic Mode | `sources/mic-button.png` |

## Layout intent

| Asset | Role |
|-------|------|
| Tarot reference | Card aesthetic — **not shipped** |
| Microphone / mic-button | Mode selector icons inside full-width pills |
| Alphabet collage | Empty state only (no mode or no cards) |

## Mode flow

1. **Select:** Video Mode (top) · Topic Mode (bottom)
2. **Active:** `Video Mode Now` or `Topic Mode Now` · `Back`
3. **Card:** flip card; empty state hides alphabet background

## Folders

```text
references/   Mood boards — never import in app code
sources/      Original assets before optimize → public/review/
src/components/review/  Review React components
```

## Files

| File | Notes |
|------|-------|
| `tarot-ace-of-cups-ref.png` | Card style reference |
| `microphone-button.png` | Video Mode icon |
| `mic-button.png` | Topic Mode icon |
| `review-background-alphabet.png` | Empty-state decoration |
