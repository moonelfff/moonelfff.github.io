# Сайт психолога Екатерины Жук - описание проекта

Домен: <https://ekaterinazhuk.ru>. Репозиторий: `moonelfff/moonelfff.github.io`.

## 1. Назначение

Сайт клинического психолога: профиль и подход, пакеты консультаций с ценами, контакты и соцсети, онлайн-тесты. Контент редактируется через админку (JSON + Markdown), без правок кода.

Проект - единое приложение на **Next.js**.

## 2. Технологии

- Next.js 16.4 (App Router, Turbopack, proxy), React 19.3, TypeScript 6, Node.js 24 LTS
- Tailwind CSS 4 (`@tailwindcss/postcss`)
- Supabase (`@supabase/supabase-js`): Postgres и Storage
- MySQL/MariaDB (`mysql2`): альтернативный режим для Beget; изображения в постоянном `MEDIA_ROOT`
- `sharp` - обработка загружаемых изображений
- `marked` - Markdown
- SurveyJS (`survey-core`, `survey-react-ui`, `survey-creator-*`), `zod`, `nanoid` - тесты
- ESLint 10 (`eslint-config-next`)
- Хостинг: Vercel; CI/cron: GitHub Actions
- `AGENTS.md`: версия Next имеет breaking changes, сверяйтесь с `node_modules/next/dist/docs/`

## 3. Структура

```
/
├─ next.config.ts, tsconfig.json, eslint.config.mjs, postcss.config.mjs
├─ .env.example
├─ .github/workflows/   # supabase-keepalive.yml, sync-fallback-photo.yml, supabase-backup.yml, supabase-restore.yml
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
   ├─ assets/     # иконки соцсетей, изображения (noise, запасное фото)
   ├─ styles/     # main.css; app/fonts.ts (next/font)
   └─ utils/      # markdownParser, markdownToHtml
```

Компоненты по Atomic Design: `atom` (Glass, Typography, Spinner, Skeleton) -> `molecule` (Card, ContentBox, Image, Link, Number) -> `organism` (Main, Profile, Pricelist, PriceItem, Contact, Social, Footer, Copyright).

## 4. Модель контента

- `content_json` (`site_content`, в выбранной базе): `fullName`, `info` (`title`, `contentPath`), `professionDescription`, `profileImageUrl`, `ogImageUrl`, `priceHeader`, `blogDescriptionPath`, контакты и `pricelist`.
- Markdown (`site_content`, в выбранной базе, ключи `profile.md`, `blog.md`, `pricelist/*.md`). Текст отображается, только если путь к нему есть в `content_json`.
- Элемент `pricelist`: `title`, `descriptionPath`, `packages[]` (`name`, `price.regular{amount,currency}`, опционально `price.discounted`).

## 5. Принципы работы

