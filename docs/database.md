# База данных

PostgreSQL + Prisma ORM. Схема: `prisma/schema.prisma`, миграции: `prisma/migrations/`.

## Модели

| Модель | Назначение | Ключевые поля |
|---|---|---|
| `User` | Администраторы и редакторы | email (unique), passwordHash (bcrypt), role (ADMIN/EDITOR), isActive |
| `Session` | Серверные сессии | tokenHash (SHA-256 от токена + AUTH_SECRET), expiresAt |
| `LoginAttempt` | Защита от подбора пароля | email, ip, success, createdAt |
| `Category` | Категории меню | slug (unique, якорь секции), title, sort, isVisible |
| `Product` | Блюда | categoryId (FK, каскад), title, description, price (int, ₽), weight, imageUrl, gallery[], cardType (gallery/string), isVisible, isFeatured, sort |
| `Label` | Бейджи карточек | name (NEW, HIT), imageUrl |
| `Setting` | Настройки сайта (key-value) | ключи: siteTitle, siteDescription, logoUrl, footerCopyright, footerAddress, footerPhone, footerWorkingHours, footerLinks (JSON), footerSocials (JSON), year |
| `MediaAsset` | Загруженные файлы | url, path (вне Git), filename, size |
| `AuditLog` | Журнал действий | user, action, entity, entityId, details |

## Команды

```bash
npx prisma migrate deploy   # применить миграции (prod)
npx prisma migrate dev      # создать миграцию при изменении схемы (dev)
npm run db:seed             # настройки + меню исходного сайта + суперпользователь
npm run db:studio           # GUI для просмотра данных
```

Начальная миграция сгенерирована из схемы (`0_init`). Seed идемпотентен:
повторный запуск не дублирует данные.

## Локальный PostgreSQL

`docker compose up -d` поднимает Postgres 16: пользователь `kaef`, пароль `kaef`,
база `kaef_menu`, порт 5432. Данные хранятся в volume `pgdata`.
