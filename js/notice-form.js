/* SC-04 공지 작성 · 수정
   파일 하나로 두 모드를 처리합니다. ?id= 가 있으면 수정, 없으면 등록. */

var editId = null;
window.CHAT_NO_NAVIGATE = true;   /* 쓰던 글이 날아가지 않게 챗봇 이동을 막습니다 */

function syncSub() {
  var isSch = $("#category").value === "장학";
  var sub = $("#subCategory");
  sub.disabled = !isSch;
  if (!isSch) sub.value = "";                    /* R-11 */
  $("#subHint").textContent = isSch
    ? "근로 장학이면 '근로'를 고르세요."
    : "장학 카테고리에서만 고를 수 있습니다.";
}

function fill(n) {
  $("#category").value = n.category;
  syncSub();
  $("#subCategory").value = n.subCategory || "";
  $("#title").value = n.title;
  $("#author").value = n.author;
  $("#department").value = n.department;
  $("#dueDate").value = n.dueDate || "";
  $("#isPinned").checked = !!n.isPinned;
  $("#content").value = n.content;
}

function mark(rowId, bad) { $("#" + rowId).classList.toggle("invalid", bad); }

function validate(v) {
  var ok = true;
  mark("row-title", !v.title);     if (!v.title) ok = false;
  mark("row-author", !v.author);   if (!v.author) ok = false;
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
    subCategory: $("#category").value === "장학" ? ($("#subCategory").value || null) : null,
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
    var created = Object.assign({ id: maxId + 1, createdAt: today(), views: 0 }, v);
    window.NOTICES.unshift(created);
    saveNotices();
    sessionStorage.setItem("flash", "등록되었습니다");
    location.href = "notice.html?id=" + created.id;
  }
}

document.addEventListener("DOMContentLoaded", function () {
  mountLayout("정보광장");

  if (!isAdmin()) {
    toast("권한이 없습니다. 푸터의 '관리자'를 눌러 주세요", true);
    setTimeout(function () { location.href = "notices.html"; }, 1200);
    return;
  }

  $("#category").addEventListener("change", syncSub);
  syncSub();

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
    document.title = "공지 수정 | 인하공업전문대학";
    fill(n);
  }

  ["title", "author", "content"].forEach(function (f) {
    $("#" + f).addEventListener("input", function () { mark("row-" + f, false); });
  });
});
