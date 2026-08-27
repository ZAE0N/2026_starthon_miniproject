#!/usr/bin/env bash
# 단계 11 (선택) — 도메인에 무료 인증서를 붙여 https 로 만듭니다.
#
#   먼저 할 일
#     1. 도메인을 삽니다
#     2. A 레코드를 이 서버의 고정 IP 로 가리킵니다  (@ 와 www 둘 다)
#     3. config.env 에  DOMAIN=내도메인  을 적습니다
#     4. Lightsail 콘솔에서 443 포트를 엽니다 (아래에서 확인해 줍니다)
#     5. 이 스크립트를 실행합니다
#     6. ./10-deploy-app.sh 를 다시 실행합니다  ← nginx 설정은 그쪽이 씁니다
#
# ★ 이 스크립트는 nginx 설정을 건드리지 않습니다.
#   certbot 의 --nginx 플러그인은 설정 파일을 직접 고치는데,
#   10-deploy-app.sh 가 배포마다 그 파일을 다시 쓰므로 다음 배포에서
#   https 가 통째로 사라집니다. 그래서 여기서는 certonly 로 인증서만 받고,
#   설정을 쓰는 일은 10 번 하나에 맡깁니다.
. "$(dirname "$0")/_common.sh"

WEB_DIR="/var/www/inhatc"
DOMAIN="${DOMAIN:-}"

say "설정 확인"
if [ -z "$DOMAIN" ]; then
  cat <<NODOMAIN

   config.env 의 DOMAIN 이 비어 있습니다.

   도메인이 아직 없다면 이 단계는 건너뛰어도 됩니다.
   http://$SERVER_IP/ 로도 심사 기준 3가지가 모두 충족됩니다.
   로그인도 개인정보 입력도 없는 조회용 페이지라 자물쇠가 없어도 괜찮습니다.

   도메인을 샀다면 config.env 에 한 줄 적고 다시 실행하세요:

        echo 'DOMAIN=내도메인' >> $HERE/config.env

   도메인 없이 자물쇠만 원한다면 무료 대체도 있습니다 (주소에 IP 가 보입니다):

        echo 'DOMAIN=$(echo "$SERVER_IP" | tr . -).sslip.io' >> $HERE/config.env

NODOMAIN
  exit 0
fi
ok "DOMAIN=$DOMAIN"
echo "   서버 IP : $SERVER_IP"

# ── 1. DNS 가 이 서버를 가리키는지 ──────────────────────────────────────
# Let's Encrypt 는 실패도 횟수를 셉니다 (한 시간에 5번). DNS 가 안 붙은 채로
# 시도하면 한 시간 동안 막혀서, 정작 준비가 끝났을 때 발급을 못 받습니다.
# 그래서 먼저 확인하고, 안 맞으면 아예 시도하지 않습니다.
#
# IPv4 만 봅니다. AAAA 레코드가 함께 있으면 (Cloudflare 등이 자동으로 붙입니다)
# getent hosts 가 IPv6 를 먼저 돌려주는데, 그걸 IP 로 오해하면 A 레코드가
# 제대로 돼 있는데도 "다른 곳을 가리킨다"고 잘못 막게 됩니다.
ipv4_of() {
  { getent ahostsv4 "$1" 2>/dev/null || getent hosts "$1" 2>/dev/null; } \
    | awk '$1 ~ /^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$/ {print $1; exit}'
}

say "DNS 확인"
RESOLVED=$(ipv4_of "$DOMAIN" || true)
if [ -z "$RESOLVED" ]; then
  cat <<NODNS

   $DOMAIN 이 아직 아무 곳도 가리키지 않습니다.

   도메인 등록처의 DNS 설정에서 A 레코드를 추가하세요:

        Type: A    Name: @      Value: $SERVER_IP
        Type: A    Name: www    Value: $SERVER_IP

   Cloudflare 를 쓴다면 프록시(주황 구름)를 끄고 DNS only 로 두세요.
   반영되면 아래 명령에 $SERVER_IP 가 나옵니다. 그때 다시 실행하세요.

        getent hosts $DOMAIN

