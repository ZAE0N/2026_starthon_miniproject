/* 목업 데이터 — DB의 seed.sql 과 같은 내용입니다.
   실제 프로젝트에서는 백엔드 API 로 대체됩니다.
   브라우저 탭 안에서만 유지되며, 탭을 닫으면 초기 상태로 돌아갑니다.

   학교명·링크는 실제이지만, 공지 내용은 학습용으로 직접 작성한 예시입니다. */

window.SCHOOL = {
  name: "인하공업전문대학",
  nameEn: "INHATC",
  address: "인천광역시 미추홀구 인하로 100",
  tel: "032-000-0000",
};

/* 외부 링크는 여기 한 곳에만 적습니다 (화면정의서 CM-07).
   학교가 주소를 바꾸면 이 부분만 고치면 됩니다. */
window.EXTERNAL = {
  portal: "https://portal.inhatc.ac.kr",
  dorm:   "https://dorm.inhatc.ac.kr",
};

window.CATEGORIES = ["학사", "행사", "장학", "채용", "일반"];
window.SUB_CATEGORIES = ["근로"];

window.GNB = [
  { menu: "대학안내", slug: "greeting" },
  { menu: "학과안내", slug: "departments" },
  { menu: "입학안내", slug: "admission-susi" },
  { menu: "학사안내", slug: "calendar" },
  { menu: "대학생활", slug: "scholarship" },
  { menu: "정보광장", slug: null },
  { menu: "신포털", external: "portal" },
];

