#!/usr/bin/env bash
# 단계 2 — MySQL 설치와 보안 설정. 아무것도 없는 서버 기준입니다.
#          이미 설치돼 있으면 설치는 건너뛰고 설정·검증만 합니다.
. "$(dirname "$0")/_common.sh"

# ── 1. 스왑 ────────────────────────────────────────────────────────────
MEM=$(rsh "free -m | awk '/^Mem:/{print \$2}'")
SWAP=$(rsh "free -m | awk '/^Swap:/{print \$2}'")
if [ "$MEM" -lt 1024 ] && [ "$SWAP" -lt 512 ]; then
  say "스왑 생성 (RAM ${MEM}MB, 스왑 없음)"
  warn "이대로 설치하면 메모리 부족으로 중간에 멈출 수 있습니다."
  confirm "2GB 스왑 파일을 만들까요?"
  rsh "sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile"
  rsh "grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab >/dev/null"
  rsh "free -m" | sed 's/^/   /'
  ok "스왑 설정 완료 (재부팅 후에도 유지)"
fi

# ── 2. 설치 ────────────────────────────────────────────────────────────
if rsh "command -v mysql >/dev/null 2>&1"; then
  say "MySQL 이 이미 설치돼 있습니다 — 설치는 건너뜁니다"
  rsh "mysql --version" | sed 's/^/   /'
else
  say "MySQL 서버 설치"
  echo "   apt 로 mysql-server 를 설치합니다. 몇 분 걸립니다."
  echo "   ※ mysql_secure_installation 은 대화형이라 쓰지 않습니다."
  echo "     같은 일을 아래 4단계에서 SQL 로 직접 처리합니다."
  confirm "설치할까요?"

  rsh "sudo DEBIAN_FRONTEND=noninteractive apt-get update -qq"
  rsh "sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq \
         -o Dpkg::Options::=--force-confdef -o Dpkg::Options::=--force-confold \
         mysql-server" \
    || die "설치 실패. 위 오류를 확인하세요 (디스크·메모리 부족이 가장 흔합니다)"

  rsh "mysql --version" | sed 's/^/   /'
  ok "설치 완료"
fi

say "서비스 기동과 자동 시작 등록"
rsh "sudo systemctl enable --now mysql"
sleep 2
rsh "systemctl is-active mysql" | sed 's/^/   상태:     /'
rsh "systemctl is-enabled mysql" | sed 's/^/   자동시작: /'
rsh "sudo mysql -e 'SELECT 1;' >/dev/null" || die "sudo mysql 로 접속이 안 됩니다. systemctl status mysql 을 확인하세요"
ok "MySQL 이 살아 있습니다"

# ── 3. 문자셋과 시간대  ★ 여기가 핵심 ──────────────────────────────────
say "서버 기본 문자셋을 utf8mb4 로 고정  ★ 한글이 걸린 문제"
echo "   팀원 덤프에는 CHARSET 선언이 없어서, 테이블이 '서버 기본값'으로 만들어집니다."
echo "   그 기본값을 지금 utf8mb4 로 못 박아두면 덤프를 고치지 않아도 한글이 안 깨집니다."
echo "   설정 파일: $MYCNF (배포판 기본 파일은 건드리지 않습니다)"
confirm "설정을 넣을까요?"

rshin "sudo tee $MYCNF >/dev/null" <<'CNF'
# 인하공전 미니프로젝트용 설정.
# mysqld.cnf 보다 알파벳 순으로 뒤라서 이 값이 최종적으로 적용됩니다.
[mysqld]
character-set-server = utf8mb4
collation-server     = utf8mb4_unicode_ci
default-time-zone    = '+09:00'

[client]
default-character-set = utf8mb4

[mysql]
default-character-set = utf8mb4
CNF

rsh "sudo systemctl restart mysql"
sleep 3
rsh "systemctl is-active mysql" | grep -q active || die "재시작 실패. sudo journalctl -u mysql -n 50 을 확인하세요"

say "적용 결과"
rsh "sudo mysql -B -e \"SHOW VARIABLES WHERE Variable_name IN ('character_set_server','collation_server','time_zone');\"" | sed 's/^/   /'
CS=$(rsh "sudo mysql -N -B -e 'SELECT @@character_set_server;'")
[ "$CS" = "utf8mb4" ] && ok "character_set_server = utf8mb4" || die "여전히 '$CS' 입니다. $MYCNF 를 확인하세요"

