#!/usr/bin/env bash
# 단계 10 — 프론트와 API 를 서버 한 곳에서 서빙합니다 (nginx 단일 오리진).
#
#   nginx :80
#     ├─ /      →  /var/www/inhatc      (정적 파일)
#     └─ /api/  →  127.0.0.1:$API_PORT   (uvicorn, 기본 8010)
#
# 같은 주소에서 나오므로 CORS 설정도, https/http 혼용 차단(mixed content)도
# 생기지 않습니다. 심사에 낼 링크는 http://<서버IP>/ 하나입니다.
#
# 코드를 고친 뒤 다시 실행하면 그대로 업데이트 배포가 됩니다.
. "$(dirname "$0")/_common.sh"

REPO_URL="https://github.com/ZAE0N/2026_starthon_miniproject.git"
APP_DIR="/home/$SSH_USER/app"
WEB_DIR="/var/www/inhatc"
BRANCH="${DEPLOY_BRANCH:-main}"
# uvicorn 이 들을 포트. 서버에서 이미 쓰는 포트와 겹치면 config.env 에서 바꾸세요.
API_PORT="${API_PORT:-8010}"

say "배포 대상"
echo "   저장소 : $REPO_URL ($BRANCH)"
echo "   서버   : $SSH_USER@$SERVER_IP"
echo "   앱     : $APP_DIR"
echo "   정적   : $WEB_DIR"
echo "   API    : 127.0.0.1:$API_PORT"

# ── 0. 포트가 비어 있는지 ───────────────────────────────────────────────
# 우리 서비스를 먼저 멈춘 뒤에 확인합니다. 그래야 남는 점유자가 있으면
# 그건 확실히 다른 프로그램입니다.
# (프로세스 이름으로 구분하면 venv 의 uvicorn 이 python3 로 보여 오판합니다.)
say "포트 확인 ($API_PORT)"
rsh "sudo systemctl stop inhatc-api 2>/dev/null || true"
sleep 1
HOLDER=$(rsh "sudo ss -tlnp 2>/dev/null | grep -E ':$API_PORT( |\\$)' || true")
if [ -n "$HOLDER" ]; then
  warn "$API_PORT 을 다른 프로그램이 쓰고 있습니다:"
  echo "$HOLDER" | sed 's/^/      /'
  cat <<PORTHELP

   그 프로그램은 끄지 마세요. 우리 API 의 포트를 옮기면 됩니다.
   config.env 에 한 줄 추가하고 다시 실행하세요:

        echo 'API_PORT=8020' >> $HERE/config.env
        ./10-deploy-app.sh

   nginx 가 /api 를 그 포트로 넘겨주므로 접속 주소는 그대로입니다.
PORTHELP
  die "포트가 겹쳐 중단합니다"
fi
ok "$API_PORT 사용 가능"

# ── 1. 필요한 패키지 ────────────────────────────────────────────────────
say "패키지 확인"
NEED=""
for pkg in nginx git python3-venv; do
  rsh "dpkg -s $pkg >/dev/null 2>&1" || NEED="$NEED $pkg"
done
if [ -n "$NEED" ]; then
  echo "   설치 필요:$NEED"
  confirm "설치할까요?"
  rsh "sudo DEBIAN_FRONTEND=noninteractive apt-get update -qq"
  rsh "sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq$NEED" || die "설치 실패"
fi
ok "nginx · git · python3-venv 준비됨"

# ── 2. 코드 받기 ────────────────────────────────────────────────────────
say "코드 받기"
if rsh "[ -d $APP_DIR/.git ]"; then
  rsh "cd $APP_DIR && git fetch origin -q && git checkout -q $BRANCH && git reset --hard -q origin/$BRANCH"
  ok "최신으로 갱신"
else
  rsh "rm -rf $APP_DIR && git clone -q -b $BRANCH $REPO_URL $APP_DIR" || die "clone 실패"
  ok "새로 받음"
fi
rsh "cd $APP_DIR && git log --oneline -1" | sed 's/^/   /'

