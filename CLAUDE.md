# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A second-hand toy marketplace SPA. Vite + React 18 + TypeScript frontend, shadcn/ui (Radix) + Tailwind for UI, and Supabase (Postgres + Auth + Storage + Realtime) as the entire backend. Originally scaffolded by Lovable; `lovable-tagger` runs only in dev mode (see `vite.config.ts`).

## Commands

```bash
npm run dev        # Vite dev server on http://localhost:8080
npm run build      # production build
npm run build:dev  # build with development mode
npm run lint       # eslint (flat config in eslint.config.js)
npm run preview    # preview a production build
```

There is no test runner configured. UI/flow verification is done manually or via the Playwright MCP server.

### Supabase (local backend)

```bash
supabase start                 # local stack; Studio at http://localhost:54323, API at :54321
supabase db reset              # drop + re-apply all migrations + seed.sql
supabase migration new <name>  # create a new migration, then edit its SQL and re-run db reset
supabase link --project-ref <ref> && supabase db push   # deploy migrations to remote
```

The client (`src/integrations/supabase/client.ts`) auto-switches between the local stack (when hostname is `localhost`/`127.0.0.1`) and the remote project — no env vars involved.

## Architecture

### Data access goes through Postgres RPCs, not table queries

This is the single most important pattern. Every table has Row Level Security enabled, and RLS blocks the multi-table joins the UI needs (joining `products` → `product_images` → `profiles` returns nothing under RLS). So read paths are implemented as `SECURITY DEFINER` SQL functions defined in the migrations and called via `supabase.rpc('fn_name', {...})`.

**Before writing any data-fetch code, check `supabase/migrations/` for an existing RPC and reuse it. When new data access is needed, add a new `SECURITY DEFINER` RPC via a migration rather than querying tables directly from the client.** Key existing RPCs:

- `get_public_products(search_term, sort_by)` / `get_public_product_detail(product_id)` — public listings + detail (includes first image + seller name).
- `get_profile_names(user_ids[])` — the ONLY sanctioned way to read profile names; deliberately exposes just `first_name`/`last_name` (never email). All other RPCs compose seller/buyer names through this.
- `get_user_conversations()`, `get_conversation_details(conv_id)`, `get_conversation_messages_with_read_status(conv_id)`, `create_conversation(prod_id)`, `get_user_conversation_for_product(prod_id)` — messaging.
- `get_user_saved_products()`, `mark_conversation_read`, `get_unread_count_for_conversation` — saved items + read tracking.

Writes to a user's own rows (create/update product, save item, send message) use direct `supabase.from(...)` calls, which RLS permits via `auth.uid() = user_id` policies.

### Frontend layering

- `src/pages/` — one component per route; routing table is in `src/App.tsx`. `/` and `/categories` both render `Categories`; catch-all `*` must stay last.
- `src/hooks/use*.tsx` — data hooks that wrap the RPC calls and own loading/error state (e.g. `usePublicProducts`, `useUserProducts`, `useSavedProducts`, `useUnreadMessagesCount`). `useAuth` wraps Supabase auth session state.
- `src/components/` — feature components at the top level; `src/components/ui/` is generated shadcn/ui primitives (avoid hand-editing these). `src/contexts/PresenceProvider.tsx` provides global online-presence via a Supabase Realtime channel.
- `@tanstack/react-query` (`QueryClientProvider`) and `PresenceProvider` wrap the app in `App.tsx`, though several hooks manage fetch state with plain `useState`/`useEffect` rather than react-query.
- Path alias `@` → `src/` (configured in both `vite.config.ts` and `tsconfig`).

### Backend data model (see `supabase/migrations/00000000_consolidated_migration.sql`)

`profiles` (auto-created on signup via `handle_new_user` trigger) → `products` → `product_images`. Messaging: `conversations` ↔ `participants` (membership) ↔ `messages`, with `message_status` tracking read receipts. `saved_products` for bookmarks. Product images live in the public `product-images` storage bucket, keyed by `<auth.uid()>/...` folder so storage RLS ties files to their owner. `messages` is in the realtime publication; new-message and new-conversation triggers bump timestamps and auto-add the seller as a participant.

The consolidated migration is the source of truth for the schema; later timestamped migrations layer on top. Generated TS types are in `src/integrations/supabase/types.ts`.

## Conventions (from README_TODO.md)

- Component/page files use PascalCase (e.g. `CreateListingForm.tsx`).
- **Never commit PII (emails) or secrets.** `.mcp.json` and `.env` are gitignored; use the `.mcp.json.example*` templates. Profile emails are intentionally kept out of all RPCs — do not add them.
- Uploaded product images are resized client-side to max 400×400 via `resizeImage` in `src/lib/imageUtils.ts` before upload.
