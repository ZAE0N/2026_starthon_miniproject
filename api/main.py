"""인하공전 미니프로젝트 백엔드.

실행:
    cd api
    python3 -m venv .venv && source .venv/bin/activate
    pip install -r requirements.txt
    cp .env.example .env        # DATABASE_URL 채우기
    uvicorn main:app --reload

문서: http://localhost:8000/docs
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from config import CORS_ORIGINS
from db import engine
from routers import chat, events, notices, pages

app = FastAPI(
    title="인하공업전문대학 홈페이지 API",
    description="공지사항·학사일정·학교안내 문서를 제공합니다.",
    version="0.1.0",
)

# 배포는 nginx 단일 오리진이라 CORS 가 필요 없습니다.
# 로컬에서 프론트를 다른 포트로 띄울 때만 .env 의 CORS_ORIGINS 를 채웁니다.
if CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=CORS_ORIGINS,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(notices.router)
app.include_router(events.router)
app.include_router(pages.router)
app.include_router(chat.router)


@app.get("/api/health", tags=["health"])
def health():
    """DB 까지 살아 있는지 확인합니다. 배포 후 첫 점검에 씁니다."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "ok", "database": "ok"}
    except Exception as exc:                      # noqa: BLE001
        return {"status": "degraded", "database": str(exc)[:200]}