1. Главная страница (`page.tsx`, `force-dynamic`) на сервере загружает `getPublicContentBundle()` (кэшированная версия) и передаёт `content` и `markdown` в `HomePage` (`components/organism`) -> `SiteContentProvider` (хуки `useSiteContent`, `useSiteMarkdown`). Клиент контент не запрашивает.
2. **Источник выбирается явно**: `DATA_PROVIDER=supabase|mysql` (`src/lib/dataProvider.ts`), по умолчанию Supabase для существующего Vercel-деплоя. Серверные клиенты — `src/lib/supabase.ts` и ленивый пул `src/lib/mysql.ts`. Нет автоматических переключений или чтения начальных файлов: при недоступности выбранной базы возвращается ошибка. В MySQL используются те же четыре таблицы, JSON хранится в LONGTEXT (UTF-8), записи выполняются параметризованными запросами и транзакциями. Сохранение тарифов с пакетами и тестов заменяет соответствующий набор целиком внутри транзакции: ошибка откатывает изменения.
3. **contentStore**: таблица `site_content` (key/value: `content_json` + ключ на каждый md-путь без ведущего `/`). Сохранение из админки - `upsert` в эту таблицу.
4. **tariffStore**: таблицы `tariffs` и `tariff_packages`; прайс загружается на сервере в `page.tsx` и передаётся через `SiteContentProvider` (без клиентского запроса; `/api/tariffs` остаётся публичным API).
5. **testStore**: таблица `psychological_tests` (slug, `schema_json` SurveyJS, `scoring_json`). Страницы `/tests` и `/tests/[slug]` рендерят опросник (`SurveyRunner`), ответы отправляются в `/api/tests/[slug]/submit`, подсчёт - `scoring.ts` (уровни или группы). Дизайн тестов: стеклянные карточки `Glass`, кнопки `molecule/Button` (вне карточек - стеклянные `glass`/`soft`/`success`, меняется только цвет подложки; внутри карточек - полупрозрачная светлая таблетка `solid`, менять можно только цвет фона), тема SurveyJS - класс `.test-survey` в `main.css`; страница теста проходит этапы «описание → вопросы (прогресс, Назад/Далее, автопереход при >8 вопросов на странице) → результат». Админка тестов (`src/app/admin/tests`) - визуальный редактор: `lib/admin/editable.ts` конвертирует схему и `scoring_json` в редактируемую модель и обратно (подсчёт ссылается на вопросы по внутреннему id, переименование безопасно), `ScoringEditor` (режимы `scale`/`groups`/без подсчёта), `TestSettings`, `QuestionPicker`. Поддерживаются поля подсчёта `positiveValues` (по умолчанию [1,2]) и `topCount` (по умолчанию 2), тип вопроса `rating`. Короткие примеры для проверки: `demo-stress-level` (шкала с уровнями) и `demo-communication-style` (группы) в `supabase/seed/tests.json`.
6. **Начальные данные**: `npm run seed` (`scripts/seed-supabase.mjs`) загружает `supabase/seed/*` в пустые таблицы Supabase; `-- --force` перезаписывает. Перенос действующего сайта в MySQL описан в README.
7. **Изображения** (`POST /api/admin/image`): `profile` (WebP до 2400 px, quality 90) и `og` (JPEG 1200x630); JPEG/PNG/WEBP до 8 МБ. `mediaStorage.ts` загружает в Supabase Storage либо записывает новый файл в `MEDIA_ROOT` без перезаписи. URL пишется в `profileImageUrl`/`ogImageUrl`. В режиме MySQL `/media/[...path]` проверяет путь, расширение и выход через симлинк; отдаёт только поддерживаемые изображения с `nosniff` и immutable-кэшем на год. Каталог должен находиться вне web root и сохраняться между деплоями.
   На Beget он находится внутри приватного каталога сайта, вне `public_html`, чтобы веб-пользователь сайта имел доступ через штатные ACL хостинга.
8. **SEO**: `layout.tsx` формирует metadata, Open Graph, JSON-LD (Person, Service, WebPage); также `robots.txt` (закрыты `/admin`, `/api/`), `sitemap.xml`, `llms.txt`, `site.webmanifest`. Подключены GTM и Яндекс.Метрика.

Порядок тестов в админке меняется стрелками вверх/вниз или перетаскиванием на компьютере, как у тарифов. После нажатия «Сохранить» порядок записывается в `psychological_tests.sort_order` и используется в публичном списке тестов; «Отменить» возвращает сохранённый порядок.

### Оптимизация загрузки

Раздел тестов пока не запущен для поисковых систем: `/tests` и все страницы тестов получают `noindex, nofollow` из `src/app/tests/layout.tsx` и отсутствуют в sitemap. Индексацию нужно включить одновременно с добавлением ссылки на тесты на главную. Обход в robots.txt остаётся разрешённым, чтобы поисковики могли прочитать `noindex`. Уже проиндексированные страницы исчезнут из поиска после повторного обхода, не мгновенно.

