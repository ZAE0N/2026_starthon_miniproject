#!/usr/bin/env bash
# 단계 8 ①② — MySQL bind-address 와 서버 방화벽. ③ 콘솔 작업은 안내만 합니다.
. "$(dirname "$0")/_common.sh"

CNF=/etc/mysql/mysql.conf.d/mysqld.cnf

say "내 공인 IP 확인"
MYIP=$(curl -s https://ifconfig.me || curl -s https://api.ipify.org)
[ -n "$MYIP" ] || die "공인 IP 를 알아내지 못했습니다"
ok "$MYIP"

say "① MySQL bind-address"
rsh "grep -n 'bind-address\|default-time-zone' $CNF || echo '   (설정 없음)'" | sed 's/^/   /'
warn "bind-address 를 0.0.0.0 으로 바꾸면 MySQL 이 외부 요청을 받기 시작합니다."
warn "반드시 아래 ②③ 방화벽으로 IP 를 제한한 상태에서만 쓰세요."
confirm "bind-address 를 0.0.0.0 으로 바꾸고 시간대를 +09:00 으로 설정할까요?"

rsh "sudo cp $CNF ${CNF}.bak.\$(date +%Y%m%d_%H%M)"
rsh "sudo sed -i 's/^bind-address.*/bind-address = 0.0.0.0/' $CNF"
rsh "grep -q '^bind-address' $CNF || echo 'bind-address = 0.0.0.0' | sudo tee -a $CNF >/dev/null"
rsh "grep -q '^default-time-zone' $CNF || sudo sed -i '/^\[mysqld\]/a default-time-zone = \"+09:00\"' $CNF"

say "변경 결과"
rsh "grep -n 'bind-address\|default-time-zone' $CNF" | sed 's/^/   /'

say "MySQL 재시작"
rsh "sudo systemctl restart mysql"
sleep 3
rsh "sudo systemctl is-active mysql" | sed 's/^/   /'

say "대기 주소 확인  ★ 0.0.0.0:3306 이어야 합니다"
LISTEN=$(rsh "sudo ss -tlnp | grep 3306 || true")
echo "   $LISTEN"
case "$LISTEN" in
  *0.0.0.0:3306*|*'*:3306'*) ok "외부 요청을 받을 수 있습니다" ;;
  *127.0.0.1:3306*) die "127.0.0.1 그대로입니다. $CNF 를 직접 확인하세요" ;;
  *) warn "3306 대기가 확인되지 않습니다" ;;
esac

say "시간대 확인"
rsh "sudo mysql -B -e \"SELECT @@global.time_zone, NOW();\"" | sed 's/^/   /'

say "② 서버 방화벽 (ufw)"
UFW=$(rsh "sudo ufw status | head -1")
echo "   $UFW"
if echo "$UFW" | grep -q inactive; then
  ok "ufw 가 꺼져 있습니다. 별도 조치 불필요 (Lightsail 콘솔 방화벽만 설정하면 됩니다)"
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

echo "   다음: ./08-test-remote.sh"
