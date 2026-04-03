## 1. Parser Fixes (mobile + web)

- [x] 1.1 In `apps/mobile/lib/parser/expense-parser.ts` `parseSimplePatterns`, change the "and"/"&" splitting to only split when both sides contain a pure-number token (Option D heuristic)
- [x] 1.2 Add dash normalization: before tokenizing, replace `<text>\s*[-–—]\s*<number>` patterns with `<text> <number>`, preserving dashes within words (e.g., "7-eleven")
- [x] 1.3 Clean trailing dashes/punctuation from labels after parsing
- [x] 1.4 Apply the same "and" splitting fix and dash normalization to web parser in `apps/web/hooks/use-ai-parser.ts` `parseSimplePatterns`
- [x] 1.5 Update existing tests in `apps/web/lib/__tests__/expense-parser.test.ts` and add new test cases: "Harlan and Holden 200", "iPhone 15 - 30000", "Ben & Jerry's 350", "coffee and lunch 150", "7-eleven 200"

## 2. Seed Default Templates to Shortcuts DB

- [x] 2.1 In `apps/mobile/hooks/use-shortcuts.ts`, add a `seedDefaults` function that inserts the 8 TEMPLATES into shortcuts table with `is_system = 1` when the user has zero shortcuts
- [x] 2.2 Call `seedDefaults` during the `useShortcuts` init (after refresh, before returning), guarded by a check on shortcuts count
- [x] 2.3 Add a reserved-words list constant and a `validateTriggerWord` function that rejects "and", "at", "yesterday", "last", "both", "ways", "roundtrip", "round", "trip"

## 3. Unified Parser — Shortcuts Without @ Prefix

- [x] 3.1 In mobile `parseExpenseInput`, after time/category extraction and before simple pattern parsing, check if the remaining input (or individual tokens) matches a shortcut `trigger_word`. If matched, use the shortcut's label/category and the explicit amount (or `default_amount` if no number given)
- [x] 3.2 In web `parseLocally`, add the same shortcut-as-template recognition logic
- [x] 3.3 Add test cases: shortcut trigger without @, trigger with explicit amount override, trigger alone (uses default amount)

## 4. SmartInput Template Strip from DB

- [x] 4.1 In `apps/mobile/components/expenses/smart-input.tsx`, replace the hardcoded `TEMPLATES.map(...)` chip strip with shortcuts from the `shortcutMap` prop (already passed in). Show each shortcut's label and default_amount
- [x] 4.2 Add a "+" chip at the end of the strip that opens the shortcut edit sheet in create mode
- [x] 4.3 Pass `shortcuts` array (not just map) to SmartInput from `index.tsx` so the strip can iterate in order

## 5. Shortcut Quick Edit from SmartInput

- [x] 5.1 Create `apps/mobile/components/expenses/shortcut-edit-sheet.tsx` — a bottom sheet with fields: trigger word (with reserved-word validation), label, default amount, category (optional), and a delete button
- [x] 5.2 Wire long-press on template chips to open the edit sheet pre-filled with that shortcut's data
- [x] 5.3 On save, call `updateShortcut` (add this to `useShortcuts` hook); on delete, call `deleteShortcut`. Both already enqueue sync.
- [x] 5.4 Add `updateShortcut` method to `useShortcuts` hook (currently only has add and delete)

## 6. Settings Shortcuts Management

- [x] 6.1 Create `apps/mobile/components/settings/shortcuts-settings.tsx` — a list of all shortcuts with trigger, label, amount. Each row tappable to edit (opens same edit sheet), swipe-to-delete
- [x] 6.2 Add an "Add Shortcut" button at the top or bottom of the list
- [x] 6.3 Wire into the Settings Budget tab — show below the existing budget settings sections

## 7. Smart Input Help

- [x] 7.1 Add an `(i)` icon button in the SmartInput input row (left of the sparkle icon or right side)
- [x] 7.2 Create a collapsible help section below the input that shows syntax examples: basic ("coffee 120"), multiple ("coffee 100 and lunch 150"), shortcuts ("@starbucks 150" or just "starbucks"), categories ("#food"), time ("at 2pm", "yesterday")
- [x] 7.3 Add first-time tooltip: check `has_seen_smart_input_help` in MMKV. If false, show a tooltip pointing to the (i) icon on SmartInput open. Dismiss on tap, set flag.

## 8. Verification

- [x] 8.1 Run all parser tests: `pnpm --filter web test -- --run lib/__tests__/expense-parser.test.ts`
- [ ] 8.2 Manual test: type "Harlan and Holden 200" → should parse as one expense
- [ ] 8.3 Manual test: type "iPhone 15 - 30000" → should parse as one expense with amount 30000
- [ ] 8.4 Manual test: long-press a chip → edit sheet opens → change amount → chip updates
- [ ] 8.5 Manual test: open SmartInput first time → tooltip appears → tap (i) → cheatsheet expands
- [ ] 8.6 Manual test: Settings > Budget > Quick Entries → shows all shortcuts → can add/edit/delete
