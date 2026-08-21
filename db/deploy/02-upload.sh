#!/usr/bin/env bash
# 단계 1(스왑) + 단계 3 — 파일을 서버로 보냅니다.
. "$(dirname "$0")/_common.sh"

MEM=$(rsh "free -m | awk '/^Mem:/{print \$2}'")
if [ "$MEM" -lt 1024 ] && ! rsh "swapon --show" | grep -q .; then
  say "스왑 생성 (메모리 ${MEM}MB)"
  confirm "2GB 스왑 파일을 만들까요?"
  rsh "sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile && grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab"
  ok "스왑 설정 완료"
fi

say "업로드"
echo "   보낼 파일 : $DUMP_FILE"
echo "   받을 위치 : $SSH_USER@$SERVER_IP:~/db/"
confirm "전송할까요?"

rsh "mkdir -p ~/db"
scp -i "$SSH_KEY" "$DUMP_FILE" "$SSH_USER@$SERVER_IP:~/db/"

say "서버에 도착한 파일"
rsh "ls -lh ~/db/" | sed 's/^/   /'

say "전송 무결성 확인 (체크섬 비교)"
L=$(shasum -a 256 "$DUMP_FILE" 2>/dev/null | awk '{print $1}' || sha256sum "$DUMP_FILE" | awk '{print $1}')
R=$(rsh "sha256sum ~/db/$(basename "$DUMP_FILE") | awk '{print \$1}'")
if [ "$L" = "$R" ]; then ok "일치 ($L)"; else die "불일치. 다시 전송하세요"; fi

echo
echo "   다음: ./03-backup.sh  (기존 DB가 없으면 건너뛰고 04 로)"
