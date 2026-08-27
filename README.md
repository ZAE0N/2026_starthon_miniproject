# 인하공업전문대학 홈페이지 — AI 공지 도우미

**▶ 실행 링크 — https://smpsws.shop**

설치도 로그인도 필요 없습니다. 링크만 누르면 됩니다.

우하단 **AI 도우미**를 열고 `근로장학금 공고 있어?` 를 누르면,
답변과 **동시에 왼쪽 공지 목록이 71건에서 6건으로 바뀝니다.**

---

## 이 프로젝트가 하는 일

학교 홈페이지에서 공지를 찾는 일은 대개 이렇습니다.
카테고리 탭을 누르고, 페이지를 넘기고, 제목을 하나씩 읽습니다.
찾는 것이 "이번 주에 마감인 장학금" 처럼 **여러 조건이 겹친 것**이면 더 오래 걸립니다.

여기서는 그냥 물어보면 됩니다. 챗봇이 답만 하는 게 아니라 **화면을 대신 조작합니다.**

| 물어보면 | 화면이 |
|---|---|
| 이번 주 마감인 장학금 알려줘 | 장학 탭으로 이동 + 마감 조건 칩 + 오늘 기준으로 좁혀짐 |
| 근로장학금 공고 있어? | 장학 → 근로 하위 필터 + **6건** |
| 취업 관련 공지 보여줘 | 채용 탭 + 해당 공지만 |
| 기숙사 얘기 있어? | 키워드 검색 + **2건** |
| 오늘 점심 뭐 먹지? | **바뀌지 않음** — 범위 밖이라고 답만 합니다 |

답변 아래에는 **근거 카드**가 붙습니다. 누르면 그 공지 상세로 갑니다.
지어낸 말인지 아닌지 바로 확인할 수 있습니다.

## 챗봇이 화면을 바꾸는 원리

이 프로젝트에서 가장 설명할 가치가 있는 부분입니다.

보통은 "AI 가 답을 만들고, 그 답을 파싱해서 화면을 바꾼다" 고 생각합니다.
그러면 문장이 조금만 달라져도 깨집니다.

여기서는 반대입니다. **AI 가 부르는 함수의 인자가 곧 화면 조작 명령입니다.**

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

파싱이 없습니다. 모델이 **구조화된 인자**를 주도록 되어 있고, 서버는 그 인자를
검증만 해서 그대로 씁니다. 문장 표현이 달라져도 동작이 흔들리지 않습니다.

## 시연 중 멈추지 않게 만든 것

심사 도중 외부 서비스가 죽어서 화면이 멈추는 것이 가장 큰 위험이라, **2단으로 막았습니다.**

```
OpenAI 가 죽으면   →  규칙 기반 엔진(api/chat_rules.py)이 같은 형식으로 답합니다
API 서버가 죽으면  →  브라우저가 js/data.js 목업으로 화면을 그립니다
```

응답 형식이 세 경로 모두 같아서 **프론트는 누가 답했는지 알 필요가 없습니다.**
OpenAI 키를 지워도, 백엔드를 내려도 챗봇이 답하고 목록이 바뀝니다.

모델이 엉뚱하게 굴 때를 위한 안전망도 있습니다.

- 모델이 찾아보지도 않고 "안내할 수 없다"고 거절하면 → 규칙 엔진이 다시 찾아봅니다
- 모델이 엉뚱한 인자로 검색해 0건이 나와도 → 마찬가지
- 모델이 정의에 없는 값을 보내면 → 버립니다 (`_clean_args`)
- 근거를 못 찾은 답은 **캐시하지 않습니다** — 한 번의 실수가 굳어지지 않게

`api/tests/` 의 검사 60개가 이 동작을 지킵니다 (가짜 OpenAI 를 주입하므로 실제 호출·비용 없음).

## 구조

정적 파일과 API 를 **한 대의 nginx 에서** 서빙합니다.
같은 오리진이라 CORS 설정도, mixed content 회피도 필요 없고, 링크도 하나로 끝납니다.

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
CSS·JS·JSON 을 gzip 으로 줄여 한 페이지 전송량이 147 KB 에서 42 KB 가 됐습니다.

| | |
|---|---|
| 프론트 | 순수 HTML · CSS · JavaScript (빌드 도구 없음) |
| 백엔드 | FastAPI · SQLAlchemy 2.0 · Pydantic v2 |
| DB | MySQL 8 (utf8mb4) |
| AI | OpenAI Function Calling |
| 배포 | AWS Lightsail · nginx · systemd |

빌드 단계가 없어서 `git pull` 후 파일을 복사하면 그게 배포입니다.

### API

