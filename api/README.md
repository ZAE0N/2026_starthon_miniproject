# 백엔드 (FastAPI)

공지사항·학사일정·학교 안내 문서를 제공합니다.
프론트엔드는 `js/api.js` 를 통해 이 API 를 씁니다.

## 실행

```bash
cd api
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env      # DATABASE_URL 을 채웁니다
uvicorn main:app --reload
```

- 문서: http://localhost:8000/docs
- 상태: http://localhost:8000/api/health

`DATABASE_URL` 은 `db/deploy/07-appuser.sh` 가 출력한 줄을 그대로 붙여넣으면 됩니다.
**`?charset=utf8mb4` 를 빼면 한글이 물음표로 나옵니다.**

## 엔드포인트

| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/api/notices` | 목록. `category` `subCategory` `q` `dueBefore` `limit` 로 좁힘 |
| GET | `/api/notices/{id}` | 상세 |
| POST | `/api/notices/{id}/views` | 조회수 +1 |
| POST | `/api/notices` | 등록 |
| PUT | `/api/notices/{id}` | 수정 |
| DELETE | `/api/notices/{id}` | 삭제 |
| GET | `/api/events` | 학사일정. `from` `to` 로 기간 지정 |
| GET | `/api/pages` | 안내 문서. `menu` 로 좁힘 |
| GET | `/api/pages/{slug}` | 문서 상세 |
| GET | `/api/health` | DB 포함 상태 확인 |

## 알아둘 점

**응답은 camelCase 입니다.** DB 는 `sub_category`, 프론트는 `subCategory` 를 쓰는데
`schemas.py` 의 `CamelModel` 이 자동 변환합니다. 그래서 프론트 코드를 고칠 일이 없습니다.

**카테고리 검증을 서버에서도 합니다.** `db/schema.sql` 의 `CHECK` 제약과 같은 규칙을
`routers/notices.py` 의 `_check_category()` 가 한 번 더 막습니다.
MySQL 8.0.16 미만에서는 `CHECK` 가 조용히 무시되기 때문입니다.

**`.env` 는 커밋하지 않습니다.** `.gitignore` 에 등록돼 있습니다.

## 챗봇 예외 처리

이상한 질문·악의적 입력·모델의 엉뚱한 응답을 걸러냅니다.

| 막는 것 | 방법 |
|---|---|
| LIKE 와일드카드로 전체 긁기 (`%`, `_`) | `chat_rules.escape_like()` 로 글자 그대로 취급 |
| 지나치게 긴 질문 | `MAX_MESSAGE`(300자) 초과 시 정중히 거절 |
| 모델이 준 정의 밖 값 | `_clean_args()` 가 카테고리·하위분류를 화이트리스트로 거르고, 일수를 1~365 로 제한 |
| 빈 답변 · 수천 자 답변 | `_clean_answer()` 가 대체 문구를 넣고 `MAX_ANSWER`(500자)로 자름 |
| SQL 주입 | SQLAlchemy 파라미터 바인딩 (문자열을 붙이지 않음) |
| XSS | 답변은 `textContent`, 근거 카드는 `esc()` |
| 잘못된 요청 형태 | Pydantic 이 422 로 거절 |
| OpenAI 장애 | 규칙 기반으로 답하고, **그 답은 캐시하지 않음** |

마지막 항목이 중요합니다. 폴백 답변을 캐시하면 키가 복구된 뒤에도
그 질문은 계속 규칙 답변이 나갑니다.

### 점검 실행

44개 항목을 확인하고 통과/실패 개수를 냅니다.

**서버에서 (권장)** — 배포하면서 만들어진 `.venv` 가 이미 있습니다.

```bash
cd db/deploy
. ./config.env
ssh -i "${SSH_KEY/#\~/$HOME}" "$SSH_USER@$SERVER_IP" \
  "cd ~/app/api && .venv/bin/python tests/check_chat_guards.py"
```

**내 컴퓨터에서** — `.venv` 를 먼저 만들어야 합니다.
(`api/.venv` 는 서버에만 있습니다. 배포 스크립트가 만든 것입니다.)

```bash
cd api
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python tests/check_chat_guards.py
```

**운영 DB 와 OpenAI 를 건드리지 않습니다.**
스크립트가 `DATABASE_URL` 을 임시 SQLite 로 먼저 설정하고,
`config.py` 의 `load_dotenv()` 는 기본이 `override=False` 라
이미 설정된 환경변수를 덮지 않습니다. `OPENAI_API_KEY` 도 같은 방식으로
빈 값이 유지되고, 가짜 openai 모듈을 주입하므로 실제 호출과 비용이 없습니다.

### 코드를 고친 뒤에는 재배포해야 반영됩니다

`main` 에 머지해도 서버는 그대로입니다. 서버는 배포할 때 받은 코드로 돕니다.

```bash
cd db/deploy && ./10-deploy-app.sh
```
