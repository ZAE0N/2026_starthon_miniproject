/* 백엔드 연결 계층.

   js/data.js 의 목업 데이터를 API 응답으로 갈아끼웁니다.
   화면 코드(notices.js, home.js ...)는 그대로 window.NOTICES 를 읽으므로
   이 파일만 성공하면 나머지는 손댈 것이 없습니다.

   API 가 없거나 죽어 있으면 data.js 의 목업으로 그대로 동작합니다.
   시연 중 서버가 멈춰도 화면이 빈 채로 뜨지 않게 하기 위한 장치입니다. */

(function () {
  /* 같은 서버에서 서빙하면(배포 형태) 상대 경로로 충분합니다.
     로컬에서 프론트와 백엔드를 다른 포트로 띄울 때만 아래를 바꾸세요. */
  var BASE = window.API_BASE || "";

  window.API_LIVE = false;

  function get(path) {
    return fetch(BASE + path, { headers: { Accept: "application/json" } })
      .then(function (r) {
        if (!r.ok) throw new Error(path + " → " + r.status);
        return r.json();
      });
  }

  function send(method, path, body) {
    return fetch(BASE + path, {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    }).then(function (r) {
      if (!r.ok) throw new Error(method + " " + path + " → " + r.status);
      return r.status === 204 ? null : r.json();
    });
  }

  /* 세 전역을 한 번에 채웁니다. 하나라도 실패하면 전체를 목업으로 둡니다. */
  window.DATA_READY = Promise.all([
    get("/api/notices"),
    get("/api/events"),
    get("/api/pages"),
  ])
    .then(function (res) {
      window.NOTICES = res[0];
      window.EVENTS = res[1];
      window.PAGES = res[2];
      window.API_LIVE = true;
      /* 목업 시절 남은 캐시가 API 데이터를 덮지 않도록 지웁니다 */
      try { sessionStorage.removeItem("notices"); } catch (e) {}
    })
    .catch(function (err) {
      console.warn("[api] 백엔드에 연결하지 못해 목업 데이터로 동작합니다:", err.message);
    });

  /* DOM 준비와 데이터 준비를 함께 기다립니다.
     각 화면은 DOMContentLoaded 대신 이걸 씁니다. */
  window.onDataReady = function (fn) {
    var dom = new Promise(function (resolve) {
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", resolve);
      } else {
        resolve();
      }
    });
    Promise.all([dom, window.DATA_READY]).then(function () { fn(); });
  };

  /* 쓰기 작업. API 가 살아 있으면 서버에, 아니면 메모리에만 반영합니다.
     어느 쪽이든 같은 모양의 공지 객체를 돌려줍니다. */
  window.Api = {
    bumpViews: function (id) {
      if (!window.API_LIVE) return Promise.resolve(null);
      return send("POST", "/api/notices/" + id + "/views", null);
    },
    createNotice: function (payload) {
      if (!window.API_LIVE) return Promise.resolve(null);
      return send("POST", "/api/notices", payload);
    },
    updateNotice: function (id, payload) {
      if (!window.API_LIVE) return Promise.resolve(null);
      return send("PUT", "/api/notices/" + id, payload);
    },
    deleteNotice: function (id) {
      if (!window.API_LIVE) return Promise.resolve(null);
      return send("DELETE", "/api/notices/" + id, null);
    },
  };
})();
