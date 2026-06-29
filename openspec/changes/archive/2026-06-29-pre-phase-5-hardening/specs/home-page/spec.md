# home-page

## Purpose

Vintage scrapbook home landing at `/` with Hello illustration and primary CTAs.

## ADDED Requirements

### Requirement: Home page structure

The system SHALL render the home page in this vertical order: Header (PageHeader tagline), Divider, **Import transcript** button, **Start review** button, Hello illustration.

Tagline text SHALL remain:

```text
Turn video transcripts into expressions you actually remember.
```

Button labels SHALL remain **Import transcript** and **Start review**.

#### Scenario: Home layout

- **WHEN** user opens `/`
- **THEN** the page shows tagline, divider, two buttons, then the Hello illustration below

#### Scenario: Import CTA

- **WHEN** user taps Import transcript
- **THEN** the system navigates to `/import`

#### Scenario: Review CTA

- **WHEN** user taps Start review
- **THEN** the system navigates to `/review`

### Requirement: Hello hero illustration

The system SHALL display the processed transparent Hello illustration (`Hello.jpeg` → `public/home/hello.png` or equivalent) as the primary visual below the buttons, per `docs/design/phase-4-review/references/echo-speak-homepage-ref.png`.

#### Scenario: Illustration visible

- **WHEN** home page loads on 430px viewport
- **THEN** the Hello illustration is visible and does not overlap CTAs
