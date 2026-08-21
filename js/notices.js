/* SC-02 공지 목록 — 탭, 장학 하위 필터, 검색, 페이징, 챗봇 연동 */

var SIZE = 10;
var state = { category: null, sub: null, q: "", scope: "both", dueBefore: null, page: 1 };

function readURL() {
  var p = new URLSearchParams(location.search);
  state.category  = p.get("category");
  state.sub       = p.get("sub");
  state.q         = p.get("q") || "";
  state.scope     = p.get("scope") || "both";
  state.dueBefore = p.get("dueBefore");
  state.page      = parseInt(p.get("page") || "1", 10);
  if (state.category !== "장학") state.sub = null;   /* R-11 */
}

function writeURL() {
  var p = new URLSearchParams();
  if (state.category) p.set("category", state.category);
  if (state.sub) p.set("sub", state.sub);
  if (state.q) p.set("q", state.q);
  if (state.scope !== "both") p.set("scope", state.scope);
  if (state.dueBefore) p.set("dueBefore", state.dueBefore);
  if (state.page > 1) p.set("page", state.page);
  history.pushState(null, "", location.pathname + (p.toString() ? "?" + p : ""));
}

function filtered() {
  return window.NOTICES.filter(function (n) {
    if (state.category && n.category !== state.category) return false;
    if (state.sub === "근로" && n.subCategory !== "근로") return false;
    if (state.sub === "일반" && n.subCategory === "근로") return false;
    if (state.dueBefore) {
      if (!n.dueDate) return false;
      if (n.dueDate > state.dueBefore || n.dueDate < today()) return false;
    }
    if (state.q) {
      var k = state.q, hit;
      if (state.scope === "title") hit = n.title.indexOf(k) !== -1;
      else if (state.scope === "content") hit = n.content.indexOf(k) !== -1;
      else if (state.scope === "author") hit = (n.author + n.department).indexOf(k) !== -1;
      else hit = (n.title + n.content).indexOf(k) !== -1;
      if (!hit) return false;
    }
    return true;
  }).sort(function (a, b) {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? 1 : -1;
    return b.id - a.id;
  });
}

function render() {
  var all = filtered();
  var pages = Math.max(1, Math.ceil(all.length / SIZE));
  if (state.page > pages) state.page = pages;        /* R-04 */
  if (state.page < 1) state.page = 1;
  var rows = all.slice((state.page - 1) * SIZE, state.page * SIZE);

  /* 탭 */
  $$(".tab").forEach(function (t) {
    t.setAttribute("aria-selected", (t.dataset.cat || null) === state.category ? "true" : "false");
  });
  $("#total").innerHTML = "총 <strong>" + all.length + "</strong>건";

  /* 장학 하위 필터 — 장학 탭일 때만 나타납니다 */
  var subRow = $("#subRow");
  if (state.category === "장학") {
    subRow.classList.add("on");
    $$(".subtab", subRow).forEach(function (b) {
      b.setAttribute("aria-selected", (b.dataset.sub || null) === state.sub ? "true" : "false");
    });
  } else {
    subRow.classList.remove("on");
  }

  $("#q").value = state.q;
  $("#scope").value = state.scope;

  /* 챗봇 조건 칩 */
  var chip = $("#filterChip");
  var tags = [];
  if (state.dueBefore) {
    if (state.category) tags.push("카테고리 · " + state.category);
    if (state.sub) tags.push("세부 · " + state.sub);
    tags.push("마감 · " + state.dueBefore + " 이전");
  }
  if (tags.length) {
    chip.classList.add("on");
    $("#chipTags").innerHTML = tags.map(function (t) {
      return '<span class="tag">' + esc(t) + "</span>";
    }).join("");
  } else {
    chip.classList.remove("on");
  }

  if (!rows.length) {
    $("#tableWrap").innerHTML =
      '<div class="empty"><h3>' + (state.q ? "검색 결과가 없습니다" : "등록된 공지가 없습니다") + "</h3>" +
      "<p>다른 검색어나 카테고리로 다시 찾아보세요.</p>" +
      '<button class="btn btn-ghost" onclick="resetAll()">조건 모두 해제</button></div>';
    $("#pager").innerHTML = "";
    return;
  }

  if (!$("#tbody")) buildTable();

  $("#tbody").innerHTML = rows.map(function (n) {
    return (
      '<tr class="' + (n.isPinned ? "pinned" : "") + '" onclick="location.href=\'notice.html?id=' + n.id + "&" + backQuery() + "'\">" +
        '<td class="c-no">' + (n.isPinned ? "고정" : n.id) + "</td>" +
        '<td><div class="t-cell">' + catBadges(n) +
          '<span class="title">' + esc(n.title) + "</span>" + dueBadge(n.dueDate) +
        "</div>" +
        '<span class="m-meta">' + esc(n.department) + " · " + n.createdAt + " · 조회 " + n.views + "</span></td>" +
        '<td class="c-author">' + esc(n.department) + "</td>" +
        '<td class="c-date">' + n.createdAt + "</td>" +
        '<td class="c-views">' + n.views + "</td>" +
      "</tr>"
    );
  }).join("");

  renderPager(pages);
}