| | |
|---|---|
| `GET /api/notices` | 공지 목록 (`category` · `subCategory` · `q` · `dueBefore` · `limit`) |
| `GET /api/notices/{id}` | 공지 상세 |
| `POST /api/notices` · `PUT` · `DELETE` | 작성 · 수정 · 삭제 |
| `GET /api/events` | 학사일정 |
| `GET /api/pages` · `/{slug}` | 학교 안내 문서 |
| **`POST /api/chat`** | **챗봇 — `{ answer, action, sources }`** |
| `GET /api/health` | 상태 확인 |
| `GET /docs` | 자동 생성 API 문서 |

DB 는 snake_case, 프론트는 camelCase 를 씁니다.
Pydantic 의 `alias_generator` 가 응답에서 자동으로 바꿔 주므로 변환 코드가 없습니다.

## 화면

| 파일 | 화면 | 비고 |
|---|---|---|
| `index.html` | SC-01 홈 | 학사일정 카드 → 모달 |
| `notices.html` | SC-02 공지 목록 | 장학 하위 필터 포함 |
| `notice.html` | SC-03 공지 상세 | |
| `notice-form.html` | SC-04 작성 · 수정 | 관리자 전용 |
| `search.html` | SC-06 통합 검색 | |
| `page.html` | SC-07 학교 안내 | 문서 20개를 이 파일 하나로 |
| `calendar.html` | SC-09 학사일정 | 월 이동, 중요 일정에 형광펜 |

챗봇은 **지금 보고 있는 화면에 따라 다르게 동작합니다.**

| 지금 화면 | 챗봇이 답하면 |
|---|---|
| 홈 · 공지 목록 | 그 자리에서 목록이 걸러짐 (이동 없음) |
| 상세 · 검색 · 안내 | "목록에서 결과 보기" 링크 표시 |
| 작성 · 수정 | 이동하지 않음 — **쓰던 글을 지키기 위해** |
| 학교와 무관한 질문 | 답변만 표시 |

## 내 컴퓨터에서 돌려보기

프론트만 보려면 서버가 필요 없습니다. API 가 없으면 `js/data.js` 목업으로 동작합니다.

```bash
python3 -m http.server 5500     # http://localhost:5500
```

백엔드까지 돌리려면:

```bash
cd api
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env            # DATABASE_URL 설정 (OPENAI_API_KEY 는 비워도 됨)
.venv/bin/uvicorn main:app --reload
```

검사 실행:

```bash
.venv/bin/python tests/check_chat_guards.py    # 이상한 입력 44개 항목
.venv/bin/python tests/check_chat_intent.py    # 모델이 엉뚱할 때 16개 항목
```

## 서버 배포

**처음 하는 거라면 → [`db/deploy/GUIDE.md`](db/deploy/GUIDE.md)**
Lightsail 인스턴스 생성부터 배포 링크까지 순서대로. 50분~1시간.

```bash
cd db/deploy
cp config.env.example config.env   # 서버 IP 와 키 경로만 채우면 됨
./00-check-file.sh                 # 00~09 로 DB 구축
./10-deploy-app.sh                 # 프론트+API 배포 (nginx 단일 오리진)
bash checksite.sh http://서버IP     # 배포 결과 20개 항목 점검
```

| | |
|---|---|
| [`db/deploy/GUIDE.md`](db/deploy/GUIDE.md) | 처음부터 따라 하는 가이드 |
| [`db/deploy/README.md`](db/deploy/README.md) | 스크립트별 상세 설명 |
| [`docs/demo-script.md`](docs/demo-script.md) | 시연 영상 대본 · 촬영 순서 |

**API 키와 DB 비밀번호는 서버의 `api/.env` 에만 있습니다.** 저장소에 없습니다.

### 데이터를 바꿀 때

`js/data.js` 가 **단일 출처**입니다. 거기서 `db/seed.sql` 을 생성하므로
화면과 DB 가 어긋나지 않습니다.

```bash
python3 db/tools/gen_seed.py    # data.js → seed.sql
cd db/deploy && ./reseed.sh     # 백업 → 적용 → 건수·한글 확인
```

## 지켜야 할 규칙

- 색은 `css/tokens.css` 에서만 정의합니다
- 포인트 3색은 역할이 정해져 있습니다 — cyan(AI·장학), red(마감·삭제), amber(행사·고정·형광펜)
- 사용자 입력값은 `innerHTML` 이 아니라 `textContent` 또는 `esc()` 를 씁니다
- 외부 링크는 `js/data.js` 의 `window.EXTERNAL` 한 곳에만 주소를 적습니다

## 미구현 (의도적)

- **실제 인증** — 관리자 모드는 버튼을 보이고 숨기는 장치입니다.
  실제 서비스라면 여기에 로그인과 권한 검사가 들어갑니다
- **파일 첨부 · 이미지 업로드**
- **공지 조회수의 중복 방지** — 새로고침하면 계속 올라갑니다

## 참고

학습 목적으로 만든 **비공식** 사이트입니다.
공지 내용은 실제 공지가 아닌 예시 데이터이며, 로고는 직접 만든 글자 로고입니다.
