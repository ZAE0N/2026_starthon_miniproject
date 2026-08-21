/* SC-01 홈 — 공지 탭이 페이지 이동 없이 목록만 바꿉니다 */

var homeState = { category: null, sub: null, q: "", dueBefore: null, fromChat: false };
var HOME_SIZE = 6;

function homeFiltered() {
  return window.NOTICES.filter(function (n) {
    if (homeState.category && n.category !== homeState.category) return false;
    if (homeState.sub === "근로" && n.subCategory !== "근로") return false;
    if (homeState.dueBefore) {
      if (!n.dueDate) return false;
      if (n.dueDate > homeState.dueBefore || n.dueDate < today()) return false;
    }
    if (homeState.q && (n.title + n.content).indexOf(homeState.q) === -1) return false;
    return true;
  }).sort(function (a, b) {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    return a.createdAt < b.createdAt ? 1 : -1;
  });
}

function renderHome() {
  var all = homeFiltered();
  var rows = all.slice(0, HOME_SIZE);

  $$(".pill[data-cat]").forEach(function (b) {
    b.setAttribute("aria-selected", (b.dataset.cat || null) === homeState.category ? "true" : "false");
  });

  var chip = $("#homeChip");
  if (homeState.fromChat) {
    chip.classList.add("on");
    var t = [];
    if (homeState.category) t.push(homeState.category);
    if (homeState.sub) t.push(homeState.sub);
    if (homeState.q) t.push("'" + homeState.q + "'");
    if (homeState.dueBefore) t.push(homeState.dueBefore + " 이전 마감");
    $("#homeChipTags").textContent = t.join(" · ");
  } else {
    chip.classList.remove("on");
  }

  $("#homeCount").textContent = all.length + "건";
  $("#moreBtn").href = homeMoreHref();

  if (!rows.length) {
    $("#homeList").innerHTML = '<li class="home-empty">해당 조건의 공지가 없습니다.</li>';
    return;
  }
  $("#homeList").innerHTML = rows.map(function (n) {
    return '<li><a href="notice.html?id=' + n.id + '">' + catBadges(n) +
      '<span class="t">' + esc(n.title) + "</span>" + dueBadge(n.dueDate) +
      '<span class="d">' + n.createdAt + "</span></a></li>";
  }).join("");
}

function homeTab(cat) {
  homeState.fromChat = false;
  homeState.q = "";
  homeState.dueBefore = null;
  homeState.category = cat;
  if (cat !== "장학") homeState.sub = null;
  renderHome();
}

function homeClear() {
  homeState = { category: null, sub: null, q: "", dueBefore: null, fromChat: false };
  renderHome();
  $("#moreBtn").href = "notices.html";
}

function homeMoreHref() {
  var p = new URLSearchParams();
  if (homeState.category) p.set("category", homeState.category);
  if (homeState.sub) p.set("sub", homeState.sub);
  if (homeState.q) p.set("q", homeState.q);
  if (homeState.dueBefore) p.set("dueBefore", homeState.dueBefore);
  return "notices.html" + (p.toString() ? "?" + p : "");
}

/* 챗봇이 홈에서도 목록을 바꿉니다 (화면정의서 2-5) */
window.applyChatFilter = function (a) {
  homeState.category  = a.category || null;
  homeState.sub       = a.subCategory || null;
  homeState.q         = a.keyword || "";
  homeState.dueBefore = a.dueBefore || null;
  homeState.fromChat = true;
  renderHome();
  $("#moreBtn").href = homeMoreHref();
  return homeFiltered().length;
};

function initHome() {
  mountLayout(null);
  $("#homeTabs").innerHTML = ["전체"].concat(window.CATEGORIES).map(function (t) {
    var cat = t === "전체" ? "" : t;
    return '<button class="pill" data-cat="' + cat + '" onclick="homeTab(' +
      (cat ? "'" + cat + "'" : "null") + ')">' + t + "</button>";
  }).join("");
  renderHome();
}
