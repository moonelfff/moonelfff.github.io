# Сайт-визитка психолога Екатерины Жук — описание проекта

Домен: <https://ekaterinazhuk.ru>. Репозиторий: `moonelfff/moonelfff.github.io`.

## 1. Назначение

Одностраничный сайт клинического психолога: профиль и подход, пакеты консультаций с ценами, контакты и соцсети. Весь контент редактируемый (JSON + Markdown), без правок кода.

В репозитории **два независимых приложения**:

| Приложение | Расположение | Назначение |
|---|---|---|
| Статический сайт (Vite + React) | корень (`src/`, `public/`) | Продакшн на GitHub Pages |
| Next.js-версия с админкой | `next/` | Миграция: SSR/API, админка, Supabase, деплой (напр. Vercel) |

## 2. Технологии

**Корневой сайт (Vite)**
- React 19, TypeScript ~5.9, Vite 7, `@vitejs/plugin-react`
- Tailwind CSS 4 (`@tailwindcss/vite`), `tailwindcss-patch` + `unplugin-tailwindcss-mangle` (минификация/мангл классов; `npx tw-patch extract` в сборке; `.tw-patch/tw-class-list.json`)
- `@responsive-image/*` — адаптивные изображения
- `marked` — парсинг Markdown
- ESLint 9 (+react-hooks, react-refresh), Prettier (+tailwind plugin)
- Алиас `@` → `src`

**Next-версия (`next/`)**
- Next.js 16.3 (App Router, Turbopack), React 19.2, TypeScript 5, Tailwind 4 (`@tailwindcss/postcss`)
- `@supabase/supabase-js` — БД и Storage
- `sharp` — обработка загружаемых изображений
- `marked`, ESLint (`eslint-config-next`)
- Dev/start: `127.0.0.1:3020` (в README указан 3010 — расхождение)
- `AGENTS.md` предупреждает: версия Next имеет breaking changes, сверяйтесь с `node_modules/next/dist/docs/`.

## 3. Структура

```
/
├─ index.html, vite.config.ts, tsconfig*.json, eslint.config.js, .prettierrc
├─ src/                    # Vite-приложение
│  ├─ main.tsx, App.tsx
│  ├─ assets/data/content.json   # основной контент (+ content.ts — типы/экспорт)
│  ├─ assets/{fonts,icons,images}
│  ├─ components/{atom,molecule,organism}
│  ├─ styles/{main.css,fonts.css}
│  └─ utils/markdownParser.tsx
├─ public/                 # статика: profile.md, blog.md, pricelist/*.md,
│                          # шрифты, favicons, robots.txt, sitemap.xml,
│                          # llms.txt, site.webmanifest
├─ .github/workflows/deploy.yml
└─ next/
   ├─ middleware.ts        # защита /admin и /api/admin
   ├─ next.config.ts       # remotePatterns для Supabase Storage
   ├─ supabase/{site_content,tariffs}.sql
   └─ src/
      ├─ app/              # layout, page, admin/, api/
      ├─ components/       # те же atom/molecule/organism + providers/SiteContentProvider
      ├─ lib/{adminAuth,contentStore,tariffStore}.ts
      └─ utils/{fetchMarkdown,markdownParser}
```

Компоненты организованы по Atomic Design: `atom` (Glass, Icon, Typography) → `molecule` (Card, ContentBox, Image, Link, Number) → `organism` (Main, Profile, Pricelist, PriceItem, Contact, Social, Footer, Copyright).

## 4. Модель контента

- **`content.json`** — короткие данные: `fullName`, `info` (`title`, `contentPath`), `professionDescription`, `profileImageUrl`, `ogImageUrl`, `priceHeader`, `blogDescriptionPath`, контакты/соцсети и `pricelist`.
- **Markdown** в `public/` — длинные тексты: `profile.md`, `blog.md`, `pricelist/*.md` (одноразовая консультация, индивидуальная и парная терапия, диагностика, карта личности). Поддерживаются заголовки, абзацы, маркированные списки.
- Файл отображается только если путь к нему указан в `content.json`.
- Элемент `pricelist`: `title`, `descriptionPath`, `packages[]` (`name`, `price.regular{amount,currency}`, опционально `price.discounted`). Порядок в файле = порядок на сайте.
- Ключи в `content.json` удалять нельзя (кроме элементов списков); комментарии в JSON недопустимы.

## 5. Принципы работы

### Vite-сайт
Чистый клиентский SPA: `main.tsx` рендерит `App` → `Main` + `Footer`. Контент импортируется из JSON, Markdown загружается и разбирается `markdownParser`. `npm run build` = `tw-patch extract` → `tsc -b` → `vite build` → `dist/`.