NODNS
  die "DNS 가 아직 반영되지 않았습니다"
fi
if [ "$RESOLVED" != "$SERVER_IP" ]; then
  warn "$DOMAIN 이 다른 곳을 가리킵니다"
  echo "      지금  : $RESOLVED"
  echo "      기대  : $SERVER_IP"
  echo
  echo "   A 레코드를 고치고, 반영될 때까지 기다렸다가 다시 실행하세요."
  echo "   방금 고쳤다면 최대 몇 분에서 몇 시간까지 걸릴 수 있습니다."
  die "DNS 가 이 서버를 가리키지 않습니다"
fi
ok "$DOMAIN → $SERVER_IP"

# ── 2. 443 포트 ─────────────────────────────────────────────────────────
say "443 포트 확인"
echo "   Lightsail 콘솔에서 열어야 합니다 (80 때와 같은 자리입니다):"
echo "     인스턴스 → [네트워킹] → [규칙 추가]"
echo "        애플리케이션: HTTPS   프로토콜: TCP   포트: 443"
echo
if timeout 8 bash -c "</dev/tcp/$SERVER_IP/443" 2>/dev/null; then
  ok "443 이 열려 있습니다"
else
  warn "443 이 아직 닫혀 있는 것 같습니다"
  echo "   지금 열어도 되고, 인증서를 먼저 받아도 됩니다."
  echo "   (발급은 80 포트로 이뤄지므로 443 이 닫혀 있어도 진행됩니다)"
  echo "   다만 10-deploy-app.sh 를 돌린 뒤 접속하려면 반드시 열려 있어야 합니다."
  confirm "계속할까요?"
fi

# 서버 안쪽 방화벽도 열어 둡니다 (ufw 가 켜져 있을 때만 의미가 있습니다)
UFW=$(rsh "sudo ufw status 2>/dev/null | head -1 || echo 'ufw 없음'")
if ! echo "$UFW" | grep -qE "inactive|없음"; then
  rsh "sudo ufw allow 443/tcp && sudo ufw reload" >/dev/null
  ok "서버 ufw 에 443 허용"
fi

# ── 3. certbot ──────────────────────────────────────────────────────────
say "certbot 설치"
# python3-certbot-nginx 는 일부러 설치하지 않습니다.
# 그 플러그인이 있으면 --nginx 를 쓰기 쉬워지고, 그러면 다음 배포에서
# nginx 설정이 덮어써지며 https 가 사라집니다 (파일 맨 위 설명 참고).
if rsh "command -v certbot >/dev/null 2>&1"; then
  ok "이미 설치돼 있습니다"
else
  confirm "certbot 을 설치할까요?"
  rsh "sudo DEBIAN_FRONTEND=noninteractive apt-get update -qq"
  rsh "sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq certbot" \
    || die "certbot 설치 실패"
  ok "설치 완료"
fi

# ── 4. 발급 통로가 열려 있는지 ──────────────────────────────────────────
# nginx 설정에 /.well-known/acme-challenge/ 예외가 있어야 합니다.
# 없으면 'location ~ /\.' deny 규칙에 걸려 발급도 갱신도 실패합니다.
say "발급 통로 확인"
rsh "sudo mkdir -p $WEB_DIR/.well-known/acme-challenge \
     && echo ok | sudo tee $WEB_DIR/.well-known/acme-challenge/ping >/dev/null \
     && sudo chown -R www-data:www-data $WEB_DIR/.well-known"
PING=$(curl -s --max-time 10 "http://$DOMAIN/.well-known/acme-challenge/ping" || true)
rsh "sudo rm -f $WEB_DIR/.well-known/acme-challenge/ping"
if [ "$PING" != "ok" ]; then
  warn "발급 통로가 막혀 있습니다 (받은 값: '${PING:-없음}')"
  echo
  echo "   nginx 설정에 아래 예외가 있어야 합니다."
  echo "   최신 10-deploy-app.sh 에는 들어 있습니다. 먼저 이걸 실행하세요:"
  echo
  echo "        ./10-deploy-app.sh"
  echo
  die "발급 통로가 열려야 인증서를 받을 수 있습니다"
