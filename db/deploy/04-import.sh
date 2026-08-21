#!/usr/bin/env bash
# 단계 5 — 덤프를 MySQL 에 넣습니다.
. "$(dirname "$0")/_common.sh"

BASE=$(basename "$DUMP_FILE")

say "임포트 전 최종 확인"
CS=$(rsh "sudo mysql -N -B -e 'SELECT @@character_set_server;'")
echo "   서버 기본 문자셋 : $CS"
echo "   덤프 파일        : ~/db/$BASE"
echo "   대상 DB          : $DB_NAME"

if [ "$CS" != "utf8mb4" ]; then
  warn "서버 기본 문자셋이 utf8mb4 가 아닙니다."
  warn "이 덤프에는 문자셋 선언이 없어서 '$CS' 로 테이블이 만들어집니다. 한글이 깨집니다."
  confirm "그래도 계속할까요? (권장하지 않음)"
fi

# 팀원 파일은 CREATE DATABASE ... 에 IF NOT EXISTS 가 없어서 DB가 있으면 실패합니다
if rsh "sudo mysql -N -B -e 'SHOW DATABASES;'" | grep -qx "$DB_NAME"; then
  warn "'$DB_NAME' 이 이미 있습니다. 이 덤프는 CREATE DATABASE 에 IF NOT EXISTS 가 없어 그대로는 실패합니다."
  if ! rsh "ls ~/db/backup_${DB_NAME}_*.sql >/dev/null 2>&1"; then
    die "백업이 없습니다. 먼저 ./03-backup.sh 를 돌리세요"
  fi
  rsh "ls -lh ~/db/backup_${DB_NAME}_*.sql" | sed 's/^/   백업: /'
  confirm "기존 '$DB_NAME' 을 DROP 하고 새로 넣을까요?"
  rsh "sudo mysql -e 'DROP DATABASE \`$DB_NAME\`;'"
  ok "기존 DB 삭제"
fi

say "임포트 실행"
confirm "지금 넣을까요?"
rsh "sudo mysql --default-character-set=utf8mb4 < ~/db/$BASE" \
  && ok "임포트 성공" \
  || die "임포트 실패. 위 오류 메시지를 확인하세요"

say "곧바로 확인 — 테이블과 건수"
rsh "sudo mysql --default-character-set=utf8mb4 -B $DB_NAME -e 'SHOW TABLES;'" | sed 's/^/   /'

say "한글 확인  ★ 물음표가 보이면 실패입니다"
rsh "sudo mysql --default-character-set=utf8mb4 -B $DB_NAME -e 'SELECT id, title FROM notices LIMIT 3;'" | sed 's/^/   /'

echo
echo "   다음: ./05-verify.sh"
