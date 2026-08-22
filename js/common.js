/* 모든 화면이 공유하는 것: 헤더, 푸터, 관리자 모드, 토스트, 모달, 챗봇 */

/* ── 프로토타입용 저장 계층 ── */
(function () {
  try {
    var saved = sessionStorage.getItem("notices");
    if (saved) window.NOTICES = JSON.parse(saved);
  } catch (e) {}
})();

function saveNotices() {
  try { sessionStorage.setItem("notices", JSON.stringify(window.NOTICES)); } catch (e) {}
}
function resetData() {
  try { sessionStorage.removeItem("notices"); } catch (e) {}
  sessionStorage.setItem("flash", "데이터를 처음 상태로 되돌렸습니다");
  location.href = "notices.html";
}

/* ── 유틸 ── */
function $(s, r) { return (r || document).querySelector(s); }
function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
function qs(name) { return new URLSearchParams(location.search).get(name); }

/* 사용자가 입력한 값은 반드시 이 함수를 거치거나 textContent 를 쓰세요 */
function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/* 오늘 날짜. 백엔드가 CURDATE() 를 쓰므로 프론트도 실제 날짜를 씁니다.
   두 값이 어긋나면 "이번 주 마감" 결과가 화면과 서버에서 달라집니다.
   시연 중 날짜를 고정해야 한다면 이 한 줄만 "2026-08-20" 처럼 바꾸면 됩니다. */
var TODAY = (function () {
  var d = new Date();
  var m = String(d.getMonth() + 1).padStart(2, "0");
  var t = String(d.getDate()).padStart(2, "0");
  return d.getFullYear() + "-" + m + "-" + t;
})();
function today() { return TODAY; }
function daysLeft(due) {
  if (!due) return null;
  return Math.round((new Date(due) - new Date(TODAY)) / 86400000);
}
function dueBadge(due) {
  var d = daysLeft(due);
  if (d === null || d < 0 || d > 7) return "";
  return '<span class="badge badge-due">마감 D-' + d + "</span>";
}

/* 하위 분류가 있으면 배지를 두 겹으로 표시합니다 */
function catBadges(n) {
  var html = '<span class="badge badge-' + n.category + '">' + n.category + "</span>";
  if (n.subCategory) html += '<span class="badge badge-sub">' + esc(n.subCategory) + "</span>";
  return html;
}

/* ── CM-01 헤더 ── */
function renderHeader(current) {
  var menus = window.GNB.map(function (g) {
    if (g.external) {
      return '<a href="' + window.EXTERNAL[g.external] + '" target="_blank" rel="noopener noreferrer" class="ext">' +
             g.menu + '<span class="ext-mark">↗</span></a>';
    }
    var href = g.slug ? "page.html?slug=" + g.slug : "notices.html";
    var on = current === g.menu ? ' aria-current="page"' : "";
    return '<a href="' + href + '"' + on + ">" + g.menu + "</a>";
  }).join("");

  return (
    '<div class="utilbar"><div class="container">' +
      "<span>PORTAL</span><span>ENGLISH</span><span class=\"spacer\"></span><span>사이트맵</span>" +
    "</div></div>" +
    '<header class="gnb"><div class="container">' +
      '<a class="logo" href="index.html"><span class="mark"></span>' + window.SCHOOL.name + "</a>" +
      '<nav class="gnb-menu" id="gnbMenu">' + menus + "</nav>" +
      '<a class="gnb-search" href="search.html">검색</a>' +
      '<button class="gnb-toggle" id="gnbToggle" aria-label="메뉴 열기">☰</button>' +
    "</div></header>" +
    '<div class="admin-bar"><div class="container">' +
      '<span class="dot"></span><span>관리자 모드 — 글쓰기·수정·삭제를 할 수 있습니다</span>' +
      '<button onclick="resetData()">데이터 초기화</button>' +
      '<button onclick="adminOff()" style="margin-left:12px">종료</button>' +
    "</div></div>"
  );
}

/* ── CM-02 푸터 ── */
function renderFooter() {
  return (
    '<footer class="footer"><div class="container">' +
      "<div><h2>" + window.SCHOOL.name + "</h2>" +
      "<p>" + window.SCHOOL.address + " &nbsp;|&nbsp; 대표전화 " + window.SCHOOL.tel + "</p>" +
      "<p>학습 목적으로 만든 비공식 사이트이며, 공지 내용은 실제 공지가 아닌 예시입니다.</p></div>" +
      '<span class="spacer"></span>' +
      '<button class="btn-admin" onclick="adminOn()">관리자</button>' +
    "</div></footer>"
  );
}

