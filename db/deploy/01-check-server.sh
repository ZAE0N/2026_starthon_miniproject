#!/usr/bin/env bash
# 단계 1 — 서버 기본 상태 확인. 읽기만 하고 아무것도 바꾸지 않습니다.
. "$(dirname "$0")/_common.sh"

say "키 파일 권한"
[ -f "$SSH_KEY" ] || die "키 파일이 없습니다: $SSH_KEY"
PERM=$(stat -c '%a' "$SSH_KEY" 2>/dev/null || stat -f '%A' "$SSH_KEY")
if [ "$PERM" != "400" ]; then
  warn "권한이 $PERM 입니다. 400 으로 고칩니다"
  chmod 400 "$SSH_KEY"
fi
ok "$SSH_KEY"

say "접속 테스트"
rsh "echo 접속 성공" || die "접속 실패 — Lightsail 콘솔에서 22번 포트가 열려 있는지, IP·사용자 이름이 맞는지 확인하세요"

say "OS"
rsh 'cat /etc/os-release | grep -E "^(NAME|VERSION)=" | sed "s/^/   /"'
if ! rsh "command -v apt-get >/dev/null"; then
  die "apt 계열이 아닙니다. 02-install-mysql.sh 는 Ubuntu/Debian 전용입니다"
fi
ok "apt 사용 가능"

say "디스크  ★ MySQL 설치에 최소 2GB 는 있어야 합니다"
rsh "df -h /" | sed 's/^/   /'
AVAIL=$(rsh "df -m / | awk 'NR==2{print \$4}'")
if [ "$AVAIL" -lt 2048 ]; then
  warn "여유 ${AVAIL}MB — 2GB 미만입니다. 설치 중 실패할 수 있습니다"
else
  ok "여유 ${AVAIL}MB"
fi

say "메모리  ★ 1GB 미만이면 설치 중 멈출 수 있습니다"
rsh "free -m" | sed 's/^/   /'
MEM=$(rsh "free -m | awk '/^Mem:/{print \$2}'")
SWAP=$(rsh "free -m | awk '/^Swap:/{print \$2}'")
echo "   RAM ${MEM}MB / 스왑 ${SWAP}MB"
if [ "$MEM" -lt 1024 ] && [ "$SWAP" -lt 512 ]; then
  warn "메모리가 부족하고 스왑도 없습니다 → 02 가 스왑을 먼저 만들어 줍니다"
else
  ok "메모리 여유 있음"
fi

say "MySQL 설치 여부"
if rsh "command -v mysql >/dev/null 2>&1"; then
  ok "이미 설치돼 있습니다"
  rsh "mysql --version" | sed 's/^/   /'
  rsh "systemctl is-active mysql 2>/dev/null || systemctl is-active mysqld 2>/dev/null || echo inactive" | sed 's/^/   상태: /'
  echo
  echo "   02-install-mysql.sh 를 돌려도 됩니다 (설치는 건너뛰고 설정·검증만 합니다)"
else
  warn "MySQL 이 설치돼 있지 않습니다"
  echo "   → 02-install-mysql.sh 가 설치부터 보안 설정까지 전부 해 줍니다"
fi

say "다른 DB 서버가 포트를 쓰고 있는지"
rsh "sudo ss -tlnp 2>/dev/null | grep -E '3306|mariadb|postgres' || echo '   (없음)'" | sed 's/^/   /'

say "Bitnami 같은 사전 구성 이미지인지 확인"
if rsh "[ -d /opt/bitnami ]"; then
  warn "/opt/bitnami 가 있습니다 — Lightsail 앱 이미지입니다"
  warn "MySQL 경로와 설정 파일 위치가 달라서 이 스크립트가 맞지 않습니다. 알려주세요"
else
  ok "일반 Ubuntu 이미지"
fi

echo
ok "확인 끝. 아무것도 바꾸지 않았습니다."
echo "   다음: ./02-install-mysql.sh"
