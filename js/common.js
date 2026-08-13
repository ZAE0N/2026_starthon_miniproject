/* 모든 화면이 공유하는 것: 헤더, 푸터, 관리자 모드, 토스트, 챗봇 패널 */

/* ── 프로토타입용 저장 계층 ──
   실제 프로젝트에서는 백엔드 + DB 가 이 역할을 합니다.
   여기서는 브라우저 탭 안에서만 유지되며, 탭을 닫으면 초기 데이터로 돌아갑니다. */
(function () {
  try {
    var saved = sessionStorage.getItem("notices");
    if (saved) window.NOTICES = JSON.parse(saved);
  } catch (e) { /* file:// 등에서 막히면 메모리만 사용 */ }
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

/* innerHTML 로 본문을 넣으면 사용자가 넣은 스크립트가 실행됩니다.
   본문·제목처럼 사용자가 입력한 값은 반드시 이 함수를 거치거나 textContent 를 쓰세요. */
function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

var TODAY = new Date("2026-08-12");
function daysLeft(due) {
  if (!due) return null;
  return Math.ceil((new Date(due) - TODAY) / 86400000);
}
function dueBadge(due) {
  var d = daysLeft(due);
  if (d === null || d < 0 || d > 7) return "";
  return '<span class="badge badge-due">마감 D-' + d + "</span>";
}
function fmtShort(d) { return d ? d.slice(5) : ""; }

/* ── CM-01 헤더 ── */
function renderHeader(current) {
  var menus = window.GNB.map(function (g) {
    var href = g.slug ? "page.html?slug=" + g.slug : "notices.html";
    var on = current === g.menu ? ' aria-current="page"' : "";
    return '<a href="' + href + '"' + on + ">" + g.menu + "</a>";
  }).join("");

  return (
    '<div class="utilbar"><div class="container">' +
      "<span>PORTAL</span><span>ENGLISH</span><span class=\"spacer\"></span><span>사이트맵</span>" +
    "</div></div>" +
    '<header class="gnb"><div class="container">' +
      '<a class="logo" href="index.html"><span class="mark"></span>한빛공업전문대학</a>' +
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
      "<div><h2>한빛공업전문대학</h2>" +
      "<p>인천광역시 미추홀구 한빛로 100 &nbsp;|&nbsp; 대표전화 032-000-0000</p>" +
      "<p>© 2026 HANBIT College. 학습용 가상 사이트입니다.</p></div>" +
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

/* ── 확인 모달 (SC-05) ── */
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

/* ═══════════ CM-03 챗봇 ═══════════ */
var SUGGESTS = [
  "이번 주 마감인 장학금 알려줘",
  "수강신청 언제야?",
  "취업 관련 공지 보여줘",
  "기숙사 얘기 있어?",
];

function renderChat() {
  return (
    '<button class="fab" onclick="chatOpen()">AI 도우미</button>' +
    '<aside class="chat" aria-label="AI 공지 도우미">' +
      '<div class="chat-head"><span class="dot"></span>' +
        "<div><h2>한빛 AI</h2><p>공지 도우미</p></div>" +
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
  addAI("공지사항에 대해 물어보세요. 답변과 함께 아래 목록을 걸러 드립니다.");
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

function ask(text) {
  $$(".suggests").forEach(function (n) { n.remove(); });
  addUser(text);
  var t = addTyping();
  setTimeout(function () {
    t.remove();
    var res = window.chatAnswer(text);
    var el = addAI(res.answer, res.sources);
    if (res.action && res.action.type === "filter" && typeof window.applyChatFilter === "function") {
      var n = window.applyChatFilter(res.action);
      var jump = document.createElement("button");
      jump.className = "jump";
      jump.textContent = "공지 " + n + "건으로 좁혔습니다 →";
      jump.onclick = chatClose;
      el.appendChild(jump);
    }
    if (res.action && res.action.type === "filter" && typeof window.applyChatFilter !== "function") {
      var go = document.createElement("a");
      go.className = "jump";
      go.style.display = "block";
      go.href = "notices.html?" + filterToQuery(res.action);
      go.textContent = "공지 목록에서 결과 보기 →";
      el.appendChild(go);
    }
    if (res.action && res.action.type === "navigate") {
      location.href = "notice.html?id=" + res.action.noticeId;
    }
  }, 700);
}

function filterToQuery(a) {
  var p = new URLSearchParams();
  if (a.category) p.set("category", a.category);
  if (a.keyword) p.set("q", a.keyword);
  if (a.dueBefore) p.set("dueBefore", a.dueBefore);
  return p.toString();
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