### Next-версия
1. Главная страница рендерит тот же `App`. `SiteContentProvider` стартует с `content.json` из бандла и затем запрашивает `/api/content` (`no-store`), подменяя данные актуальными.
2. **Хранилище (`contentStore.ts`)** — двойной режим:
   - Supabase настроен (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`): данные из таблицы `site_content` (key/value; ключ `content_json` + по ключу на каждый md-путь). Недостающий markdown берётся из локальных файлов.
   - Иначе: чтение/запись локальных файлов (`content.json`, `public/*.md`). На serverless-хостингах запись в ФС не сохраняется, поэтому для продакшна нужен Supabase.
   - Сохранение: сначала Supabase, при неудаче — локально.
3. **Тарифы (`tariffStore.ts`)** — таблицы `tariffs` и `tariff_packages` (uuid, slug, `description_md`, `is_active`, `sort_order`, цены `price_regular`/`price_discounted`, валюта ₽). Если таблиц нет/пусто — «legacy»-тарифы строятся из `content.json`; возможен посев в Supabase из legacy-данных.
4. **Изображения** (`/api/admin/image`): типы `profile` и `og`; JPEG/PNG/WEBP до 8 МБ; `sharp` приводит профиль к WebP шириной ≤1600, OG — к JPEG 1200×630; загрузка в бакет Supabase Storage (`SUPABASE_STORAGE_BUCKET`, по умолчанию `site-images`), публичный URL записывается в `profileImageUrl`/`ogImageUrl`.

### API
| Маршрут | Назначение |
|---|---|
| `GET /api/content` | публичный контент |
| `GET /api/markdown` | markdown по пути |
| `GET /api/tariffs` | публичные тарифы |
| `POST /api/admin/login`, `/logout` | вход/выход |
| `GET/PUT /api/admin/content` | чтение/сохранение контента |
| `GET/PUT /api/admin/tariffs` | управление тарифами |
| `POST /api/admin/image` | загрузка изображений |

### Админка и безопасность
- `/admin` (UI) и `/admin/login`; пароль — `ADMIN_PASSWORD`.
- После входа ставится cookie `admin_session` (httpOnly, sameSite=lax, secure в production, 8 часов). Значение — `ADMIN_SESSION_TOKEN` либо `token:<пароль>`.
- `middleware.ts` пропускает только запросы с верным cookie: API → `401`, страницы → редирект на логин.
- Замечания: при отсутствии `ADMIN_SESSION_TOKEN` токен выводится из пароля (рекомендуется задавать случайный токен); `service_role`-ключ Supabase использовать только на сервере.

## 6. Переменные окружения (`next/.env.local`)

| Переменная | Описание |
|---|---|
| `ADMIN_PASSWORD` | пароль админки |
| `ADMIN_SESSION_TOKEN` | (опц.) значение сессионной cookie |
| `NEXT_PUBLIC_SUPABASE_URL` | URL проекта Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | серверный ключ |
| `SUPABASE_STORAGE_BUCKET` | (опц.) бакет, по умолчанию `site-images` |

## 7. Запуск и сборка

```bash
# Vite-сайт (корень)
npm ci
npm run dev       # разработка
npm run build     # сборка в dist/
npm run lint

# Next-версия
cd next
npm ci
npm run dev       # http://127.0.0.1:3020
npm run build && npm start
```

Supabase: выполнить `next/supabase/site_content.sql` и `next/supabase/tariffs.sql` (создают таблицы, триггер `updated_at`, права `service_role`); создать публичный бакет для изображений.

## 8. Деплой

GitHub Actions (`.github/workflows/deploy.yml`): при push в `main` → `npm ci` → `npm run build` → запись `CNAME` (`ekaterinazhuk.ru`) в `dist/` → публикация на GitHub Pages. Деплоится только корневое Vite-приложение; `next/` деплоится отдельно (например, Vercel).

## 9. SEO и AI-доступность

`robots.txt`, `sitemap.xml`, `site.webmanifest`, favicons, OG-изображение (`ogImageUrl`), `llms.txt` (ключевые страницы для LLM-агентов), публичные `.md`-файлы с текстами.

## 10. Типографика и оформление

Шрифты Mulish (все начертания) и Play — локальные subset-файлы woff/woff2 (`fonts.css`); стиль «glass» (компонент `Glass`), фон `platinum`, noise-текстура, адаптивные отступы Tailwind (`md/xl/2xl`).

## 11. Рекомендации по редактированию

После правок JSON/Markdown проверьте скобки, кавычки и запятые. Для новой позиции прайса добавьте объект в `pricelist` и md-файл в `public/pricelist/`. Новые типы полей требуют изменений в коде.
