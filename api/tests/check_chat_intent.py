#!/usr/bin/env python3
"""모델이 엉뚱하게 굴 때도 챗봇이 제 일을 하는지 확인합니다.

실제 서버에서 이런 일이 있었습니다.

    "취업 관련 공지 보여줘"   → 모델이 찾아보지도 않고 "안내할 수 없습니다"
    "기숙사 얘기 있어?"       → 같음
    "이번 주 마감인 장학금"    → 모델이 sub_category=근로 를 덧붙여 3건이 1건으로

프롬프트만 고치면 모델이 바뀔 때 다시 생깁니다. 그래서 코드 쪽에 안전망을 뒀고,
여기서 그 안전망이 살아 있는지 확인합니다.

가짜 OpenAI 클라이언트를 주입하므로 실제 호출과 비용이 없습니다.

    cd api
    .venv/bin/python tests/check_chat_intent.py
"""
import hashlib
import json
import os
import sqlite3
import sys
import tempfile
import types

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.dirname(HERE))

DB = sys.argv[1] if len(sys.argv) > 1 else os.path.join(tempfile.mkdtemp(), "intent.db")
if not os.path.exists(DB):
    from check_chat_guards import build_db
    build_db(DB)

os.environ["DATABASE_URL"] = "sqlite:///" + DB
os.environ["OPENAI_API_KEY"] = "sk-fake"


# ── 가짜 OpenAI ─────────────────────────────────────────────────────────
class _Fn:
    def __init__(self, a):
        self.arguments = a if isinstance(a, str) else json.dumps(a, ensure_ascii=False)


class _Call:
    def __init__(self, a):
        self.id = "c1"
        self.function = _Fn(a)


class _Msg:
    def __init__(self, content=None, calls=None):
        self.content = content
        self.tool_calls = calls

    def model_dump(self, **k):
        return {"role": "assistant", "content": self.content}


class _Resp:
    def __init__(self, m):
        self.choices = [type("C", (), {"message": m})()]


SCRIPT = {"first": None}


class _Comp:
    def create(self, **kw):
        if any(isinstance(m, dict) and m.get("role") == "tool" for m in kw["messages"]):
            return _Resp(_Msg(content="검색 결과를 바탕으로 답합니다."))
        return SCRIPT["first"]()


class OpenAI:
    def __init__(self, **k):
        self.chat = type("X", (), {"completions": _Comp()})()


_mod = types.ModuleType("openai")
_mod.OpenAI = OpenAI
sys.modules["openai"] = _mod

from fastapi.testclient import TestClient          # noqa: E402
import main                                        # noqa: E402

client = TestClient(main.app)
PASS = FAIL = 0


def chk(label, cond, extra=""):
    global PASS, FAIL
    if cond:
        PASS += 1
        print(f"  \033[32m✅\033[0m {label}" + (f"   {extra}" if extra else ""))
    else:
        FAIL += 1
        print(f"  \033[31m❌\033[0m {label}" + (f"   {extra}" if extra else ""))


def ask(q):
    con = sqlite3.connect(DB)
    con.execute("DELETE FROM chat_cache")
    con.commit()
    con.close()
    return client.post("/api/chat", json={"message": q}).json()


def refuses(text):
    """모델이 찾아보지도 않고 거절하는 상황."""
    return lambda: _Resp(_Msg(content=text))


def calls(args):
    return lambda: _Resp(_Msg(calls=[_Call(args)]))


print("\033[1;36m== 1. 모델이 찾아보지도 않고 거절할 때\033[0m")
SCRIPT["first"] = refuses("취업 관련 공지는 안내할 수 없습니다.")
for q in ["취업 관련 공지 보여줘", "기숙사 얘기 있어?", "축제 언제야?", "졸업 요건 알려줘"]:
    d = ask(q)
    a = d["action"]
    chk(f"[{q}] 결과가 나옴",
        a["type"] == "filter" and d["sources"],
        f"cat={a['category']} kw={a['keyword']} 근거={len(d['sources'])}")

print("\n\033[1;36m== 2. 진짜 범위 밖은 그대로 거절\033[0m")
SCRIPT["first"] = refuses("공지사항만 안내할 수 있습니다.")
for q in ["오늘 점심 뭐 먹지?", "날씨 어때?", "로또 번호 알려줘"]:
    d = ask(q)
    chk(f"[{q}] type=none", d["action"]["type"] == "none", d["action"]["type"])

print("\n\033[1;36m== 3. 모델이 하위 분류를 멋대로 덧붙일 때\033[0m")
SCRIPT["first"] = calls({"category": "장학", "sub_category": "근로", "due_within_days": 7})
d = ask("이번 주 마감인 장학금 알려줘")
chk("'근로'라고 안 했으면 버림", d["action"]["subCategory"] is None,
    f"sub={d['action']['subCategory']}")
chk("장학 전체가 잡힘", len(d["sources"]) > 0, f"근거={len(d['sources'])}")

