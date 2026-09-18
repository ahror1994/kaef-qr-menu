# Деплой

## Локальный запуск

См. «Быстрый старт» в README. Итог:

- сайт: http://localhost:3000
- админка: http://localhost:3000/admin/login

## Production (VPS + Docker)

### 1. Переменные окружения

```env
DATABASE_URL="postgresql://kaef:<надёжный-пароль>@db:5432/kaef_menu?schema=public"
NEXT_PUBLIC_SITE_URL="https://qr.<ваш-домен>"
AUTH_SECRET="<openssl rand -base64 32>"
MEDIA_DRIVER="local"
```

### 2. Запуск

```bash
docker compose up -d            # БД
npm ci
npx prisma migrate deploy
npm run build
npm start                       # или pm2 / systemd
```

Для reverse-proxy используйте Nginx/Caddy: терминируйте HTTPS, проксируйте
`localhost:3000`. Обязательно HTTPS — cookie сессии в production ставится с
флагом `Secure`.

### 3. Первичная настройка

```bash
npm run superadmin              # суперпользователь из SUPERADMIN_EMAIL/PASSWORD
```

Затем войдите в админку и **смените пароль** (Пользователи → Сменить пароль).

### 4. Vercel (альтернатива)

Next.js совместим с Vercel: подключите репозиторий, задайте переменные окружения
и используйте управляемый PostgreSQL (Neon/Supabase). Для загрузок выберите
`MEDIA_DRIVER=s3` и подключите S3-совместимое хранилище (см. ниже).

## S3-совместимое хранилище (Cloudflare R2 / MinIO)

`lib/storage.ts` определяет интерфейс `StorageDriver`. Драйвер `local` включён по
умолчанию. Для S3: `npm i @aws-sdk/client-s3`, реализуйте `save/remove` в
классе `S3Driver` (загрузка объекта + публичный URL через домен бакета) и задайте
`MEDIA_DRIVER=s3`, `S3_*` переменные. Пользовательские файлы при этом никогда не
попадают в Git и в контейнер приложения.

## Резервное копирование

```bash
npm run backup                  # pg_dump -> backups/kaef-menu-YYYYMMDD-HHMMSS.sql
npm run restore -- backups/<file>.sql
```

Настройте cron (ежедневно) и копирование `backups/` и `storage/uploads/` на
внешнее хранилище. Подробнее: docs/backup-restore.md.

## Обновления

```bash
git pull
npm ci
npx prisma migrate deploy
npm run build && npm start
```
