"""챗봇 API.

핵심은 **함수 인자가 곧 화면 조작 명령**이라는 점입니다.
OpenAI 가 search_notices(...) 를 호출하면, 그 인자가 그대로 응답의 action 이 되고
프론트는 그 action 으로 목록을 바꿉니다.

키가 없거나 호출이 실패하면 chat_rules 로 답합니다. 응답 모양이 같아서
프론트는 어느 쪽이 답했는지 알 필요가 없습니다.
"""
import hashlib
import json
import logging
from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

import chat_rules
from chat_rules import CATEGORIES, MAX_ANSWER, MAX_MESSAGE, SUB_CATEGORIES
from config import OPENAI_API_KEY, OPENAI_MODEL
from db import get_db
from models import ChatCache, Notice
from schemas import ChatRequest, ChatResponse

log = logging.getLogger("chat")
router = APIRouter(prefix="/api/chat", tags=["chat"])

SYSTEM_PROMPT = """너는 인하공업전문대학 홈페이지의 공지사항 안내 도우미다.

학생이 찾는 공지를 search_notices 로 좁힌 뒤, 결과를 한두 문장으로 간결하게 답한다.

규칙
- 공지사항과 학사 안내에 대해서만 답한다. 그 밖의 질문에는 안내할 수 없다고 말한다.
- 답변에 없는 사실을 지어내지 않는다. 검색 결과에 있는 내용만 말한다.
- 건수를 먼저 말하고, 마감이 가까운 것이 있으면 그것을 짚어 준다.
- 존댓말로, 두 문장을 넘기지 않는다.

카테고리는 학사·행사·장학·채용·일반 다섯 가지다.
하위 분류는 장학 공지에만 있고 값은 '근로' 하나뿐이다."""

TOOLS = [{
    "type": "function",
    "function": {
        "name": "search_notices",
        "description": "조건에 맞는 학교 공지사항을 찾는다. 학생이 공지를 찾으면 반드시 호출한다.",
        "parameters": {
            "type": "object",
            "properties": {
                "category": {
                    "type": "string",
                    "enum": ["학사", "행사", "장학", "채용", "일반"],
                    "description": "공지 분류. 확실하지 않으면 넣지 않는다.",
                },
                "sub_category": {
                    "type": "string",
                    "enum": ["근로"],
                    "description": "장학 공지의 하위 분류. 근로장학을 물을 때만 쓴다.",
                },
                "keyword": {
                    "type": "string",
                    "description": "제목·본문에서 찾을 낱말. 예: 기숙사, 등록금, 졸업",
                },
                "due_within_days": {
                    "type": "integer",
                    "description": "며칠 안에 마감하는 것만. '이번 주'는 7, '오늘내일'은 2.",
                },
                "open_detail": {
                    "type": "boolean",
                    "description": "특정 공지 하나의 내용을 묻는 경우 true. 목록을 원하면 false.",
                },
            },
            "required": [],
        },
    },
}]


def _to_source(n: Notice) -> dict:
    return {"id": n.id, "title": n.title,
            "department": n.department,
            "dueDate": n.due_date.isoformat() if n.due_date else None}


def _clean_args(args: dict) -> dict:
    """모델이 돌려준 함수 인자를 우리가 믿을 수 있는 값으로 좁힙니다.

    모델은 정의에 없는 값도 보낼 수 있습니다. 그대로 쓰면 결과가 비거나
    (enum 밖 카테고리) 날짜 계산에서 터집니다(일수가 문자열이거나 10억일 때).
    """
    out: dict = {}

    category = args.get("category")
    if isinstance(category, str) and category in CATEGORIES:
        out["category"] = category

    sub = args.get("sub_category")
    # 하위 분류는 장학 공지에만 있습니다. 그 밖에서는 버립니다.
    if isinstance(sub, str) and sub in SUB_CATEGORIES and out.get("category") == "장학":
        out["sub_category"] = sub

    keyword = args.get("keyword")
    if isinstance(keyword, str) and keyword.strip():
        out["keyword"] = keyword.strip()[:50]

    days = args.get("due_within_days")
    if isinstance(days, bool):
        days = None
    if isinstance(days, (int, float)):
        days = int(days)
        if 1 <= days <= 365:                    # 그 밖은 의미가 없습니다
            out["due_within_days"] = days

    out["open_detail"] = bool(args.get("open_detail"))
    return out


def _clean_answer(text: str | None, fallback: str) -> str:
    """빈 답변과 지나치게 긴 답변을 막습니다.

    모델이 빈 문자열을 주면 말풍선이 빈 채로 뜨고,
    수천 자를 주면 채팅 패널이 통째로 밀립니다.
    """
    text = (text or "").strip()
    if not text:
        return fallback
    if len(text) > MAX_ANSWER:
        text = text[:MAX_ANSWER].rstrip() + "…"
    return text


def _pick_single(hits: list[Notice], keyword: str | None) -> Notice | None:
    """특정 공지 하나를 묻는 질문에서 이동할 대상을 고릅니다.

    본문에만 스친 공지로 잘못 이동하지 않도록 제목 일치를 우선합니다.
    고를 근거가 약하면 None 을 돌려주고 목록 필터로 남깁니다.
    """
    if not hits:
        return None
    if keyword:
        titled = [n for n in hits if keyword in n.title]
        if len(titled) == 1:
            return titled[0]
        if titled:
            return titled[0] if len(titled) <= 3 else None
    return hits[0] if len(hits) == 1 else None


