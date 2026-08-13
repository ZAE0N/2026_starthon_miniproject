/* SC-02 공지 목록 — 탭, 검색, 페이징, 챗봇 필터 연동
   R-05: 지금 걸린 조건을 주소(URL)에 남깁니다. 상세에서 돌아올 때 그대로 복원됩니다. */

var SIZE = 10;

var state = {
  category: null,
  q: "",
  scope: "both",
  dueBefore: null,
  page: 1,
};

function readURL() {
  var p = new URLSearchParams(location.search);
  state.category = p.get("category");
  state.q = p.get("q") || "";
  state.scope = p.get("scope") || "both";
  state.dueBefore = p.get("dueBefore");
  state.page = parseInt(p.get("page") || "1", 10);
}

function writeURL(replace) {
  var p = new URLSearchParams();
  if (state.category) p.set("category", state.category);
  if (state.q) p.set("q", state.q);
  if (state.scope !== "both") p.set("scope", state.scope);
  if (state.dueBefore) p.set("dueBefore", state.dueBefore);
  if (state.page > 1) p.set("page", state.page);
  var url = location.pathname + (p.toString() ? "?" + p : "");
  history[replace ? "replaceState" : "pushState"](null, "", url);
}

function filtered() {
  return window.NOTICES.filter(function (n) {
    if (state.category && n.category !== state.category) return false;
    if (state.dueBefore) {
      if (!n.dueDate) return false;
      if (n.dueDate > state.dueBefore || n.dueDate < "2026-08-12") return false;
    }
    if (state.q) {
      var k = state.q;
      var hit =
        state.scope === "title" ? n.title.indexOf(k) !== -1 :
        state.scope === "content" ? n.content.indexOf(k) !== -1 :
        state.scope === "author" ? (n.author + n.department).indexOf(k) !== -1 :
        (n.title + n.content).indexOf(k) !== -1;
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
  if (state.page > pages) state.page = pages;   /* R-04 */
  if (state.page < 1) state.page = 1;
  var rows = all.slice((state.page - 1) * SIZE, state.page * SIZE);

  /* 탭 */
  $$(".tab").forEach(function (t) {
    t.setAttribute("aria-selected", (t.dataset.cat || null) === state.category ? "true" : "false");
  });
  $("#total").innerHTML = "총 <strong>" + all.length + "</strong>건";

  /* 검색 입력 복원 */
  $("#q").value = state.q;
  $("#scope").value = state.scope;

  /* 필터 칩 */
  var chip = $("#filterChip");
  if (state.dueBefore) {
    chip.classList.add("on");
    $("#chipTags").innerHTML =
      (state.category ? '<span class="tag">카테고리 · ' + esc(state.category) + "</span>" : "") +
      '<span class="tag">마감 · ' + esc(state.dueBefore) + " 이전</span>";
  } else {
    chip.classList.remove("on");
  }

  /* 목록 */
  var tb = $("#tbody");
  if (!rows.length) {
    $("#tableWrap").innerHTML =
      '<div class="empty"><h3>검색 결과가 없습니다</h3>' +
      "<p>다른 검색어나 카테고리로 다시 찾아보세요.</p>" +
      '<button class="btn btn-ghost" onclick="resetAll()">조건 모두 해제</button></div>';
    renderPager(1);
    return;
  }
  if (!tb) { location.reload(); return; }

  tb.innerHTML = rows.map(function (n) {
    return (
      '<tr class="' + (n.isPinned ? "pinned" : "") + '" onclick="location.href=\'notice.html?id=' + n.id + "&" + backQuery() + "'\">" +
        '<td class="c-no">' + (n.isPinned ? "고정" : n.id) + "</td>" +
        '<td><div class="t-cell">' +
          '<span class="badge badge-' + n.category + '">' + n.category + "</span>" +
          '<span class="title">' + esc(n.title) + "</span>" +
          dueBadge(n.dueDate) +
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

function backQuery() {
  var p = new URLSearchParams(location.search);
  return "back=" + encodeURIComponent(p.toString());
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
  state.page = 1;
  writeURL();
  render();
}

function doSearch(e) {
  if (e) e.preventDefault();
  state.q = $("#q").value.trim();     /* R-03: 비우면 전체로 복귀 */
  state.scope = $("#scope").value;
  state.page = 1;
  writeURL();
  render();
}

function resetAll() {
  state = { category: null, q: "", scope: "both", dueBefore: null, page: 1 };
  writeURL();
  location.reload();
}

function clearChip() {
  state.dueBefore = null;
  state.category = null;
  state.page = 1;
  writeURL();
  render();
}

/* ── 챗봇이 목록을 걸러낼 때 부르는 함수 (R-06: 탭도 함께 이동) ── */
window.applyChatFilter = function (a) {
  state.category = a.category || null;
  state.q = a.keyword || "";
  state.scope = "both";
  state.dueBefore = a.dueBefore || null;
  state.page = 1;
  writeURL();
  render();
  return filtered().length;
};

/* ── 시작 ── */
document.addEventListener("DOMContentLoaded", function () {
  mountLayout("정보광장");
  readURL();

  var tabs = ["전체"].concat(window.CATEGORIES);
  $("#tabs").innerHTML = tabs.map(function (t) {
    var cat = t === "전체" ? "" : t;
    return '<button class="tab" data-cat="' + cat + '" onclick="pickTab(' + (cat ? "'" + cat + "'" : "null") + ')">' + t + "</button>";
  }).join("");

  /* 서버가 깨어나는 시간을 흉내낸 로딩 표시 */
  setTimeout(function () {
    $("#tableWrap").innerHTML =
      '<table class="notice-table"><thead><tr>' +
        '<th class="c-no">번호</th><th class="c-title">제목</th>' +
        '<th class="c-author">작성자</th><th class="c-date">작성일</th><th class="c-views">조회</th>' +
      '</tr></thead><tbody id="tbody"></tbody></table>';
    render();
  }, 350);

  window.addEventListener("popstate", function () { readURL(); render(); });
});
