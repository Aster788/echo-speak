# active-recall-review (delta)

## MODIFIED Requirements

### Requirement: Active mode bar during review

The system SHALL replace the dual mode selector with an active bar showing the current mode label (`Video Mode Now` or `Topic Mode Now`) on the left and a **Back** control on the right while a review session is active **or** on the finish page.

#### Scenario: Back from reviewing to scope picker

- **WHEN** user taps Back during card review
- **THEN** the system returns to Choose a video/topic for the current mode (scope picker), preserving selected mode

#### Scenario: Back from finish to scope picker

- **WHEN** user taps Back on the finish page
- **THEN** the system returns to Choose a video/topic for the current mode

#### Scenario: Back from scope picker to mode selector

- **WHEN** user taps Back on Choose a video/topic
- **THEN** the system returns to Video Mode / Topic Mode selector
