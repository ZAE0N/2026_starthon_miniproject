"""데이터베이스 연결."""
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from config import DATABASE_URL

if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL 이 비어 있습니다.\n"
        "api/.env.example 을 .env 로 복사하고 접속 문자열을 넣으세요.\n"
        "  cp api/.env.example api/.env"
    )

# MySQL 연결은 오래 놀면 서버가 먼저 끊습니다(wait_timeout).
# pool_pre_ping 이 매번 살아 있는지 확인해 'server has gone away' 를 막습니다.
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=3600,
    future=True,
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


def get_db():
    """요청 하나당 세션 하나."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
