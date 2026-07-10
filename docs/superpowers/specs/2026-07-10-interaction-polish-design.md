# Interaction polish: quick-add FAB, toast feedback, press states

## Context

Aurum's Journal, Accounts, and day-dialog screens were already brought to pixel/behavior parity with the bundled prototype. This pass is scoped narrowly to interaction quality, not visual style: logging a trade currently requires navigating to Journal, finding the right calendar cell, and tapping it — there's no fast path from anywhere else in the app, and successful saves/deletes give no positive confirmation beyond the sheet closing.

Explicitly out of scope (considered and rejected during brainstorming): elevation/shadow system, typography scale rework, color-tint additions to calendar cells or a win/loss border-stripe on cards. The visuals stay exactly as they are today.

## Design

### 1. Quick-add FAB

**Problem:** the day-dialog is currently owned by local `useState` inside `journal-view.tsx`, so it only exists on the Journal screen. A FAB reachable from both Journal and Accounts needs the dialog's open/close state lifted above both.

**Store:** `src/features/trades/store/day-dialog.store.ts` — a zustand store, since this is cross-screen client business state per the project's store conventions:

```ts
interface DayDialogState {
  date: string | null
  open: (date: string) => void
  close: () => void
}
```

**Global mount:** a new route-scoped component `src/app/(app)/quick-add.tsx` (`'use client'`) renders the FAB button and a single `<DayDialog>` instance driven by the store. `src/app/(app)/layout.tsx` renders `<QuickAdd />` as a sibling to `<AppShell>` (fixed positioning doesn't depend on DOM nesting, so this doesn't require threading it through the shared shell component — `AppShell` stays generic and slice-agnostic per CLAUDE.md).

**Journal wiring:** `journal-view.tsx` drops its local `selectedDay` state and its own `<DayDialog>` render; calendar day-cell taps call `useDayDialogStore().open(date)` instead, and `JournalScreen`'s `selectedDate` prop reads from the store instead of local state. No other behavior on that screen changes.

**FAB appearance/behavior:**
- Circular, `bg-clay text-white`, same fill as the existing Accounts "Add" button — no new colors.
- Fixed position: `bottom-24 right-4` (clears the sticky bottom nav + safe-area inset).
- Tapping it opens the day-dialog for **today's date**, using the currently selected account (`useSelectedAccountStore`).
- Hidden entirely when the user has zero accounts (via `useAccounts()`) — there's nothing to log against, so no dead-end tap.
- Rendered only within the `(app)` route group, so it never appears on `/login` or `/register`.

### 2. Toast feedback

Error toasts already exist on save/delete failure (`toast.error(result.error)` in `quick-pnl-form.tsx`, `calc-form.tsx`, `trade-list.tsx`). Adding the missing success side, using the existing `sonner` `toast` import already present in each file:

- `quick-pnl-form.tsx` and `calc-form.tsx`: on successful save, `toast.success(`Trade logged · ${formatPnl(pnl, { showPlus: true })}`)`.
- `trade-list.tsx`: on successful delete, `toast.success('Trade deleted')`.

### 3. Press states

Tactile feedback via Tailwind `active:` scale utilities — no new colors, shadows, or sizes:

- FAB: `active:scale-95`
- Win/loss toggle buttons (`quick-pnl-form.tsx`), quick/calc mode tabs (`day-dialog.tsx`), the Log win/loss submit button, the Accounts "Add" button, the trade-item delete (×) button: `active:scale-[0.98]`

All transitions use `transition-transform` already available via existing `transition-colors` patterns in these files (adding `transform` to the existing transition list where one is already present, or a plain `transition-transform` where none exists yet).

## Non-goals

- No shadow/elevation system, no typography scale changes, no new color usage beyond what already exists in the app (explicitly rejected during brainstorming in favor of a narrower interaction-only pass).
- No loading-state/skeleton work.
- No page-transition or sheet-transition changes — the existing `framer-motion` spring transition on `BottomSheet` is untouched.

## Testing

- `npx tsc --noEmit`, `npm run lint`, `npm run build` as the standard quality gate (per CLAUDE.md — no test runner configured).
- Manual Playwright smoke test: FAB visible/hidden correctly (zero vs. 1+ accounts), FAB opens today's day-dialog from both Journal and Accounts, calendar taps still open the correct day, success toast appears on save/delete, press states are visually present on tap.
