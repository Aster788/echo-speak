## ADDED Requirements

### Requirement: Calibration table refreshed from 27 videos

The system SHALL regenerate `docs/extraction-depth-calibration.md` via `scripts/extraction-depth-stats.ts --write` against the cloud database including all available videos (target ≥27).

#### Scenario: Calibration reflects current library

- **WHEN** the calibration script runs after this change
- **THEN** the Scheme 2 table lists ≥27 videos with `extracted`, `deleted`, `kept`, `clean_text_chars`, and `notes` columns

### Requirement: Constant adjustment gated on median delete rate

The system SHALL adjust `STANDARD_CHARS_PER_SLOT`, `STANDARD_CAP_MIN`, or `STANDARD_CAP_MAX` only if the 27-video median delete rate differs materially (>30%) from the 5-video baseline (20%); otherwise constants stay and the calibration table is refreshed with a dated note.

#### Scenario: Constants unchanged

- **WHEN** the 27-video median delete rate is between 15% and 30%
- **THEN** `STANDARD_CHARS_PER_SLOT` remains 1000 and a dated note is appended to `docs/extraction-depth-calibration.md`

#### Scenario: Constant tuned

- **WHEN** the 27-video median delete rate exceeds 30%
- **THEN** the design-confirmed constant change (e.g. `STANDARD_CHARS_PER_SLOT` 1000→800) is applied and recorded in `docs/decisions.md`