window.NOTICES = [
  {
    "id": 71,
    "category": "학사",
    "subCategory": null,
    "title": "2026학년도 2학기 개강 안내",
    "content": "2026학년도 2학기 개강 일정을 안내합니다.\n\n■ 개강일\n2026년 9월 1일(화)\n\n■ 유의사항\n- 첫 주는 수강 정정 기간과 겹칩니다. 시간표를 미리 확인해 주세요.\n- 강의실 배정은 학사정보시스템에서 조회할 수 있습니다.\n\n자세한 내용은 학사일정을 확인해 주세요.",
    "author": "관리자",
    "department": "교무처",
    "createdAt": "2026-06-24",
    "dueDate": null,
    "views": 152,
    "isPinned": false
  },
  {
    "id": 70,
    "category": "장학",
    "subCategory": null,
    "title": "2026학년도 2학기 국가장학금 신청 안내",
    "content": "2026학년도 2학기 국가장학금 신청 기간을 안내합니다.\n\n■ 신청 마감\n2026년 9월 10일(목) 18:00\n\n■ 신청 방법\n한국장학재단 홈페이지 또는 모바일 앱\n\n■ 유의사항\n- 가구원 동의와 서류 제출까지 마쳐야 신청이 완료됩니다.\n- 기간 내에 신청하지 않으면 2학기 국가장학금을 받을 수 없습니다.",
    "author": "관리자",
    "department": "학생지원팀",
    "createdAt": "2026-06-23",
    "dueDate": "2026-09-10",
    "views": 98,
    "isPinned": false
  },
  {
    "id": 69,
    "category": "행사",
    "subCategory": null,
    "title": "2026 교내 소프트웨어 경진대회 참가자 모집",
    "content": "소프트웨어 경진대회 참가자를 모집합니다. 재학생 여러분의 많은 참여 바랍니다.\n\n■ 접수 마감\n2026년 9월 20일(일)\n\n■ 참가 자격\n재학생 누구나 (팀당 2~4명)\n\n■ 시상\n대상 1팀, 최우수 2팀, 우수 3팀\n\n문의: 컴퓨터정보공학과 사무실",
    "author": "관리자",
    "department": "컴퓨터정보공학과",
    "createdAt": "2026-06-22",
    "dueDate": "2026-09-20",
    "views": 73,
    "isPinned": false
  },
  {
    "id": 68,
    "category": "채용",
    "subCategory": null,
    "title": "2026 하반기 IT기업 인턴 채용 안내",
    "content": "IT 관련 기업의 하반기 인턴 채용 정보를 안내합니다.\n\n■ 접수 마감\n2026년 9월 30일(수)\n\n■ 모집 분야\n소프트웨어 개발, 정보보안, 데이터 분석\n\n■ 지원 방법\n취업지원센터를 통해 일괄 접수합니다.\n\n기업별 상세 요강은 취업지원센터에 비치돼 있습니다.",
    "author": "취업담당자",
    "department": "취업지원센터",
    "createdAt": "2026-06-21",
    "dueDate": "2026-09-30",
    "views": 45,
    "isPinned": false
  },
  {
    "id": 67,
    "category": "일반",
    "subCategory": null,
    "title": "학교 홈페이지 이용 안내",
    "content": "학교 홈페이지 이용 방법과 주요 기능을 안내합니다.\n\n■ 공지사항\n학사·행사·장학·채용·일반 다섯 가지로 나뉘어 있습니다. 상단 탭으로 걸러 볼 수 있습니다.\n\n■ AI 도우미\n오른쪽 아래 버튼을 누르면 열립니다. 원하는 조건을 말하면 목록을 바로 걸러 줍니다.\n\n■ 통합 검색\n공지사항과 학교 안내 문서를 한 번에 찾을 수 있습니다.",
    "author": "관리자",
    "department": "정보전산팀",
    "createdAt": "2026-06-20",
    "dueDate": null,
    "views": 21,
    "isPinned": false
  },
  {
    "id": 66,
    "category": "장학",
    "subCategory": null,
    "title": "2026학년도 2학기 국가장학금 2차 신청 안내",
    "content": "2학기 국가장학금 2차 신청이 시작되었습니다.\n\n■ 신청 기간\n8월 4일(화) 09:00 ~ 8월 17일(월) 18:00\n\n■ 신청 방법\n한국장학재단 홈페이지 또는 모바일 앱\n\n■ 유의사항\n- 1차 미신청 신입생·편입생·재입학생이 대상입니다.\n- 가구원 동의와 서류 제출까지 마쳐야 신청이 완료됩니다.\n- 기한을 넘기면 2학기 국가장학금을 받을 수 없습니다.",
    "author": "김민준",
    "department": "학생지원팀",
    "createdAt": "2026-08-04",
    "dueDate": "2026-08-17",
    "views": 412,
    "isPinned": true
  },
  {
    "id": 65,
    "category": "학사",
    "subCategory": null,
    "title": "수강 정정 기간 및 유의사항 안내",
    "content": "2학기 수강 정정 기간을 안내드립니다.\n\n■ 기간: 8월 19일(수) ~ 8월 21일(금)\n■ 방법: 학사정보시스템 > 수강신청 > 정정\n\n정정 기간 이후에는 어떠한 사유로도 변경할 수 없으니 시간표를 미리 확인해 주세요.",
    "author": "박서연",
    "department": "학사지원팀",
    "createdAt": "2026-08-10",
    "dueDate": "2026-08-21",
    "views": 188,
    "isPinned": false
  },
  {
    "id": 64,
    "category": "행사",
    "subCategory": null,
    "title": "2026 인하공전 축제 부스 운영팀 모집",
    "content": "가을 축제에서 함께할 부스 운영팀을 모집합니다.\n\n■ 모집 인원: 20명\n■ 활동 기간: 9월 22일 ~ 9월 24일\n■ 신청: 총학생회 SNS 링크\n\n봉사시간이 인정됩니다.",
    "author": "이도현",
    "department": "총학생회",
    "createdAt": "2026-08-09",
    "dueDate": "2026-08-20",
    "views": 95,
    "isPinned": false
  },
  {
    "id": 63,
    "category": "채용",
    "subCategory": null,
    "title": "2026 하반기 공채 대비 특강 신청",
    "content": "하반기 공채를 준비하는 재학생을 위한 특강입니다.\n\n■ 일정: 8월 25일 ~ 8월 27일 (3일)\n■ 장소: 본관 3층 대강의실\n■ 내용: 자기소개서, 인적성, 모의 면접\n\n선착순 60명, 전 학년 신청 가능합니다.",
    "author": "정하윤",
    "department": "취업지원센터",
    "createdAt": "2026-08-08",
    "dueDate": "2026-08-18",
    "views": 231,
    "isPinned": false
  },
  {
    "id": 62,
    "category": "학사",
    "subCategory": null,
    "title": "하계 계절학기 성적 정정 기간 안내",
    "content": "하계 계절학기 성적 정정 기간입니다.\n\n■ 기간: 8월 12일(수) ~ 8월 14일(금)\n■ 방법: 담당 교수님께 직접 문의\n\n정정 기간이 지나면 성적은 확정되며 변경되지 않습니다.",
    "author": "박서연",
    "department": "학사지원팀",
    "createdAt": "2026-08-07",
    "dueDate": "2026-08-14",
    "views": 176,
    "isPinned": false
  },
  {
    "id": 61,
    "category": "일반",
    "subCategory": null,
    "title": "교내 주차장 공사에 따른 통행 안내",
    "content": "제2주차장 포장 공사로 통행이 제한됩니다.\n\n■ 기간: 8월 10일 ~ 8월 28일\n■ 제한 구역: 제2주차장 전체\n■ 대체 주차: 제1주차장, 체육관 앞 임시 구역",
    "author": "최우진",
    "department": "시설관리팀",
    "createdAt": "2026-08-06",
    "dueDate": null,
    "views": 64,
    "isPinned": false
  },
  {
    "id": 60,
    "category": "장학",
    "subCategory": "근로",
    "title": "2026학년도 2학기 교내 근로장학생 2차 모집",
    "content": "2학기 교내 근로장학생을 모집합니다.\n\n■ 모집 인원: 45명\n■ 근로 시간: 주 10시간 이내\n■ 지급액: 시간당 11,000원\n■ 신청: 학사정보시스템 > 장학 > 근로장학 신청\n\n소득분위 8분위 이하를 우선 선발합니다.",
    "author": "김민준",
    "department": "학생지원팀",
    "createdAt": "2026-08-05",
    "dueDate": "2026-08-15",
    "views": 308,
    "isPinned": false
  },
  {
    "id": 59,
    "category": "장학",
    "subCategory": null,
    "title": "교내 성적우수 장학 신청 안내",
    "content": "직전 학기 성적 우수자에게 교내 장학금을 지급합니다.\n\n■ 대상: 평점 4.0 이상, 15학점 이상 이수자\n■ 지급액: 등록금의 30~100%\n■ 신청: 8월 3일 ~ 8월 16일",
    "author": "김민준",
    "department": "학생지원팀",
    "createdAt": "2026-07-28",
    "dueDate": "2026-08-16",
    "views": 264,
    "isPinned": false
  },
  {
    "id": 58,
    "category": "행사",
    "subCategory": null,
    "title": "제32회 체육대회 참가 신청",
    "content": "학과 대항 체육대회 참가 신청을 받습니다.\n\n■ 일정: 9월 12일(금)\n■ 종목: 축구, 농구, 피구, 줄다리기, 이어달리기\n■ 신청: 학과 학생회를 통해 일괄 접수",
    "author": "이도현",
    "department": "총학생회",
    "createdAt": "2026-08-04",
    "dueDate": "2026-09-05",
    "views": 142,
    "isPinned": false
  },
  {
    "id": 57,
    "category": "채용",
    "subCategory": null,
    "title": "LINC 산학협력 인턴십 모집",
    "content": "산학협력 가족회사와 함께하는 현장 실습입니다.\n\n■ 기간: 9월 ~ 12월 (4개월)\n■ 자격: 2학년 이상 재학생\n■ 지원금: 월 80만원\n■ 학점: 최대 6학점 인정",
    "author": "한지우",
    "department": "산학협력단",
    "createdAt": "2026-08-03",
    "dueDate": "2026-08-19",
    "views": 197,
    "isPinned": false
  },
  {
    "id": 56,
    "category": "학사",
    "subCategory": null,
    "title": "2학기 등록금 분할 납부 신청 안내",
    "content": "등록금 분할 납부를 원하는 학생은 기간 내에 신청해 주세요.\n\n■ 분할 횟수: 최대 4회\n■ 신청: 8월 10일 ~ 8월 25일\n■ 방법: 학사정보시스템 > 등록 > 분할납부",
    "author": "송예린",
    "department": "재무회계팀",
    "createdAt": "2026-08-03",
    "dueDate": "2026-08-25",
    "views": 523,
    "isPinned": false
  },
  {
    "id": 55,
    "category": "일반",
    "subCategory": null,
    "title": "여름철 냉방기 운영 시간 조정",
    "content": "에너지 절약을 위해 냉방기 운영 시간을 조정합니다.\n\n■ 시간: 09:00 ~ 18:00\n■ 기간: 8월 1일 ~ 8월 31일",
    "author": "최우진",
    "department": "시설관리팀",
    "createdAt": "2026-08-01",
    "dueDate": null,
    "views": 41,
    "isPinned": false
  },
  {
    "id": 54,
    "category": "학사",
    "subCategory": null,
    "title": "2027년 2월 졸업 예정자 학점 확인 요청",
    "content": "졸업 예정자는 졸업 요건 충족 여부를 반드시 확인해 주세요.\n\n■ 확인: 학사정보시스템 > 졸업 > 졸업사정 조회\n■ 미충족 시 2학기 수강신청에 반영해야 합니다.",
    "author": "박서연",
    "department": "학사지원팀",
    "createdAt": "2026-07-30",
    "dueDate": "2026-08-29",
    "views": 289,
    "isPinned": false
  },
  {
    "id": 53,
    "category": "장학",
    "subCategory": null,
    "title": "저소득층 생활지원 장학금 신청",
    "content": "경제적 어려움을 겪는 재학생을 지원합니다.\n\n■ 대상: 소득분위 4분위 이하\n■ 지급액: 학기당 100만원\n■ 서류: 신청서, 가족관계증명서, 소득 증빙",
    "author": "김민준",
    "department": "학생지원팀",
    "createdAt": "2026-07-29",
    "dueDate": "2026-08-22",
    "views": 176,
    "isPinned": false
  },
  {
    "id": 52,
    "category": "행사",
    "subCategory": null,
    "title": "2학기 신입생·편입생 오리엔테이션",
    "content": "2학기 편입생과 신입생을 위한 오리엔테이션입니다.\n\n■ 일시: 8월 28일(금) 14:00\n■ 장소: 학과별 강의실",
    "author": "이도현",
    "department": "총학생회",
    "createdAt": "2026-07-28",
    "dueDate": null,
    "views": 118,
    "isPinned": false
  },
  {
    "id": 51,
    "category": "채용",
    "subCategory": null,
    "title": "공무원 시험 대비 스터디 그룹 모집",
    "content": "9급 공무원 시험 준비 스터디를 운영합니다.\n\n■ 인원: 15명\n■ 기간: 9월 ~ 12월\n■ 지원: 교재비, 스터디룸 제공",
    "author": "정하윤",
    "department": "취업지원센터",
    "createdAt": "2026-07-27",
    "dueDate": "2026-08-12",
    "views": 154,
    "isPinned": false
  },
  {
    "id": 50,
    "category": "학사",
    "subCategory": null,
    "title": "재학생 전공 변경 신청 안내",
    "content": "전공 변경을 희망하는 재학생의 신청을 받습니다.\n\n■ 자격: 2학기 이상 이수, 평점 2.5 이상\n■ 선발: 서류 및 면접\n■ 신청: 8월 3일 ~ 8월 14일",
    "author": "박서연",
    "department": "학사지원팀",
    "createdAt": "2026-07-25",
    "dueDate": "2026-08-14",
    "views": 203,
    "isPinned": false
  },
  {
    "id": 49,
    "category": "일반",
    "subCategory": null,
    "title": "도서관 하계 휴관일 안내",
    "content": "시설 점검을 위해 도서관을 휴관합니다.\n\n■ 휴관일: 8월 14일(금)\n■ 전자 자료는 정상 이용 가능합니다.",
    "author": "윤서아",
    "department": "학술정보원",
    "createdAt": "2026-07-24",
    "dueDate": null,
    "views": 87,
    "isPinned": false
  },
  {
    "id": 48,
    "category": "장학",
    "subCategory": null,
    "title": "해외 연수 장학 프로그램 설명회",
    "content": "겨울 방학 해외 어학연수 장학 프로그램을 소개합니다.\n\n■ 설명회: 8월 13일(목) 15:00, 본관 2층 세미나실\n■ 대상 국가: 일본, 대만, 싱가포르\n■ 지원: 항공료 및 등록금 일부",
    "author": "오세훈",
    "department": "국제교류팀",
    "createdAt": "2026-07-22",
    "dueDate": "2026-08-13",
    "views": 132,
    "isPinned": false
  },
  {
    "id": 47,
    "category": "행사",
    "subCategory": null,
    "title": "교내 전공 경진대회 개최",
    "content": "전공 역량을 겨루는 교내 경진대회입니다.\n\n■ 접수: 8월 20일 ~ 9월 10일\n■ 본선: 10월 8일\n■ 시상: 대상 200만원 외 다수",
    "author": "한지우",
    "department": "산학협력단",
    "createdAt": "2026-07-21",
    "dueDate": "2026-09-10",
    "views": 76,
    "isPinned": false
  },
  {
    "id": 46,
    "category": "채용",
    "subCategory": null,
    "title": "취업 특강 — 포트폴리오 만들기",
    "content": "실무자가 알려주는 포트폴리오 제작 특강입니다.\n\n■ 일시: 8월 20일(목) 14:00\n■ 대상: 전 학년\n■ 장소: 창의관 401호",
    "author": "정하윤",
    "department": "취업지원센터",
    "createdAt": "2026-07-20",
    "dueDate": null,
    "views": 245,
    "isPinned": false
  },
  {
    "id": 45,
    "category": "학사",
    "subCategory": null,
    "title": "휴학 및 복학 신청 기간 안내",
    "content": "2학기 휴학과 복학 신청 기간입니다.\n\n■ 기간: 8월 1일 ~ 8월 28일\n■ 방법: 학사정보시스템 신청 후 학과 승인",
    "author": "박서연",
    "department": "학사지원팀",
    "createdAt": "2026-07-18",
    "dueDate": "2026-08-28",
    "views": 312,
    "isPinned": false
  },
  {
    "id": 44,
    "category": "일반",
    "subCategory": null,
    "title": "교내 무선 네트워크 개선 작업",
    "content": "무선 네트워크 장비를 교체합니다.\n\n■ 작업일: 8월 18일 ~ 8월 19일\n■ 영향: 작업 시간 중 일시적 접속 불가",
    "author": "최우진",
    "department": "정보전산원",
    "createdAt": "2026-07-17",
    "dueDate": null,
    "views": 58,
    "isPinned": false
  },
  {
    "id": 43,
    "category": "장학",
    "subCategory": null,
    "title": "봉사활동 우수자 장학금 추천 요청",
    "content": "봉사 시간이 우수한 학생을 학과별로 추천해 주세요.\n\n■ 기준: 연간 봉사 40시간 이상\n■ 마감: 8월 20일",
    "author": "김민준",
    "department": "학생지원팀",
    "createdAt": "2026-07-15",
    "dueDate": "2026-08-20",
    "views": 94,
    "isPinned": false
  },
  {
    "id": 42,
    "category": "행사",
    "subCategory": null,
    "title": "총장배 e스포츠 대회 참가팀 모집",
    "content": "총장배 e스포츠 대회를 개최합니다.\n\n■ 종목: LOL, 배틀그라운드\n■ 접수: 8월 30일까지\n■ 상금: 종목별 100만원",
    "author": "이도현",
    "department": "총학생회",
    "createdAt": "2026-07-14",
    "dueDate": "2026-08-30",
    "views": 167,
    "isPinned": false
  },
  {
    "id": 41,
    "category": "채용",
    "subCategory": null,
    "title": "직무 적성 검사 무료 응시 안내",
    "content": "재학생 대상 직무 적성 검사를 무료로 제공합니다.\n\n■ 신청: 취업지원센터 방문 또는 온라인\n■ 결과 상담도 함께 제공됩니다.",
    "author": "정하윤",
    "department": "취업지원센터",
    "createdAt": "2026-07-12",
    "dueDate": "2026-08-31",
    "views": 138,
    "isPinned": false
  },
  {
    "id": 40,
    "category": "학사",
    "subCategory": null,
    "title": "교직 과정 이수 신청 안내",
    "content": "교직 과정 이수를 희망하는 학생의 신청을 받습니다.\n\n■ 자격: 1학년 성적 상위 30% 이내\n■ 신청: 8월 3일 ~ 8월 18일",
    "author": "박서연",
    "department": "학사지원팀",
    "createdAt": "2026-07-10",
    "dueDate": "2026-08-18",
    "views": 109,
    "isPinned": false
  },
  {
    "id": 39,
    "category": "일반",
    "subCategory": null,
    "title": "생활관 2학기 입사 신청 안내",
    "content": "생활관(기숙사) 2학기 입사 신청을 받습니다.\n\n■ 신청: 8월 1일 ~ 8월 15일\n■ 선발: 통학 거리, 소득분위, 직전 학기 성적\n■ 입사일: 8월 30일(일)\n\n합격자는 8월 20일 생활관 홈페이지에 발표됩니다.",
    "author": "윤서아",
    "department": "생활관운영팀",
    "createdAt": "2026-07-08",
    "dueDate": "2026-08-15",
    "views": 421,
    "isPinned": false
  },
  {
    "id": 38,
    "category": "일반",
    "subCategory": null,
    "title": "생활관 생활 수칙 개정 안내",
    "content": "2학기부터 적용되는 생활관(기숙사) 수칙 변경 사항입니다.\n\n■ 점호 시간: 23:00 → 24:00\n■ 취사 구역 확대\n■ 자세한 내용은 생활관 홈페이지를 확인하세요.",
    "author": "윤서아",
    "department": "생활관운영팀",
    "createdAt": "2026-07-05",
    "dueDate": null,
    "views": 73,
    "isPinned": false
  },
  {
    "id": 37,
    "category": "학사",
    "subCategory": null,
    "title": "2026학년도 2학기 학사일정 확정",
    "content": "2학기 주요 학사일정입니다.\n\n■ 개강: 9월 1일(화)\n■ 중간고사: 10월 20일 ~ 10월 24일\n■ 기말고사: 12월 15일 ~ 12월 19일\n■ 종강: 12월 19일(금)",
    "author": "박서연",
    "department": "학사지원팀",
    "createdAt": "2026-07-01",
    "dueDate": null,
    "views": 634,
    "isPinned": false
  },
  {
    "id": 36,
    "category": "장학",
    "subCategory": "근로",
    "title": "근로장학생 근로지 배정 결과 발표",
    "content": "1차 근로장학생 근로지 배정 결과를 발표합니다.\n\n■ 확인: 학사정보시스템 > 장학 > 근로장학\n■ 배정 확인 마감: 8월 18일\n■ 기한 내 확인하지 않으면 배정이 취소됩니다.",
    "author": "김민준",
    "department": "학생지원팀",
    "createdAt": "2026-08-11",
    "dueDate": "2026-08-18",
    "views": 211,
    "isPinned": false
  },
  {
    "id": 35,
    "category": "장학",
    "subCategory": "근로",
    "title": "국가근로장학금 신청 안내",
    "content": "국가근로장학금 2학기 신청 안내입니다.\n\n■ 신청: 한국장학재단 홈페이지\n■ 마감: 8월 14일\n■ 교내·교외 근로지 중 선택할 수 있습니다.",
    "author": "김민준",
    "department": "학생지원팀",
    "createdAt": "2026-07-19",
    "dueDate": "2026-08-14",
    "views": 187,
    "isPinned": false
  },
  {
    "id": 34,
    "category": "장학",
    "subCategory": "근로",
    "title": "근로장학생 안전 교육 이수 안내",
    "content": "근로 시작 전 안전 교육을 반드시 이수해야 합니다.\n\n■ 방법: 온라인 강의 40분 수강\n■ 마감: 8월 26일\n■ 미이수 시 근로를 시작할 수 없습니다.",
    "author": "김민준",
    "department": "학생지원팀",
    "createdAt": "2026-07-16",
    "dueDate": "2026-08-26",
    "views": 88,
    "isPinned": false
  },
  {
    "id": 33,
    "category": "장학",
    "subCategory": "근로",
    "title": "방학 중 근로장학생 추가 모집",
    "content": "방학 중 근로 인원을 추가 모집합니다.\n\n■ 인원: 12명\n■ 근로 기간: 7월 27일 ~ 8월 21일",
    "author": "김민준",
    "department": "학생지원팀",
    "createdAt": "2026-07-03",
    "dueDate": "2026-07-20",
    "views": 143,
    "isPinned": false
  },
  {
    "id": 32,
    "category": "장학",
    "subCategory": null,
    "title": "교외 장학재단 추천 대상자 모집",
    "content": "교외 장학재단 추천 대상자를 모집합니다.\n\n■ 대상: 2학년 이상, 평점 3.5 이상\n■ 서류: 추천서, 자기소개서",
    "author": "오세훈",
    "department": "학생지원팀",
    "createdAt": "2026-07-11",
    "dueDate": "2026-08-23",
    "views": 121,
    "isPinned": false
  },
  {
    "id": 31,
    "category": "장학",
    "subCategory": null,
    "title": "가족 장학금(형제자매 재학) 신청",
    "content": "형제자매가 함께 재학 중인 경우 신청할 수 있습니다.\n\n■ 지급액: 1인당 등록금의 10%\n■ 서류: 가족관계증명서",
    "author": "김민준",
    "department": "학생지원팀",
    "createdAt": "2026-07-07",
    "dueDate": "2026-08-27",
    "views": 67,
    "isPinned": false
  },
  {
    "id": 30,
    "category": "장학",
    "subCategory": null,
    "title": "장애학생 지원 장학금 안내",
    "content": "장애학생을 위한 학업 지원 장학금입니다.\n\n■ 대상: 장애인 등록 재학생\n■ 지원: 등록금 및 학습 보조 기기",
    "author": "김민준",
    "department": "학생지원팀",
    "createdAt": "2026-07-02",
    "dueDate": null,
    "views": 54,
    "isPinned": false
  },
  {
    "id": 29,
    "category": "장학",
    "subCategory": null,
    "title": "2학기 장학금 지급 일정 안내",
    "content": "2학기 장학금 지급 일정입니다.\n\n■ 교내 장학: 9월 25일\n■ 국가장학금: 10월 10일 예정\n■ 계좌 정보를 미리 확인해 주세요.",
    "author": "송예린",
    "department": "재무회계팀",
    "createdAt": "2026-06-30",
    "dueDate": null,
    "views": 198,
    "isPinned": false
  },
  {
    "id": 28,
    "category": "학사",
    "subCategory": null,
    "title": "2학기 수강신청 일정 안내",
    "content": "2학기 수강신청 일정입니다.\n\n■ 장바구니: 8월 5일 ~ 8월 7일\n■ 본 수강신청: 8월 11일 ~ 8월 13일\n■ 학년별 시간이 다르니 공지를 확인하세요.",
    "author": "박서연",
    "department": "학사지원팀",
    "createdAt": "2026-08-02",
    "dueDate": "2026-08-13",
    "views": 478,
    "isPinned": false
  },
  {
    "id": 27,
    "category": "학사",
    "subCategory": null,
    "title": "계절학기 개설 강좌 안내",
    "content": "하계 계절학기 개설 강좌 목록입니다.\n\n■ 수업 기간: 7월 6일 ~ 7월 24일\n■ 최대 6학점까지 수강할 수 있습니다.",
    "author": "박서연",
    "department": "학사지원팀",
    "createdAt": "2026-06-28",
    "dueDate": null,
    "views": 156,
    "isPinned": false
  },
  {
    "id": 26,
    "category": "학사",
    "subCategory": null,
    "title": "학사 경고자 상담 안내",
    "content": "직전 학기 학사 경고를 받은 학생은 상담을 받아야 합니다.\n\n■ 신청: 학과 사무실\n■ 마감: 8월 31일\n■ 미이수 시 수강 학점이 제한됩니다.",
    "author": "박서연",
    "department": "학사지원팀",
    "createdAt": "2026-07-13",
    "dueDate": "2026-08-31",
    "views": 92,
    "isPinned": false
  },
  {
    "id": 25,
    "category": "학사",
    "subCategory": null,
    "title": "복수전공·부전공 신청 안내",
    "content": "복수전공과 부전공 신청을 받습니다.\n\n■ 자격: 3학기 이상 이수\n■ 신청: 학사정보시스템",
    "author": "박서연",
    "department": "학사지원팀",
    "createdAt": "2026-07-09",
    "dueDate": "2026-08-20",
    "views": 134,
    "isPinned": false
  },
  {
    "id": 24,
    "category": "학사",
    "subCategory": null,
    "title": "2학기 교재 구매 안내",
    "content": "2학기 교재는 교내 서점과 온라인에서 구매할 수 있습니다.\n\n■ 교내 서점: 본관 지하 1층\n■ 강의계획서에서 교재를 확인하세요.",
    "author": "송예린",
    "department": "학사지원팀",
    "createdAt": "2026-08-06",
    "dueDate": null,
    "views": 87,
    "isPinned": false
  },
  {
    "id": 23,
    "category": "학사",
    "subCategory": null,
    "title": "학점 포기 제도 시행 안내",
    "content": "2026학년도부터 학점 포기 제도를 시행합니다.\n\n■ 대상: F 학점을 제외한 D 이하 과목\n■ 재학 중 최대 6학점까지",
    "author": "박서연",
    "department": "학사지원팀",
    "createdAt": "2026-07-06",
    "dueDate": null,
    "views": 167,
    "isPinned": false
  },
  {
    "id": 22,
    "category": "학사",
    "subCategory": null,
    "title": "현장실습 학점 인정 신청",
    "content": "현장실습을 이수한 학생의 학점 인정 신청입니다.\n\n■ 신청: 8월 1일 ~ 8월 24일\n■ 서류: 실습 확인서, 실습 일지",
    "author": "한지우",
    "department": "산학협력단",
    "createdAt": "2026-07-04",
    "dueDate": "2026-08-24",
    "views": 103,
    "isPinned": false
  },
  {
    "id": 21,
    "category": "채용",
    "subCategory": null,
    "title": "교내 채용박람회 개최 안내",
    "content": "가족회사 40여 곳이 참여하는 채용박람회입니다.\n\n■ 일시: 9월 24일(목) 10:00 ~ 16:00\n■ 장소: 체육관\n■ 이력서를 지참하세요.",
    "author": "정하윤",
    "department": "취업지원센터",
    "createdAt": "2026-08-07",
    "dueDate": "2026-09-18",
    "views": 176,
    "isPinned": false
  },
  {
    "id": 20,
    "category": "채용",
    "subCategory": null,
    "title": "자기소개서 첨삭 신청 안내",
    "content": "1:1 자기소개서 첨삭을 신청할 수 있습니다.\n\n■ 신청: 취업지원센터 온라인 예약\n■ 1인당 2회까지",
    "author": "정하윤",
    "department": "취업지원센터",
    "createdAt": "2026-07-23",
    "dueDate": "2026-08-29",
    "views": 212,
    "isPinned": false
  },
  {
    "id": 19,
    "category": "채용",
    "subCategory": null,
    "title": "IT 직무 취업 캠프 참가자 모집",
    "content": "IT 직무 취업 준비 캠프를 운영합니다.\n\n■ 기간: 8월 24일 ~ 8월 28일 (5일)\n■ 인원: 30명\n■ 내용: 포트폴리오, 코딩테스트, 기술 면접",
    "author": "정하윤",
    "department": "취업지원센터",
    "createdAt": "2026-07-05",
    "dueDate": "2026-08-16",
    "views": 165,
    "isPinned": false
  },
  {
    "id": 18,
    "category": "채용",
    "subCategory": null,
    "title": "산업기사 자격증 대비반 모집",
    "content": "산업기사 필기·실기 대비반을 모집합니다.\n\n■ 과목: 전기, 기계, 정보처리\n■ 수강료: 전액 지원",
    "author": "한지우",
    "department": "산학협력단",
    "createdAt": "2026-06-29",
    "dueDate": "2026-08-10",
    "views": 119,
    "isPinned": false
  },
  {
    "id": 17,
    "category": "채용",
    "subCategory": null,
    "title": "졸업생 취업 현황 조사 협조 요청",
    "content": "졸업생 취업 현황 조사에 협조 부탁드립니다.\n\n■ 대상: 2026년 2월 졸업생\n■ 방법: 온라인 설문",
    "author": "정하윤",
    "department": "취업지원센터",
    "createdAt": "2026-07-01",
    "dueDate": "2026-08-31",
    "views": 71,
    "isPinned": false
  },
  {
    "id": 16,
    "category": "채용",
    "subCategory": null,
    "title": "해외 취업 설명회 안내",
    "content": "일본 IT 기업 해외 취업 설명회입니다.\n\n■ 일시: 8월 21일(금) 14:00\n■ 장소: 본관 대강당",
    "author": "오세훈",
    "department": "국제교류팀",
    "createdAt": "2026-06-27",
    "dueDate": null,
    "views": 98,
    "isPinned": false
  },
  {
    "id": 15,
    "category": "행사",
    "subCategory": null,
    "title": "가을 축제 공연팀 오디션",
    "content": "축제 무대에 설 공연팀을 모집합니다.\n\n■ 오디션: 9월 4일(금)\n■ 신청: 9월 1일까지",
    "author": "이도현",
    "department": "총학생회",
    "createdAt": "2026-08-08",
    "dueDate": "2026-09-01",
    "views": 128,
    "isPinned": false
  },
  {
    "id": 14,
    "category": "행사",
    "subCategory": null,
    "title": "독서 마라톤 참가자 모집",
    "content": "한 학기 동안 책을 읽고 기록하는 프로그램입니다.\n\n■ 기간: 9월 ~ 12월\n■ 시상: 상위 20명에게 도서 상품권",
    "author": "윤서아",
    "department": "학술정보원",
    "createdAt": "2026-07-26",
    "dueDate": "2026-09-30",
    "views": 64,
    "isPinned": false
  },
  {
    "id": 13,
    "category": "행사",
    "subCategory": null,
    "title": "교내 사진 공모전 개최",
    "content": "캠퍼스를 주제로 한 사진 공모전입니다.\n\n■ 접수: 9월 20일까지\n■ 시상: 대상 30만원",
    "author": "이도현",
    "department": "총학생회",
    "createdAt": "2026-07-12",
    "dueDate": "2026-09-20",
    "views": 83,
    "isPinned": false
  },
  {
    "id": 12,
    "category": "행사",
    "subCategory": null,
    "title": "신입생 멘토링 프로그램 멘토 모집",
    "content": "신입생을 도와줄 선배 멘토를 모집합니다.\n\n■ 자격: 2학년 이상\n■ 혜택: 봉사시간, 활동비 지급",
    "author": "이도현",
    "department": "학생지원팀",
    "createdAt": "2026-06-26",
    "dueDate": "2026-08-20",
    "views": 107,
    "isPinned": false
  },
  {
    "id": 11,
    "category": "행사",
    "subCategory": null,
    "title": "학과별 학술제 일정 안내",
    "content": "학과별 학술제 일정을 안내합니다.\n\n■ 기간: 11월 2일 ~ 11월 13일\n■ 자세한 일정은 학과 공지를 확인하세요.",
    "author": "한지우",
    "department": "산학협력단",
    "createdAt": "2026-06-24",
    "dueDate": null,
    "views": 59,
    "isPinned": false
  },
  {
    "id": 10,
    "category": "일반",
    "subCategory": null,
    "title": "교내 흡연 구역 조정 안내",
    "content": "교내 흡연 구역이 조정되었습니다.\n\n■ 지정 구역: 후문 옆, 체육관 뒤편\n■ 그 외 구역은 금연입니다.",
    "author": "최우진",
    "department": "시설관리팀",
    "createdAt": "2026-08-05",
    "dueDate": null,
    "views": 52,
    "isPinned": false
  },
  {
    "id": 9,
    "category": "일반",
    "subCategory": null,
    "title": "학생증 재발급 안내",
    "content": "학생증 분실 시 재발급 절차입니다.\n\n■ 신청: 본관 1층 학사지원팀\n■ 수수료: 5,000원\n■ 발급 기간: 약 5일",
    "author": "송예린",
    "department": "학사지원팀",
    "createdAt": "2026-07-27",
    "dueDate": null,
    "views": 144,
    "isPinned": false
  },
  {
    "id": 8,
    "category": "일반",
    "subCategory": null,
    "title": "교내 셔틀버스 2학기 운행 일정",
    "content": "2학기 셔틀버스 운행 일정입니다.\n\n■ 운행: 08:00 ~ 19:00, 20분 간격\n■ 노선: 지하철역 ↔ 정문 ↔ 생활관",
    "author": "최우진",
    "department": "시설관리팀",
    "createdAt": "2026-07-20",
    "dueDate": null,
    "views": 231,
    "isPinned": false
  },
  {
    "id": 7,
    "category": "일반",
    "subCategory": null,
    "title": "분실물 보관 및 인계 안내",
    "content": "분실물은 본관 1층 안내데스크에 보관합니다.\n\n■ 보관 기간: 3개월\n■ 기간이 지나면 폐기합니다.",
    "author": "최우진",
    "department": "시설관리팀",
    "createdAt": "2026-07-14",
    "dueDate": null,
    "views": 38,
    "isPinned": false
  },
  {
    "id": 6,
    "category": "일반",
    "subCategory": null,
    "title": "교내 헬스장 이용 안내",
    "content": "재학생은 교내 헬스장을 무료로 이용할 수 있습니다.\n\n■ 운영: 평일 07:00 ~ 21:00\n■ 학생증을 지참하세요.",
    "author": "윤서아",
    "department": "생활관운영팀",
    "createdAt": "2026-06-25",
    "dueDate": null,
    "views": 176,
    "isPinned": false
  },
  {
    "id": 5,
    "category": "장학",
    "subCategory": null,
    "title": "2학기 교내 장학금 최종 확정자 발표 및 이의신청",
    "content": "2학기 교내 장학금 확정자를 발표합니다.\n\n■ 확인: 학사정보시스템 > 장학 > 수혜 내역\n■ 이의신청: 8월 24일 ~ 8월 29일\n■ 기간이 지나면 이의신청을 받지 않습니다.",
    "author": "김민준",
    "department": "학생지원팀",
    "createdAt": "2026-08-17",
    "dueDate": "2026-08-29",
    "views": 176,
    "isPinned": false
  },
  {
    "id": 4,
    "category": "장학",
    "subCategory": null,
    "title": "국가장학금 학자금 지원구간 산정 결과 확인 요청",
    "content": "국가장학금 학자금 지원구간 산정 결과를 확인해 주세요.\n\n■ 확인: 한국장학재단 홈페이지\n■ 이의신청 마감: 9월 2일\n■ 구간이 확정되어야 장학금이 지급됩니다.",
    "author": "김민준",
    "department": "학생지원팀",
    "createdAt": "2026-08-14",
    "dueDate": "2026-09-02",
    "views": 243,
    "isPinned": false
  },
  {
    "id": 3,
    "category": "장학",
    "subCategory": "근로",
    "title": "2학기 근로장학생 3차 추가 모집",
    "content": "2차 모집에서 미충원된 근로지를 추가 모집합니다.\n\n■ 인원: 18명\n■ 근로 시작: 9월 7일\n■ 신청: 학사정보시스템 > 장학 > 근로장학",
    "author": "김민준",
    "department": "학생지원팀",
    "createdAt": "2026-08-16",
    "dueDate": "2026-09-04",
    "views": 158,
    "isPinned": false
  },
  {
    "id": 2,
    "category": "채용",
    "subCategory": null,
    "title": "2학기 현장실습 참여 학생 모집",
    "content": "2학기 현장실습 참여 학생을 모집합니다.\n\n■ 실습 기간: 9월 ~ 12월\n■ 학점: 최대 6학점 인정\n■ 신청 마감: 9월 3일",
    "author": "한지우",
    "department": "산학협력단",
    "createdAt": "2026-08-15",
    "dueDate": "2026-09-03",
    "views": 134,
    "isPinned": false
  },
  {
    "id": 1,
    "category": "학사",
    "subCategory": null,
    "title": "2학기 개강 및 수업 운영 안내",
    "content": "9월 1일 개강합니다.\n\n■ 첫 주 수업은 정상 운영됩니다.\n■ 강의실은 학사정보시스템에서 확인하세요.",
    "author": "박서연",
    "department": "학사지원팀",
    "createdAt": "2026-08-18",
    "dueDate": "2026-09-01",
    "views": 97,
    "isPinned": false
  }
];