# ── 3. .env  ★ 비밀값은 서버에만 둡니다 ────────────────────────────────
say "백엔드 설정 (.env)"
if rsh "[ -f $APP_DIR/api/.env ]"; then
  ok "이미 있습니다 (건드리지 않습니다)"
  rsh "grep -oE '^[A-Z_]+=' $APP_DIR/api/.env" | sed 's/^/   /'
  echo
  echo "   값을 바꾸려면 서버에서 직접 여세요:"
  echo "      ssh -i $SSH_KEY $SSH_USER@$SERVER_IP"
  echo "      nano $APP_DIR/api/.env && sudo systemctl restart inhatc-api"
else
  warn ".env 가 없습니다. 지금 만듭니다."
  echo "   입력한 값은 이 컴퓨터에 저장되지 않고 서버로 바로 들어갑니다."
  echo
  printf '   DB 비밀번호 (07-appuser.sh 가 출력한 값): '
  read -rs DBPW; echo
  [ -n "$DBPW" ] || die "비밀번호가 비었습니다"
  printf '   OpenAI API 키 (없으면 그냥 Enter — 규칙 기반으로 동작): '
  read -rs OAIKEY; echo

  rshin "cat > $APP_DIR/api/.env && chmod 600 $APP_DIR/api/.env" <<ENVEOF
DATABASE_URL=mysql+pymysql://$APP_USER:$DBPW@127.0.0.1:3306/$DB_NAME?charset=utf8mb4
OPENAI_API_KEY=$OAIKEY
OPENAI_MODEL=gpt-4o-mini
CORS_ORIGINS=
ENVEOF
  unset DBPW OAIKEY
  ok ".env 생성 (권한 600)"
  echo "   DB 는 127.0.0.1 로 붙습니다. API 가 DB 와 같은 서버에 있으니"
  echo "   외부 IP 를 거칠 이유가 없고, 그편이 더 안전하고 빠릅니다."
fi

# ── 4. 파이썬 환경 ──────────────────────────────────────────────────────
say "파이썬 환경"
rsh "[ -d $APP_DIR/api/.venv ] || python3 -m venv $APP_DIR/api/.venv"
rsh "$APP_DIR/api/.venv/bin/pip install -q --upgrade pip" || true
rsh "$APP_DIR/api/.venv/bin/pip install -q -r $APP_DIR/api/requirements.txt" || die "의존성 설치 실패"
rsh "$APP_DIR/api/.venv/bin/python -c \"import fastapi, sqlalchemy, pymysql; print('  fastapi', fastapi.__version__)\"" | sed 's/^/ /'
ok "설치 완료"

# ── 5. 정적 파일 ────────────────────────────────────────────────────────
say "정적 파일 배치"
# 저장소 폴더를 통째로 서빙하면 db/seed.sql · api/.env · .git 까지
# 인터넷에 열립니다. 화면에 필요한 것만 골라서 복사합니다.
rsh "sudo mkdir -p $WEB_DIR && sudo rm -rf $WEB_DIR/* \
     && sudo cp $APP_DIR/*.html $WEB_DIR/ \
     && sudo cp -r $APP_DIR/css $APP_DIR/js $WEB_DIR/ \
     && sudo chown -R www-data:www-data $WEB_DIR"
rsh "ls $WEB_DIR" | tr '\n' ' ' | sed 's/^/   /'; echo
ok "복사 완료 (db/ · api/ · .git 은 배포하지 않습니다)"

# ── 6. uvicorn 서비스 ───────────────────────────────────────────────────
say "API 서비스 등록"
rshin "sudo tee /etc/systemd/system/inhatc-api.service >/dev/null" <<UNITEOF
[Unit]
Description=인하공전 미니프로젝트 API
After=network.target mysql.service