d = ask("근로장학금 공고 있어?")
chk("'근로'라고 했으면 유지", d["action"]["subCategory"] == "근로",
    f"sub={d['action']['subCategory']}")

print("\n\033[1;36m== 4. 모델이 제대로 부를 때는 그대로 존중\033[0m")
SCRIPT["first"] = calls({"category": "채용"})
d = ask("채용 공지 보여줘")
chk("모델 인자 사용", d["action"]["category"] == "채용", d["action"]["category"])
chk("모델 답변 사용", "검색 결과를 바탕으로" in d["answer"], d["answer"][:30])

print("\n\033[1;36m== 5. 모델이 검색은 했지만 0건일 때\033[0m")
# 도구를 아예 안 부른 것과 결과가 같습니다. 안전망이 여기에도 걸려야 합니다.
SCRIPT["first"] = calls({"keyword": "존재하지않는낱말zzz"})
d = ask("취업 관련 공지 보여줘")
a = d["action"]
chk("규칙 결과로 대체됨", a["type"] == "filter" and d["sources"],
    f"cat={a['category']} kw={a['keyword']} 근거={len(d['sources'])}")

d = ask("오늘 점심 뭐 먹지?")
chk("범위 밖은 0건이어도 거절", d["action"]["type"] == "none", d["action"]["type"])

print("\n\033[1;36m== 6. 근거 없는 답은 캐시하지 않는다\033[0m")


def cache_rows():
    con = sqlite3.connect(DB)
    n = con.execute("SELECT COUNT(*) FROM chat_cache").fetchone()[0]
    con.close()
    return n


SCRIPT["first"] = refuses("공지사항만 안내할 수 있습니다.")
ask("날씨 어때?")                                  # ask 가 먼저 캐시를 비웁니다
chk("거절은 캐시에 안 남음", cache_rows() == 0, f"{cache_rows()}행")

SCRIPT["first"] = calls({"category": "채용"})
ask("채용 공지 보여줘")
chk("근거 있는 답은 캐시됨", cache_rows() == 1, f"{cache_rows()}행")

print("\n\033[1;36m== 7. 어제 캐시된 답을 오늘 쓰면 안 된다\033[0m")
# 실제로 있었던 일입니다.
#   챗봇: "2026-09-03 이전 마감인 장학 공지는 3건입니다"  ← 어제 저장된 답
#   목록: "총 2건"                                       ← 브라우저가 오늘 다시 거름
# 캐시 열쇠가 질문 글자만 해싱하면 '이번 주 마감' 같은 답이 하루 지나 어긋납니다.


def seed_cache(question, answer):
    """옛 방식(질문만 해싱)으로 캐시 한 줄을 심습니다."""
    con = sqlite3.connect(DB)
    con.execute("DELETE FROM chat_cache")
    con.execute(
        "INSERT INTO chat_cache (question_hash, question, response, hit_count,"
        " created_at) VALUES (?, ?, ?, 0, datetime('now', '-1 day'))",
        (hashlib.sha256(question.strip().encode("utf-8")).hexdigest(), question,
         json.dumps({"answer": answer,
                     "action": {"type": "filter", "category": "장학",
                                "subCategory": None, "keyword": None,
                                "dueBefore": "1999-01-01", "noticeId": None},
                     "sources": [{"id": 1, "title": "어제 것", "dueDate": None}]},
                    ensure_ascii=False)))
    con.commit()
    con.close()


STALE = "어제 캐시된 답입니다"
SCRIPT["first"] = calls({"category": "장학", "due_within_days": 7})
seed_cache("이번 주 마감인 장학금 알려줘", STALE)
d = client.post("/api/chat", json={"message": "이번 주 마감인 장학금 알려줘"}).json()
chk("어제 답이 안 나옴", STALE not in d["answer"], d["answer"][:38])
chk("어제 dueBefore 가 안 나옴", d["action"]["dueBefore"] != "1999-01-01",
    f"dueBefore={d['action']['dueBefore']}")

# 같은 날 안에서는 캐시가 계속 들어야 합니다. 고치다가 캐시를 죽이면 안 됩니다.
con = sqlite3.connect(DB)
con.execute("DELETE FROM chat_cache")
con.commit()
con.close()
SCRIPT["first"] = calls({"category": "채용"})
client.post("/api/chat", json={"message": "채용 공지 보여줘"})
client.post("/api/chat", json={"message": "채용 공지 보여줘"})
con = sqlite3.connect(DB)
rows, hits = con.execute(
    "SELECT COUNT(*), COALESCE(MAX(hit_count), 0) FROM chat_cache").fetchone()
con.close()
chk("같은 날 두 번째 질문은 캐시 적중", rows == 1 and hits >= 1,
    f"{rows}행 · 적중 {hits}회")

print(f"\n\033[1m통과 {PASS} · 실패 {FAIL}\033[0m")
sys.exit(0 if FAIL == 0 else 1)
