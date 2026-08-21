#!/usr/bin/env bash
# 단계 7 — 앱 전용 계정 생성. root 는 절대 원격에 열지 않습니다.
. "$(dirname "$0")/_common.sh"

say "앱 전용 계정 '$APP_USER'"
echo "   권한  : SELECT, INSERT, UPDATE, DELETE  (DROP·ALTER 없음)"
echo "   대상  : $DB_NAME.*"
echo "   접속  : '%' (원격 허용 — Lightsail 방화벽에서 IP 로 제한합니다)"

if rsh "sudo mysql -N -B -e \"SELECT 1 FROM mysql.user WHERE user='$APP_USER';\"" | grep -q 1; then
  warn "'$APP_USER' 계정이 이미 있습니다."
  confirm "비밀번호를 새로 만들고 덮어쓸까요?"
  RECREATE=1
else
  confirm "계정을 만들까요?"
  RECREATE=0
fi

PW=$(openssl rand -base64 24)

if [ "$RECREATE" = "1" ]; then
  rsh "sudo mysql -e \"DROP USER '$APP_USER'@'%';\"" || true
fi

rsh "sudo mysql -e \"
CREATE USER '$APP_USER'@'%' IDENTIFIED BY '$PW';
GRANT SELECT, INSERT, UPDATE, DELETE ON \\\`$DB_NAME\\\`.* TO '$APP_USER'@'%';
FLUSH PRIVILEGES;\""

say "권한 확인"
rsh "sudo mysql -N -B -e \"SHOW GRANTS FOR '$APP_USER'@'%';\"" | sed 's/^/   /'

say "root 가 원격에 열려 있지 않은지 확인"
if rsh "sudo mysql -N -B -e \"SELECT host FROM mysql.user WHERE user='root';\"" | grep -qv localhost; then
  warn "root 에 localhost 가 아닌 host 가 있습니다. 확인하세요"
  rsh "sudo mysql -N -B -e \"SELECT user, host FROM mysql.user WHERE user='root';\"" | sed 's/^/   /'
else
  ok "root 는 localhost 전용입니다"
fi

cat <<BOX

╔══════════════════════════════════════════════════════════════╗
   비밀번호는 지금 한 번만 표시됩니다. 안전한 곳에 옮겨 적으세요.

   사용자   : $APP_USER
   비밀번호 : $PW

   FastAPI 의 .env 에 넣을 값:

   DATABASE_URL=mysql+pymysql://$APP_USER:$PW@$SERVER_IP:3306/$DB_NAME?charset=utf8mb4

   ※ ?charset=utf8mb4 를 빼면 한글이 물음표로 나옵니다.
   ※ .env 는 절대 커밋하지 마세요. (.gitignore 에 이미 등록돼 있습니다)
╚══════════════════════════════════════════════════════════════╝

BOX

echo "   다음: ./07-network.sh"
