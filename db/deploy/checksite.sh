#!/usr/bin/env bash
# 배포된 사이트를 밖에서 점검합니다.  사용법:  bash checksite.sh http://서버IP
BASE="${1:?사용법: bash checksite.sh http://서버IP}"
BASE="${BASE%/}"
pass=0; fail=0
ok()   { printf '  \033[32m✅\033[0m %s\n' "$*"; pass=$((pass+1)); }
bad()  { printf '  \033[31m❌\033[0m %s\n' "$*"; fail=$((fail+1)); }
head_() { printf '\n\033[1;36m== %s\033[0m\n' "$*"; }

code() { curl -s -o /dev/null -w '%{http_code}' --max-time 15 "$1"; }
jlen() { curl -s --max-time 15 "$1" | python3 -c 'import json,sys;print(len(json.load(sys.stdin)))' 2>/dev/null || echo x; }

head_ "화면"
for p in / /notices.html /notice.html?id=66 /calendar.html /search.html "/page.html?slug=vision"; do
  c=$(code "$BASE$p"); [ "$c" = 200 ] && ok "$p  $c" || bad "$p  $c"
done

head_ "API"
h=$(curl -s --max-time 15 "$BASE/api/health")
echo "$h" | grep -q '"database":"ok"' && ok "health  $h" || bad "health  $h"
n=$(jlen "$BASE/api/notices"); [ "$n" = 71 ] && ok "공지 $n건" || bad "공지 $n건 (기대 71)"
e=$(jlen "$BASE/api/events");  [ "$e" = 33 ] && ok "일정 $e건" || bad "일정 $e건 (기대 33)"
g=$(jlen "$BASE/api/pages");   [ "$g" = 20 ] && ok "문서 $g건" || bad "문서 $g건 (기대 20)"

head_ "한글"
t=$(curl -s --max-time 15 "$BASE/api/notices?limit=1" | python3 -c 'import json,sys;print(json.load(sys.stdin)[0]["title"])' 2>/dev/null)
case "$t" in *[가-힣]*) ok "한글 정상: $t" ;; *) bad "한글 깨짐/실패: $t" ;; esac

head_ "노출 차단 (열려 있으면 안 되는 것)"
for p in /db/seed.sql /api/.env /.git/config /api/config.py; do
  c=$(code "$BASE$p"); [ "$c" = 200 ] && bad "$p 가 열려 있음! ($c)" || ok "$p  $c"
done

head_ "★ 챗봇 — 목록이 바뀌는가"
ask() {
  curl -s --max-time 30 -X POST "$BASE/api/chat" \
       -H 'Content-Type: application/json' \
       -d "{\"message\": \"$1\"}"
}
for q in "이번 주 마감인 장학금 알려줘" "근로장학금 공고 있어?" "취업 관련 공지 보여줘" "기숙사 얘기 있어?"; do
  r=$(ask "$q")
  out=$(echo "$r" | python3 -c '
import json,sys
d=json.load(sys.stdin); a=d["action"]
print(a["type"], a["category"] or "-", a["subCategory"] or "-", a["keyword"] or "-", len(d["sources"]), d["answer"][:46].replace("\n"," "), sep="|")
' 2>/dev/null)
  if [ -z "$out" ]; then bad "$q  → 응답 파싱 실패: ${r:0:80}"; continue; fi
  IFS='|' read -r ty cat sub kw ns ans <<<"$out"
  if [ "$ty" = filter ] && [ "$ns" -gt 0 ]; then
    ok "$q"
    printf '       action=%s cat=%s sub=%s kw=%s 근거=%s\n       "%s..."\n' "$ty" "$cat" "$sub" "$kw" "$ns" "$ans"
  else
    bad "$q  → type=$ty 근거=$ns"
  fi
done

head_ "범위 밖 질문"
r=$(ask "오늘 점심 뭐 먹지?")
ty=$(echo "$r" | python3 -c 'import json,sys;print(json.load(sys.stdin)["action"]["type"])' 2>/dev/null)
[ "$ty" = none ] && ok "목록 안 바뀜 (type=none)" || bad "type=$ty (none 이어야 함)"

printf '\n\033[1m통과 %d · 실패 %d\033[0m\n' "$pass" "$fail"
[ "$fail" -eq 0 ] && echo "→ 심사에 낼 준비 완료" || echo "→ 위 ❌ 항목을 확인하세요"
