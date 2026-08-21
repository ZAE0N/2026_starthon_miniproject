#!/usr/bin/env bash
# 단계 0 — 받은 파일이 무엇인지 확인. 서버는 건드리지 않습니다.
. "$(dirname "$0")/_common.sh"

say "파일 정보"
[ -f "$DUMP_FILE" ] || die "파일이 없습니다: $DUMP_FILE"
ls -lh "$DUMP_FILE"
file "$DUMP_FILE" 2>/dev/null || true

say "파일 형태 판별"
if grep -qi "CREATE DATABASE" "$DUMP_FILE"; then
  ok "CREATE DATABASE 있음 → 전체 덤프. 그대로 임포트하면 됩니다"
  grep -in "CREATE DATABASE" "$DUMP_FILE" | sed 's/^/      /'
else
  warn "CREATE DATABASE 없음 → DB를 먼저 만들고 넣어야 합니다"
fi

say "테이블 목록"
grep -in "CREATE TABLE" "$DUMP_FILE" | sed 's/^/   /' || warn "CREATE TABLE 이 없습니다"

say "문자셋  ★ 가장 중요"
if grep -qi "utf8mb4" "$DUMP_FILE"; then
  ok "utf8mb4 선언 있음"
elif grep -qi "charset=utf8[^m]" "$DUMP_FILE"; then
  warn "utf8(3바이트)만 있습니다. 한글 일부가 깨질 수 있습니다"
  warn "고치려면:  sed -i.bak 's/CHARSET=utf8 /CHARSET=utf8mb4 /g' \"$DUMP_FILE\""
else
  warn "문자셋 선언이 아예 없습니다 → 서버 기본값을 그대로 상속합니다"
  warn "01-check-server.sh 에서 서버 기본 문자셋이 utf8mb4 인지 반드시 확인하세요"
  warn "utf8mb4 가 아니면 이 파일을 고치기 전에는 임포트하면 안 됩니다"
fi

say "인코딩"
if head -c 3 "$DUMP_FILE" | od -An -tx1 | grep -q "ef bb bf"; then
  warn "UTF-8 BOM 이 있습니다. 첫 줄에서 문법 오류가 날 수 있습니다"
else
  ok "BOM 없음"
fi

say "CHECK 제약"
grep -qi "CHECK" "$DUMP_FILE" && ok "CHECK 제약 있음" || warn "CHECK 제약 없음 (설계서 요구사항. 지금은 넘어감)"

say "앞부분 미리보기 — 한글이 깨져 보이면 인코딩 문제입니다"
head -20 "$DUMP_FILE" | sed 's/^/   /'

echo
ok "확인 끝. 서버에는 아무것도 하지 않았습니다."
echo "   다음: ./01-check-server.sh"
