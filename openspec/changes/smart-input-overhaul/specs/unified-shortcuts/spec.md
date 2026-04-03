## ADDED Requirements

### Requirement: Seed default templates to shortcuts table
On app startup, if the user has zero shortcuts in the database, the system SHALL insert the 8 default templates (Coffee, Commute, Lunch, Dinner, Snack, Grab, Groceries, Shopping) into the `shortcuts` table with their default amounts and `is_system = 1`.

#### Scenario: First launch — no shortcuts exist
- **WHEN** user opens the app for the first time and has zero shortcuts
- **THEN** 8 default shortcuts SHALL be created in the shortcuts table with is_system = 1

#### Scenario: User already has shortcuts
- **WHEN** user has 1 or more existing shortcuts on app startup
- **THEN** no seeding SHALL occur (existing data preserved)

### Requirement: Template strip reads from shortcuts DB
The SmartInput template chip strip SHALL display shortcuts from the database instead of the hardcoded TEMPLATES constant. Chips SHALL show the shortcut's `label` and `default_amount`.

#### Scenario: Default chips after fresh install
- **WHEN** user opens SmartInput after first launch seeding
- **THEN** 8 default chips SHALL appear matching the original template labels and amounts

#### Scenario: User-created shortcuts appear as chips
- **WHEN** user has created a custom shortcut "Harlan" with amount 200
- **THEN** a chip labeled "Harlan ₱200" SHALL appear in the strip alongside default chips

### Requirement: Shortcuts recognized in NLP without @ prefix
The parser SHALL check if any word or phrase in the input matches a shortcut `trigger_word` (case-insensitive). If matched, the shortcut's label and default_amount SHALL be used. An explicit number in the input SHALL override the default_amount.

#### Scenario: Shortcut trigger typed without @
- **WHEN** user types "harlan" and a shortcut with trigger_word "harlan" exists with default_amount 200
- **THEN** parser SHALL produce one expense: label from shortcut, amount 200

#### Scenario: Shortcut trigger with explicit amount
- **WHEN** user types "harlan 350" and shortcut "harlan" has default_amount 200
- **THEN** parser SHALL produce one expense: label from shortcut, amount 350 (explicit overrides default)

#### Scenario: @ prefix still works
- **WHEN** user types "@harlan 350"
- **THEN** parser SHALL produce the same result as without @ prefix (backward compatible)

### Requirement: Reserved word validation
When creating or editing a shortcut, the system SHALL reject trigger words that conflict with parser reserved words: "and", "at", "yesterday", "last", "both", "ways", "roundtrip", "round".

#### Scenario: Attempt to create reserved trigger
- **WHEN** user tries to create a shortcut with trigger_word "and"
- **THEN** the system SHALL show an error and prevent creation
