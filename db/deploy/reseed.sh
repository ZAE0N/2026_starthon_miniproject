#!/usr/bin/env bash
# 스키마와 시드를 다시 넣습니다. 최초 구축(00~09) 이후 데이터를 바꿀 때 씁니다.
#
#   1. js/data.js 를 고친다
#   2. python3 db/tools/gen_seed.py
#   3. ./reseed.sh
#
# 주의: 기존 테이블을 지우고 다시 만듭니다. 백업을 먼저 확인합니다.
. "$(dirname "$0")/_common.sh"

SCHEMA="$HERE/../schema.sql"
SEED="$HERE/../seed.sql"

say "넣을 파일 확인"
for f in "$SCHEMA" "$SEED"; do
  [ -f "$f" ] || die "파일이 없습니다: $f"
  printf '   %-12s %s\n' "$(basename "$f")" "$(wc -l < "$f") 줄"
done

say "seed 가 최신인지 확인"
if command -v python3 >/dev/null; then
  BEFORE=$(sha256sum "$SEED" | awk '{print $1}')
  ( cd "$HERE/../.." && python3 db/tools/gen_seed.py >/dev/null )
  AFTER=$(sha256sum "$SEED" | awk '{print $1}')
  if [ "$BEFORE" = "$AFTER" ]; then
    ok "js/data.js 와 일치합니다"
  else
    warn "js/data.js 가 바뀌어 seed.sql 을 새로 만들었습니다. 커밋을 잊지 마세요"
  fi
fi

say "현재 서버 상태"
rsh "sudo mysql -N -B -e 'SHOW DATABASES;'" | sed 's/^/   /'
if rsh "sudo mysql -N -B -e 'SHOW DATABASES;'" | grep -qx "$DB_NAME"; then
  rsh "sudo mysql -B $DB_NAME -e \"
    SELECT 'notices' AS t, COUNT(*) AS n FROM notices
    UNION ALL SELECT 'events', COUNT(*) FROM academic_events
    UNION ALL SELECT 'pages',  COUNT(*) FROM pages;\"" 2>/dev/null | sed 's/^/   /' || true
fi

say "백업"
warn "이 작업은 '$DB_NAME' 의 테이블을 전부 지우고 다시 만듭니다."
confirm "먼저 백업을 만들까요? (건너뛰려면 n)"
STAMP=$(date +%Y%m%d_%H%M)
rsh "mkdir -p ~/db && sudo mysqldump --single-transaction --routines \
     --default-character-set=utf8mb4 '$DB_NAME' > ~/db/backup_${DB_NAME}_${STAMP}.sql" \
  && rsh "ls -lh ~/db/backup_${DB_NAME}_${STAMP}.sql" | sed 's/^/   /' \
  && ok "백업 완료" \
  || warn "백업 실패 (DB 가 아직 없으면 정상입니다)"

say "전송"
rsh "mkdir -p ~/db"
scp -i "$SSH_KEY" "$SCHEMA" "$SEED" "$SSH_USER@$SERVER_IP:~/db/"
rsh "ls -lh ~/db/schema.sql ~/db/seed.sql" | sed 's/^/   /'

say "적용"
confirm "지금 적용할까요?"
rsh "sudo mysql --default-character-set=utf8mb4 < ~/db/schema.sql" \
  && ok "schema.sql 적용" || die "schema.sql 실패"
rsh "sudo mysql --default-character-set=utf8mb4 '$DB_NAME' < ~/db/seed.sql" \
  && ok "seed.sql 적용" || die "seed.sql 실패"

say "결과"
rsh "sudo mysql --default-character-set=utf8mb4 -B $DB_NAME -e \"
  SELECT 'notices' AS t, COUNT(*) AS n FROM notices
  UNION ALL SELECT 'events', COUNT(*) FROM academic_events
  UNION ALL SELECT 'pages',  COUNT(*) FROM pages
  UNION ALL SELECT 'chat_cache', COUNT(*) FROM chat_cache;\"" | sed 's/^/   /'
echo "   기준: 71 / 33 / 20 / 0"

say "한글 확인"
rsh "sudo mysql --default-character-set=utf8mb4 -B $DB_NAME -e \
  'SELECT id, title FROM notices ORDER BY id DESC LIMIT 3;'" | sed 's/^/   /'

echo
echo "   전체 검증: ./06-verify.sh"
