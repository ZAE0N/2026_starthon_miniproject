#!/usr/bin/env bash
# 단계 8 ①② — 외부 접속 허용. ③ Lightsail 콘솔 작업은 안내만 합니다.
. "$(dirname "$0")/_common.sh"

say "내 공인 IP 확인"
MYIP=$(curl -s https://ifconfig.me || curl -s https://api.ipify.org)
[ -n "$MYIP" ] || die "공인 IP 를 알아내지 못했습니다"
ok "$MYIP"

say "① MySQL 이 외부 요청을 받도록 (bind-address)"
echo "   현재 대기 주소:"
rsh "sudo ss -tlnp | grep 3306 || echo '(3306 대기 없음)'" | sed 's/^/      /'
echo
echo "   02 가 만든 $MYCNF 에 bind-address 를 추가합니다."
echo "   배포판 기본 파일(mysqld.cnf)의 127.0.0.1 을 덮어씁니다."
warn "이 설정 이후 MySQL 이 외부 요청을 받기 시작합니다."
warn "아래 ②③ 방화벽으로 IP 를 제한한 상태에서만 쓰세요."
confirm "진행할까요?"

rsh "[ -f $MYCNF ]" || die "$MYCNF 가 없습니다. 02-install-mysql.sh 를 먼저 돌리세요"
rsh "sudo cp $MYCNF ${MYCNF}.bak.\$(date +%Y%m%d_%H%M)"
rsh "grep -q '^bind-address' $MYCNF \
     && sudo sed -i 's/^bind-address.*/bind-address = 0.0.0.0/' $MYCNF \
     || sudo sed -i '/^\[mysqld\]/a bind-address = 0.0.0.0' $MYCNF"

say "설정 파일 내용"
rsh "cat $MYCNF" | sed 's/^/   /'

say "MySQL 재시작"
rsh "sudo systemctl restart mysql"
sleep 3
rsh "systemctl is-active mysql" | grep -q active || die "재시작 실패. sudo journalctl -u mysql -n 50 확인"

say "대기 주소 재확인  ★ 0.0.0.0:3306 이어야 합니다"
LISTEN=$(rsh "sudo ss -tlnp | grep 3306 || true")
echo "   $LISTEN"
case "$LISTEN" in
  *0.0.0.0:3306*|*'*:3306'*) ok "외부 요청을 받을 수 있습니다" ;;
  *127.0.0.1:3306*) die "127.0.0.1 그대로입니다. $MYCNF 를 확인하세요" ;;
  *) warn "3306 대기가 확인되지 않습니다" ;;
esac

say "② 서버 방화벽 (ufw)"
UFW=$(rsh "sudo ufw status 2>/dev/null | head -1 || echo 'ufw 없음'")
echo "   $UFW"
if echo "$UFW" | grep -qE "inactive|없음"; then
  ok "ufw 가 꺼져 있습니다 — Lightsail 콘솔 방화벽만 설정하면 됩니다"
else
  confirm "3306 을 $MYIP 에서만 허용할까요?"
  rsh "sudo ufw allow from $MYIP to any port 3306 proto tcp"
  rsh "sudo ufw reload"
  rsh "sudo ufw status numbered" | sed 's/^/   /'
  ok "3306 을 $MYIP 로만 제한했습니다"
fi

cat <<BOX

╔══════════════════════════════════════════════════════════════╗
   ③ Lightsail 콘솔 방화벽 — 이건 웹에서 직접 하셔야 합니다

   1. Lightsail 콘솔 → 인스턴스 선택
   2. [네트워킹] 탭
   3. IPv4 방화벽 → [규칙 추가]
   4. 애플리케이션 : MySQL/Aurora     포트 : 3306
   5. ★ "IP 주소로 제한" 을 켜고 아래 IP 를 넣으세요

          $MYIP

   3306 을 전체 공개(0.0.0.0/0)하면 몇 시간 안에 자동 로그인
   시도가 들어옵니다. 반드시 IP 로 제한하세요.

   팀원도 붙어야 한다면 각자 https://ifconfig.me 에서 확인한
   IP 를 규칙에 추가하면 됩니다.
╚══════════════════════════════════════════════════════════════╝

BOX

echo "   다음: ./09-test-remote.sh"
