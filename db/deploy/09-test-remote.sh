#!/usr/bin/env bash
# 단계 9 — 로컬에서 원격 접속 테스트. 반드시 내 컴퓨터에서 실행하세요.
. "$(dirname "$0")/_common.sh"

say "원격 접속 테스트"
echo "   대상: $APP_USER@$SERVER_IP:3306/$DB_NAME"
printf '   %s 비밀번호: ' "$APP_USER"
read -rs PW
echo

if command -v mysql >/dev/null; then
  say "mysql 클라이언트로 시도"
  MYSQL_PWD="$PW" mysql -h "$SERVER_IP" -u "$APP_USER" "$DB_NAME" \
    --default-character-set=utf8mb4 \
    -e "SELECT COUNT(*) AS notices FROM notices; SELECT id, title FROM notices LIMIT 3;" \
    && ok "접속 성공" \
    || warn "실패 — 아래 파이썬으로도 시도해 봅니다"
else
  warn "mysql 클라이언트가 없습니다. 파이썬으로 시도합니다"
fi

if command -v python3 >/dev/null; then
  say "python(pymysql) 으로 시도"
  python3 -c "
import sys
try:
    import pymysql
except ImportError:
    print('   pymysql 이 없습니다:  pip install pymysql cryptography'); sys.exit(0)
try:
    c = pymysql.connect(host='$SERVER_IP', user='$APP_USER', password='''$PW''',
                        database='$DB_NAME', charset='utf8mb4', connect_timeout=10)
except Exception as e:
    print('   접속 실패:', e); sys.exit(1)
cur = c.cursor()
cur.execute('SELECT COUNT(*) FROM notices'); print('   공지 건수 :', cur.fetchone()[0])
cur.execute('SELECT id, title FROM notices LIMIT 3')
for r in cur.fetchall(): print('   ', r[0], r[1])
print('   한글이 제대로 보이면 성공입니다.')
"
fi

cat <<'BOX'

   접속이 안 될 때 확인 순서
   ─────────────────────────────────────────────
   그냥 멈춤(timeout)          → Lightsail 콘솔 방화벽 (07 의 ③)
   Can't connect to MySQL      → bind-address (07 의 ①)
   Access denied for user      → 계정이 @'localhost' 로만 있음 (06 재실행)
   Authentication plugin ...   → pip install cryptography
   한글이 ???                  → 문자셋. 임포트를 다시 해야 합니다
BOX