function buildTable() {
  $("#tableWrap").innerHTML =
    '<table class="notice-table"><thead><tr>' +
      '<th class="c-no">번호</th><th class="c-title">제목</th>' +
      '<th class="c-author">작성자</th><th class="c-date">작성일</th><th class="c-views">조회</th>' +
    '</tr></thead><tbody id="tbody"></tbody></table>';
}

function backQuery() {
  return "back=" + encodeURIComponent(new URLSearchParams(location.search).toString());
}

function renderPager(pages) {
  var html = '<button ' + (state.page === 1 ? "disabled" : "") + ' onclick="go(' + (state.page - 1) + ')">‹</button>';
  for (var i = 1; i <= pages; i++) {
    html += '<button aria-current="' + (i === state.page) + '" onclick="go(' + i + ')">' + i + "</button>";
  }
  html += '<button ' + (state.page === pages ? "disabled" : "") + ' onclick="go(' + (state.page + 1) + ')">›</button>';
  $("#pager").innerHTML = html;
}

/* ── 이벤트 ── */
function go(p) { state.page = p; writeURL(); render(); window.scrollTo({ top: 0, behavior: "smooth" }); }

function pickTab(cat) {
  state.category = cat;
  if (cat !== "장학") state.sub = null;              /* R-11 */
  state.page = 1;
  writeURL(); render();
}

function pickSub(sub) {
  state.sub = sub;
  state.page = 1;
  writeURL(); render();
}

function doSearch(e) {
  if (e) e.preventDefault();
  state.q = $("#q").value.trim();                    /* R-03 */
  state.scope = $("#scope").value;
  state.page = 1;
  writeURL(); render();
}

function resetAll() {
  state = { category: null, sub: null, q: "", scope: "both", dueBefore: null, page: 1 };
  history.pushState(null, "", location.pathname);
  buildTable(); render();
}

function clearChip() {
  state.dueBefore = null;
  state.category = null;
  state.sub = null;
  state.page = 1;
  writeURL(); render();
}

/* ── 챗봇이 목록을 걸러낼 때 (R-06: 탭과 세부 필터도 함께 이동) ── */
window.applyChatFilter = function (a) {
  state.category  = a.category || null;
  state.sub       = a.subCategory || null;
  state.q         = a.keyword || "";
  state.scope     = "both";
  state.dueBefore = a.dueBefore || null;
  state.page      = 1;
  writeURL(); render();
  return filtered().length;
};

/* ── 시작 ── */
document.addEventListener("DOMContentLoaded", function () {
  mountLayout("정보광장");
  readURL();

  $("#tabs").innerHTML = ["전체"].concat(window.CATEGORIES).map(function (t) {
    var cat = t === "전체" ? "" : t;
    return '<button class="tab" data-cat="' + cat + '" onclick="pickTab(' +
           (cat ? "'" + cat + "'" : "null") + ')">' + t + "</button>";
  }).join("");

  $("#subTabs").innerHTML = [["", "전체"], ["근로", "근로"], ["일반", "일반"]].map(function (s) {
    return '<button class="subtab" data-sub="' + s[0] + '" onclick="pickSub(' +
           (s[0] ? "'" + s[0] + "'" : "null") + ')">' + s[1] + "</button>";
  }).join("");

  setTimeout(function () { buildTable(); render(); }, 350);
  window.addEventListener("popstate", function () { readURL(); render(); });
});
