"""환경 설정. .env 에서 읽습니다."""
import os

from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))

# 접속 문자열. 없으면 로컬 SQLite 로 떨어져서 DB 없이도 서버가 뜹니다.
DATABASE_URL = os.getenv("DATABASE_URL", "").strip()

# 챗봇용. 비어 있으면 규칙 기반으로 동작합니다.
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()

# 함수 하나만 쓰므로 저렴한 소형 모델로 충분합니다.
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini").strip()

# 배포는 nginx 단일 오리진이라 CORS 가 필요 없습니다.
# 로컬에서 프론트를 다른 포트로 띄울 때만 채웁니다. (쉼표로 구분)
CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "").split(",") if o.strip()]