- Главная страница и её статичные блоки рендерятся на сервере; клиентскими остаются интерактивные кнопки и подсказки. Общий клиентский провайдер контента больше не нужен.
- Настройки сайта читаются отдельно от Markdown: layout и страница теста используют кэшированный `getPublicSiteContent`, главная — полный `getPublicContentBundle`. Оба кэша используют тег контента и сбрасываются после сохранения в админке.
- Список тестов использует компактный кэш `getPublicTestSummaries`: без настроек подсчёта и без схем в результате. При холодном кэше схемы читаются только для вычисления числа вопросов; отдельного счётчика в базе нет.
- Отдельный тест читается по `slug` через `getPublicTestBySlug`, без `scoring_json`. Обработчик результатов использует отдельное серверное чтение `getTestBySlug`. Все эти кэши обновляются по тегу тестов.
- Экран описания теста не загружает SurveyJS. После «Начать» React lazy/Suspense подгружает `TestSession` вместе с движком и CSS опросника. Повторное прохождение создаёт новую сессию; сбой загрузки показывает страницу ошибки с перезагрузкой.
- Mulish и Play загружаются по используемым начертаниям без массового preload, с `display: swap`. Страницы с данными остаются динамическими при любом провайдере; сборка не требует доступа к базе.

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

### Структура интерфейса админки (`src/app/admin`)

- `layout.tsx` - светлая тема в палитре сайта (`soft-linnen`, `platinum`, `alabaster-grey`, `dusty-grape`) и `ToastProvider`; `admin.css` - анимация тостов.
- `src/components/admin/` - атомарный дизайн, как на главной: `atom` (`AdminButton`, `TextInput`, `TextArea`, `Select`, `Tip`, `Hint`, `Panel`), `molecule` (`Field`, `Checkbox`, `SectionTitle`, `AdminCard`, `Collapsible`, `RowActions`, `MarkdownEditor`, `ImageUpload` с пропом `aspectClass` - пропорции как на сайте: профиль 4:5, OG 1200×630, `AdminLoadError`, `AdminPageSkeleton`, `ScoringModePicker`, `QuestionPicker`), `organism` (`AdminShell`, `AdminHeader`, `AdminSaveBar`, `ContentAdminPage`, `TestsAdminPage`, `LoginForm`, карточки сайта/тарифов/тестов/подсчёта), `providers/ToastProvider` (`useToast()`). `Field` и `Checkbox` принимают проп `tip`. Иконки - `src/assets/icons/admin.tsx`.
- `src/lib/admin/` - `draft` (`updateDraft`, `useSavedSnapshot`), `api` (`fetchAdmin`, `sendJson`; при 401 редирект на логин), `useAdminLoader`, `useContentImageUpload`, `content`, `useDragSort`, `tariffs`, `validation`, `moveItem`, `scoringRanges`, `editable` (модель и `buildTestsPayload`).
- Страницы `src/app/admin/**/page.tsx` тонкие: только рендерят организм.

## 6. Кэширование

Публичные чтения выбранной базы кэшируются через `unstable_cache` с тегами (`src/lib/cache.ts`: `site-content`, `tariffs`, `tests`): `getPublicContentBundle`, `getMarkdownByPath`, `getPublicTariffBundle`, `getPublicTestBundle` (и `getTestBySlug`). Админка читает данные напрямую (без кэша), чтобы всегда видеть актуальное состояние. Любое сохранение в админке (`saveContentBundle`, `saveTariffs`, `saveTests`, загрузка фото) вызывает `invalidateCache(tag)`, и следующий запрос читает свежие данные. Страховочный TTL - 1 час. Публичные `/api/content`, `/api/tariffs`, `/api/markdown` дополнительно отдают `Cache-Control: s-maxage=60, stale-while-revalidate=300` (CDN), поэтому на этих эндпоинтах правка видна в течение ~минуты; keep-alive workflow всё равно обращается к БД, так как реже TTL. Страницы остаются `force-dynamic`, чтобы сборка не требовала ключей Supabase. Новые публичные чтения добавляйте через такой же кэш, а в админских маршрутах используйте некэшированные функции.

## 7. Переменные окружения

См. `.env.example` и README: `DATA_PROVIDER`, `ADMIN_PASSWORD`, `ADMIN_SESSION_TOKEN`, `NEXT_PUBLIC_SURVEYJS_LICENSE_KEY`; для Supabase — `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET`; для MySQL — `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`, опциональный `MYSQL_SSL_CA` и постоянный каталог `MEDIA_ROOT`.

