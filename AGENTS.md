<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project context

Website of clinical psychologist Ekaterina Zhuk (ekaterinazhuk.ru): Next.js App Router, React 19, Tailwind 4, Supabase, SurveyJS. Full description: `PROJECT.md`; setup and deploy: `README.md`. User communicates in Russian; reply in Russian, concisely.

## Rules

- SEO: основной адрес сайта — `https://ekaterinazhuk.ru` без `www`. Canonical, sitemap и структурированные данные должны использовать его; домен `www` должен постоянно перенаправляться на основной через настройки Vercel. Не добавлять обратный редирект в приложение, пока Vercel перенаправляет основной домен на `www`: это создаст цикл.
- Пока сохраняем одну страницу услуг и не расширяем блок квалификации. При добавлении новых индексируемых страниц задавать собственные title, description, canonical и соответствующую странице разметку WebPage, не наследовать canonical главной. Оценивать скорость по LCP, INP, CLS и мобильным замерам, не выдавать лабораторные результаты за полевые.

- Раздел `/tests` и все `/tests/[slug]` должны оставаться `noindex` до появления ссылки на тесты на главной странице. При добавлении этой ссылки одновременно включить индексацию: обновить metadata в `src/app/tests/layout.tsx`, проверить robots.txt и добавить публичные страницы тестов в sitemap. До этого не добавлять тесты в sitemap. Не запрещать их обход в robots.txt: поисковики должны видеть `noindex`.

- **Choose the runtime data source explicitly** with `DATA_PROVIDER=supabase|mysql` (default: Supabase for Vercel). Never automatically fall back between providers or to seed files. MySQL uses the same four tables and persistent filesystem images in `MEDIA_ROOT`, served by `/media/[...path]`; Supabase uses Storage. `supabase/seed/` is only input for `npm run seed`.
- Server code uses `src/lib/supabase.ts` or `src/lib/mysql.ts` (server only; never expose database credentials to the client).
- Pages that read either database must be `export const dynamic = "force-dynamic"` so the build works without credentials.
- Public reads use cached `getPublic*` functions (`unstable_cache` + tags, `src/lib/cache.ts`); admin routes use uncached `get*Bundle`. Any new save path must call `invalidateCache(tag)`.
- Admin auth: cookie + `src/proxy.ts` + `src/lib/adminSession.ts`. `/admin` and `/api/admin/*` are protected.
- UI tooltips sitewide: use `src/components/atom/Tooltip` instead of native HTML `title` attributes; it uses a viewport-aware native Popover with the purple glass style in `.tip-bubble`. Admin `Tip` is the compact "?" trigger for this shared component.
- Admin UI: atomic design like the home page - `src/components/admin/{atom,molecule,organism,providers}` (one component per file, default exports, `AdminShell` with sticky save bar, `useToast()` notifications), helpers/hooks in `src/lib/admin/`, `src/app/admin/**/page.tsx` stay thin and only render an organism. Mobile-first (44px targets, 16px inputs on mobile), site palette only (`soft-linnen`, `platinum`, `alabaster-grey`, `dusty-grape`). Report results via toasts, not inline text. Explain non-obvious settings with a plain-language `tip` on `Field`/`Checkbox`/`SectionTitle`; keep admin copy simple, in Russian, with no technical jargon (say «адрес (slug)», «служебные параметры», not «SurveyJS JSON»). Image previews must use the same aspect ratio as the site (`ImageUpload` `aspectClass`).
- Hosting: Vercel + Supabase; Beget migration uses Node.js + MySQL + persistent media (GitHub Pages is not supported). Existing Supabase workflows remain for Vercel and do not back up MySQL/media. Configure separate scheduled encrypted backups for Beget before switching production.
- Test deployments use `SITE_PREVIEW=1` (no analytics/structured data, noindex). `mysql:demo` only seeds an empty, explicitly confirmed MySQL database and media directory. On Beget, persistent media must be inside the private site directory but outside `public_html` so the site's web-user ACL permits access. Never disable Secure cookies for HTTP testing; block remote admin at the test server until HTTPS is ready.

- Кнопки: вне карточек - стеклянные `glass`/`soft`/`success` (как чёрная кнопка на главной, меняется только цвет подложки); внутри карточек - только `variant="solid"` (полупрозрачная светлая таблетка со стрелкой), менять можно лишь цвет фона.
- Главный источник истины для UI — компоненты главной страницы, их стили и анимации, а также принятый в них формат кода. Перед созданием или изменением компонента находи подходящие существующие значения отступов, размеров, интервалов и типографики и переиспользуй их для единообразия.
- Не рисуй иконки самостоятельно. Используй иконки из уже установленной библиотеки; если подходящей библиотеки нет, сначала предложи её установить.
- Для кастомных стилей, которых нет в Tailwind, следуй структуре и паттернам существующих стилей в `src/styles/main.css`.
- Для отображения текста используй `Typography` с подходящими параметрами, а не дублируй типографические стили вручную.
- Максимально переиспользуй компоненты. Если существующий компонент можно адаптировать настройками или пропсами, расширь его вместо создания узкоспециализированного аналога. Новые компоненты проектируй для повторного применения.
- Строго следуй атомарному дизайну: компоненты размещай в подходящем слое `atom`, `molecule`, `organism` или `providers`; при изменении компонента, который нарушает этот принцип, исправляй его структуру в рамках задачи.

## Environment

- Secrets live in `.env.local` (gitignored). A shared copy is at `C:\Users\mrsav\.copilot\secrets\.env.local`; in a new worktree copy it to the repo root. Never print, log or commit its values.
- Dev server: `npm run dev` on `127.0.0.1:3020`; restart after env changes.
- Checks: `npx tsc --noEmit`, `npm run build` (`npm run lint` has pre-existing `no-explicit-any` errors in `src/types/global.d.ts`).
- Windows PowerShell 5.1: write files as UTF-8 without BOM; paths with `[slug]` need `-LiteralPath`.

## Git

- Work on a feature branch, open PRs against `main`. Commit trailer: `Co-authored-by: Copilot App <223556219+Copilot@users.noreply.github.com>`.