/* ── CM-04 관리자 모드 (비밀번호 없음) ── */
function adminOn() {
  sessionStorage.setItem("admin", "1");
  document.body.classList.add("is-admin");
  toast("관리자 모드가 켜졌습니다");
}
function adminOff() {
  sessionStorage.removeItem("admin");
  document.body.classList.remove("is-admin");
  toast("관리자 모드를 종료했습니다");
}
function isAdmin() { return sessionStorage.getItem("admin") === "1"; }

/* ── CM-05 토스트 ── */
function toast(msg, isError) {
  var wrap = $(".toast-wrap");
  if (!wrap) { wrap = document.createElement("div"); wrap.className = "toast-wrap"; document.body.appendChild(wrap); }
  var el = document.createElement("div");
  el.className = "toast" + (isError ? " error" : "");
  el.textContent = msg;
  wrap.appendChild(el);
  setTimeout(function () { el.remove(); }, 3000);
}

/* ── 공용 모달 ── */
function openModal(title, bodyHtml, opts) {
  opts = opts || {};
  var bg = document.createElement("div");
  bg.className = "modal-bg" + (opts.wide ? " wide" : "");
  bg.innerHTML =
    '<div class="modal" role="dialog" aria-modal="true">' +
      '<header>' + esc(title) + '<button class="x" data-close aria-label="닫기">✕</button></header>' +
      '<div class="modal-body">' + bodyHtml + "</div>" +
    "</div>";
  function close() { bg.remove(); document.removeEventListener("keydown", onKey); }
  function onKey(e) { if (e.key === "Escape") close(); }
  bg.addEventListener("click", function (e) {
    if (e.target === bg || e.target.hasAttribute("data-close")) close();
  });
  document.addEventListener("keydown", onKey);
  document.body.appendChild(bg);
  if (opts.onOpen) opts.onOpen(bg);
  return bg;
}

/* ── SC-05 삭제 확인 ── */
function confirmModal(title, strong, desc, onOk) {
  var bg = document.createElement("div");
  bg.className = "modal-bg";
  bg.innerHTML =
    '<div class="modal" role="dialog" aria-modal="true">' +
      "<header>" + esc(title) + "</header>" +
      '<div class="body"><strong>' + esc(strong) + "</strong><p>" + esc(desc) + "</p></div>" +
      '<footer><button class="btn btn-ghost" data-no>취소</button>' +
      '<button class="btn btn-danger" data-yes>삭제</button></footer>' +
    "</div>";
  function close() { bg.remove(); document.removeEventListener("keydown", onKey); }
  function onKey(e) { if (e.key === "Escape") close(); }
  bg.addEventListener("click", function (e) {
    if (e.target === bg || e.target.hasAttribute("data-no")) close();
    if (e.target.hasAttribute("data-yes")) { close(); onOk(); }
  });
  document.addEventListener("keydown", onKey);
  document.body.appendChild(bg);
}

/* ── SC-09 학사일정 달력 모달 ── */
function openCalendar() {
  openModal("학사일정", '<div id="calMount"></div>', {
    wide: true,
    onOpen: function () { mountCalendar($("#calMount")); },
  });
}

/* ═══════════ CM-03 챗봇 ═══════════ */
var SUGGESTS = [
  "이번 주 마감인 장학금 알려줘",
  "근로장학금 공고 있어?",
  "취업 관련 공지 보여줘",
  "기숙사 얘기 있어?",
];

function renderChat() {
  return (
    '<button class="fab" onclick="chatOpen()">AI 도우미</button>' +
    '<aside class="chat" aria-label="AI 공지 도우미">' +
      '<div class="chat-head"><span class="dot"></span>' +
        "<div><h2>인하 AI</h2><p>공지 도우미</p></div>" +
        '<button class="close" onclick="chatClose()" aria-label="닫기">✕</button></div>' +
      '<div class="chat-log" id="chatLog"></div>' +
      '<form class="chat-input" onsubmit="chatSend(event)">' +
        '<input id="chatInput" placeholder="질문을 입력하세요" autocomplete="off">' +
        '<button type="submit" aria-label="전송">▶</button>' +
      "</form>" +
    "</aside>"
  );
}

function chatOpen() {
  document.body.classList.add("chat-open");
  if (!$("#chatLog").children.length) chatGreet();
  setTimeout(function () { $("#chatInput").focus(); }, 100);
}
function chatClose() { document.body.classList.remove("chat-open"); }