fi
ok "http://$DOMAIN/.well-known/... 접근 가능"

# ── 5. 발급 ─────────────────────────────────────────────────────────────
say "인증서 발급"
printf '   알림 받을 이메일 (만료 경고용, 그냥 Enter 면 생략): '
read -r EMAIL
if [ -n "$EMAIL" ]; then
  EMAIL_OPT="--email $EMAIL"
else
  EMAIL_OPT="--register-unsafely-without-email"
fi

# 도메인 목록. www 가 이 서버를 가리킬 때만 함께 넣습니다.
# 안 가리키는 도메인을 넣으면 전체 발급이 실패합니다.
DOMS="-d $DOMAIN"
WWW_IP=$(ipv4_of "www.$DOMAIN" || true)
if [ "$WWW_IP" = "$SERVER_IP" ]; then
  DOMS="$DOMS -d www.$DOMAIN"
  ok "www.$DOMAIN 도 함께 발급합니다"
else
  echo "   www.$DOMAIN 은 이 서버를 안 가리켜 제외합니다 (문제 없습니다)"
fi

CERTBOT="sudo certbot certonly --webroot -w $WEB_DIR $DOMS \
  --agree-tos --non-interactive --no-eff-email $EMAIL_OPT"

# 먼저 스테이징으로 예행 연습합니다. 여기서 실패해도 횟수에 안 잡힙니다.
echo "   먼저 예행 연습(dry-run)을 합니다. 실패해도 발급 횟수에 안 잡힙니다."
if rsh "$CERTBOT --dry-run" 2>&1 | sed 's/^/   /' | tail -12; then
  ok "예행 연습 통과"
else
  die "예행 연습 실패 — 위 메시지를 확인하세요 (실제 발급은 시도하지 않았습니다)"
fi

confirm "실제 인증서를 발급할까요?"
rsh "$CERTBOT" 2>&1 | sed 's/^/   /' | tail -12 || die "발급 실패"

if rsh "sudo test -f /etc/letsencrypt/live/$DOMAIN/fullchain.pem"; then
  ok "인증서 발급 완료"
  rsh "sudo certbot certificates 2>/dev/null | grep -E 'Certificate Name|Domains|Expiry'" \
    | sed 's/^/   /' || true
else
  die "인증서 파일이 없습니다"
fi

# ── 6. 자동 갱신 ────────────────────────────────────────────────────────
# certbot 패키지가 systemd 타이머를 함께 깔아 둡니다. 90일마다 자동입니다.
# 갱신도 /.well-known/acme-challenge/ 를 쓰므로, 4번에서 확인한 예외가
# 계속 살아 있어야 합니다. 10-deploy-app.sh 가 항상 넣어 줍니다.
say "자동 갱신 확인"
rsh "sudo certbot renew --dry-run" 2>&1 | tail -6 | sed 's/^/   /' \
  && ok "자동 갱신 정상 (90일마다)" \
  || warn "갱신 예행 연습 실패 — 지금 발급된 인증서는 90일간 유효합니다"

cat <<DONE

$(printf '\033[1;32m')── 다음 한 단계 ──$(printf '\033[0m')

   nginx 설정은 10-deploy-app.sh 가 씁니다. 지금 다시 실행하세요.
   인증서가 생겼으므로 이번엔 https 블록으로 씁니다.

        ./10-deploy-app.sh

   그 다음 확인:

        bash checksite.sh https://$DOMAIN      # 통과 20 · 실패 0
        curl -sI http://$DOMAIN | head -1      # 301 (http → https)

   ★ 재배포해도 https 가 유지되는지 꼭 확인하세요:

        ./10-deploy-app.sh
        bash checksite.sh https://$DOMAIN      # 여전히 20/20 이어야 합니다

DONE
