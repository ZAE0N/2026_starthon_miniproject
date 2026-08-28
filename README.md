# 인하공업전문대학 홈페이지 — AI 공지 도우미

**▶ 실행 링크 — https://smpsws.shop**

---

## 프로젝트가 기존 사이트를 개선하고자 한 점

학교 홈페이지에 들어가 보면, **한 번에 주는 정보가 너무 많은 문제**가 있습니다.

- 한눈에 들어오는 데 필요한 만큼만 남기고, 없어도 되는 것은 최대한 지웠습니다.
- AI 챗봇을 이용하여 사용자가 접근하고자 하는 정보에 쉽게 접근할 수 있도록 하였습니다.

## 구현 목록

- 공지사항 CRUD
- 공지사항 간소화
- 모달형 AI 챗봇
- 실제 링크 연동

## 챗봇이 화면을 바꾸는 원리

보통은 "AI 가 답을 만들고, 그 답을 파싱해서 화면을 바꾼다"라고 생각합니다.
그러면 문장이 조금만 달라져도 깨집니다.

**AI 가 부르는 함수의 인자가 곧 화면 조작 명령**이 되게끔 만들어봤습니다.

## AI 모델

AI 모델은 기존 LLM 모델인 'OpenAI'를 사용하였습니다.

```
사용자:  "이번 주 마감인 장학금 알려줘"
   ↓
OpenAI:  search_notices(category="장학", due_within_days=7)   ← 함수 호출
   ↓
서버:    그 인자로 DB 를 조회하고, 인자를 그대로 action 에 담아 내려보냄
   ↓
{ "answer": "이번 주 마감인 장학 공지는 4건입니다. ...",
  "action":  { "type": "filter", "category": "장학", "dueBefore": "2026-09-01" },
  "sources": [ { "id": 30, "title": "...", "dueDate": "..." }, ... ] }
   ↓
브라우저: action 대로 목록을 거르고 탭을 옮김
```

모델이 구조화된 인자를 주도록 되어 있고, 서버는 그 인자를 검증만 해서 그대로 씁니다.

## 예외 처리

외부 서비스가 죽어서 화면이 멈추는 것이 서비스에서는 가장 큰 위험이기 때문에 다음과 같이 처리하였습니다.

```
OpenAI 가 죽으면   →  규칙 기반 엔진(api/chat_rules.py)이 같은 형식으로 답합니다
API 서버가 죽으면  →  브라우저가 js/data.js 목업으로 화면을 그립니다
```

OpenAI 키를 지워도, 백엔드를 내려도 챗봇이 답하고 목록이 바뀝니다.

모델이 엉뚱하게 굴 때를 위한 안전망도 있습니다.

- 모델이 찾아보지도 않고 "안내할 수 없다"고 거절하거나 엉뚱한 인자로 검색해 0건이 나오면 규칙 엔진이 다시 찾아봅니다.
- 모델이 정의에 없는 값을 보내면 버립니다.
- 근거를 못 찾은 답은 캐시하지 않습니다.

## 구조

정적 파일과 API 를 **한 대의 nginx** 에서 서빙합니다.

```
브라우저
   │  https://smpsws.shop        (http 로 오면 301 로 넘김)
   ▼
nginx :443 ────┬── /        →  /var/www/inhatc     (HTML · CSS · JS)
   http2       └── /api/    →  127.0.0.1:8010      (uvicorn)
   gzip                              │
                              FastAPI ──┬── MySQL 8      공지 71 · 일정 33 · 문서 20
                                        └── OpenAI       Function Calling
```

인증서는 Let's Encrypt 이고 90일마다 자동 갱신됩니다.

### API

|API|역할|
|---|---|
| `GET /api/notices` | 공지 목록 (`category` · `subCategory` · `q` · `dueBefore` · `limit`) |
| `GET /api/notices/{id}` | 공지 상세 |
| `POST /api/notices` · `PUT` · `DELETE` | 작성 · 수정 · 삭제 |
| `GET /api/events` | 학사일정 |
| `GET /api/pages` · `/{slug}` | 학교 안내 문서 |
| **`POST /api/chat`** | **챗봇 — `{ answer, action, sources }`** |
| `GET /api/health` | 상태 확인 |
| `GET /docs` | 자동 생성 API 문서 |

## 화면

| 파일 | 화면 |
|---|---|
| `index.html` | 홈
| `notices.html` | 공지 목록
| `notice.html` | 공지 상세
| `notice-form.html` | 작성 · 수정
| `search.html` | 통합 검색
| `page.html` | 학교 안내
| `calendar.html` | 학사일정

챗봇은 지금 보고 있는 화면에 따라 다르게 동작합니다.

| 현재 화면 | 챗봇 답변 |
|---|---|
| 홈 · 공지 목록 | 그 자리에서 목록이 걸러짐 (이동 없음) |
| 상세 · 검색 · 안내 | "목록에서 결과 보기" 링크 표시 |
| 작성 · 수정 | 이동하지 않음 |
| 학교와 무관한 질문 | 답변만 표시 |

## 서버 배포

개인이 가지고 있는 AWS Lightsail 인스턴스 서버에서 배포하였습니다.

### 기술 스택

| | |
|---|---|
| 프론트 | 순수 HTML · CSS · JavaScript (빌드 도구 없음) |
| 백엔드 | FastAPI · SQLAlchemy 2.0 · Pydantic v2 |
| DB | MySQL 8 (utf8mb4) |
| AI | OpenAI Function Calling |
| 배포 | AWS Lightsail · nginx · systemd |

`git pull` 후 파일을 복사하면 바로 배포할 수 있도록 설정하였습니다.

(파이프라인 도입까지 고민하였지만 가볍게 하는 미니 프로젝트이기 때문에 지양하였습니다.)

## 기타

- 팀원들이 하는 첫 프로젝트이기 때문에 '협업이 이루어지는 과정'을 중점적으로 다루고 최대한 간단하게 구현하는 것을 목표로 잡았습니다.
- 저렴한 도메인을 구입하여 실제 서비스하는 과정을 알아보고자 하였습니다.
