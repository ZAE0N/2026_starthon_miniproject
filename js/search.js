/* SC-06 통합 검색 — 공지와 학교 안내 문서를 함께 찾습니다 */

function doSearch(e) {
  if (e) e.preventDefault();
  var q = $("#q").value.trim();
  location.href = "search.html" + (q ? "?q=" + encodeURIComponent(q) : "");
}

function render() {
  var q = (qs("q") || "").trim();
  var box = $("#result");
  $("#q").value = q;

  if (!q) {
    box.innerHTML = '<div class="empty"><h3>검색어를 입력해 주세요</h3>' +
      "<p>공지사항과 학교 안내 문서를 함께 찾아 드립니다.</p></div>";
    return;
  }

  var notices = window.NOTICES.filter(function (n) {
    return (n.title + n.content + n.department).indexOf(q) !== -1;
  });
  var pages = window.PAGES.filter(function (p) {
    return (p.title + p.body + p.menu).indexOf(q) !== -1;
  });
  var total = notices.length + pages.length;

  if (!total) {
    box.innerHTML = '<div class="empty"><h3>검색 결과가 없습니다</h3>' +
      "<p>단어를 줄이거나 다른 표현으로 다시 찾아보세요.</p>" +
      '<a class="btn btn-ghost" href="search.html">검색어 지우기</a></div>';
    return;
  }

  var html = '<div class="result-head"><em>' + esc(q) + "</em> 검색 결과 — 총 " + total + "건</div>";

  if (notices.length) {
    html += '<section class="grp"><h3>공지사항 <span>' + notices.length + "건</span></h3><ul>";
    html += notices.slice(0, 5).map(function (n) {
      return '<li><a href="notice.html?id=' + n.id + '">' +
        '<span class="badge badge-' + n.category + '">' + n.category + "</span>" +
        '<span class="t">' + esc(n.title) + "</span>" +
        '<span class="d">' + n.createdAt + "</span></a></li>";
    }).join("");
    html += "</ul>";
    if (notices.length > 5) {
      html += '<a class="more" href="notices.html?q=' + encodeURIComponent(q) + '">공지에서 더 보기 →</a>';
    }
    html += "</section>";
  }

  if (pages.length) {
    html += '<section class="grp"><h3>학교 안내 <span>' + pages.length + "건</span></h3><ul>";
    html += pages.map(function (p) {
      return '<li><a href="page.html?slug=' + p.slug + '">' +
        '<span class="path">' + p.menu + " &rsaquo;</span>" +
        '<span class="t">' + esc(p.title) + "</span></a></li>";
    }).join("");
    html += "</ul></section>";
  }

  box.innerHTML = html;
}

document.addEventListener("DOMContentLoaded", function () {
  mountLayout(null);
  render();
});
