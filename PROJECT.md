# Сайт психолога Екатерины Жук - описание проекта

Домен: <https://ekaterinazhuk.ru>. Репозиторий: `moonelfff/moonelfff.github.io`.

## 1. Назначение

Сайт клинического психолога: профиль и подход, пакеты консультаций с ценами, контакты и соцсети, онлайн-тесты. Контент редактируется через админку (JSON + Markdown), без правок кода.

Проект - единое приложение на **Next.js** (ранее существовавшая Vite-версия для GitHub Pages удалена).

## 2. Технологии

- Next.js 16.4 (App Router, Turbopack, proxy), React 19.3, TypeScript 5
- Tailwind CSS 4 (`@tailwindcss/postcss`)
- Supabase (`@supabase/supabase-js`): Postgres и Storage
- `sharp` - обработка загружаемых изображений
- `marked` - Markdown
- SurveyJS (`survey-core`, `survey-react-ui`, `survey-creator-*`), `zod`, `nanoid` - тесты
- ESLint 9 (`eslint-config-next`)
- Хостинг: Vercel; CI/cron: GitHub Actions
- `AGENTS.md`: версия Next имеет breaking changes, сверяйтесь с `node_modules/next/dist/docs/`

## 3. Структура

```
/
├─ next.config.ts, tsconfig.json, eslint.config.mjs, postcss.config.mjs
├─ .env.example
├─ .github/workflows/supabase-keepalive.yml
├─ public/        # шрифты, favicons,
│                 # robots.txt, sitemap.xml, llms.txt, site.webmanifest
├─ supabase/      # site_content.sql, tariffs.sql, tests.sql
│  └─ seed/       # content.json, markdown/**, tests.json (для npm run seed)
├─ scripts/       # seed-supabase.mjs
└─ src/
   ├─ app/        # layout, page; admin/ (+login, tests); tests/ и tests/[slug];
   │              # api/{content,markdown,tariffs,tests/[slug](/submit),admin/*}
   ├─ components/ # atom / molecule / organism, providers/SiteContentProvider, tests/SurveyRunner
   ├─ lib/        # adminAuth, adminSession, slug, contentStore, tariffStore, supabase, contentTypes, tests/{testStore,scoring,types}
   ├─ assets/     # шрифты, иконки, изображения
   ├─ styles/     # main.css, fonts.css
   └─ utils/      # markdownParser, markdownToHtml
```

Компоненты по Atomic Design: `atom` (Glass, Icon, Typography) -> `molecule` (Card, ContentBox, Image, Link, Number) -> `organism` (Main, Profile, Pricelist, PriceItem, Contact, Social, Footer, Copyright).

## 4. Модель контента

- `content_json` (Supabase, `site_content`): `fullName`, `info` (`title`, `contentPath`), `professionDescription`, `profileImageUrl`, `ogImageUrl`, `priceHeader`, `blogDescriptionPath`, контакты и `pricelist`.
- Markdown (Supabase, `site_content`, ключи `profile.md`, `blog.md`, `pricelist/*.md`). Текст отображается, только если путь к нему есть в `content_json`.
- Элемент `pricelist`: `title`, `descriptionPath`, `packages[]` (`name`, `price.regular{amount,currency}`, опционально `price.discounted`).

## 5. Принципы работы

