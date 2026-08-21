"""공지사항 API."""
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from db import get_db
from models import Notice
from schemas import NoticeCreate, NoticeOut, NoticeUpdate

router = APIRouter(prefix="/api/notices", tags=["notices"])

CATEGORIES = {"학사", "행사", "장학", "채용", "일반"}


def _check_category(category: str | None, sub_category: str | None) -> None:
    """DB 의 CHECK 제약과 같은 규칙을 앞에서 한 번 더 막습니다.

    MySQL 8.0.16 미만에서는 CHECK 가 조용히 무시되므로, 서버가 걸러야 합니다.
    """
    if category is not None and category not in CATEGORIES:
        raise HTTPException(422, f"category 는 {sorted(CATEGORIES)} 중 하나여야 합니다")
    if sub_category and category != "장학":
        raise HTTPException(422, "sub_category 는 장학 공지에만 붙일 수 있습니다")


@router.get("", response_model=list[NoticeOut])
def list_notices(
    db: Session = Depends(get_db),
    category: str | None = Query(None, description="학사·행사·장학·채용·일반"),
    sub_category: str | None = Query(None, alias="subCategory"),
    q: str | None = Query(None, description="제목·본문 검색어"),
    due_before: date | None = Query(None, alias="dueBefore", description="이 날짜까지 마감"),
    limit: int | None = Query(None, ge=1, le=500),
):
    """공지 목록.

    조건을 주지 않으면 전부 돌려줍니다. 프론트는 전체를 받아 화면에서 거르고,
    챗봇(/api/chat)은 조건을 붙여 좁힙니다.
    """
    stmt = select(Notice)
    if category:
        stmt = stmt.where(Notice.category == category)
    if sub_category:
        stmt = stmt.where(Notice.sub_category == sub_category)
    if q:
        like = f"%{q}%"
        stmt = stmt.where(or_(Notice.title.like(like), Notice.content.like(like)))
    if due_before:
        stmt = stmt.where(
            Notice.due_date.is_not(None),
            Notice.due_date <= due_before,
            Notice.due_date >= date.today(),
        )
    # 목록 기본 정렬: 고정 → 최신 → 번호 (프론트 notices.js 와 같은 규칙)
    stmt = stmt.order_by(Notice.is_pinned.desc(), Notice.created_at.desc(), Notice.id.desc())
    if limit:
        stmt = stmt.limit(limit)
    return db.scalars(stmt).all()


@router.get("/{notice_id}", response_model=NoticeOut)
def get_notice(notice_id: int, db: Session = Depends(get_db)):
    notice = db.get(Notice, notice_id)
    if not notice:
        raise HTTPException(404, "공지를 찾을 수 없습니다")
    return notice


@router.post("/{notice_id}/views", response_model=NoticeOut)
def bump_views(notice_id: int, db: Session = Depends(get_db)):
    """조회수 증가. 세션당 1회 제한은 프론트에서 처리합니다."""
    notice = db.get(Notice, notice_id)
    if not notice:
        raise HTTPException(404, "공지를 찾을 수 없습니다")
    notice.views += 1
    db.commit()
    return notice


@router.post("", response_model=NoticeOut, status_code=201)
def create_notice(payload: NoticeCreate, db: Session = Depends(get_db)):
    _check_category(payload.category, payload.sub_category)
    notice = Notice(**payload.model_dump())
    db.add(notice)
    db.commit()
    db.refresh(notice)
    return notice


@router.put("/{notice_id}", response_model=NoticeOut)
def update_notice(notice_id: int, payload: NoticeUpdate, db: Session = Depends(get_db)):
    notice = db.get(Notice, notice_id)
    if not notice:
        raise HTTPException(404, "공지를 찾을 수 없습니다")

    changes = payload.model_dump(exclude_unset=True)
    # 일부만 바꿔도 규칙이 깨지지 않도록, 바뀐 뒤의 값으로 검사합니다
    _check_category(
        changes.get("category", notice.category),
        changes.get("sub_category", notice.sub_category),
    )
    for field, value in changes.items():
        setattr(notice, field, value)
    db.commit()
    db.refresh(notice)
    return notice


@router.delete("/{notice_id}", status_code=204)
def delete_notice(notice_id: int, db: Session = Depends(get_db)):
    notice = db.get(Notice, notice_id)
    if not notice:
        raise HTTPException(404, "공지를 찾을 수 없습니다")
    db.delete(notice)
    db.commit()
    return Response(status_code=204)
