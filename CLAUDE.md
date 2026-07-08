# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

This repo is a **starter template** demonstrating vertical-slice architecture in Next.js. It ships with one example slice (`auth`) — clone it, delete `auth` if you don't need it as-is, and add your own slices following the conventions below.

## ⚠️ Important: Read Next.js docs before writing code

This project uses **Next.js 16**, which has breaking changes from earlier versions. APIs, conventions, and file structure may differ from training data. Before writing any code that touches Next.js internals, read the relevant guide in `node_modules/next/dist/docs/`.

## Commands

```bash
npm run dev      # Start dev server with Turbopack on http://localhost:3000
npm run build    # Production build (also runs tsc + lint)
npm run lint     # ESLint only
npx tsc --noEmit # Type check only (no build output)
```

No test runner is configured yet. Use `npm run lint && npx tsc --noEmit` as the quality gate.

To add a shadcn component: `npx shadcn@latest add <component-name>`

## Architecture

### Feature-Module structure

Business logic is organized by domain under `src/features/<domain>/`:

```
src/features/<domain>/
  actions/
    index.ts        ← barrel re-export only (no 'use server' here)
    <sub-domain>.ts ← 'use server' at top of each file
  components/
  hooks/
  schemas/          ← Zod schemas + inferred types for every form in this slice
    index.ts        ← barrel re-export only
    <form>.schema.ts
  store/
    <domain>.store.ts ← zustand store (business state only)
  types.ts
  utils/            ← domain-aware helpers (optional; see rule below)
    index.ts        ← barrel re-export only
    <topic>.ts
```

**Current slices:**

| Slice | Responsibility |
|-------|---------------|
| `auth` | Session management — login, register, forgot/reset password, cookie-based sessions, token refresh |

**Adding a new slice:**
1. Create `src/features/<new-slice>/` with the subset of `actions/`, `components/`, `hooks/`, `schemas/`, `store/`, `types.ts`, `utils/` your slice needs
2. Wire up a route under `src/app/` (a new route group, or a page inside `(app)`) that imports from the slice's `components/`
3. Keep all business logic in the slice — pages under `src/app/` should stay thin compositions
4. Follow the "Rules enforced by reviewers" below

**Dependency direction:** Slices must not import from each other. Import from `@/components/shared/` or `@/lib/` for shared code. If a slice genuinely needs another slice's data (e.g. a dashboard aggregating several domains), document the exception here.

**Shared presentational components** live in `src/components/shared/` — used across slices, must not import from any feature slice:
- `form-controls.tsx` — `Field` (label wrapper) and `Toggle` (accessible switch)
- `thumb.tsx` — generic image placeholder
- `theme-toggle.tsx` — light/dark theme switch (next-themes)
- `navigation-progress.tsx` — top-of-page loading bar (nprogress)
- `page-shell.tsx` — heading + description wrapper for a page's content
- `icons.tsx` — `Icons` map of lucide icons (plus a couple of custom SVGs) used across features

