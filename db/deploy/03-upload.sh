#!/usr/bin/env bash
# 단계 3 — 덤프 파일을 서버로 보냅니다.
. "$(dirname "$0")/_common.sh"

say "업로드"
[ -f "$DUMP_FILE" ] || die "파일이 없습니다: $DUMP_FILE"
echo "   보낼 파일 : $DUMP_FILE"
echo "   받을 위치 : $SSH_USER@$SERVER_IP:~/db/"
confirm "전송할까요?"

rsh "mkdir -p ~/db"
scp -i "$SSH_KEY" "$DUMP_FILE" "$SSH_USER@$SERVER_IP:~/db/"

say "서버에 도착한 파일"
rsh "ls -lh ~/db/" | sed 's/^/   /'

say "전송 무결성 확인 (체크섬 비교)"
L=$(sha256sum "$DUMP_FILE" 2>/dev/null | awk '{print $1}' || shasum -a 256 "$DUMP_FILE" | awk '{print $1}')
R=$(rsh "sha256sum ~/db/$(basename "$DUMP_FILE") | awk '{print \$1}'")
if [ "$L" = "$R" ]; then ok "일치 ($L)"; else die "불일치 — 다시 전송하세요"; fi

echo
echo "   다음: ./04-backup.sh  (기존 DB가 없으면 건너뛰고 05 로)"
