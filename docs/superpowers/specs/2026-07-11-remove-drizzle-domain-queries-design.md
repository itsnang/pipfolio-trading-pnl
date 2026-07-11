# Remove Drizzle from domain queries (accounts/trades/journal)

## Context

The user reported inserts/reads consistently feeling slow in production (deployed on Vercel). A brainstorming pass ruled out region mismatch and Supabase free-tier cold-start pausing, landed on a serverless connection-lifecycle issue (`postgres.js` client missing `idle_timeout`/`max_lifetime`), and shipped a small fix for that (PR open against `main`, not yet merged/measured).

Before that fix could be measured, the user decided to skip ahead and remove Drizzle from the app, having found Supabase's `.rpc()` docs (https://supabase.com/docs/reference/javascript/rpc). Two follow-up decisions narrowed scope:

1. **Sequencing:** abandon the connection-lifecycle fix / measurement step — go straight to removing Drizzle. (The fix's own file, `src/lib/db/client.ts`, would become irrelevant to domain queries under this change anyway, though it stays for auth — see below.)
2. **Auth scope:** better-auth keeps its existing Drizzle adapter for the `user`/`session`/`account`/`verification` tables — rewriting auth persistence is a much bigger, security-sensitive lift than rewriting business queries, and better-auth has first-party Drizzle support. Only the domain layer (`accounts`, `trades`, `journal` server actions) moves off Drizzle.

**Important architectural note:** this app's auth is better-auth, not Supabase Auth, so Supabase's Row Level Security (which normally ties to `auth.uid()` from a Supabase JWT) does not apply here. The migration uses Supabase's **service role key** (bypasses RLS) and keeps doing manual `user_id` scoping inside every query/function — exactly the same security model as today's `eq(tradingAccount.userId, user.id)` pattern, just expressed differently. This migration does not change the security model, only the client library.

**Migration structure (user-selected):** RPC only for the two queries that need custom SQL (joins + `FILTER` aggregates that PostgREST's query builder can't express) — `getAccountsWithStats` and `getMonthJournal`. Everything else (simple inserts/deletes/selects) uses supabase-js's `.from()` directly.

## Current behavior (what must be replicated exactly)

**`src/features/accounts/actions/accounts.ts`:**
- `getAccountsWithStats({user})`: for the current user, one row per `trading_account`, left-joined with `trade` (matching `trade.account_id = trading_account.id AND trade.user_id = :userId`), grouped by account, ordered by `created_at DESC`. Per account: `total_pnl` = `COALESCE(SUM(trade.pnl), 0)`, `trade_count` = `COUNT(trade.id)`, `recent_count` = `COUNT(trade.id) FILTER (WHERE trade.date >= :thirtyDaysAgo)` (today's date minus 30 days, as `YYYY-MM-DD`). Post-processing in JS: `current_balance` = `starting_balance + total_pnl` (both parsed as floats, `.toFixed(2)`), `trade_count` parsed to int, `is_active` = `recent_count > 0`. Returns all `trading_account` columns spread plus these derived fields.
- `addAccount({user}, input)`: inserts a new `trading_account` row (`id`: `crypto.randomUUID()`, `user_id`, `name`, `broker` (nullable), `type`, `starting_balance`). On success: `revalidatePath('/accounts')`, return `{}`. On failure: return `{ error: 'Failed to create account' }` (never throw).
- `deleteAccount({user}, accountId)`: deletes the `trading_account` row where `id = accountId AND user_id = :userId`. Same revalidate/error pattern, error message `'Failed to delete account'`.

**`src/features/trades/actions/trades.ts`:**
- `getTradesForDay({user}, accountId, date)`: selects all `trade` columns where `user_id = :userId AND account_id = :accountId AND date = :date`.
- `addQuickTrade({user}, input)`: computes `pnl` (negated if `result === 'loss'`), inserts a `trade` row (`id`: `crypto.randomUUID()`, `user_id`, `account_id`, `date`, `mode: 'quick'`, `result`, `pnl`). Revalidates `/journal` and `/accounts`. Error message `'Failed to save trade'`.
- `addCalcTrade({user}, input)`: computes `pnl` via `calcPnl()` (already exists at `src/features/trades/utils/calc-pnl.ts`, unchanged), derives `result` from sign, inserts a `trade` row with `mode: 'calc'`, `direction`, `entry_price`, `exit_price`, `lot_size` in addition to the quick-trade fields. Same revalidate/error pattern.
- `deleteTrade({user}, tradeId)`: deletes the `trade` row where `id = tradeId AND user_id = :userId`. Same revalidate/error pattern, error message `'Failed to delete trade'`.

**`src/features/journal/actions/journal.ts`:**
- `getMonthJournal({user}, accountId, month)`: for a given `"YYYY-MM"` month, computes first/last day of month, then for the current user's `trade` rows matching `account_id` and `date` between those bounds, groups by `date`: `total_pnl` = `SUM(pnl)`, `trade_count` = `COUNT(*)`, `win_count` = `COUNT(*) FILTER (WHERE result = 'win')`, `loss_count` = `COUNT(*) FILTER (WHERE result = 'loss')`. Post-processing in JS aggregates these per-day rows into month totals (`net_pnl`, `win_count`, `loss_count`, `trade_count`, `win_rate` = round(winCount/tradeCount*100), 0 if no trades) and returns `MonthJournalData` (`src/features/journal/types.ts`, unchanged).

All three files use `withAuthAction` (`src/lib/better-auth/middleware.ts`) as the outer wrapper — **this does not change**. `withAuthAction` calls `requireSession()` (better-auth, still Drizzle-backed) before invoking the action body; only the body's database calls change from Drizzle to Supabase.

## Architecture

**New dependency:** `@supabase/supabase-js`.

**New env vars** (`src/env.ts`, added to `serverSchema`): `SUPABASE_URL` (`z.string().url()`), `SUPABASE_SERVICE_ROLE_KEY` (`z.string().min(1)` — an opaque secret string, no further format validation needed). Both required, validated the same way `DATABASE_URL`/`BETTER_AUTH_SECRET` already are.

**New file — `src/lib/supabase/client.ts`** (server-only): exports a function returning a `SupabaseClient` configured with `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. Used only by the three domain action files below — never by better-auth, never by any Client Component (the service role key must never reach the browser).

**Two new Postgres functions**, added via a raw-SQL Drizzle migration (`drizzle-kit generate --custom`, so Drizzle's migration history stays the single source of truth for the whole database, auth and domain tables alike, even though domain tables are no longer *queried* through Drizzle at runtime):
- `get_accounts_with_stats(p_user_id text, p_recent_since date) returns table (...)` — replicates the `getAccountsWithStats` join+aggregate exactly as described above. Takes the 30-days-ago cutoff as a parameter (computed in the action, passed in) rather than computing "now" inside SQL, so behavior matches today's JS-side date computation exactly.
- `get_month_journal(p_user_id text, p_account_id text, p_first_day date, p_last_day date) returns table (...)` — replicates the `getMonthJournal` per-day grouped aggregate. Takes first/last day as parameters (computed in the action, as today), not month-parsing inside SQL.

**Modified files:**
- `src/features/accounts/actions/accounts.ts` — `getAccountsWithStats` calls `.rpc('get_accounts_with_stats', {...})`; `addAccount`/`deleteAccount` use `.from('trading_account').insert()/.delete()`.
- `src/features/trades/actions/trades.ts` — `getTradesForDay` uses `.from('trade').select()`; `addQuickTrade`/`addCalcTrade` use `.from('trade').insert()`; `deleteTrade` uses `.from('trade').delete()`.
- `src/features/journal/actions/journal.ts` — `getMonthJournal` calls `.rpc('get_month_journal', {...})`.
- `CLAUDE.md` — update the "Database schema" section to state that Drizzle now only manages/queries better-auth's own tables; domain tables (`trading_account`, `trade`) are still defined in Drizzle schema files for migration purposes, but queried at runtime via the Supabase client (`src/lib/supabase/client.ts`), not Drizzle's query builder. Note the `drizzle-kit generate --custom` workflow for adding/changing Postgres functions.

**Unchanged:** `src/lib/db/client.ts` (Drizzle + postgres.js — stays, used only by `src/lib/better-auth/server.ts`'s `drizzleAdapter`), `src/lib/db/schema/*.table.ts` (stay as the schema/migration source of truth for all tables, including domain ones), `withAuthAction`, `requireSession`, all Zod schemas, all client-side hooks/components, `calcPnl`, `MonthJournalData`/`AccountWithStatsLike` types (row shapes returned by the Supabase calls must still satisfy these).

## Data flow

Client → Server Action (`'use server'`) → `withAuthAction` → `requireSession()` (better-auth, Drizzle-backed, unchanged) → Supabase client call (`.rpc()` or `.from()`) → Supabase's PostgREST → same Postgres database, same tables → response mapped to the same return shapes as today.

## Error handling

supabase-js calls return `{ data, error }` rather than throwing. This maps directly onto this codebase's existing convention (per `CLAUDE.md`: actions returning `{ error?: string }` must `return { error: '...' }`, never throw) — check `error` after each call and return the same user-facing error strings already used (`'Failed to create account'`, `'Failed to save trade'`, etc.), rather than a generic message or the raw Supabase error (which could leak internal details).

## Testing / verification

No automated test runner in this project (`npm run lint && npx tsc --noEmit` is the quality gate per `CLAUDE.md`). Verification is manual, and must specifically include a **two-user isolation check** — since raw string table/column names lose Drizzle's compile-time type safety, a typo in a `.eq('user_id', ...)` filter could silently leak data across users without a type error to catch it:

1. `npx tsc --noEmit && npm run lint` clean.
2. `npm run build` succeeds.
3. Register two separate throwaway users. For user A: add an account, add a quick trade and a calc trade, load `/journal` and `/accounts`, confirm stats match expectations, delete the trade, delete the account. Repeat for user B.
4. With both users' data present simultaneously, confirm user A's `/journal` and `/accounts` never show user B's accounts/trades and vice versa (the two-user isolation check).
5. Clean up both throwaway users from the database afterward.

## Out of scope (explicitly not part of this change)

- better-auth's own persistence (stays on Drizzle).
- Any change to `src/lib/db/client.ts`, including the `idle_timeout`/`max_lifetime` fix from the prior spec (already implemented, PR open, not part of this work).
- Row Level Security policies (not used — service role key bypasses RLS by design, as explained above).
- Any change to Zod validation schemas, client-side hooks, or UI components.
