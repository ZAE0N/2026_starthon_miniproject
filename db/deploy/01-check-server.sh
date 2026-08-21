#!/usr/bin/env bash
# 단계 1~2 — 서버 상태 확인. 읽기만 하고 아무것도 바꾸지 않습니다.
. "$(dirname "$0")/_common.sh"

say "키 파일 권한"
if [ "$(stat -c '%a' "$SSH_KEY" 2>/dev/null || stat -f '%A' "$SSH_KEY")" != "400" ]; then
  warn "권한이 400 이 아닙니다. 고칩니다"
  chmod 400 "$SSH_KEY"
fi
ok "$SSH_KEY"

say "접속 테스트"
rsh "echo 접속 성공" || die "접속 실패. Lightsail 콘솔에서 22번 포트가 열려 있는지 확인하세요"

say "서버 기본 정보"
rsh 'lsb_release -d 2>/dev/null | sed "s/^/   /"; echo "   --- 디스크 ---"; df -h / | sed "s/^/   /"; echo "   --- 메모리 ---"; free -m | sed "s/^/   /"'

say "메모리 여유"
MEM=$(rsh "free -m | awk '/^Mem:/{print \$2}'")
if [ "$MEM" -lt 1024 ]; then
  warn "메모리 ${MEM}MB — 1GB 미만입니다. 임포트 중 멈출 수 있습니다"
  rsh "swapon --show" | grep -q . && ok "스왑이 이미 있습니다" || warn "스왑이 없습니다. 02 스크립트가 만들어 줍니다"
else
  ok "메모리 ${MEM}MB"
fi

say "MySQL 설치 여부"
if ! rsh "command -v mysql >/dev/null"; then
  warn "MySQL 이 설치돼 있지 않습니다"
  echo "   서버에 직접 접속해서 설치하세요 (mysql_secure_installation 이 대화형이라 자동화하지 않습니다):"
  echo "      ssh -i $SSH_KEY $SSH_USER@$SERVER_IP"
  echo "      sudo apt update && sudo apt install -y mysql-server"
  echo "      sudo systemctl enable --now mysql"
  echo "      sudo mysql_secure_installation"
  echo "   ※ 'root 원격 로그인 금지' 에는 반드시 y 로 답하세요."
  exit 1
fi
rsh "mysql --version" | sed 's/^/   /'

say "버전 판정  ★ CHECK 제약이 동작하는 최소 버전은 8.0.16"
VER=$(rsh "mysql --version" | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
echo "   감지된 버전: $VER"
if [ "$(printf '%s\n8.0.16\n' "$VER" | sort -V | head -1)" = "8.0.16" ]; then
  ok "8.0.16 이상 → CHECK 제약 사용 가능"
else
  warn "8.0.16 미만 → CHECK 제약이 조용히 무시됩니다"
  warn "백엔드(FastAPI)에서 sub_category 값을 직접 걸러야 합니다"
fi

say "sql_mode  ★ STRICT_TRANS_TABLES 가 있어야 ENUM 오입력이 막힙니다"
MODE=$(rsh "sudo mysql -N -B -e 'SELECT @@sql_mode;'")
echo "   $MODE"
case "$MODE" in *STRICT_TRANS_TABLES*) ok "STRICT_TRANS_TABLES 있음" ;;
  *) warn "없습니다. ENUM 에 없는 값이 빈 문자열로 조용히 저장됩니다" ;; esac

say "서버 기본 문자셋  ★ 덤프에 문자셋 선언이 없으므로 이 값이 그대로 적용됩니다"
rsh "sudo mysql -B -e \"SHOW VARIABLES WHERE Variable_name IN ('character_set_server','collation_server');\"" | sed 's/^/   /'
CS=$(rsh "sudo mysql -N -B -e \"SELECT @@character_set_server;\"")
if [ "$CS" = "utf8mb4" ]; then
  ok "utf8mb4 → 팀원 파일을 수정 없이 그대로 넣어도 한글이 안 깨집니다"
else
  warn "서버 기본이 '$CS' 입니다 (utf8mb4 아님)"
  warn "이대로 임포트하면 한글이 ??? 가 됩니다. 임포트 전에 반드시 파일을 고쳐야 합니다"
fi

say "기존 데이터베이스"
rsh "sudo mysql -N -B -e 'SHOW DATABASES;'" | sed 's/^/   /'
if rsh "sudo mysql -N -B -e 'SHOW DATABASES;'" | grep -qx "$DB_NAME"; then
  warn "'$DB_NAME' 이 이미 있습니다 → 03-backup.sh 를 반드시 먼저 돌리세요"
else
  ok "'$DB_NAME' 없음 → 새로 만들어집니다"
fi

say "MySQL 접속 대기 주소"
rsh "sudo ss -tlnp | grep 3306 || echo '   (3306 대기 없음)'" | sed 's/^/   /'

echo
ok "확인 끝. 아무것도 바꾸지 않았습니다."
echo "   다음: ./02-upload.sh"
