/* SC-04 공지 작성 · 수정
   파일 하나로 두 모드를 처리합니다. ?id= 가 있으면 수정, 없으면 등록. */

var editId = null;

function fill(n) {
  $("#category").value = n.category;
  $("#title").value = n.title;
  $("#author").value = n.author;
  $("#department").value = n.department;
  $("#dueDate").value = n.dueDate || "";
  $("#isPinned").checked = !!n.isPinned;
  $("#content").value = n.content;
}

function mark(rowId, bad) {
  $("#" + rowId).classList.toggle("invalid", bad);
}

function validate(v) {
  var ok = true;
  mark("row-title", !v.title);   if (!v.title) ok = false;
  mark("row-author", !v.author); if (!v.author) ok = false;
  mark("row-content", !v.content); if (!v.content) ok = false;
  if (!ok) {
    toast("입력하지 않은 항목이 있습니다", true);
    $(".invalid input, .invalid textarea").focus();
  }
  return ok;
}

function submitForm(e) {
  e.preventDefault();
  var v = {
    category: $("#category").value,
    title: $("#title").value.trim(),
    author: $("#author").value.trim(),
    department: $("#department").value.trim() || "관리자",
    dueDate: $("#dueDate").value || null,
    isPinned: $("#isPinned").checked,
    content: $("#content").value.trim(),
  };
  if (!validate(v)) return;

  if (editId) {
    var n = window.NOTICES.find(function (x) { return x.id === editId; });
    Object.assign(n, v);
    saveNotices();
    sessionStorage.setItem("flash", "수정되었습니다");
    location.href = "notice.html?id=" + editId;
  } else {
    var maxId = window.NOTICES.reduce(function (m, x) { return Math.max(m, x.id); }, 0);
    var created = Object.assign({
      id: maxId + 1,
      createdAt: "2026-08-12",
      views: 0,
    }, v);
    window.NOTICES.unshift(created);
    saveNotices();
    sessionStorage.setItem("flash", "등록되었습니다");
    location.href = "notice.html?id=" + created.id;
  }
}

document.addEventListener("DOMContentLoaded", function () {
  mountLayout("정보광장");

  /* 관리자가 아니면 되돌려보냅니다 */
  if (!isAdmin()) {
    toast("권한이 없습니다. 푸터의 '관리자'를 눌러 주세요", true);
    setTimeout(function () { location.href = "notices.html"; }, 1200);
    return;
  }

  var id = parseInt(qs("id"), 10);
  if (id) {
    var n = window.NOTICES.find(function (x) { return x.id === id; });
    if (!n) {
      $("#form").innerHTML =
        '<div class="empty"><h3>수정할 공지를 찾을 수 없습니다</h3>' +
        '<a class="btn btn-primary" href="notices.html">목록으로 가기</a></div>';
      return;
    }
    editId = id;
    $("#pageTitle").textContent = "공지 수정";
    $("#formTitle").textContent = "공지 수정";
    $("#submitBtn").textContent = "저장하기";
    document.title = "공지 수정 | 한빛공업전문대학";
    fill(n);
  }

  /* 입력하면 오류 표시 해제 */
  ["title", "author", "content"].forEach(function (f) {
    $("#" + f).addEventListener("input", function () { mark("row-" + f, false); });
  });
});
