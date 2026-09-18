# KAEF HOOKAH LOUNGE — QR Menu

Полноценное веб-приложение цифрового меню ресторана, перенесённое с WordPress-сайта
[qr.kaef-nch.ru](https://qr.kaef-nch.ru/) на современный стек, с админ-панелью,
базой данных и редактируемым контентом.

Дизайн, структура и пользовательский сценарий исходного сайта сохранены
(аудит: [docs/source-audit.md](docs/source-audit.md)). По ТЗ из футера удалены
«Кайфокон Лаунч» и «Разработка Core Menu», оставлен 2026 год.

## Стек

- **Next.js 14 (App Router) + TypeScript + React 18**, строгий режим
- **PostgreSQL + Prisma ORM**, миграции и seed
- **Zod** — валидация на сервере и клиенте
- Собственная сессионная авторизация: bcrypt (12 раундов), httpOnly-cookie,
  rate-limit попыток входа, CSRF-защита через Origin, журнал аудита
- CSS портирован из исходной темы (Gilroy, дизайн-токены) — точное соответствие дизайну
- CI: GitHub Actions (lint, typecheck, тесты, сборка)

Из меню намеренно исключены заказы, корзина и оплата — это цифровое меню,
архитектура расширяема на будущее.

## Быстрый старт (локально)

Требования: Node.js 20+, Docker (для PostgreSQL).

```bash
npm ci
cp .env.example .env          # при необходимости поправьте значения
docker compose up -d          # поднимет PostgreSQL на localhost:5432
npm run db:migrate            # применит миграции
npm run db:seed               # настройки + меню из исходного сайта + суперпользователь
npm run dev                   # http://localhost:3000
```

Вход в админку: `/admin/login`, лог/пароль из `.env` (`SUPERADMIN_EMAIL` /
`SUPERADMIN_PASSWORD`). **Смените пароль после первого входа.**

Полезные команды:

```bash
npm run superadmin        # (пере)создать суперпользователя из .env
npm run import:source-menu
npm test                  # unit + интеграционные тесты (vitest)
npm run typecheck && npm run lint && npm run build
npm run backup            # pg_dump в backups/
npm run restore           # восстановление из файла
```

## Структура

```
app/            публичная страница (/), админка (/admin/*), API (/api/*)
components/     public | admin | ui
lib/            db, auth, validation, settings, storage, audit, api
prisma/         schema, миграции, seed
scripts/        crawl-source-site.py, create-superadmin, import-source-menu, backup/restore
data/           source-menu.json — меню, извлечённое из исходного сайта
public/source-assets/  изображения, шрифты и логотип исходного сайта
docs/           аудит исходника, архитектура, деплой, инструкции
tests/          unit + integration (vitest)
```

## Документация

| Документ | Описание |
|---|---|
| [docs/source-audit.md](docs/source-audit.md) | Аудит и инвентаризация исходного сайта |
| [docs/architecture.md](docs/architecture.md) | Архитектура приложения |
| [docs/deployment.md](docs/deployment.md) | Локальный запуск и production-деплой |
| [docs/admin-manual.md](docs/admin-manual.md) | Инструкция администратора |
| [docs/database.md](docs/database.md) | Схема БД |
| [docs/backup-restore.md](docs/backup-restore.md) | Бэкапы и восстановление |
| [docs/acceptance-checklist.md](docs/acceptance-checklist.md) | Чек-лист приёмки |