window.EVENTS = [
  {
    "id": 1,
    "title": "하계 계절학기 성적 정정 마감",
    "startDate": "2026-08-14",
    "endDate": "2026-08-14",
    "isImportant": true
  },
  {
    "id": 2,
    "title": "2학기 수강 정정 기간",
    "startDate": "2026-08-19",
    "endDate": "2026-08-21",
    "isImportant": true
  },
  {
    "id": 3,
    "title": "2학기 등록금 납부 마감",
    "startDate": "2026-08-28",
    "endDate": "2026-08-28",
    "isImportant": true
  },
  {
    "id": 4,
    "title": "생활관 입사",
    "startDate": "2026-08-30",
    "endDate": "2026-08-30",
    "isImportant": false
  },
  {
    "id": 5,
    "title": "2학기 개강",
    "startDate": "2026-09-01",
    "endDate": "2026-09-01",
    "isImportant": true
  },
  {
    "id": 6,
    "title": "수강 신청 확정",
    "startDate": "2026-09-04",
    "endDate": "2026-09-04",
    "isImportant": false
  },
  {
    "id": 7,
    "title": "전공 상담 주간",
    "startDate": "2026-09-07",
    "endDate": "2026-09-11",
    "isImportant": false
  },
  {
    "id": 8,
    "title": "체육대회",
    "startDate": "2026-09-12",
    "endDate": "2026-09-12",
    "isImportant": false
  },
  {
    "id": 9,
    "title": "추석 연휴 휴강",
    "startDate": "2026-09-24",
    "endDate": "2026-09-26",
    "isImportant": true
  },
  {
    "id": 10,
    "title": "채용박람회",
    "startDate": "2026-09-24",
    "endDate": "2026-09-24",
    "isImportant": false
  },
  {
    "id": 11,
    "title": "가을 축제",
    "startDate": "2026-09-22",
    "endDate": "2026-09-24",
    "isImportant": false
  },
  {
    "id": 12,
    "title": "개교기념일 휴업",
    "startDate": "2026-10-05",
    "endDate": "2026-10-05",
    "isImportant": true
  },
  {
    "id": 13,
    "title": "전공 경진대회 본선",
    "startDate": "2026-10-08",
    "endDate": "2026-10-08",
    "isImportant": false
  },
  {
    "id": 14,
    "title": "중간고사",
    "startDate": "2026-10-20",
    "endDate": "2026-10-24",
    "isImportant": true
  },
  {
    "id": 15,
    "title": "중간고사 성적 공시",
    "startDate": "2026-10-28",
    "endDate": "2026-10-30",
    "isImportant": false
  },
  {
    "id": 16,
    "title": "학과 학술제",
    "startDate": "2026-11-02",
    "endDate": "2026-11-13",
    "isImportant": false
  },
  {
    "id": 17,
    "title": "기말 수강 취소 마감",
    "startDate": "2026-11-10",
    "endDate": "2026-11-10",
    "isImportant": true
  },
  {
    "id": 18,
    "title": "겨울 계절학기 신청",
    "startDate": "2026-11-16",
    "endDate": "2026-11-20",
    "isImportant": false
  },
  {
    "id": 19,
    "title": "졸업 사정 확인 기간",
    "startDate": "2026-11-23",
    "endDate": "2026-11-27",
    "isImportant": true
  },
  {
    "id": 20,
    "title": "2027학년도 1학기 수강신청 설명회",
    "startDate": "2026-11-30",
    "endDate": "2026-11-30",
    "isImportant": false
  },
  {
    "id": 21,
    "title": "기말고사",
    "startDate": "2026-12-15",
    "endDate": "2026-12-19",
    "isImportant": true
  },
  {
    "id": 22,
    "title": "종강",
    "startDate": "2026-12-19",
    "endDate": "2026-12-19",
    "isImportant": true
  },
  {
    "id": 23,
    "title": "기말 성적 입력 마감",
    "startDate": "2026-12-24",
    "endDate": "2026-12-24",
    "isImportant": false
  },
  {
    "id": 24,
    "title": "성적 정정 기간",
    "startDate": "2026-12-28",
    "endDate": "2026-12-30",
    "isImportant": true
  },
  {
    "id": 25,
    "title": "겨울 계절학기",
    "startDate": "2026-12-21",
    "endDate": "2027-01-15",
    "isImportant": false
  },
  {
    "id": 26,
    "title": "동계 방학",
    "startDate": "2026-12-21",
    "endDate": "2027-02-28",
    "isImportant": false
  },
  {
    "id": 27,
    "title": "생활관 퇴사",
    "startDate": "2026-12-20",
    "endDate": "2026-12-20",
    "isImportant": false
  },
  {
    "id": 28,
    "title": "동계 방학 시작",
    "startDate": "2026-12-21",
    "endDate": "2026-12-21",
    "isImportant": false
  },
  {
    "id": 29,
    "title": "교직원 워크숍(행정 업무 중단)",
    "startDate": "2026-09-17",
    "endDate": "2026-09-18",
    "isImportant": false
  },
  {
    "id": 30,
    "title": "도서관 시스템 점검 휴관",
    "startDate": "2026-10-15",
    "endDate": "2026-10-15",
    "isImportant": false
  },
  {
    "id": 31,
    "title": "신입생 수시 면접",
    "startDate": "2026-11-07",
    "endDate": "2026-11-08",
    "isImportant": false
  },
  {
    "id": 32,
    "title": "학생회 선거",
    "startDate": "2026-11-19",
    "endDate": "2026-11-19",
    "isImportant": false
  },
  {
    "id": 33,
    "title": "2학기 강의평가 기간",
    "startDate": "2026-12-07",
    "endDate": "2026-12-14",
    "isImportant": true
  }
];

