## Context

The Smart Input uses a local NLP parser (both mobile and web) that tokenizes input, extracts special patterns (#category, @shortcuts, time tokens), then splits on "and"/"&"/"," to handle multi-expense inputs. The parser takes the last pure-number token as the price and everything else as the label.

Two systems exist in parallel: hardcoded TEMPLATES (8 items in `packages/shared/src/constants.ts`) for quick-tap chips and NLP recognition, and user-managed shortcuts (in SQLite `shortcuts` table with full CRUD + sync) that only work with the `@` prefix. The shortcuts table already has all the columns needed to replace templates: `trigger_word`, `label`, `default_amount`, `category`, `icon`.

## Goals / Non-Goals

**Goals:**
- Fix "and" splitting so brand names like "Harlan and Holden" aren't broken apart
- Fix dash-separated amounts ("label - 30000") to work reliably
- Unify templates and shortcuts into one DB-backed system users can customize
- Provide two management surfaces: quick edit from SmartInput, full CRUD in Settings
- Help users discover Smart Input syntax with inline help

**Non-Goals:**
- Changing the web SmartInput UI (web parser gets the fixes, but template/help UI is mobile-only for now)
- AI/ML-based parsing improvements
- Reordering or drag-to-sort shortcuts (can add later)
- Budget bucket integration for shortcuts (already exists on web, separate concern)

## Decisions

### 1. "And" splitting: only split when both sides have numbers

**Decision**: Before splitting on `\s+(?:and|&)\s+`, check if both resulting sides contain at least one pure-number token. If not, don't split.

**Why**: This handles the common case ("Harlan and Holden 200" → one expense) while preserving multi-expense input ("coffee 100 and lunch 150" → two expenses). No new syntax needed.

**Edge case**: "coffee and lunch 150" — left side has no number, so it won't split. The whole thing becomes label "coffee and lunch", amount 150. This is reasonable — the user can type "coffee, lunch 150" or "coffee 120 and lunch 150" for two expenses.

**Alternatives considered**:
- Quoted strings (`"Harlan and Holden" 200`) — extra syntax users have to learn
- Amount-first rule — changes the feel of the parser
- Dash as primary separator — breaks other use cases

### 2. Dash handling: strip separator dashes before tokenizing

**Decision**: Before tokenizing, detect `<text> - <number>` or `<text> – <number>` (en-dash) patterns and normalize them to `<text> <number>`. Also clean trailing dashes/punctuation from labels after parsing.

**Why**: Users naturally type "iPhone 15 - 30000" as a separator. The dash itself carries no semantic meaning — it's just visual separation.

### 3. Seed defaults to shortcuts table

**Decision**: On app startup, if the user has zero shortcuts, seed the 8 default templates from `TEMPLATES` constant into the `shortcuts` table with `is_system: 1` flag (column already exists in schema). After seeding, the parser and UI read exclusively from shortcuts.

**Why over alternatives**:
- **Alt: Dual-read (DB + constant)** — Complex merge logic, precedence confusion
- **Alt: Migrate on DB migration** — Only runs once, can't re-seed if user deletes all

Using the existing `is_system` column lets us distinguish defaults from user-created ones (for potential "reset to defaults" feature later).

### 4. Shortcuts recognized without @ prefix

**Decision**: After extracting special tokens (#, @, time), check if any remaining token matches a shortcut `trigger_word`. If so, use that shortcut's label and default amount (overridden by any explicit number in the input).

**Parse order**:
1. Extract #category, :bucket
2. Extract time tokens
3. Check @shortcut (explicit, highest priority)
4. Try "and" splitting with Option D heuristic
5. For each part: check if label matches a shortcut trigger → use its metadata
6. Fall back to raw label + last-number-as-amount

**Why**: This makes shortcuts feel like templates — just type the word. The `@` prefix becomes a power-user feature, not a requirement.

### 5. SmartInput quick edit via long-press

**Decision**: Long-press a template chip to open a small edit sheet (label, amount, delete). A "+" chip at the end of the strip opens the same sheet in create mode. This reuses the existing bottom-sheet pattern from the app.

**Why**: Users see the chips every time they open SmartInput. Long-press is the standard mobile pattern for "edit this thing." Settings provides the full list view for bulk management.

### 6. Help: (i) icon + first-time tooltip

**Decision**: Add a small `(i)` icon button next to the input field. Tapping it expands an inline cheatsheet below the input showing syntax examples. On first-ever SmartInput open, show a brief tooltip pointing to the (i) icon saying "Tap here to learn shortcuts." Track `has_seen_smart_input_help` in MMKV (not DB — no need to sync this).

**Why**: Inline beats a separate screen — users see it in context. First-time tooltip catches new users without being annoying on repeat visits.

## Risks / Trade-offs

**[Shortcut trigger collisions]** → A user could create a shortcut with trigger "and" or "at" which conflicts with parser keywords. Mitigation: validate trigger words against a reserved-word list on creation.

**[Seed timing]** → If seeding happens before sync pulls remote shortcuts, the user could end up with duplicates. Mitigation: seed only when shortcuts count is 0, and sync pull runs before seed check on fresh login.

**[Parser performance]** → Adding a DB lookup to the parse loop could slow down real-time preview. Mitigation: shortcuts are already loaded into a `Map` in memory via `useShortcuts` — no per-keystroke DB reads.

**["and" heuristic false positives]** → "bread and butter 50" won't split (correct), but "200 coffee and lunch" won't split either (left has number but right doesn't). This is acceptable — the parser already uses "both sides need numbers" as the rule.
