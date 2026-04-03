## ADDED Requirements

### Requirement: Smart "and" splitting
The parser SHALL only split input on "and", "&", or "," when both sides of the separator contain at least one pure-number token. If either side lacks a number, the separator SHALL be treated as part of the label text.

#### Scenario: Brand name with "and"
- **WHEN** input is "Harlan and Holden 200"
- **THEN** parser SHALL produce one expense: label "Harlan and Holden", amount 200

#### Scenario: Two expenses with numbers on both sides
- **WHEN** input is "coffee 100 and lunch 150"
- **THEN** parser SHALL produce two expenses: ("coffee", 100) and ("lunch", 150)

#### Scenario: Mixed — one side has number, other doesn't
- **WHEN** input is "coffee and lunch 150"
- **THEN** parser SHALL produce one expense: label "coffee and lunch", amount 150

#### Scenario: Ampersand in brand name
- **WHEN** input is "Ben & Jerry's 350"
- **THEN** parser SHALL produce one expense: label "Ben & Jerry's", amount 350

#### Scenario: Comma still splits without numbers
- **WHEN** input is "coffee 100, lunch 150"
- **THEN** parser SHALL produce two expenses (comma splitting is unaffected by this rule)

### Requirement: Dash separator handling
The parser SHALL recognize dash patterns (`-`, `–`, `—`) between label text and an amount, normalizing them to a space before tokenizing. Trailing dashes or punctuation SHALL be cleaned from labels.

#### Scenario: Dash-separated amount with spaces
- **WHEN** input is "iPhone 15 - 30000"
- **THEN** parser SHALL produce one expense: label "iPhone 15", amount 30000

#### Scenario: Dash without spaces
- **WHEN** input is "iPhone 15-30000"
- **THEN** parser SHALL produce one expense: label "iPhone 15", amount 30000

#### Scenario: En-dash separator
- **WHEN** input is "dinner – 500"
- **THEN** parser SHALL produce one expense: label "dinner", amount 500

#### Scenario: Dash within product name (not before number)
- **WHEN** input is "7-eleven 200"
- **THEN** parser SHALL produce one expense: label "7-eleven", amount 200 (dash is part of the name, not a separator)
