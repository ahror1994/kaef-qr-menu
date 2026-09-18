# Бэкапы и восстановление

## Что бэкапить

1. **База данных** — категории, блюда, настройки, пользователи, журнал.
2. **`storage/uploads/`** — загруженные через админку изображения.

`public/source-assets/` и весь код восстанавливаются из Git-репозитория.

## Создание бэкапа

```bash
npm run backup                       # -> backups/kaef-menu-YYYYMMDD-HHMMSS.sql
```

Скрипт использует `pg_dump` и `DATABASE_URL` из `.env`.

## Восстановление

```bash
npm run restore -- backups/<файл>.sql
```

## Автоматизация (пример cron на сервере)

```
10 4 * * *  cd /srv/kaef-menu && npm run backup >> /var/log/kaef-backup.log 2>&1
20 4 * * 0  rsync -a /srv/kaef-menu/backups/ /srv/backup-remote/kaef/
```

Рекомендуется хранить копии вне сервера (S3/другая машина) и периодически
проверять восстановление на тестовой копии.