window.PAGES = [
  {
    "slug": "greeting",
    "menu": "대학안내",
    "title": "총장 인사말",
    "sortOrder": 1,
    "body": "인하공업전문대학 홈페이지를 찾아주신 여러분을 환영합니다.\n\n우리 대학은 실무 중심 교육으로 산업 현장이 필요로 하는 인재를 길러왔습니다. 이론에 머무르지 않고 직접 만들고 실험하며 배우는 것, 그것이 우리가 지켜온 방식입니다.\n\n젊음의 앞이 늘 당당할 수 있도록 함께 걷겠습니다."
  },
  {
    "slug": "history",
    "menu": "대학안내",
    "title": "대학 연혁",
    "sortOrder": 2,
    "body": "1958년  개교\n1972년  전문학교로 개편\n1998년  전문대학으로 교명 변경\n2012년  창의관 준공, 산학협력단 출범\n2020년  LINC 사업 선정\n2026년  개교 68주년"
  },
  {
    "slug": "vision",
    "menu": "대학안내",
    "title": "교육목표 및 비전",
    "body": "미래 사회를 선도하는 전문 인재 양성을 목표로 합니다.\n\n■ 교육목표\n- 현장에서 바로 통하는 실무 역량\n- 스스로 배우고 고쳐 나가는 태도\n- 함께 일할 줄 아는 협업 능력\n\n■ 인재상\n배운 것을 직접 만들어 보는 사람, 문제를 끝까지 붙들고 해결하는 사람을 기릅니다.\n\n■ 비전\n산업 현장과 가장 가까운 대학, 졸업생이 자랑스러워하는 대학이 되겠습니다.",
    "sortOrder": 3
  },
  {
    "slug": "campus",
    "menu": "대학안내",
    "title": "캠퍼스 안내",
    "sortOrder": 4,
    "body": "본관        행정실, 대강의실, 학생지원팀\n창의관      실습실, 컴퓨터실, 스튜디오\n학술정보원  도서관, 열람실, 그룹 스터디룸\n생활관      기숙사 A동 · B동\n체육관      실내 체육관, 헬스장"
  },
  {
    "slug": "location",
    "menu": "대학안내",
    "title": "오시는 길",
    "sortOrder": 5,
    "body": "지하철: 1호선 도원역에서 도보 12분\n버스: 8, 15, 24, 519번 정류장 하차\n주차: 제1주차장 이용 (제2주차장은 8월 28일까지 공사)"
  },
  {
    "slug": "departments",
    "menu": "학과안내",
    "title": "학과 목록",
    "sortOrder": 1,
    "body": "컴퓨터정보공학과\n기계공학과\n전기전자공학과\n건축인테리어과\n경영정보과\n시각디자인과"
  },
  {
    "slug": "dept-cs",
    "menu": "학과안내",
    "title": "컴퓨터정보공학과",
    "sortOrder": 2,
    "body": "소프트웨어 개발과 정보 시스템 운영 능력을 갖춘 실무 인재를 기릅니다.\n\n주요 교과목\n- 프로그래밍 기초 / 자료구조\n- 웹 프론트엔드 / 백엔드 개발\n- 데이터베이스 / 네트워크\n- 캡스톤 디자인\n\n진로: 웹 개발자, 시스템 엔지니어, 데이터 분석가"
  },
  {
    "slug": "dept-me",
    "menu": "학과안내",
    "title": "기계공학과",
    "sortOrder": 3,
    "body": "설계부터 가공까지 전 과정을 다루는 기계 전문 인력을 양성합니다.\n\n주요 교과목\n- 기계 제도 / CAD\n- 재료역학 / 유체역학\n- CNC 가공 실습\n- 자동화 시스템"
  },
  {
    "slug": "admission-susi",
    "menu": "입학안내",
    "title": "수시 모집",
    "sortOrder": 1,
    "body": "원서 접수: 9월 9일 ~ 9월 12일\n서류 마감: 9월 15일\n합격 발표: 11월 1일\n\n전형 방법: 학생부 교과 100%"
  },
  {
    "slug": "admission-jeongsi",
    "menu": "입학안내",
    "title": "정시 모집",
    "sortOrder": 2,
    "body": "원서 접수: 12월 29일 ~ 1월 2일\n합격 발표: 1월 20일\n\n전형 방법: 수능 100% 또는 학생부 100% 중 선택"
  },
  {
    "slug": "admission-scholarship",
    "menu": "입학안내",
    "title": "신입생 장학 혜택",
    "sortOrder": 3,
    "body": "성적우수 장학: 등록금 전액 ~ 50%\n지역인재 장학: 등록금 30%\n특기자 장학: 등록금 30% ~ 50%\n\n중복 수혜는 불가하며 가장 유리한 항목이 자동 적용됩니다."
  },
  {
    "slug": "calendar",
    "menu": "학사안내",
    "title": "학사 일정 안내",
    "sortOrder": 1,
    "body": "9월 1일    2학기 개강\n9월 19일   수강 정정 마감\n10월 20일  중간고사 시작\n11월 10일  기말 수강 취소 마감\n12월 15일  기말고사 시작\n12월 19일  종강\n\n달력으로 보려면 홈의 학사일정 카드를 누르세요."
  },
  {
    "slug": "course",
    "menu": "학사안내",
    "title": "수강 신청 안내",
    "sortOrder": 2,
    "body": "수강 신청은 학사정보시스템에서 진행합니다.\n\n1. 학사정보시스템 로그인\n2. 수강신청 > 개설 강좌 조회\n3. 장바구니 담기 후 신청\n\n학기당 최대 21학점까지 신청할 수 있습니다."
  },
  {
    "slug": "graduation",
    "menu": "학사안내",
    "title": "졸업 요건",
    "sortOrder": 3,
    "body": "총 이수 학점: 80학점 이상\n전공 필수: 45학점 이상\n교양 필수: 15학점 이상\n\n졸업 인증: 전공 자격증 1개 이상 또는 캡스톤 디자인 이수"
  },
  {
    "slug": "scholarship",
    "menu": "대학생활",
    "title": "장학제도 안내",
    "sortOrder": 1,
    "body": "교내 장학\n- 성적우수 / 근로 / 봉사 / 생활지원\n\n교외 장학\n- 국가장학금 Ⅰ·Ⅱ 유형 / 국가근로장학금 / 지자체 장학\n\n신청 방법은 공지사항의 장학 카테고리를 확인하세요."
  },
  {
    "slug": "dorm",
    "menu": "대학생활",
    "title": "생활관 안내",
    "sortOrder": 2,
    "body": "생활관(기숙사) 안내입니다.\n\n생활관 A동  남학생 2인실 · 4인실\n생활관 B동  여학생 2인실 · 4인실\n\n비용: 학기당 95만원 (식비 별도)\n선발 기준: 통학 거리, 소득분위, 직전 학기 성적"
  },
  {
    "slug": "club",
    "menu": "대학생활",
    "title": "동아리 안내",
    "sortOrder": 3,
    "body": "학술  프로그래밍, 로보틱스, 창업\n체육  축구, 농구, 클라이밍\n문화  밴드, 사진, 연극\n봉사  지역 아동센터 교육 봉사"
  },
  {
    "slug": "forms",
    "menu": "정보광장",
    "title": "학사 서식",
    "sortOrder": 1,
    "body": "휴학 신청서\n복학 신청서\n전공 변경 신청서\n성적 정정 요청서\n증명서 발급 신청서\n\n서식은 학사지원팀에서 내려받을 수 있습니다."
  },
  {
    "slug": "faq",
    "menu": "정보광장",
    "title": "자주 묻는 질문",
    "sortOrder": 2,
    "body": "Q. 증명서는 어디서 발급받나요?\nA. 본관 1층 무인 발급기 또는 학사정보시스템에서 온라인 발급이 가능합니다.\n\nQ. 수강 정정은 몇 번까지 가능한가요?\nA. 정정 기간 중에는 횟수 제한 없이 가능합니다.\n\nQ. 장학금 신청 결과는 언제 나오나요?\nA. 신청 마감 후 약 3주 뒤 학사정보시스템에서 확인할 수 있습니다."
  },
  {
    "slug": "privacy",
    "menu": "정보광장",
    "title": "개인정보처리방침",
    "sortOrder": 3,
    "body": "본 사이트는 학습 목적으로 제작된 비공식 사이트입니다.\n실제 개인정보를 수집하지 않으며, 게시된 공지는 예시 데이터입니다."
  }
];
