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

print(f"\n\033[1m통과 {PASS} · 실패 {FAIL}\033[0m")
sys.exit(0 if FAIL == 0 else 1)