**Rules enforced by reviewers:**
- `'use server'` goes on each action file, never on `index.ts`
- Auth check must be the **first** thing in every action — derive user identity from the session cookie server-side, never accept a user/account id from the caller (IDOR risk)
- `revalidatePath()` / `revalidateTag()` must be called **after** the mutation commits, never before
- Actions that return `{ error?: string }` must `return { error: '...' }` on failure, not `throw`
- Helpers split by **domain-awareness** (the test: does the function reference a domain type?). Generic, domain-agnostic utilities (`formatDate`, `timeAgo`, money formatting) live in `src/lib/<topic>/` (e.g. `src/lib/format/`) with an `index.ts` barrel — shared across all features. Domain-aware helpers (operate on a feature's own types) live in that feature's `src/features/<domain>/utils/` folder with an `index.ts` barrel. Import via the barrel (`@/lib/format`, `../utils`); never put a generic formatter in a feature `utils/`
- Component files use **kebab-case** (`login-screen.tsx`), matching `src/components/ui/`; the exported component keeps **PascalCase** (`LoginScreen`). See "File naming" below
- **Every form must use React Hook Form + Zod.** Define a `z.object()` schema in `schemas/<form>.schema.ts` (or `types.ts` for a small slice like `auth`), export the inferred type (`z.infer<typeof schema>`), and wire it up with `useForm({ resolver: zodResolver(schema), defaultValues: { ... } })`. Use `register` for native inputs, `Controller` for custom inputs (`Toggle`, `ColorInput`, `SelectInput`). After a successful mutation, call `form.reset(data)` to clear `isDirty`. Avoid `z.coerce` and `.default()` — they split input/output types and break `exactOptionalPropertyTypes`; handle defaults in `defaultValues` instead and parse numbers explicitly in `onSubmit`. Field errors go in `Field`'s `error` prop (`error={errors.fieldName?.message}`).

### Route groups

`src/app/` uses parenthesised route groups (URL-invisible):
- `(auth)` → `/login`, `/register`, `/forgot-password`, `/reset-password` — unauthenticated flows
- `(app)` → `/dashboard` — authenticated area (add your own protected pages here)

Route protection is handled centrally in `src/proxy.ts` (Next.js 16's middleware-equivalent): it reads the session cookies, redirects unauthenticated visitors to `/login`, and redirects signed-in visitors away from the auth pages to `/dashboard`.

### Environment variables

Two separate modules enforce the server/client boundary:

- `src/env.ts` — server-only (imports `server-only`). Import this in Server Components and actions.
- `src/env.client.ts` — safe for Client Components. Only `NEXT_PUBLIC_*` vars.

**Never import `src/env.ts` from a Client Component.** Add new server vars as commented-out lines in `src/env.ts`; add `NEXT_PUBLIC_*` vars to `src/env.client.ts`.

### TanStack Query v5

`src/app/providers.tsx` wraps the app in `QueryClientProvider`. The client is created with `useState(() => makeQueryClient())` — this pattern is intentional: it gives each server request its own instance while reusing the same client across client-side navigations.

For server-prefetched data, use `prefetchQuery` + `HydrationBoundary` in Server Components, then `useQuery` with the same key in the Client Component below.

Hooks that fetch via `useQuery` live in `src/features/<domain>/hooks/`. The `userId` (or any identity) param should be `string | undefined` and guarded with `enabled: !!userId` — never use `!` assertions at the call site.

### Zustand (state management)

**Where state lives — decide in this order:**

1. **Server state** (anything fetched or persisted via API/server actions) → TanStack Query, never Zustand.
2. **Client business/domain state** (cross-component, client-originated) → Zustand store, e.g. `src/features/<domain>/store/<domain>.store.ts`.
3. **UI state** (open drawer, detail visibility, toggles) → `useState` in the component that owns it; never in a domain store.

Store conventions:
- Location/naming: `src/features/<domain>/store/<domain>.store.ts`
- Define `create<State & Actions>()((set, get) => ...)` with separate `State` and `Actions` interfaces
- Subscribe with fine-grained selectors — one selector per value
- **Never return a fresh object/array from a selector** (infinite re-render in v5); use multiple primitive selectors or `useShallow`
- Stores are module-level globals — fine for client-only interaction state. If a store ever needs SSR/per-request data, switch to the factory + context provider pattern from the zustand Next.js guide

Persisted stores (`persist` middleware):
- Always set `skipHydration: true` — this prevents SSR/client mismatch. Rehydrate explicitly in a small client component that calls `useIsomorphicLayoutEffect` → `.persist.rehydrate()` on mount.
- Prefix persist keys consistently for your app (e.g. `app_<domain>`).

Sharing UI state:
- When UI state must reach route children (a layout component can't pass props through `{children}`), keep the `useState` in the owning component and expose setters via a small context
- If a feature's shared UI state outgrows a setter context (several drawers/modals, many consumers), promote it to a separate `<domain>.ui.store.ts` rather than fattening the context or mixing UI state into the domain store

### TailwindCSS v4

Config lives entirely in `src/app/globals.css` — there is no `tailwind.config.ts`. Key conventions:
- CSS custom properties (HSL channel triplets) are declared in `:root` and `.dark`
- `@theme inline` maps them to Tailwind color tokens (`--color-background`, etc.)
- `@custom-variant dark (&:where(.dark, .dark *))` enables class-based dark mode (toggled by adding `.dark` to `<html>`, e.g. via next-themes)
- All theming changes go in `globals.css`, not inline styles

### shadcn/ui

Style: **New York**, base color: **Neutral**, CSS variables: **yes**. Components are generated into `src/components/ui/`. The `cn()` utility is at `src/lib/utils.ts`.

`toast` is deprecated — use `sonner` (`src/components/ui/sonner.tsx`) instead.

### File naming

All files use **kebab-case**, including React component files — `login-screen.tsx`, not `LoginScreen.tsx` (matches shadcn/ui and `src/components/ui/`). The file name is kebab-case; the **exported symbol stays PascalCase** (`login-screen.tsx` → `export function LoginScreen`), exactly like shadcn (`button.tsx` → `Button`). Non-component modules follow the same lowercase convention with their established suffixes: `*.store.ts`, `*.action.ts`, `use-*.ts`, `types.ts`, `data.ts`.

### TypeScript strictness

`tsconfig.json` enables several flags beyond `strict: true`:
- `noUncheckedIndexedAccess` — all array/object index reads may be `undefined`
- `exactOptionalPropertyTypes` — passing `prop={undefined}` explicitly is a type error when the type is `T` not `T | undefined`
- `noImplicitOverride`, `noFallthroughCasesInSwitch`

These will surface errors in patterns that compile under default strict mode.