def _cache_key(message: str) -> str:
    return hashlib.sha256(message.strip().encode("utf-8")).hexdigest()


def _ask_openai(db: Session, message: str) -> dict | None:
    """OpenAI Function Calling. 실패하면 None 을 돌려주고 호출부가 폴백합니다."""
    try:
        from openai import OpenAI
    except ImportError:
        log.warning("openai 패키지가 없습니다. 규칙 기반으로 답합니다.")
        return None

    client = OpenAI(api_key=OPENAI_API_KEY, timeout=15.0)
    today = date.today()
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT + f"\n\n오늘은 {today} 이다."},
        {"role": "user", "content": message},
    ]

    first = client.chat.completions.create(
        model=OPENAI_MODEL, messages=messages, tools=TOOLS, temperature=0.2,
    )
    choice = first.choices[0].message

    # 공지와 무관한 질문이면 도구를 부르지 않습니다
    if not choice.tool_calls:
        return {
            "answer": _clean_answer(
                choice.content,
                "공지사항에 대해 물어봐 주세요.",
            ),
            "action": chat_rules.empty_action(),
            "sources": [],
        }

    call = choice.tool_calls[0]
    try:
        raw = json.loads(call.function.arguments or "{}")
        if not isinstance(raw, dict):
            raw = {}
    except (ValueError, TypeError):
        raw = {}
    args = _clean_args(raw)

    days = args.get("due_within_days")
    due_before = today + timedelta(days=days) if days else None

    hits = chat_rules.search(
        db,
        category=args.get("category"),
        sub_category=args.get("sub_category"),
        keyword=args.get("keyword"),
        due_before=due_before,
    )

    # 검색 결과를 돌려주고 답변 문장을 받습니다
    messages.append(choice.model_dump(exclude_none=True))
    messages.append({
        "role": "tool",
        "tool_call_id": call.id,
        "content": json.dumps(
            {"count": len(hits),
             "notices": [{"title": n.title, "department": n.department,
                          "dueDate": n.due_date.isoformat() if n.due_date else None}
                         for n in hits[:5]]},
            ensure_ascii=False),
    })
    second = client.chat.completions.create(
        model=OPENAI_MODEL, messages=messages, temperature=0.2,
    )
    if not hits:
        return {
            "answer": _clean_answer(
                second.choices[0].message.content,
                "조건에 맞는 공지를 찾지 못했습니다. 다른 단어로 물어봐 주세요.",
            ),
            "action": chat_rules.empty_action(),
            "sources": [],
        }
    answer = _clean_answer(
        second.choices[0].message.content,
        f"조건에 맞는 공지는 {len(hits)}건입니다.",
    )

    # ★ 함수 인자가 그대로 화면 조작 명령이 됩니다
    action = chat_rules.empty_action()
    target = _pick_single(hits, args.get("keyword")) if args.get("open_detail") else None
    if target:
        action.update({"type": "navigate", "noticeId": target.id})
    else:
        action.update({
            "type": "filter",
            "category": args.get("category"),
            "subCategory": args.get("sub_category"),
            "keyword": args.get("keyword"),
            "dueBefore": due_before.isoformat() if due_before else None,
        })
    return {"answer": answer, "action": action, "sources": hits[:3]}


@router.post("", response_model=ChatResponse)
def chat(payload: ChatRequest, db: Session = Depends(get_db)):
    message = payload.message.strip()
    if not message:
        return {"answer": "무엇이 궁금하신가요?",
                "action": chat_rules.empty_action(), "sources": []}

    # 긴 입력은 그대로 모델에 보내면 비용과 대기 시간만 늘고 답이 좋아지지 않습니다.
    if len(message) > MAX_MESSAGE:
        return {
            "answer": f"질문이 너무 깁니다. {MAX_MESSAGE}자 이내로 줄여서 물어봐 주세요.",
            "action": chat_rules.empty_action(),
            "sources": [],
        }

    key = _cache_key(message)

    # 같은 질문이 반복되면 저장해 둔 답을 씁니다 (시연 중 응답이 빨라집니다)
    try:
        cached = db.scalars(
            select(ChatCache).where(ChatCache.question_hash == key)
        ).first()
        if cached:
            cached.hit_count += 1
            db.commit()
            return json.loads(cached.response)
    except Exception:                                  # noqa: BLE001
        db.rollback()

    result = None
    degraded = False
    if OPENAI_API_KEY:
        try:
            result = _ask_openai(db, message)
        except Exception as exc:                       # noqa: BLE001
            # 쿼터 초과·네트워크 오류·응답 형식 변화 — 무엇이든 규칙으로 넘어갑니다
            log.warning("OpenAI 호출 실패, 규칙 기반으로 답합니다: %s", exc)
            degraded = True

    if result is None:
        result = chat_rules.answer(db, message)
        result["answer"] = _clean_answer(result["answer"], "다시 물어봐 주세요.")

    result["sources"] = [
        s if isinstance(s, dict) else _to_source(s) for s in result["sources"]
    ]

    # OpenAI 가 죽어서 규칙으로 답한 것은 캐시하지 않습니다.
    # 캐시하면 키가 복구된 뒤에도 그 질문은 계속 규칙 답변이 나갑니다.
    if not degraded:
        try:
            db.add(ChatCache(question_hash=key, question=message[:500],
                             response=json.dumps(result, ensure_ascii=False)))
            db.commit()
        except Exception:                              # noqa: BLE001
            db.rollback()                              # 캐시 실패는 무시합니다

    return result
