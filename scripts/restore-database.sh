#!/usr/bin/env bash
# Восстановление базы данных PostgreSQL из бэкапа.
# Использование: bash scripts/restore-database.sh backups/kaef-menu-YYYYMMDD-HHMMSS.sql
# ВНИМАНИЕ: перезаписывает текущие данные (скрипт бэкапа делает --clean --if-exists).
set -euo pipefail
cd "$(dirname "$0")/.."

FILE="${1:?Укажите файл бэкапа: bash scripts/restore-database.sh backups/<file>.sql}"
[ -f "$FILE" ] || { echo "Файл не найден: $FILE"; exit 1; }

if [ -f .env ]; then
  set -a; . ./.env; set +a
fi

echo "Восстановление из $FILE ..."
psql "$DATABASE_URL" < "$FILE"
echo "Готово."