[Service]
Type=simple
User=$SSH_USER
WorkingDirectory=$APP_DIR/api
ExecStart=$APP_DIR/api/.venv/bin/uvicorn main:app --host 127.0.0.1 --port $API_PORT
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
UNITEOF
rsh "sudo systemctl daemon-reload && sudo systemctl reset-failed inhatc-api 2>/dev/null; sudo systemctl enable -q --now inhatc-api && sudo systemctl restart inhatc-api"
sleep 3
STATE=$(rsh "systemctl is-active inhatc-api")
echo "   상태: $STATE"
if [ "$STATE" != "active" ]; then
  rsh "sudo journalctl -u inhatc-api -n 30 --no-pager" | sed 's/^/   /'
  die "API 가 뜨지 않았습니다. 위 로그를 확인하세요"
fi
ok "uvicorn 실행 중 (127.0.0.1:$API_PORT)"

# ── 7. nginx ────────────────────────────────────────────────────────────
say "nginx 설정"
rshin "sudo tee /etc/nginx/sites-available/inhatc >/dev/null" <<NGINXEOF
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    root $WEB_DIR;
    index index.html;

    # 한글이 깨지지 않도록
    charset utf-8;

    # API 는 uvicorn 으로 넘깁니다. 같은 주소라 CORS 가 필요 없습니다.
    location /api/ {
        proxy_pass http://127.0.0.1:$API_PORT;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_read_timeout 30s;
    }

    location / {
        try_files \$uri \$uri/ =404;
    }

    # 혹시 모를 노출 차단
    location ~ /\\. { deny all; }
}
NGINXEOF
rsh "sudo ln -sf /etc/nginx/sites-available/inhatc /etc/nginx/sites-enabled/inhatc \
     && sudo rm -f /etc/nginx/sites-enabled/default"
rsh "sudo nginx -t" 2>&1 | sed 's/^/   /' || die "nginx 설정 오류"
rsh "sudo systemctl reload nginx || sudo systemctl restart nginx"
ok "nginx 재적용"

# ── 8. 방화벽 ───────────────────────────────────────────────────────────
say "서버 방화벽 (ufw)"
UFW=$(rsh "sudo ufw status 2>/dev/null | head -1 || echo 'ufw 없음'")
echo "   $UFW"
if echo "$UFW" | grep -qE "inactive|없음"; then
  ok "ufw 가 꺼져 있습니다 — Lightsail 콘솔만 열면 됩니다"
else
  rsh "sudo ufw allow 80/tcp && sudo ufw reload" >/dev/null
  ok "80 포트 허용"
fi

# ── 9. 서버 안에서 확인 ─────────────────────────────────────────────────
say "서버 내부 점검"
rsh "curl -s -o /dev/null -w '   /              %{http_code}\n' http://127.0.0.1/"
rsh "curl -s -o /dev/null -w '   /notices.html  %{http_code}\n' http://127.0.0.1/notices.html"
rsh "curl -s -w '\n' http://127.0.0.1/api/health" | sed 's/^/   /api\/health   /'
CNT=$(rsh "curl -s http://127.0.0.1/api/notices | python3 -c 'import json,sys;print(len(json.load(sys.stdin)))' 2>/dev/null || echo ?")
echo "   /api/notices   $CNT 건"
echo "   [한글 확인]"
rsh "curl -s 'http://127.0.0.1/api/notices?limit=2' | python3 -c \"
import json,sys
for n in json.load(sys.stdin): print('     ', n['id'], n['title'])
\"" 2>/dev/null || warn "한글 확인 실패"

cat <<BOX

╔══════════════════════════════════════════════════════════════╗
   마지막 한 단계 — Lightsail 콘솔에서 80 포트 열기

   1. Lightsail 콘솔 → 인스턴스 → [네트워킹] 탭
   2. IPv4 방화벽 → [규칙 추가]
   3. 애플리케이션 : HTTP     포트 : 80
   4. ★ 여기는 IP 제한을 걸지 않습니다 (전체 공개)
      심사위원이 접속해야 하므로 3306 과 달리 열어 둡니다.

   그 다음 브라우저에서:

        http://$SERVER_IP/

╚══════════════════════════════════════════════════════════════╝

   코드를 고친 뒤에는 이 스크립트를 다시 실행하면 배포됩니다.
   로그 보기:  ssh -i $SSH_KEY $SSH_USER@$SERVER_IP "sudo journalctl -u inhatc-api -f"
BOX
