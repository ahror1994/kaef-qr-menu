#!/usr/bin/env bash
# Бэкап базы данных PostgreSQL через pg_dump.
# Использование: npm run backup  (или bash scripts/backup-database.sh [output-dir])
# Требуется DATABASE_URL в окружении и утилита pg_dump.
set -euo pipefail
cd "$(dirname "$0")/.."

OUT_DIR="${1:-backups}"
mkdir -p "$OUT_DIR"
STAMP="$(date +%Y%m%d-%H%M%S)"
FILE="$OUT_DIR/kaef-menu-$STAMP.sql"

if [ -f .env ]; then
  set -a; . ./.env; set +a
fi

echo "Бэкап -> $FILE"
pg_dump --no-owner --no-privileges --clean --if-exists "$DATABASE_URL" > "$FILE"
echo "Готово. Размер: $(du -h "$FILE" | cut -f1)"
