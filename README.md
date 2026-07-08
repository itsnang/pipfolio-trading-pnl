# nextjs-vertical-slice-starter-pack

A Next.js 16 starter that demonstrates **vertical-slice architecture**: business logic organized by feature/domain rather than by technical layer, with an `auth` slice included as a working example.

## What is vertical-slice architecture

Instead of splitting code horizontally (`controllers/`, `services/`, `models/`), each feature owns everything it needs — its own actions, components, hooks, schemas, and types — in one folder:

```
src/features/<domain>/
  actions/      ← server actions ('use server')
  components/   ← feature UI
  hooks/        ← TanStack Query hooks
  schemas/      ← Zod schemas + inferred types for forms
  store/        ← Zustand store (client-only domain state)
  types.ts
  utils/        ← domain-aware helpers
```

Slices don't import from each other — shared code lives in `src/components/shared/` or `src/lib/`. This keeps features independently understandable and deletable.

## What's included

- **`auth` feature slice** — login, register, forgot/reset password, cookie-based sessions (httpOnly, JWT-expiry-aware maxAge), access-token refresh on 401, and route protection via `src/proxy.ts`
- **shadcn/ui** components (New York style) in `src/components/ui/`
- **TanStack Query v5** setup (`src/app/providers.tsx`, `src/lib/query-client.ts`) for server state
- **Zustand** conventions for client-only domain state
- **React Hook Form + Zod** convention for every form
- **TailwindCSS v4** (config lives in `src/app/globals.css`, no `tailwind.config.ts`)
- A minimal `(app)/dashboard` example page showing an authenticated route

See [CLAUDE.md](./CLAUDE.md) for the full architectural rulebook (naming conventions, dependency rules, TypeScript strictness, etc.) — it's written for both humans and Claude Code.

## Adding a new slice

1. Create `src/features/<your-domain>/` with whichever of `actions/`, `components/`, `hooks/`, `schemas/`, `store/`, `types.ts`, `utils/` you need
2. Add a route under `src/app/` (a new route group, or a page inside `(app)`) that renders your slice's components
3. Keep pages under `src/app/` thin — business logic stays in the slice

## Quickstart

```bash
npm install
cp .env.local.example .env.local   # fill in API_BASE_URL, etc.
npm run dev                        # http://localhost:3000
```

Other commands:

```bash
npm run build     # production build (also runs tsc + lint)
npm run lint      # ESLint only
npx tsc --noEmit  # type check only
```
