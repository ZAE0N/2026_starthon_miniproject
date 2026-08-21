"""테이블 정의. db/schema.sql 과 짝을 이룹니다."""
from datetime import date, datetime

from sqlalchemy import Date, DateTime, Integer, SmallInteger, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from db import Base


class Notice(Base):
    __tablename__ = "notices"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    # DB 쪽은 ENUM 이지만 여기서는 문자열로 다룹니다. 값 검증은 DB 가 합니다.
    category: Mapped[str] = mapped_column(String(10), nullable=False)
    sub_category: Mapped[str | None] = mapped_column(String(20))
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    author: Mapped[str] = mapped_column(String(30), nullable=False)
    department: Mapped[str | None] = mapped_column(String(30))
    due_date: Mapped[date | None] = mapped_column(Date)
    is_pinned: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    views: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    # default 와 server_default 를 둘 다 둡니다.
    # server_default 만 있으면 SQLAlchemy 가 INSERT 에서 컬럼을 빼고 DB 기본값에
    # 맡기는데, 기본값이 없는 DB 에서는 NOT NULL 위반으로 실패합니다.
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=func.now(), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=func.now(),
        server_default=func.now(),
        onupdate=func.now(),
    )


class AcademicEvent(Base):
    __tablename__ = "academic_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(100), nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    is_important: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class Page(Base):
    __tablename__ = "pages"

    slug: Mapped[str] = mapped_column(String(50), primary_key=True)
    menu: Mapped[str] = mapped_column(String(20), nullable=False)
    title: Mapped[str] = mapped_column(String(100), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    sort_order: Mapped[int] = mapped_column(SmallInteger, nullable=False)
