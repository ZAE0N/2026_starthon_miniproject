/* SC-03 공지 상세
   R-01 조회수는 세션당 1회만 증가
   R-02 이전글·다음글은 카테고리 무관, 번호순
   R-05 목록 버튼은 보던 조건 그대로 복귀 */

var current = null;

function backHref() {
  var back = qs("back");
  return "notices.html" + (back ? "?" + back : "");
}

function bumpViews(n) {
  var key = "viewed:" + n.id;
  if (sessionStorage.getItem(key)) return;
  sessionStorage.setItem(key, "1");
  n.views += 1;
  saveNotices();
}

function siblings(id) {
  var sorted = window.NOTICES.slice().sort(function (a, b) { return a.id - b.id; });
  var i = sorted.findIndex(function (n) { return n.id === id; });
  return { prev: sorted[i - 1] || null, next: sorted[i + 1] || null };
}

function notFound() {
  $("#wrap").innerHTML =
    '<div class="empty"><h3>요청하신 공지를 찾을 수 없습니다</h3>' +
    "<p>삭제되었거나 주소가 잘못되었습니다.</p>" +
    '<a class="btn btn-primary" href="' + backHref() + '">목록으로 가기</a></div>';
}

function render() {
  var id = parseInt(qs("id"), 10);
  var n = window.NOTICES.find(function (x) { return x.id === id; });
  if (!n) { notFound(); return; }
  current = n;
  bumpViews(n);
  document.title = n.title + " | 인하공업전문대학";

  var sib = siblings(id);
  var d = daysLeft(n.dueDate);

  $("#wrap").innerHTML =
    '<article>' +
      '<div class="detail-head">' +
        catBadges(n) +
        "<h2></h2>" +
        '<div class="meta">' +
          '<span class="m-author"></span>' +
          '<span class="sep">·</span><span>' + n.createdAt + "</span>" +
          '<span class="sep">·</span><span>조회 ' + n.views + "</span>" +
          (n.dueDate ? '<span class="sep">·</span><span>마감 ' + n.dueDate + "</span>" : "") +
          (d !== null && d >= 0 && d <= 7 ? '<span class="badge badge-due">마감 D-' + d + "</span>" : "") +
        "</div>" +
      "</div>" +
      '<div class="detail-body" id="body"></div>' +
    "</article>" +

    '<div class="siblings">' +
      (sib.prev
        ? '<a href="notice.html?id=' + sib.prev.id + "&" + (qs("back") ? "back=" + encodeURIComponent(qs("back")) : "") + '"><span class="dir">▲ 이전글</span><span class="t"></span></a>'
        : '<span class="none"><span class="dir">▲ 이전글</span>이전 글이 없습니다</span>') +
      (sib.next
        ? '<a href="notice.html?id=' + sib.next.id + "&" + (qs("back") ? "back=" + encodeURIComponent(qs("back")) : "") + '"><span class="dir">▼ 다음글</span><span class="t"></span></a>'
        : '<span class="none"><span class="dir">▼ 다음글</span>다음 글이 없습니다</span>') +
    "</div>" +

    '<div class="detail-actions">' +
      '<a class="btn btn-ghost" href="' + backHref() + '">목록</a>' +
      '<div class="right">' +
        '<a class="btn btn-secondary admin-only" href="notice-form.html?id=' + n.id + '">수정</a>' +
        '<button class="btn btn-danger admin-only" onclick="askDelete()">삭제</button>' +
      "</div>" +
    "</div>";

  /* 사용자 입력값은 textContent 로 넣습니다 (7-2 보안) */
  $(".detail-head h2").textContent = n.title;
  $(".m-author").textContent = n.department + " " + n.author;
  $("#body").textContent = n.content;

  var links = $$(".siblings a .t");
  var order = [];
  if (sib.prev) order.push(sib.prev);
  if (sib.next) order.push(sib.next);
  links.forEach(function (el, i) { el.textContent = order[i].title; });
}

function askDelete() {
  confirmModal("공지를 삭제할까요?", current.title, "삭제한 공지는 되돌릴 수 없습니다.", function () {
    var i = window.NOTICES.findIndex(function (x) { return x.id === current.id; });
    window.NOTICES.splice(i, 1);
    saveNotices();
    sessionStorage.setItem("flash", "삭제되었습니다");
    location.href = backHref();
  });
}

document.addEventListener("DOMContentLoaded", function () {
  mountLayout("정보광장");
  setTimeout(render, 250);
});