1. Главная страница (`page.tsx`, `force-dynamic`) на сервере загружает `getContentBundle()` и передаёт `content` и `markdown` в `App` -> `SiteContentProvider` (хуки `useSiteContent`, `useSiteMarkdown`). Клиент контент не запрашивает.
2. **Supabase - единственный источник данных**, локальные файлы и фолбэки не используются. Без `NEXT_PUBLIC_SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` или без загруженных данных код бросает понятную ошибку (подсказка: `npm run seed`). Общий клиент - `src/lib/supabase.ts`.
3. **contentStore**: таблица `site_content` (key/value: `content_json` + ключ на каждый md-путь без ведущего `/`). Сохранение из админки - `upsert` в эту таблицу.
4. **tariffStore**: таблицы `tariffs` и `tariff_packages`; прайс на странице грузится из `/api/tariffs`.
5. **testStore**: таблица `psychological_tests` (slug, `schema_json` SurveyJS, `scoring_json`). Страницы `/tests` и `/tests/[slug]` рендерят опросник (`SurveyRunner`), ответы отправляются в `/api/tests/[slug]/submit`, подсчёт - `scoring.ts` (уровни или группы).
6. **Начальные данные**: `npm run seed` (`scripts/seed-supabase.mjs`) загружает `supabase/seed/*` в пустые таблицы; `-- --force` перезаписывает.7. **Изображения** (`POST /api/admin/image`): `profile` (WebP до 1600 px) и `og` (JPEG 1200x630); JPEG/PNG/WEBP до 8 МБ; загрузка в бакет Supabase (`SUPABASE_STORAGE_BUCKET`, по умолчанию `site-images`); URL пишется в `profileImageUrl`/`ogImageUrl`.
8. **SEO**: `layout.tsx` формирует metadata, Open Graph, JSON-LD (Person, Service, WebPage); также `robots.txt` (закрыты `/admin`, `/api/`), `sitemap.xml`, `llms.txt`, `site.webmanifest`. Подключены GTM и Яндекс.Метрика.

### API

| Маршрут | Назначение |
|---|---|
| `GET /api/content`, `/api/markdown`, `/api/tariffs` | публичные данные |
| `GET /api/tests/[slug]`, `POST /api/tests/[slug]/submit` | тест и отправка ответов |
| `POST /api/admin/login`, `/logout` | вход и выход |
| `GET/PUT /api/admin/content`, `/tariffs`, `/tests` | управление данными |
| `POST /api/admin/image` | загрузка изображений |

### Админка и безопасность

- `/admin`, `/admin/login`, `/admin/tests`; пароль - `ADMIN_PASSWORD`.
- После входа ставится cookie `admin_session` (httpOnly, sameSite=lax, secure в production, 8 часов); значение - `ADMIN_SESSION_TOKEN` или `token:<пароль>`.
- `src/proxy.ts` (бывший middleware; matcher `/admin/*`, `/api/admin/*`): без валидной cookie (SHA-256 токен, пароль в cookie не хранится) API отвечает `401`, страницы редиректят на логин.
- Рекомендуется задавать случайный `ADMIN_SESSION_TOKEN`; `SUPABASE_SERVICE_ROLE_KEY` - только на сервере.

## 6. Переменные окружения

См. `.env.example` и README: `ADMIN_PASSWORD`, `ADMIN_SESSION_TOKEN`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET`, `NEXT_PUBLIC_SURVEYJS_LICENSE_KEY`.

## 7. Запуск и сборка

```bash
npm ci
npm run dev      # http://127.0.0.1:3020
npm run build    # next build
npm start        # next start (порт 3020; prestart запускает build)
npm run lint
```

## 8. Деплой и инфраструктура

- Хостинг - Vercel, домен `ekaterinazhuk.ru` через DNS (A `76.76.21.21`, CNAME `www` -> `cname.vercel-dns.com`). Пошаговая инструкция - в README.
- GitHub Pages и workflow `deploy.yml` удалены: статический экспорт невозможен из-за API и proxy.
- `.github/workflows/supabase-keepalive.yml`: cron раз в 3 дня + ручной запуск, запрашивает `/api/content` и `/api/tariffs`, чтобы Supabase Free не ставил проект на паузу (7 дней без активности). URL - переменная репозитория `SITE_URL` (по умолчанию `https://ekaterinazhuk.ru`).
- Supabase: SQL из `supabase/`, публичный Storage-бакет, `service_role` только на сервере.

## 9. Оформление

Шрифты Mulish и Play (локальные subset woff/woff2 в `public/fonts`, `fonts.css`); стиль «glass», фон `platinum`, noise-текстура, адаптивные отступы Tailwind.

## 10. Известные замечания

- `npm run lint` показывает ошибки `no-explicit-any` в `src/types/global.d.ts` и предупреждения `no-img-element`.
- Для устойчивости рекомендуется периодически выгружать данные Supabase; начальная копия контента лежит в `supabase/seed`.
