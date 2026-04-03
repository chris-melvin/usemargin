## ADDED Requirements

### Requirement: Long-press chip to edit shortcut
Long-pressing a template chip in SmartInput SHALL open an edit sheet with fields for trigger word, label, default amount, and a delete button. Saving SHALL update the shortcut in the database and refresh the chip strip.

#### Scenario: Edit a default shortcut's amount
- **WHEN** user long-presses the "Coffee ₱120" chip and changes amount to 150
- **THEN** the shortcut SHALL be updated in the DB, the chip SHALL show "Coffee ₱150", and NLP SHALL recognize "coffee" with default amount 150

#### Scenario: Delete a shortcut from chip
- **WHEN** user long-presses a chip and taps Delete
- **THEN** the shortcut SHALL be removed from the DB, the chip SHALL disappear from the strip

### Requirement: Add new shortcut from SmartInput
A "+" chip SHALL appear at the end of the template strip. Tapping it SHALL open the same edit sheet in create mode with empty fields.

#### Scenario: Create new shortcut
- **WHEN** user taps "+" and enters trigger "harlan", label "Harlan and Holden", amount 200
- **THEN** a new shortcut SHALL be created in the DB, a new chip SHALL appear in the strip, and "harlan" SHALL be recognized by the NLP parser

### Requirement: Settings shortcuts management screen
A "Quick Entries" section SHALL be available in the Settings Budget tab showing all shortcuts in a list. Each row SHALL have edit and delete actions. An "Add" button SHALL allow creating new shortcuts.

#### Scenario: View all shortcuts in Settings
- **WHEN** user navigates to Settings > Budget > Quick Entries
- **THEN** all shortcuts (system defaults and user-created) SHALL be listed with trigger, label, and amount

#### Scenario: Edit shortcut from Settings
- **WHEN** user taps a shortcut row in Settings
- **THEN** an edit form SHALL open allowing changes to trigger, label, amount, and category

#### Scenario: Delete shortcut from Settings
- **WHEN** user swipes or taps delete on a shortcut row
- **THEN** the shortcut SHALL be removed from the DB and the list SHALL update

### Requirement: Shortcut changes sync
All shortcut create/update/delete operations SHALL enqueue sync operations. This is already implemented in `useShortcuts` — this requirement ensures the existing sync behavior is preserved through the unification changes.

#### Scenario: New shortcut syncs to server
- **WHEN** user creates a shortcut on mobile
- **THEN** a sync queue entry SHALL be created for the shortcut
