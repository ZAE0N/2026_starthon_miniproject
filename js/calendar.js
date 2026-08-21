/* SC-09 학사일정 달력
   같은 함수를 홈의 모달과 calendar.html 전체 화면에서 함께 씁니다.
   한 번 만들어 두 곳에 붙이는 방식입니다. */

var WD = ["일", "월", "화", "수", "목", "금", "토"];

function ymd(d) {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") +
         "-" + String(d.getDate()).padStart(2, "0");
}

/* 이 달에 "걸치는" 일정을 찾습니다.
   지난달에 시작해 이번 달에 끝나는 것도 포함됩니다 (R-14). */
function eventsOfMonth(year, month) {
  var first = year + "-" + String(month).padStart(2, "0") + "-01";
  var lastDay = new Date(year, month, 0).getDate();
  var last = year + "-" + String(month).padStart(2, "0") + "-" + String(lastDay).padStart(2, "0");
  return window.EVENTS
    .filter(function (e) { return e.startDate <= last && e.endDate >= first; })
    .sort(function (a, b) { return a.startDate < b.startDate ? -1 : 1; });
}

function mountCalendar(root, opts) {
  opts = opts || {};
  var base = new Date(today());
  var state = { y: base.getFullYear(), m: base.getMonth() + 1, picked: null };

  root.classList.add("cal");
  root.innerHTML =
    '<div class="cal-head">' +
      '<button class="cal-nav" data-prev aria-label="이전 달">‹</button>' +
      '<div class="cal-title" id="calTitle"></div>' +
      '<button class="cal-nav" data-next aria-label="다음 달">›</button>' +
      '<button class="cal-today" data-today>오늘</button>' +
    "</div>" +
    '<div class="cal-grid" id="calGrid"></div>' +
    '<div class="cal-list" id="calList"></div>';

  root.addEventListener("click", function (e) {
    if (e.target.hasAttribute("data-prev")) { move(-1); }
    else if (e.target.hasAttribute("data-next")) { move(1); }
    else if (e.target.hasAttribute("data-today")) {
      var b = new Date(today());
      state.y = b.getFullYear(); state.m = b.getMonth() + 1; state.picked = null;
      draw();
    }
    var cell = e.target.closest("[data-date]");
    if (cell) { state.picked = cell.dataset.date; draw(); }
  });

  function move(step) {
    var d = new Date(state.y, state.m - 1 + step, 1);
    state.y = d.getFullYear(); state.m = d.getMonth() + 1; state.picked = null;
    draw();
  }

  function draw() {
    var evs = eventsOfMonth(state.y, state.m);
    $("#calTitle", root).textContent = state.y + "년 " + state.m + "월";

    var firstDow = new Date(state.y, state.m - 1, 1).getDay();
    var lastDate = new Date(state.y, state.m, 0).getDate();

    var html = WD.map(function (w, i) {
      return '<div class="cal-wd' + (i === 0 ? " sun" : i === 6 ? " sat" : "") + '">' + w + "</div>";
    }).join("");

    for (var i = 0; i < firstDow; i++) html += '<div class="cal-cell empty"></div>';

    for (var d = 1; d <= lastDate; d++) {
      var date = state.y + "-" + String(state.m).padStart(2, "0") + "-" + String(d).padStart(2, "0");
      var on = evs.filter(function (e) { return e.startDate <= date && e.endDate >= date; });
      var important = on.some(function (e) { return e.isImportant; });
      var dow = (firstDow + d - 1) % 7;

      var cls = ["cal-cell"];
      if (dow === 0) cls.push("sun");
      if (dow === 6) cls.push("sat");
      if (date === today()) cls.push("is-today");
      if (state.picked === date) cls.push("is-picked");

      /* 형광펜: 기간 일정이면 시작·끝을 구분해 이어지게 칠합니다 */
      var mark = "";
      if (important) {
        var startsHere = on.some(function (e) { return e.isImportant && e.startDate === date; });
        var endsHere = on.some(function (e) { return e.isImportant && e.endDate === date; });
        var edge = (startsHere ? " hl-start" : "") + (endsHere ? " hl-end" : "");
        mark = '<span class="hl' + edge + '"></span>';
      } else if (on.length) {
        mark = '<span class="dot-mark"></span>';
      }

      html += '<div class="' + cls.join(" ") + '" data-date="' + date + '">' +
                mark + '<span class="num">' + d + "</span>" +
              "</div>";
    }

    $("#calGrid", root).innerHTML = html;

    /* 아래 일정 목록 */
    var list = $("#calList", root);
    if (!evs.length) {
      list.innerHTML = '<div class="cal-empty">이 달에는 등록된 일정이 없습니다.</div>';
      return;
    }
    list.innerHTML =
      '<div class="cal-list-head">이 달의 일정 <span>' + evs.length + "건</span></div>" +
      evs.map(function (e) {
        var span = e.startDate === e.endDate
          ? e.startDate.slice(5).replace("-", "월 ") + "일"
          : e.startDate.slice(5).replace("-", "월 ") + "일 ~ " + e.endDate.slice(5).replace("-", "월 ") + "일";
        var hit = state.picked && e.startDate <= state.picked && e.endDate >= state.picked;
        return '<div class="cal-item' + (hit ? " on" : "") + '">' +
                 '<span class="cal-date">' + span + "</span>" +
                 '<span class="cal-name">' + esc(e.title) + "</span>" +
                 (e.isImportant ? '<span class="badge badge-important">중요</span>' : "") +
               "</div>";
      }).join("");
  }

  draw();
  return { redraw: draw };
}
