## Why

The Smart Input NLP parser has two bugs that misparse common expense inputs: brand names containing "and" get split into separate expenses ("Harlan and Holden 200" → "Holden 200"), and dash-separated amounts fail depending on spacing ("Iphone 15 - 30000" can produce wrong results). Additionally, the 8 quick-entry templates (coffee, lunch, etc.) are hardcoded with fixed amounts users can't customize, while the existing shortcuts system (which has full CRUD + sync) is hidden behind an `@` prefix. Users also have no way to discover the parser's syntax (time tokens, categories, shortcuts) without guessing.

## What Changes

- **Fix "and" splitting heuristic**: Only split on "and" / "&" when both sides of the separator contain a pure number token. "Harlan and Holden 200" stays as one expense; "coffee 100 and lunch 150" still splits correctly.
- **Fix dash separator handling**: Recognize `label - amount` patterns by stripping separator dashes before tokenizing, and clean trailing punctuation from labels.
- **Unify templates and shortcuts**: Seed the 8 default templates into the `shortcuts` DB table on first launch. The template chip strip and NLP parser both read from the DB instead of the hardcoded constant. Shortcuts work without the `@` prefix in NLP (while still supporting `@` for backward compat).
- **Manage shortcuts from SmartInput**: Long-press a chip to edit its label, amount, or delete it. A "+" chip at the end to add new ones.
- **Manage shortcuts from Settings**: A full "Quick Entries" management screen under Settings with add/edit/delete/reorder.
- **Smart Input help**: An `(i)` icon in the SmartInput sheet that expands an inline cheatsheet of all syntax. First-time tooltip on initial SmartInput open.

## Capabilities

### New Capabilities
- `smart-input-parser-fix`: Fixes the "and" splitting heuristic and dash separator handling in the NLP parser
- `unified-shortcuts`: Merges hardcoded templates with user-managed shortcuts — seed defaults to DB, parser recognizes shortcuts without `@`, template strip reads from DB
- `shortcut-management`: UI for managing shortcuts from both SmartInput (long-press quick edit) and Settings (full CRUD screen)
- `smart-input-help`: Inline cheatsheet and first-time tooltip in SmartInput

### Modified Capabilities

_(No existing specs to modify)_

## Impact

- **Files modified**:
  - `apps/mobile/lib/parser/expense-parser.ts` — fix "and" splitting, dash handling, recognize DB shortcuts without `@`
  - `apps/web/hooks/use-ai-parser.ts` — same parser fixes for web
  - `apps/mobile/components/expenses/smart-input.tsx` — read templates from DB, long-press edit, help icon, first-time tooltip
  - `apps/mobile/hooks/use-shortcuts.ts` — add seed logic, expose update method
  - `apps/mobile/app/(tabs)/settings.tsx` — add Quick Entries tab or section
  - `packages/shared/src/constants.ts` — TEMPLATES stays as seed data, no longer directly consumed by UI/parser
- **DB**: No schema changes — `shortcuts` table already has all needed columns
- **Sync**: Shortcuts already sync via entity-registry — seeded defaults will sync on first push
- **Web**: Parser fixes apply to web too; template unification is mobile-first but web can follow
