"""학교 안내 문서 API."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from db import get_db
from models import Page
from schemas import PageOut

router = APIRouter(prefix="/api/pages", tags=["pages"])


@router.get("", response_model=list[PageOut])
def list_pages(db: Session = Depends(get_db), menu: str | None = Query(None)):
    stmt = select(Page)
    if menu:
        stmt = stmt.where(Page.menu == menu)
    return db.scalars(stmt.order_by(Page.menu, Page.sort_order)).all()


@router.get("/{slug}", response_model=PageOut)
def get_page(slug: str, db: Session = Depends(get_db)):
    page = db.get(Page, slug)
    if not page:
        raise HTTPException(404, "문서를 찾을 수 없습니다")
    return page
