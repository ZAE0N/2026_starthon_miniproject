"""요청·응답 형태.

프론트엔드는 이미 camelCase(dueDate, isPinned ...)를 씁니다.
DB 는 snake_case 라서, 여기서 자동 변환해 두면 프론트를 고칠 일이 없습니다.
"""
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, field_serializer


def to_camel(s: str) -> str:
    head, *rest = s.split("_")
    return head + "".join(w.capitalize() for w in rest)


class CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,   # 입력은 snake_case 도 camelCase 도 받습니다
        from_attributes=True,    # SQLAlchemy 객체에서 바로 변환
    )


# ── 응답 ────────────────────────────────────────────────────────────────
class NoticeOut(CamelModel):
    id: int
    category: str
    sub_category: str | None = None
    title: str
    content: str
    author: str
    department: str | None = None
    due_date: date | None = None
    is_pinned: bool
    views: int
    created_at: datetime

    @field_serializer("created_at")
    def _date_only(self, v: datetime) -> str:
        """프론트는 "YYYY-MM-DD" 만 씁니다.

        DB 컬럼은 DATETIME 이라 그대로 내보내면 "...T10:30:00" 이 붙어
        목록의 날짜 표시가 깨집니다.
        """
        return v.strftime("%Y-%m-%d")


class EventOut(CamelModel):
    id: int
    title: str
    start_date: date
    end_date: date
    is_important: bool


class PageOut(CamelModel):
    slug: str
    menu: str
    title: str
    body: str
    sort_order: int


# ── 요청 ────────────────────────────────────────────────────────────────
class NoticeCreate(CamelModel):
    category: str
    sub_category: str | None = None
    title: str
    content: str
    author: str
    department: str | None = None
    due_date: date | None = None
    is_pinned: bool = False


class NoticeUpdate(CamelModel):
    category: str | None = None
    sub_category: str | None = None
    title: str | None = None
    content: str | None = None
    author: str | None = None
    department: str | None = None
    due_date: date | None = None
    is_pinned: bool | None = None


# ── 챗봇 ────────────────────────────────────────────────────────────────
class ChatAction(BaseModel):
    """화면 조작 명령. OpenAI 함수 인자가 그대로 여기에 담깁니다.

    프론트는 type 을 보고 목록을 거르거나(filter) 상세로 이동합니다(navigate).
    필드 이름이 camelCase 라 별도 변환이 필요 없습니다.
    """

    type: str                       # filter · navigate · none
    category: str | None = None
    subCategory: str | None = None  # noqa: N815
    keyword: str | None = None
    dueBefore: str | None = None    # noqa: N815
    noticeId: int | None = None     # noqa: N815


class ChatSource(BaseModel):
    """답변 아래 붙는 근거 공지 카드."""

    id: int
    title: str
    department: str | None = None
    dueDate: str | None = None      # noqa: N815


class ChatRequest(BaseModel):
    message: str
    history: list[dict] = []


class ChatResponse(BaseModel):
    answer: str
    action: ChatAction
    sources: list[ChatSource] = []
