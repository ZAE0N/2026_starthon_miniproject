#!/usr/bin/env bash
# 단계 4 — 기존 DB 백업. 데이터가 있다면 이 단계를 건너뛰지 마세요.
. "$(dirname "$0")/_common.sh"

say "서버의 데이터베이스 목록"
rsh "sudo mysql -N -B -e 'SHOW DATABASES;'" | sed 's/^/   /'

if ! rsh "sudo mysql -N -B -e 'SHOW DATABASES;'" | grep -qx "$DB_NAME"; then
  ok "'$DB_NAME' 이 없습니다. 백업할 것이 없으니 04 로 넘어가세요."
  exit 0
fi

say "'$DB_NAME' 현재 상태"
rsh "sudo mysql -B $DB_NAME -e 'SHOW TABLES;'" | sed 's/^/   /' || true

warn "'$DB_NAME' 이 이미 있습니다."
confirm "백업을 만들까요?"

STAMP=$(date +%Y%m%d_%H%M)
rsh "sudo mysqldump --single-transaction --routines --default-character-set=utf8mb4 '$DB_NAME' > ~/db/backup_${DB_NAME}_${STAMP}.sql"

say "백업 결과"
rsh "ls -lh ~/db/backup_${DB_NAME}_${STAMP}.sql" | sed 's/^/   /'
SIZE=$(rsh "stat -c %s ~/db/backup_${DB_NAME}_${STAMP}.sql")
[ "$SIZE" -gt 100 ] || die "백업 파일이 비어 있습니다. 중단합니다"
ok "백업 완료 (${SIZE} bytes) — ~/db/backup_${DB_NAME}_${STAMP}.sql"

echo
echo "   다음: ./05-import.sh"
