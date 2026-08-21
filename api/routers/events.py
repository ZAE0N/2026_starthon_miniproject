"""학사일정 API."""
from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from db import get_db
from models import AcademicEvent
from schemas import EventOut

router = APIRouter(prefix="/api/events", tags=["events"])


@router.get("", response_model=list[EventOut])
def list_events(
    db: Session = Depends(get_db),
    date_from: date | None = Query(None, alias="from"),
    date_to: date | None = Query(None, alias="to"),
):
    """학사일정. 달력은 전체를 받아 월별로 나눠 그립니다."""
    stmt = select(AcademicEvent)
    if date_from:
        stmt = stmt.where(AcademicEvent.end_date >= date_from)
    if date_to:
        stmt = stmt.where(AcademicEvent.start_date <= date_to)
    return db.scalars(stmt.order_by(AcademicEvent.start_date, AcademicEvent.id)).all()
