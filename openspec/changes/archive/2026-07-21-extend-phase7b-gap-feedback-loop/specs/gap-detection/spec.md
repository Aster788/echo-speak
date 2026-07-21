## ADDED Requirements

### Requirement: Accepted gaps provide positive extraction feedback

The system SHALL expose accepted gaps joined to their retained transcript expressions as positive extraction feedback, including phrase, meaning, Topic, weight, and feedback time where available. The query SHALL use explicit `gaps.status = accepted` rather than `topic_locked` alone.

#### Scenario: Accepted expression becomes positive example

- **WHEN** a gap is accepted and its linked expression remains available
- **THEN** that expression is eligible for the next Extract/Re-extract preference context

#### Scenario: Manual Topic lock is not mistaken for Accept

- **WHEN** an expression has `topic_locked = true` because of a manual Topic move but has no accepted gap
- **THEN** it is not treated as accepted-gap positive feedback

#### Scenario: Deleted accepted expression is skipped

- **WHEN** an accepted gap no longer has a linked expression
- **THEN** preference-context generation skips that invalid positive example without failing extraction

### Requirement: Accepted feedback selection is topic-aware

The system SHALL make accepted examples available for global preference learning and SHALL prioritize examples whose Topic matches candidate Topics during preference-aware ranking.

#### Scenario: Global accepted history remains available

- **WHEN** no accepted example matches a candidate Topic
- **THEN** representative accepted examples from other Topics may still guide general expression style

#### Scenario: Matching Topic ranks first

- **WHEN** accepted examples exist both inside and outside a candidate's Topic
- **THEN** examples from the matching Topic are selected before unrelated examples, subject to sample caps