# ── 4. 보안 설정 (mysql_secure_installation 대체) ──────────────────────
say "보안 설정 — mysql_secure_installation 이 하는 일을 SQL 로 처리합니다"
confirm "익명 사용자 제거 · test DB 제거 · root 원격 차단을 진행할까요?"

rshin "sudo mysql" <<'SQL'
DROP USER IF EXISTS ''@'localhost';
DROP USER IF EXISTS ''@'%';
DROP DATABASE IF EXISTS test;
FLUSH PRIVILEGES;
SQL

# 위에서 못 잡은 익명 계정 / 원격 root 가 남아 있으면 생성해서 제거
rsh "sudo mysql -N -B -e \"SELECT CONCAT('DROP USER ', QUOTE(user), '@', QUOTE(host), ';') FROM mysql.user WHERE user='' OR (user='root' AND host NOT IN ('localhost','127.0.0.1','::1'));\" | sudo mysql"

say "결과 확인"
echo "   [익명 사용자]"
ANON=$(rsh "sudo mysql -N -B -e \"SELECT COUNT(*) FROM mysql.user WHERE user='';\"")
[ "$ANON" = "0" ] && ok "없음" || warn "$ANON 개 남아 있습니다"

echo "   [test 데이터베이스]"
rsh "sudo mysql -N -B -e \"SHOW DATABASES;\"" | grep -qx test && warn "아직 있습니다" || ok "없음"

echo "   [root 계정의 접속 허용 주소]"
rsh "sudo mysql -B -e \"SELECT user, host, plugin FROM mysql.user WHERE user='root';\"" | sed 's/^/      /'
if rsh "sudo mysql -N -B -e \"SELECT COUNT(*) FROM mysql.user WHERE user='root' AND host NOT IN ('localhost','127.0.0.1','::1');\"" | grep -qx 0; then
  ok "root 는 서버 내부에서만 접속 가능합니다"
else
  die "root 가 외부에 열려 있습니다. 수동으로 확인하세요"
fi

cat <<'BOX'

   ┌─ root 비밀번호를 왜 안 만드는가 ────────────────────────────┐
   │ Ubuntu 의 MySQL 8 은 root 를 auth_socket 방식으로 만듭니다. │
   │ 비밀번호가 아니라 "서버에 sudo 로 로그인한 사람"인지를 보고 │
   │ 통과시킵니다. 그래서                                        │
   │                                                             │
   │   · 유출될 비밀번호가 애초에 없습니다                       │
   │   · 네트워크로는 root 로 접속할 방법이 아예 없습니다        │
   │   · 서버 안에서는 sudo mysql 로 그냥 들어갑니다             │
   │                                                             │
   │ 지시서의 "root 비밀번호 설정"보다 안전해서 이대로 둡니다.   │
   │ 이후 스크립트도 전부 sudo mysql 을 씁니다.                  │
   │ (비밀번호를 걸면 sudo mysql 이 막혀 나머지가 동작하지       │
   │  않으니, 꼭 필요할 때만 따로 상의해서 바꾸세요.)            │
   └─────────────────────────────────────────────────────────────┘

BOX

# ── 5. 최종 검증 ───────────────────────────────────────────────────────
say "버전 판정  ★ CHECK 제약은 8.0.16 이상에서만 동작합니다"
VER=$(rsh "sudo mysql -N -B -e 'SELECT VERSION();'" | grep -oE '^[0-9]+\.[0-9]+\.[0-9]+')
echo "   $VER"
if [ "$(printf '%s\n8.0.16\n' "$VER" | sort -V | head -1)" = "8.0.16" ]; then
  ok "8.0.16 이상 → CHECK 제약 사용 가능"
else
  warn "8.0.16 미만 → CHECK 제약이 조용히 무시됩니다"
  warn "백엔드에서 sub_category 값을 직접 걸러야 합니다 (FastAPI 가이드 4-6)"
fi

say "sql_mode  ★ STRICT_TRANS_TABLES 가 있어야 ENUM 오입력이 막힙니다"
MODE=$(rsh "sudo mysql -N -B -e 'SELECT @@sql_mode;'")
echo "   $MODE"
case "$MODE" in
  *STRICT_TRANS_TABLES*) ok "있음" ;;
  *) warn "없습니다 — ENUM 에 없는 값이 빈 문자열로 조용히 저장됩니다" ;;
esac

say "기존 데이터베이스"
rsh "sudo mysql -N -B -e 'SHOW DATABASES;'" | sed 's/^/   /'

echo
ok "MySQL 준비 완료."
echo "   다음: ./03-upload.sh"
