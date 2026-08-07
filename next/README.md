## Next App

Сайт переведен на Next.js и поддерживает редактирование контента через админку.

## Запуск

```bash
cp .env.example .env.local
npm run dev
```

Открывайте сайт по адресу `http://127.0.0.1:3010`.

## Админка

1. В `.env.local` задайте `ADMIN_PASSWORD`.
2. Откройте `http://127.0.0.1:3010/admin/login`.
3. После входа доступно редактирование:
- `content.json`
- всех markdown-файлов (`profile.md`, `blog.md`, `public/pricelist/*.md`)

## Где хранятся данные

- Без Supabase: данные читаются и сохраняются в локальные файлы проекта.
- С Supabase: данные сохраняются в таблицу `site_content` и доступны в продакшене (например, на Vercel).

### Настройка Supabase

1. Выполните SQL из файла `supabase/site_content.sql`.
2. Добавьте в `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

После этого админка и публичный сайт будут читать/писать контент через Supabase.