## 8. Запуск и сборка

```bash
npm ci
npm run dev      # http://127.0.0.1:3020
npm run build    # next build
npm start        # next start (порт 3020; prestart запускает build)
npm run lint
```

## 9. Деплой и инфраструктура

- Хостинг - Vercel, домен `ekaterinazhuk.ru` через DNS (A `76.76.21.21`, CNAME `www` -> `cname.vercel-dns.com`). Пошаговая инструкция - в README.
- GitHub Pages не используется: статический экспорт невозможен из-за API и proxy.
- `.github/workflows/supabase-keepalive.yml`: cron раз в 3 дня + ручной запуск, запрашивает `/api/content` и `/api/tariffs`, чтобы Supabase Free не ставил проект на паузу (7 дней без активности). URL - переменная репозитория `SITE_URL` (по умолчанию `https://ekaterinazhuk.ru`).
- `.github/workflows/sync-fallback-photo.yml`: раз в неделю + ручной запуск; скачивает текущее фото профиля из Supabase и при изменении коммитит его в `public/photo.webp` и `src/assets/images/photo.webp` (запасное фото для SEO/OG).
- `.github/workflows/supabase-backup.yml`: раз в сутки + ручной запуск (`force`); отпечаток данных (sha256 по файлам выгрузки без manifest.json) проверяется через `actions/cache` с ключом `supabase-backup-<hash>`: попадание в кэш = данные уже сохранялись, архив не создаётся; `scripts/backup-supabase.mjs` находит все таблицы `public` через OpenAPI PostgREST и все бакеты Storage (универсально, без списка таблиц в коде), архив шифруется gpg (`BACKUP_PASSPHRASE`) и сохраняется артефактом на 90 дней только при изменениях. Секреты: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `BACKUP_PASSPHRASE`. Восстановление: `scripts/restore-supabase.mjs` (upsert по PK в порядке FK + загрузка файлов). Инструкция в README.
- `.github/workflows/supabase-restore.yml`: только ручной запуск (`run_id` пусто = самый свежий артефакт `supabase-backup-*`, `confirm=RESTORE`); сначала сохраняет снимок текущих данных (`pre-restore-*`), затем скачивает и расшифровывает бэкап и запускает `scripts/restore-supabase.mjs` (только добавляет/обновляет, не удаляет).
- Supabase: SQL из `supabase/`, публичный Storage-бакет, `service_role` только на сервере.
- Для Beget предусмотрен режим MySQL и локальных изображений; создание базы, перенос и переключение боевого сайта выполняются отдельно по инструкции README. Workflow Supabase не резервирует MySQL и `MEDIA_ROOT`; отдельное расписание и зашифрованное внешнее хранение копий нужно настроить до переноса рабочего сайта.
- Ответы и результаты психологических тестов сейчас не сохраняются. Переход на MySQL сам по себе не обеспечивает соответствие требованиям к персональным данным: для такого расширения нужны отдельное проектирование, правовая оценка и проверка хостинга.
- `SITE_PREVIEW=1` отключает GTM/Метрику и JSON-LD, выставляет метатеги `noindex, nofollow`. `npm run mysql:demo -- --confirm <MYSQL_DATABASE>` заполняет только пустую тестовую базу и отдельный каталог медиа демонстрационными данными без обращения к Supabase. Для публичного HTTP-стенда Passenger отдельно закрывает админку и добавляет запрет индексации на уровне HTTP/robots.txt.

## 10. Оформление

Шрифты Mulish и Play (локальные subset woff2 в `src/assets/fonts`, подключены через `next/font/local` в `src/app/fonts.ts`, preload только у Mulish); стиль «glass», фон `platinum`, noise-текстура, адаптивные отступы Tailwind.

## 11. Известные замечания

- `npm run lint` показывает одно предупреждение: `window.location.assign` в `lib/admin/api.ts` (намеренная жёсткая навигация на логин при 401). `<img>` пикселя Метрики в `layout.tsx` помечен eslint-disable.
- Для устойчивости рекомендуется периодически выгружать данные Supabase; начальная копия контента лежит в `supabase/seed`.
