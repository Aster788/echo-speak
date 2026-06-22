# Navbar assets

URL-served static files for the two-tier navbar.

Paths used in app: `/nav/<filename>`

## Shipped assets

| File | Role |
|------|------|
| `brand-letter-a.png` | Brand letter — A (`sources/A.png`) |
| `brand-letter-c.png` | Brand letter — C (`sources/C.png`) |
| `brand-letter-e.png` | Brand letter — E (`sources/E.png`, Echo + Speak) |
| `brand-letter-h.png` | Brand letter — H (`sources/H.png`) |
| `brand-letter-k.png` | Brand letter — K (`sources/K.png`) |
| `brand-letter-o.png` | Brand letter — O (`sources/O.png`) |
| `brand-letter-p.png` | Brand letter — P (`sources/P.png`) |
| `brand-letter-s.png` | Brand letter — S (`sources/S.png`) |
| `sign-button.png` | Shared wooden sign background for nav links |

## Sources

| Source | Notes |
|--------|-------|
| `docs/design/phase-4-review/sources/A.png` … `S.png` | Black letter strokes only (tan + white removed) |
| `docs/design/phase-4-review/sources/navigation-bar-button.png` | Recolored to `#E0DBC8`, transparent bg |

Regenerate: `npx tsx scripts/process-nav-assets.ts`

Naming: URL-safe (`[a-zA-Z0-9._-]` only).
