"""규칙 기반 챗봇.

OpenAI 키가 없거나 호출이 실패했을 때 이 로직이 답합니다.
js/chat-engine.js 의 규칙을 서버로 옮긴 것이라 응답 모양이 완전히 같습니다.

시연 도중 외부 서비스가 죽어도 챗봇이 멈추지 않게 하는 것이 목적입니다.
"""
import re
from datetime import date, timedelta

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from models import Notice

SYNONYMS = {
    "장학": ["장학", "장학금", "국가장학", "등록금 지원"],
    "학사": ["학사", "수강", "수강신청", "수강 정정", "성적", "학점", "휴학",
             "복학", "졸업", "등록금", "전공"],
    "채용": ["취업", "채용", "인턴", "공채", "면접", "이력서", "포트폴리오",
             "진로", "현장실습"],
    "행사": ["행사", "축제", "체육대회", "동아리", "대회", "경진", "오리엔테이션"],
    "일반": ["기숙사", "생활관", "주차", "도서관", "시설", "네트워크",
             "와이파이", "셔틀", "학생증"],
}

KEYWORDS = ["기숙사", "생활관", "주차", "도서관", "축제", "인턴", "졸업", "휴학",
            "복학", "등록금", "수강신청", "체육대회", "셔틀", "증명서", "현장실습"]

OUT_OF_SCOPE = re.compile(r"날씨|점심|밥|영화|노래|사랑|주식|로또")


def _detect_category(q: str) -> str | None:
    for category, words in SYNONYMS.items():
        for w in words:
            if w in q:
                return category
    return None


def _detect_keyword(q: str) -> str | None:
    for w in KEYWORDS:
        if w in q:
            return w
    return None


def _detect_due(q: str) -> date | None:
    today = date.today()
    if re.search(r"이번\s*주|금주|곧|임박|마감", q):
        return today + timedelta(days=7)
    if re.search(r"오늘|내일|급", q):
        return today + timedelta(days=2)
    if re.search(r"이번\s*달", q):
        return today + timedelta(days=20)
    return None


def empty_action() -> dict:
    return {"type": "none", "category": None, "subCategory": None,
            "keyword": None, "dueBefore": None, "noticeId": None}


def search(db: Session, category=None, sub_category=None, keyword=None, due_before=None):
    """조건에 맞는 공지를 찾습니다. OpenAI 경로와 규칙 경로가 함께 씁니다."""
    stmt = select(Notice)
    if category:
        stmt = stmt.where(Notice.category == category)
    if sub_category:
        stmt = stmt.where(Notice.sub_category == sub_category)
    if keyword:
        like = f"%{keyword}%"
        stmt = stmt.where(or_(Notice.title.like(like), Notice.content.like(like)))
    if due_before:
        stmt = stmt.where(
            Notice.due_date.is_not(None),
            Notice.due_date <= due_before,
            Notice.due_date >= date.today(),
        )
    stmt = stmt.order_by(Notice.is_pinned.desc(), Notice.created_at.desc(), Notice.id.desc())
    return list(db.scalars(stmt).all())


def _describe(action: dict, hits: list[Notice]) -> str:
    parts = []
    if action["subCategory"]:
        parts.append(f"{action['subCategory']} 장학 공지")
    elif action["category"]:
        parts.append(f"{action['category']} 공지")
    elif action["keyword"]:
        parts.append(f"'{action['keyword']}' 관련 공지")
    else:
        parts.append("공지")
    if action["dueBefore"]:
        parts.insert(0, f"{action['dueBefore']} 이전 마감인")

    # 마감이 가까운 것 우선, 없으면 최신
    dated = sorted([n for n in hits if n.due_date], key=lambda n: n.due_date)
    first = dated[0] if dated else hits[0]
    if first.due_date:
        tail = f" 가장 급한 건 '{first.title}'이고 {first.due_date}에 마감입니다."
    else:
        tail = f" 가장 최근 건은 '{first.title}'입니다."
    return " ".join(parts) + f"는 {len(hits)}건입니다." + tail


def answer(db: Session, question: str) -> dict:
    """{ answer, action, sources } 를 돌려줍니다."""
    q = question.strip()

    if OUT_OF_SCOPE.search(q):
        return {
            "answer": "저는 인하공업전문대학 공지사항만 안내할 수 있습니다. "
                      "장학금, 수강신청, 취업, 행사, 기숙사 같은 학교 소식을 물어보세요.",
            "action": empty_action(),
            "sources": [],
        }

    # 특정 공지 하나를 콕 집어 묻는 경우 → 상세로 이동
    if re.search(r"수강\s*신청|수강\s*정정", q) and re.search(r"언제|기간|일정", q):
        target = db.scalars(
            select(Notice).where(Notice.title.like("%수강 정정%")).limit(1)
        ).first()
        if target:
            action = empty_action()
            action.update({"type": "navigate", "noticeId": target.id})
            return {
                "answer": f"'{target.title}' 공지로 이동합니다.",
                "action": action,
                "sources": [target],
            }

    action = empty_action()
    action["type"] = "filter"
    due = _detect_due(q)
    action["dueBefore"] = due.isoformat() if due else None

    # 구체적인 낱말이 있으면 그것을 먼저 씁니다.
    # '기숙사' 는 일반 카테고리의 동의어이기도 한데, 카테고리를 먼저 잡으면
    # 일반 공지 전체가 걸려 결과가 뭉툭해집니다. 낱말 쪽이 훨씬 정확합니다.
    action["keyword"] = _detect_keyword(q)
    if not action["keyword"]:
        action["category"] = _detect_category(q)

    if re.search(r"근로", q):
        action["category"] = "장학"
        action["subCategory"] = "근로"
        action["keyword"] = None

    if not action["category"] and not action["keyword"] and not action["dueBefore"]:
        action["keyword"] = re.sub(r"[?!.]", "", q).strip()[:12]

    hits = search(
        db,
        category=action["category"],
        sub_category=action["subCategory"],
        keyword=action["keyword"],
        due_before=due,
    )

    if not hits:
        return {
            "answer": "조건에 맞는 공지를 찾지 못했습니다. "
                      "카테고리(학사·행사·장학·채용·일반)나 다른 단어로 다시 물어봐 주세요.",
            "action": empty_action(),
            "sources": [],
        }

    return {"answer": _describe(action, hits), "action": action, "sources": hits[:3]}
