#!/usr/bin/env bash
# 단계 6 — 검증 쿼리 8개. 결과를 그대로 보여줍니다.
. "$(dirname "$0")/_common.sh"

M="sudo mysql --default-character-set=utf8mb4 -B $DB_NAME"
q() { rsh "$M -e \"$1\""; }

say "① 테이블 목록"
q "SHOW TABLES;" | sed 's/^/   /'
echo "   기준: notices, academic_events, pages, chat_cache (4개)"

say "② 테이블 문자셋  ★ utf8mb4 여야 합니다"
q "SELECT table_name, table_collation FROM information_schema.tables WHERE table_schema='$DB_NAME';" | sed 's/^/   /'

say "③ 건수"
q "SELECT (SELECT COUNT(*) FROM notices) AS notices, (SELECT COUNT(*) FROM academic_events) AS events, (SELECT COUNT(*) FROM pages) AS pages;" | sed 's/^/   /'
echo "   기준: 71 / 33 / 20"

say "④ 한글 깨짐  ★ 가장 중요"
q "SELECT id, title FROM notices LIMIT 3;" | sed 's/^/   /'
echo "   물음표(???)가 보이면 문자셋 문제입니다."

say "⑤ 카테고리 분포"
q "SELECT category, COUNT(*) AS cnt FROM notices GROUP BY category;" | sed 's/^/   /'

say "⑥ 장학 하위 분류"
q "SELECT COALESCE(sub_category,'(일반)') AS sub, COUNT(*) AS cnt FROM notices WHERE category='장학' GROUP BY sub;" | sed 's/^/   /'
echo "   기준: 근로 6건, 일반(NULL) 12건"

say "⑦ CHECK 제약 동작 확인 (잘못된 INSERT 를 거부해야 정상)"
if rsh "$M -e \"INSERT INTO notices (category, sub_category, title, content, author, created_at) VALUES ('학사','근로','__CHECK_TEST__','test','test',NOW());\"" 2>/dev/null; then
  warn "INSERT 가 성공했습니다 → CHECK 제약이 걸려 있지 않습니다"
  rsh "$M -e \"DELETE FROM notices WHERE title='__CHECK_TEST__';\""
  ok "테스트 행은 삭제했습니다"
else
  ok "INSERT 가 거부됐습니다 → CHECK 제약이 정상 동작합니다"
fi

say "⑧ 챗봇 시연용 데이터  ★ 0건이면 시연 중 빈 목록이 뜹니다"
echo "   [이번 주 마감 장학]"
q "SELECT COUNT(*) AS cnt FROM notices WHERE category='장학' AND due_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY);" | sed 's/^/      /'
echo "   [기숙사 관련]"
q "SELECT COUNT(*) AS cnt FROM notices WHERE title LIKE '%기숙사%' OR content LIKE '%기숙사%';" | sed 's/^/      /'

echo
echo "   기준값은 db/seed.sql (js/data.js 에서 생성) 기준입니다."
echo "   데이터를 바꿨다면 python3 db/tools/gen_seed.py 로 seed 를 다시 만드세요."
echo
echo "   다음: ./07-appuser.sh"
