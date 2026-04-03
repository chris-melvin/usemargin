## ADDED Requirements

### Requirement: Inline help cheatsheet
The SmartInput sheet SHALL include an `(i)` icon button. Tapping it SHALL expand an inline cheatsheet below the input field showing syntax examples for: basic format, multiple expenses, shortcuts, categories, time/date tokens.

#### Scenario: Tap info icon to show help
- **WHEN** user taps the (i) icon in SmartInput
- **THEN** an inline cheatsheet SHALL expand below the input showing syntax examples

#### Scenario: Tap info icon again to hide
- **WHEN** user taps the (i) icon while cheatsheet is visible
- **THEN** the cheatsheet SHALL collapse

#### Scenario: Help content covers all syntax
- **WHEN** cheatsheet is visible
- **THEN** it SHALL show examples for: basic format ("coffee 120"), multiple items ("coffee 100 and lunch 150"), shortcuts ("@starbucks 150"), categories ("#food"), and time ("yesterday", "at 2pm")

### Requirement: First-time tooltip
On the first-ever opening of SmartInput, a brief tooltip SHALL appear pointing to the (i) icon with text like "Tap here to learn shortcuts." The tooltip SHALL dismiss on tap and not show again.

#### Scenario: First SmartInput open
- **WHEN** user opens SmartInput for the first time (tracked via MMKV flag)
- **THEN** a tooltip SHALL appear pointing to the (i) icon

#### Scenario: Subsequent SmartInput opens
- **WHEN** user opens SmartInput after having dismissed the tooltip
- **THEN** no tooltip SHALL appear

#### Scenario: Tooltip dismissal
- **WHEN** user taps anywhere while tooltip is visible
- **THEN** the tooltip SHALL dismiss and the MMKV flag SHALL be set to prevent future display