function chatGreet() {
  addAI("공지사항에 대해 물어보세요. 답변과 함께 왼쪽 화면을 결과로 바꿔 드립니다.");
  var box = document.createElement("div");
  box.className = "suggests";
  box.innerHTML = SUGGESTS.map(function (s) { return "<button>" + esc(s) + "</button>"; }).join("");
  box.addEventListener("click", function (e) {
    if (e.target.tagName === "BUTTON") ask(e.target.textContent);
  });
  $("#chatLog").appendChild(box);
}

function addUser(text) {
  var el = document.createElement("div");
  el.className = "msg user";
  el.textContent = text;
  $("#chatLog").appendChild(el);
  scrollChat();
}
function addAI(text, sources) {
  var el = document.createElement("div");
  el.className = "msg ai";
  el.appendChild(document.createTextNode(text));
  if (sources && sources.length) {
    var s = document.createElement("div");
    s.className = "sources";
    s.innerHTML = '<div class="cap">근거가 된 공지</div>' + sources.map(function (n) {
      return '<a class="src-card" href="notice.html?id=' + n.id + '"><b>' + esc(n.title) + "</b>" +
        "<span>" + esc(n.department) + (n.dueDate ? " · 마감 " + n.dueDate : "") + "</span></a>";
    }).join("");
    el.appendChild(s);
  }
  $("#chatLog").appendChild(el);
  scrollChat();
  return el;
}
function addTyping() {
  var el = document.createElement("div");
  el.className = "msg ai typing";
  el.innerHTML = "<i></i><i></i><i></i>";
  $("#chatLog").appendChild(el);
  scrollChat();
  return el;
}
function scrollChat() { var l = $("#chatLog"); l.scrollTop = l.scrollHeight; }

function chatSend(e) {
  e.preventDefault();
  var v = $("#chatInput").value.trim();
  if (!v) return;
  $("#chatInput").value = "";
  ask(v);
}

function filterToQuery(a) {
  var p = new URLSearchParams();
  if (a.category) p.set("category", a.category);
  if (a.subCategory) p.set("sub", a.subCategory);
  if (a.keyword) p.set("q", a.keyword);
  if (a.dueBefore) p.set("dueBefore", a.dueBefore);
  return p.toString();
}

/* 화면정의서 2-5 — 지금 어느 화면에 있느냐에 따라 동작이 다릅니다 */
function ask(text) {
  $$(".suggests").forEach(function (n) { n.remove(); });
  addUser(text);
  var t = addTyping();

  /* 서버가 답합니다. 서버가 없거나 실패하면 목업 chatAnswer() 로 넘어갑니다.
     응답 모양이 같아서 아래 화면 조작 코드는 그대로입니다. */
  Api.chat(text).then(function (res) {
    t.remove();
    if (!res) res = window.chatAnswer(text);
    var el = addAI(res.answer, res.sources);
    var a = res.action;

    if (a.type === "navigate") { location.href = "notice.html?id=" + a.noticeId; return; }
    if (a.type !== "filter") return;

    /* 이 화면이 목록을 직접 바꿀 수 있는가 (홈 · 공지 목록) */
    if (typeof window.applyChatFilter === "function") {
      var n = window.applyChatFilter(a);
      var jump = document.createElement("button");
      jump.className = "jump jump-mobile";
      jump.textContent = "공지 " + n + "건으로 좁혔습니다 →";
      jump.onclick = chatClose;
      el.appendChild(jump);
      return;
    }

    /* 작성 화면에서는 쓰던 글이 날아가지 않게 이동하지 않습니다 */
    if (window.CHAT_NO_NAVIGATE) {
      var note = document.createElement("div");
      note.className = "chat-note";
      note.textContent = "작성 중에는 화면을 이동하지 않습니다. 저장하거나 취소한 뒤 다시 물어보세요.";
      el.appendChild(note);
      return;
    }

    /* 그 밖의 화면에서는 공지 목록으로 이동하면서 조건을 적용합니다 */
    var go = document.createElement("a");
    go.className = "jump";
    go.href = "notices.html?" + filterToQuery(a);
    go.textContent = "공지 목록에서 결과 보기 →";
    el.appendChild(go);
  });
}

/* ── 페이지 조립 ── */
function mountLayout(currentMenu) {
  document.body.insertAdjacentHTML("afterbegin", renderHeader(currentMenu));
  var main = $(".page");
  if (main) main.insertAdjacentHTML("beforeend", renderFooter());
  document.body.insertAdjacentHTML("beforeend", renderChat());
  if (isAdmin()) document.body.classList.add("is-admin");

  var t = $("#gnbToggle");
  if (t) t.addEventListener("click", function () { $("#gnbMenu").classList.toggle("open"); });

  var flash = sessionStorage.getItem("flash");
  if (flash) { sessionStorage.removeItem("flash"); setTimeout(function () { toast(flash); }, 150); }
}
