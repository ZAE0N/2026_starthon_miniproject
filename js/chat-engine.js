/* 챗봇 응답 생성 — 프로토타입용 목업입니다.
   실제 프로젝트에서는 이 함수 대신 POST /api/chat 을 호출하고,
   서버가 { answer, action, sources } 를 내려줍니다.
   중요한 건 응답의 "모양"이 같다는 점입니다. 나중에 fetch 로 바꾸기만 하면 됩니다. */

(function () {
  var SYN = {
    "장학": ["장학", "장학금", "등록금 지원", "국가장학"],
    "학사": ["학사", "수강", "수강신청", "수강 정정", "성적", "학점", "휴학", "복학", "졸업", "등록금"],
    "채용": ["취업", "채용", "인턴", "공채", "면접", "이력서", "포트폴리오", "진로"],
    "행사": ["행사", "축제", "체육대회", "동아리", "대회", "경진"],
    "일반": ["기숙사", "생활관", "주차", "도서관", "시설", "네트워크", "와이파이"],
  };

  var KEYWORDS = ["기숙사", "생활관", "주차", "도서관", "축제", "인턴", "졸업", "휴학", "복학", "등록금", "수강신청", "체육대회"];

  function todayStr() { return "2026-08-12"; }
  function addDays(n) {
    var d = new Date("2026-08-12");
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  }

  function detectCategory(q) {
    for (var cat in SYN) {
      for (var i = 0; i < SYN[cat].length; i++) {
        if (q.indexOf(SYN[cat][i]) !== -1) return cat;
      }
    }
    return null;
  }
  function detectKeyword(q) {
    for (var i = 0; i < KEYWORDS.length; i++) {
      if (q.indexOf(KEYWORDS[i]) !== -1) return KEYWORDS[i];
    }
    return null;
  }
  function detectDue(q) {
    if (/이번\s*주|이번주|금주|곧|임박|마감/.test(q)) return addDays(7);
    if (/오늘|내일|급/.test(q)) return addDays(2);
    if (/이번\s*달|이번달/.test(q)) return "2026-08-31";
    return null;
  }

  function match(action) {
    return window.NOTICES.filter(function (n) {
      if (action.category && n.category !== action.category) return false;
      if (action.keyword && (n.title + n.content).indexOf(action.keyword) === -1) return false;
      if (action.dueBefore) {
        if (!n.dueDate) return false;
        if (n.dueDate > action.dueBefore || n.dueDate < todayStr()) return false;
      }
      return true;
    });
  }

  window.chatAnswer = function (q) {
    var none = { type: "none", category: null, keyword: null, dueBefore: null, noticeId: null };

    /* 범위를 벗어난 질문 */
    if (/날씨|점심|밥|영화|노래|사랑|주식|로또/.test(q)) {
      return {
        answer: "저는 한빛공업전문대학 공지사항만 안내할 수 있습니다. 장학금, 수강신청, 취업, 행사, 기숙사 같은 학교 소식을 물어보세요.",
        action: none,
        sources: [],
      };
    }

    /* 특정 공지 하나를 콕 집어 묻는 경우 → navigate */
    if (/수강\s*신청|수강신청/.test(q) && /언제|기간|일정/.test(q)) {
      var target = window.NOTICES.filter(function (n) { return n.title.indexOf("수강 정정") !== -1; })[0];
      if (target) {
        return {
          answer: "수강 정정 기간은 8월 19일부터 21일까지입니다. 해당 공지로 이동합니다.",
          action: { type: "navigate", category: null, keyword: null, dueBefore: null, noticeId: target.id },
          sources: [target],
        };
      }
    }

    var action = {
      type: "filter",
      category: detectCategory(q),
      keyword: null,
      dueBefore: detectDue(q),
      noticeId: null,
    };
    if (!action.category) action.keyword = detectKeyword(q);

    /* 아무것도 못 잡으면 질문 자체를 검색어로 */
    if (!action.category && !action.keyword && !action.dueBefore) {
      action.keyword = q.replace(/[?!.]/g, "").trim().slice(0, 12);
    }

    var hits = match(action);

    if (!hits.length) {
      return {
        answer: "조건에 맞는 공지를 찾지 못했습니다. 카테고리(학사·행사·장학·채용·일반)나 다른 단어로 다시 물어봐 주세요.",
        action: none,
        sources: [],
      };
    }

    var parts = [];
    if (action.category) parts.push(action.category + " 공지");
    else if (action.keyword) parts.push("'" + action.keyword + "' 관련 공지");
    else parts.push("공지");
    if (action.dueBefore) parts.unshift(action.dueBefore + " 이전 마감인");

    var first = hits.slice().sort(function (a, b) {
      if (a.dueDate && b.dueDate) return a.dueDate < b.dueDate ? -1 : 1;
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return 0;
    })[0];

    var tail = first.dueDate
      ? " 가장 급한 건 '" + first.title + "'이고 " + first.dueDate + "에 마감입니다."
      : " 가장 최근 건은 '" + first.title + "'입니다.";

    return {
      answer: parts.join(" ") + "는 " + hits.length + "건입니다." + tail,
      action: action,
      sources: hits.slice(0, 3),
    };
  };
})();
