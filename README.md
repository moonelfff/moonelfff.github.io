# ekaterinazhuk.ru

Сайт клинического психолога на Next.js с админкой для редактирования контента. Подробное описание архитектуры - в [PROJECT.md](PROJECT.md).

## Запуск

```bash
npm ci
cp .env.example .env.local   # задайте ADMIN_PASSWORD и ключи Supabase
npm run seed                # однократно: загрузить начальные данные в Supabase
npm run dev                  # http://127.0.0.1:3020
npm run build && npm start   # продакшн-режим (порт 3020)
```

## Переменные окружения

| Переменная | Описание |
|---|---|
| `ADMIN_PASSWORD` | пароль админки (обязательно) |
| `ADMIN_SESSION_TOKEN` | случайная строка для сессионной cookie (рекомендуется в продакшне) |
| `NEXT_PUBLIC_SUPABASE_URL` | URL проекта Supabase (обязательно) |
| `SUPABASE_SERVICE_ROLE_KEY` | серверный ключ Supabase (обязательно, никогда не публиковать) |
| `SUPABASE_STORAGE_BUCKET` | бакет для изображений, по умолчанию `site-images` |
| `NEXT_PUBLIC_SURVEYJS_LICENSE_KEY` | лицензионный ключ SurveyJS (опционально) |

## Админка

1. Откройте `/admin/login` и введите `ADMIN_PASSWORD`.
2. `/admin` - редактирование общего контента (JSON), markdown-текстов, тарифов и загрузка изображений (профиль, OG).
3. `/admin/tests` - редактирование психологических тестов.

## Где хранятся данные

Единственный источник данных - **Supabase**. Локальные файлы во время работы не читаются; если переменные Supabase не заданы или данные не загружены, страницы возвращают понятную ошибку.

- `site_content`: ключ `content_json` (общая информация, контакты) и по ключу на каждый markdown (`profile.md`, `blog.md`, `pricelist/*.md`).
- `tariffs`, `tariff_packages`: прайс (страница читает `/api/tariffs`).
- `psychological_tests`: тесты.
- Storage-бакет: изображения.

Каталог `supabase/seed/` содержит только начальные данные для `npm run seed` (`content.json`, `markdown/**`, `tests.json`).

### Настройка Supabase

1. Выполните в SQL Editor файлы `supabase/site_content.sql`, `supabase/tariffs.sql`, `supabase/tests.sql`.
2. Создайте **публичный** Storage-бакет (по умолчанию `site-images`).
3. Задайте `NEXT_PUBLIC_SUPABASE_URL` и `SUPABASE_SERVICE_ROLE_KEY` в `.env.local` (и в Vercel).
4. Загрузите начальные данные: `npm run seed`. Скрипт заполняет только пустые таблицы; `npm run seed -- --force` перезаписывает данные.
Free-план Supabase ставит проект на паузу после 7 дней без запросов к БД. Эту проблему решает workflow `.github/workflows/supabase-keepalive.yml` (см. ниже).

## Публикация (Vercel + домен ekaterinazhuk.ru)

GitHub Pages больше **не подходит**: сайт использует серверные API и middleware. Рекомендуемый хостинг - Vercel (бесплатный план достаточен).

1. На [vercel.com](https://vercel.com) создайте проект из репозитория (Framework: Next.js, Root Directory: корень репозитория, Production Branch: `main`).
2. В Settings -> Environment Variables добавьте переменные из таблицы выше (для Production).
3. Settings -> Domains: добавьте `ekaterinazhuk.ru` и `www.ekaterinazhuk.ru`.
4. У регистратора домена настройте DNS (актуальные значения покажет Vercel):
   - `A` запись `@` -> `76.76.21.21`
   - `CNAME` запись `www` -> `cname.vercel-dns.com`
   - удалите старые записи, указывающие на GitHub Pages (`185.199.108-111.153`).
5. В GitHub: Settings -> Pages -> отключите публикацию (Source: None), чтобы старый домен не конфликтовал. Файл `CNAME` в репозитории больше не нужен.
6. Проверьте сертификат (выпускается автоматически), `/admin/login`, `/api/content`.

### Keep-alive для Supabase

Workflow `supabase-keepalive.yml` раз в 3 дня запрашивает `/api/content` и `/api/tariffs` (оба читают БД). Адрес берётся из переменной репозитория `SITE_URL` (Settings -> Secrets and variables -> Actions -> Variables), по умолчанию `https://ekaterinazhuk.ru`. Можно запустить вручную из вкладки Actions. GitHub отключает cron-workflow в репозиториях без коммитов более 60 дней - тогда включите его заново.

## Редактирование содержимого

> Если сайт сломался после изменений, проверьте, не потерялась ли где-то скобка, кавычка или запятая.

Весь контент хранится в Supabase и редактируется через `/admin`. Начальные значения лежат в [supabase/seed](supabase/seed) (изменение этих файлов влияет на сайт только после `npm run seed -- --force`).

### Общий контент (`content_json`)

У каждого значения есть свой ключ, например `"fullName": "Екатерина Жук"`. Любое значение можно менять; новые типы значений требуют изменений в коде.

> Удалять значения (за исключением элементов списков) нельзя!

Пример структуры элемента прайса (в `content_json`; актуальный прайс на сайте берётся из таблиц `tariffs`):

```json
{
  "descriptionPath": "/pricelist/имя_файла_с_описанием.md",
  "packages": [
    {
      "name": "1 встреча",
      "price": { "regular": { "amount": 3333, "currency": "₽" } }
    },
    {
      "name": "4 встречи",
      "price": {
        "regular": { "amount": 9999, "currency": "₽" },
        "discounted": { "amount": 8888, "currency": "₽" }
      }
    }
  ],
  "title": "Название продукта"
}
```

Комментарии в JSON недопустимы. `discounted` опционален, пакетов должно быть минимум один.

### Markdown

[Шпаргалка по Markdown](https://gist.github.com/fomvasss/8dd8cd7f88c67a4e3727f9d39224a84c). Поддерживаются заголовки, обычный текст и маркированные списки. Markdown отображается, только если путь к нему указан в общем контенте.
