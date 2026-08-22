/* 챗봇 응답 생성 — 프로토타입용 목업입니다.
   실제 프로젝트에서는 POST /api/chat 을 호출하고,
   서버가 { answer, action, sources } 를 내려줍니다. 응답의 모양은 같습니다. */

(function () {
  var SYN = {
    "장학": ["장학", "장학금", "국가장학", "등록금 지원"],
    "학사": ["학사", "수강", "수강신청", "수강 정정", "성적", "학점", "휴학", "복학", "졸업", "등록금", "전공"],
    "채용": ["취업", "채용", "인턴", "공채", "면접", "이력서", "포트폴리오", "진로", "현장실습"],
    "행사": ["행사", "축제", "체육대회", "동아리", "대회", "경진", "오리엔테이션"],
    "일반": ["기숙사", "생활관", "주차", "도서관", "시설", "네트워크", "와이파이", "셔틀", "학생증"],
  };
  var KEYWORDS = ["기숙사", "생활관", "주차", "도서관", "축제", "인턴", "졸업", "휴학", "복학",
                  "등록금", "수강신청", "체육대회", "셔틀", "증명서", "현장실습"];

  function addDays(n) {
    var d = new Date(today());
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  }
  function detectCategory(q) {
    for (var cat in SYN) {
      for (var i = 0; i < SYN[cat].length; i++) if (q.indexOf(SYN[cat][i]) !== -1) return cat;
    }
    return null;
  }
  function detectKeyword(q) {
    for (var i = 0; i < KEYWORDS.length; i++) if (q.indexOf(KEYWORDS[i]) !== -1) return KEYWORDS[i];
    return null;
  }
  function detectDue(q) {
    if (/이번\s*주|이번주|금주|곧|임박|마감/.test(q)) return addDays(7);
    if (/오늘|내일|급/.test(q)) return addDays(2);
    if (/이번\s*달|이번달/.test(q)) return addDays(20);
    return null;
  }

  function match(a) {
    return window.NOTICES.filter(function (n) {
      if (a.category && n.category !== a.category) return false;
      if (a.subCategory && n.subCategory !== a.subCategory) return false;
      if (a.keyword && (n.title + n.content).indexOf(a.keyword) === -1) return false;
      if (a.dueBefore) {
        if (!n.dueDate) return false;
        if (n.dueDate > a.dueBefore || n.dueDate < today()) return false;
      }
      return true;
    });
  }

  window.chatAnswer = function (q) {
    var none = { type: "none", category: null, subCategory: null, keyword: null, dueBefore: null, noticeId: null };

    if (/날씨|점심|밥|영화|노래|사랑|주식|로또/.test(q)) {
      return {
        answer: "저는 인하공업전문대학 공지사항만 안내할 수 있습니다. 장학금, 수강신청, 취업, 행사, 기숙사 같은 학교 소식을 물어보세요.",
        action: none, sources: [],
      };
    }

    /* 특정 공지 하나를 콕 집어 묻는 경우 → 상세로 이동 */
    if (/수강\s*신청|수강신청|수강\s*정정/.test(q) && /언제|기간|일정/.test(q)) {
      var target = window.NOTICES.filter(function (n) { return n.title.indexOf("수강 정정") !== -1; })[0];
      if (target) {
        return {
          answer: "수강 정정 기간은 8월 19일부터 21일까지입니다. 해당 공지로 이동합니다.",
          action: { type: "navigate", category: null, subCategory: null, keyword: null, dueBefore: null, noticeId: target.id },
          sources: [target],
        };
      }
    }

    var a = {
      type: "filter",
      category: null,
      subCategory: null,
      keyword: null,
      dueBefore: detectDue(q),
      noticeId: null,
    };

    /* 구체적인 낱말을 먼저 씁니다. '기숙사' 는 일반 카테고리의 동의어이기도 해서
       카테고리를 먼저 잡으면 일반 공지 전체가 걸려 결과가 뭉툭해집니다. */
    a.keyword = detectKeyword(q);
    if (!a.keyword) a.category = detectCategory(q);

    /* 근로장학은 하위 분류로 좁힙니다 */
    if (/근로/.test(q)) { a.category = "장학"; a.subCategory = "근로"; a.keyword = null; }
    if (!a.category && !a.keyword && !a.dueBefore) {
      a.keyword = q.replace(/[?!.]/g, "").trim().slice(0, 12);
    }

    var hits = match(a);
    if (!hits.length) {
      return {
        answer: "조건에 맞는 공지를 찾지 못했습니다. 카테고리(학사·행사·장학·채용·일반)나 다른 단어로 다시 물어봐 주세요.",
        action: none, sources: [],
      };
    }

    var parts = [];
    if (a.subCategory) parts.push(a.subCategory + " 장학 공지");
    else if (a.category) parts.push(a.category + " 공지");
    else if (a.keyword) parts.push("'" + a.keyword + "' 관련 공지");
    else parts.push("공지");
    if (a.dueBefore) parts.unshift(a.dueBefore + " 이전 마감인");

    var first = hits.slice().sort(function (x, y) {
      if (x.dueDate && y.dueDate) return x.dueDate < y.dueDate ? -1 : 1;
      if (x.dueDate) return -1;
      if (y.dueDate) return 1;
      return 0;
    })[0];

    var tail = first.dueDate
      ? " 가장 급한 건 '" + first.title + "'이고 " + first.dueDate + "에 마감입니다."
      : " 가장 최근 건은 '" + first.title + "'입니다.";

    return {
      answer: parts.join(" ") + "는 " + hits.length + "건입니다." + tail,
      action: a,
      sources: hits.slice(0, 3),
    };
  };
})();
