<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project context

Website of clinical psychologist Ekaterina Zhuk (ekaterinazhuk.ru): Next.js App Router, React 19, Tailwind 4, Supabase, SurveyJS. Full description: `PROJECT.md`; setup and deploy: `README.md`. User communicates in Russian; reply in Russian, concisely.

## Rules

- **Supabase is the only runtime data source** (`site_content`, `tariffs`, `tariff_packages`, `psychological_tests`, Storage). Never add local file reads or fallbacks. `supabase/seed/` is only input for `npm run seed`.
- Server code gets the client via `src/lib/supabase.ts` (service role key, server only; never expose it to the client).
- Pages that read Supabase must be `export const dynamic = "force-dynamic"` so the build works without credentials.
- Public reads use cached `getPublic*` functions (`unstable_cache` + tags, `src/lib/cache.ts`); admin routes use uncached `get*Bundle`. Any new save path must call `invalidateCache(tag)`.
- Admin auth: cookie + `src/proxy.ts` + `src/lib/adminSession.ts`. `/admin` and `/api/admin/*` are protected.
- Admin UI (`src/app/admin`): shared components in `_components/` (`AdminShell` with sticky save bar, `useToast()` notifications, `ui.tsx` primitives), helpers in `_lib/`. Mobile-first (44px targets, 16px inputs on mobile), site palette only (`soft-linnen`, `platinum`, `alabaster-grey`, `dusty-grape`). Report results via toasts, not inline text. Explain non-obvious settings with a plain-language `tip` on `Field`/`Checkbox`/`SectionTitle` (the `Tip` "?" bubble in `ui.tsx`; styled `.tip-bubble` in `main.css`); keep admin copy simple, in Russian, with no technical jargon (say «адрес (slug)», «служебные параметры», not «SurveyJS JSON»). Image previews must use the same aspect ratio as the site (`ImageUpload` `aspectClass`).
- Hosting: Vercel (GitHub Pages is not supported). Workflows: `supabase-keepalive.yml` (keep-alive), `sync-fallback-photo.yml` (weekly fallback photo sync), `supabase-backup.yml` (daily encrypted backup of all tables and storage, skipped when data is unchanged; scripts in `scripts/`), `supabase-restore.yml` (manual restore with confirmation and pre-restore snapshot) in `.github/workflows/`.

- Кнопки: вне карточек - стеклянные `glass`/`soft`/`success` (как чёрная кнопка на главной, меняется только цвет подложки); внутри карточек - только `variant="solid"` (полупрозрачная светлая таблетка со стрелкой), менять можно лишь цвет фона.

## Environment

- Secrets live in `.env.local` (gitignored). A shared copy is at `C:\Users\mrsav\.copilot\secrets\.env.local`; in a new worktree copy it to the repo root. Never print, log or commit its values.
- Dev server: `npm run dev` on `127.0.0.1:3020`; restart after env changes.
- Checks: `npx tsc --noEmit`, `npm run build` (`npm run lint` has pre-existing `no-explicit-any` errors in `src/types/global.d.ts`).
- Windows PowerShell 5.1: write files as UTF-8 without BOM; paths with `[slug]` need `-LiteralPath`.

## Git

- Work on a feature branch, open PRs against `main`. Commit trailer: `Co-authored-by: Copilot App <223556219+Copilot@users.noreply.github.com>`.
