# topic-tree-management (delta)

## REMOVED Requirements

### Requirement: Topic dock for move and dismiss

**Reason:** Collections redesign replaces dock with card-level move/delete icons and Move sheet modal.

**Migration:** All move/dismiss flows use Collections expression cards; no bottom dock.

### Requirement: Merge topics

**Reason:** User chose to remove Merge from Collections UI; move/reparent covers primary curation.

**Migration:** Advanced merge MAY be reintroduced later via admin script or hidden tool—not in pre-phase-5 scope.

## MODIFIED Requirements

### Requirement: Topic tree browser

The system SHALL provide a **Collections** page at `/collections` (Topic tab) displaying the hierarchical topic tree with expression counts. `/topics` redirects to `/collections`.

#### Scenario: View topic tree

- **WHEN** user opens Collections Topic tab
- **THEN** the system shows root topics with expandable children and expression counts sorted a→z among siblings

#### Scenario: View expressions in topic

- **WHEN** user selects a topic node
- **THEN** the system navigates to Topic level two listing expressions for that topic only (not subtree aggregate on this view)

### Requirement: Mobile-first layout

The topic management UI SHALL use route `/collections` with Topic tab, centered 430px container, vintage scrapbook styling.

#### Scenario: Mobile layout

- **WHEN** user views Collections Topic tab
- **THEN** the layout is centered with max width 430px
