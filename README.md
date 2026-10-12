# ekaterinazhuk.ru

Сайт клинического психолога на Next.js с админкой для редактирования контента. Подробное описание архитектуры - в [PROJECT.md](PROJECT.md).

## Запуск

```bash
npm ci
cp .env.example .env.local   # задайте ADMIN_PASSWORD
npm run dev                  # http://127.0.0.1:3020
npm run build && npm start   # продакшн-режим (порт 3020)
```

## Переменные окружения

| Переменная | Описание |
|---|---|
| `ADMIN_PASSWORD` | пароль админки (обязательно) |
| `ADMIN_SESSION_TOKEN` | случайная строка для сессионной cookie (рекомендуется в продакшне) |
| `NEXT_PUBLIC_SUPABASE_URL` | URL проекта Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | серверный ключ Supabase (никогда не публиковать) |
| `SUPABASE_STORAGE_BUCKET` | бакет для изображений, по умолчанию `site-images` |
| `NEXT_PUBLIC_SURVEYJS_LICENSE_KEY` | лицензионный ключ SurveyJS (опционально) |

## Админка

1. Откройте `/admin/login` и введите `ADMIN_PASSWORD`.
2. `/admin` - редактирование `content.json`, markdown-текстов, тарифов и загрузка изображений (профиль, OG).
3. `/admin/tests` - редактирование психологических тестов (требует Supabase).

## Где хранятся данные

- Без Supabase: чтение и запись локальных файлов (`src/assets/data/content.json`, `public/**/*.md`). На хостингах с read-only файловой системой (Vercel) изменения не сохранятся.
- С Supabase: таблицы `site_content`, `tariffs`, `tariff_packages`, `psychological_tests` и Storage-бакет для изображений.

### Настройка Supabase

1. Выполните в SQL Editor файлы `supabase/site_content.sql`, `supabase/tariffs.sql`, `supabase/tests.sql`.
2. Создайте **публичный** Storage-бакет (по умолчанию `site-images`).
3. Задайте `NEXT_PUBLIC_SUPABASE_URL` и `SUPABASE_SERVICE_ROLE_KEY`.

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

Большая часть контента находится в [src/assets/data/content.json](src/assets/data/content.json). Длинные тексты - в `.md`-файлах в `public/` (например, [public/profile.md](public/profile.md)). Всё это можно править через админку.

### content.json (общая информация, прайс)

У каждого значения есть свой ключ, например `"fullName": "Екатерина Жук"`. Любое значение можно менять; новые типы значений требуют изменений в коде.

> Удалять значения (за исключением элементов списков) нельзя!

Прайс - список объектов одинаковой структуры; порядок в файле = порядок на сайте:

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

[Шпаргалка по Markdown](https://gist.github.com/fomvasss/8dd8cd7f88c67a4e3727f9d39224a84c). Поддерживаются заголовки, обычный текст и маркированные списки. Ссылка на каждый файл должна быть в `content.json`, иначе текст не отображается.
