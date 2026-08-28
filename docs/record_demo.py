#!/usr/bin/env python3
"""시연 영상을 자동으로 녹화합니다.  대본: docs/demo-script.md

    CAPTIONS=0 python3 docs/record_demo.py http://127.0.0.1:8120 out/   # 자막 없음
    python3 docs/record_demo.py http://127.0.0.1:8120 out/             # 자막 있음

브라우저를 실제로 조작하며 화면을 녹화합니다. 결과는 webm 이고,
ffmpeg 이 있으면 mp4 로도 변환합니다.

사람이 쓰는 것처럼 보이게 하는 것이 이 스크립트의 절반입니다.
  · Playwright 녹화에는 마우스 커서가 안 찍힙니다. 그래서 커서를 페이지에
    직접 그리고, page.mouse 가 쏘는 진짜 mousemove 를 받아 따라다니게 합니다.
  · 커서는 곡선으로 움직이고, 목표 근처에서 느려지고, 중간에 멈칫하고,
    요소의 정확한 중앙을 누르지 않습니다.
  · 타이핑은 글자마다 간격이 다르고, 엔터를 바로 누르지 않습니다.
  · 화면 이동은 휠을 잘게 굴려서 합니다. 순간이동하지 않습니다.
  · 페이지 이동도 주소 입력이 아니라 링크 클릭과 뒤로 가기로 합니다.

알아둘 점
  · 무음입니다.
  · 녹화 대상은 페이지 뷰포트뿐이라 주소창·브라우저 크롬은 안 잡힙니다.
    "링크 붙여넣기" 장면은 직접 찍어 앞에 붙이세요.
  · 건수는 실행 시점에 화면에서 읽습니다. 오늘 날짜에 따라 '이번 주 마감'
    결과가 달라지므로 숫자를 박아 두면 안 됩니다.
"""
import math
import os
import random
import re
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8120").rstrip("/")
OUT = os.path.abspath(sys.argv[2] if len(sys.argv) > 2 else "out")
W, H = 1280, 720
# 전체 길이를 줄이는 손잡이입니다. 3분을 넘기면 이 값을 낮춥니다.
SPEED = float(os.environ.get("SPEED", "1.0"))
# 마우스만 따로 조절합니다. 크게 하면 빨라집니다.
# 화면을 읽는 멈춤과 타이핑 속도는 여기에 딸려 오지 않습니다 — 그건 그대로 둬야
# 심사위원이 바뀐 숫자를 읽을 시간이 남습니다.
MOUSE = float(os.environ.get("MOUSE", "1.3"))
# 자막판과 무자막판을 한 스크립트로 유지합니다.
CAPTIONS = os.environ.get("CAPTIONS", "1") != "0"
# 매번 같은 움직임이 나오면 그것대로 어색합니다. 고정하고 싶으면 SEED 를 주세요.
random.seed(int(os.environ["SEED"]) if os.environ.get("SEED") else None)

# 커서 그림과 자막을 페이지에 주입합니다.
# ★ 커서가 이 스크립트의 전제입니다. 이게 없으면 화면이 저절로 바뀌는 것처럼
#   보여서, 무엇을 눌렀는지 알 방법이 없습니다.
OVERLAY = r"""
(() => {
  const css = `
    :root { --font: "Noto Sans CJK KR","Noto Sans KR","Pretendard",sans-serif !important; }
    #__cur {
      position: fixed; left: 0; top: 0; width: 22px; height: 30px;
      z-index: 2147483647; pointer-events: none; opacity: 0;
      will-change: transform; margin: -2px 0 0 -2px;
    }
    #__ring {
      position: fixed; left: 0; top: 0; width: 14px; height: 14px;
      margin: -7px 0 0 -7px; border-radius: 50%;
      border: 2px solid rgba(6,182,212,.95); background: rgba(6,182,212,.20);
      z-index: 2147483646; pointer-events: none; opacity: 0;
    }
    #__ring.go { animation: __pop .42s ease-out; }
    @keyframes __pop {
      from { opacity: .95; transform: translate(var(--x), var(--y)) scale(.5); }
      to   { opacity: 0;   transform: translate(var(--x), var(--y)) scale(3.1); }
    }
    #__cap {
      position: fixed; left: 50%; bottom: 28px; transform: translateX(-50%);
      max-width: 82%; z-index: 2147483645; pointer-events: none;
      background: rgba(12,14,18,.88); color: #fff;
      font: 600 21px/1.5 "Noto Sans CJK KR","Noto Sans KR",sans-serif;
      padding: 13px 24px; border-radius: 12px; text-align: center;
      box-shadow: 0 8px 28px rgba(0,0,0,.45);
      opacity: 0; transition: opacity .25s; white-space: pre-line;
    }
    #__cap.on { opacity: 1; }`;

  const ARROW =
    '<svg width="22" height="30" viewBox="0 0 22 30">' +
    '<path d="M2 1.5 L2 21.5 L7.2 16.6 L10.8 24.6 L14.2 23 L10.7 15.2 L17.6 15.2 Z"' +
    ' fill="#14181f" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"' +
    ' style="filter:drop-shadow(0 2px 3px rgba(0,0,0,.45))"/></svg>';

  const add = () => {
    if (document.getElementById('__curstyle')) return;
    const s = document.createElement('style');
    s.id = '__curstyle'; s.textContent = css;
    (document.head || document.documentElement).appendChild(s);
    const c = document.createElement('div');
    c.id = '__cur'; c.innerHTML = ARROW;
    document.body.appendChild(c);
    const g = document.createElement('div');
    g.id = '__ring';
    document.body.appendChild(g);
    const d = document.createElement('div');
    d.id = '__cap';
    document.body.appendChild(d);

    // ★ 페이지를 넘어가도 커서가 이어져 보이게 마지막 좌표를 복원합니다.
    //   이게 없으면 새 페이지에서 mousemove 가 한 번 날 때까지 커서가
    //   사라집니다. 휠만 굴리는 구간에서는 그 한 번이 영영 안 옵니다.
    try {
      const p = JSON.parse(sessionStorage.getItem('__curpos') || 'null');
      if (p) place(c, p.x, p.y);
    } catch (_) {}
  };

  const place = (c, x, y) => {
    c.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    c.style.opacity = '1';
  };

  if (document.body) add();
  else document.addEventListener('DOMContentLoaded', add);

  // page.mouse.move() 가 쏘는 진짜 이벤트를 받아 커서를 옮깁니다.
  addEventListener('mousemove', (e) => {
    const c = document.getElementById('__cur');
    if (!c) return;
    place(c, e.clientX, e.clientY);
    try {
      sessionStorage.setItem('__curpos',
        JSON.stringify({ x: e.clientX, y: e.clientY }));
    } catch (_) {}
  }, true);

  // 눌린 것이 보이도록 클릭 자리에 링을 한 번 띄웁니다.
  addEventListener('mousedown', (e) => {
    const g = document.getElementById('__ring');
    if (!g) return;
    g.style.setProperty('--x', e.clientX + 'px');
    g.style.setProperty('--y', e.clientY + 'px');
    g.classList.remove('go'); void g.offsetWidth; g.classList.add('go');
  }, true);

  window.__cap = (t) => {
    const d = document.getElementById('__cap');
    if (!d) return;
    if (t) { d.textContent = t; d.classList.add('on'); }
    else { d.classList.remove('on'); }
  };
})();
"""


def rnd(a, b):
    return random.uniform(a, b)


class Rec:
    """녹화 진행과 '사람처럼 보이는 조작'을 함께 맡습니다."""

    def __init__(self, page):
        self.page = page
        self.t0 = time.time()
        self.mark_t = self.t0
        self.x, self.y = W * 0.58, H * 0.72   # 커서 시작 위치

    # ── 진행 로그 ────────────────────────────────────────────────────────
    def mark(self, label):
        now = time.time()
        print(f"  [{now-self.t0:6.1f}s] (+{now-self.mark_t:5.1f}) {label}", flush=True)
        self.mark_t = now

    # ── 멈춤과 자막 ──────────────────────────────────────────────────────
    def beat(self, sec):
        time.sleep(sec * SPEED)

    def cap(self, text):
        if CAPTIONS:
            self.page.evaluate("t => window.__cap && window.__cap(t)", text)

    def clear(self):
        if CAPTIONS:
            self.page.evaluate("() => window.__cap && window.__cap('')")

    def note(self, text, cap_hold=3.0, hold=0.4):
        """자막판에서는 읽을 시간을, 무자막판에서는 짧은 숨만 둡니다.

        화면 변화를 보여주려고 멈추는 것은 note 가 아니라 beat 로 씁니다.
        그건 자막이 있든 없든 똑같이 필요하기 때문입니다.
        """
        if CAPTIONS:
            self.cap(text)
            self.beat(cap_hold)
            self.clear()
            self.beat(0.25)
        else:
            self.beat(hold)

    # ── 마우스 ───────────────────────────────────────────────────────────
    def _hop(self, x, y, dur):
        """한 번의 곡선 이동. 가감속·흔들림·멈칫이 들어갑니다."""
        x0, y0 = self.x, self.y
        dist = math.hypot(x - x0, y - y0)
        steps = max(6, min(46, int(dist / 13) + 6))

        # 제어점을 경로에 수직으로 밀어 곡선을 만듭니다. 최단 직선이 아닙니다.
        nx, ny = -(y - y0), (x - x0)
        n = math.hypot(nx, ny) or 1.0
        bow = rnd(-0.16, 0.16) * dist
        cx = (x0 + x) / 2 + nx / n * bow
        cy = (y0 + y) / 2 + ny / n * bow

        # 이동 중 한두 번 멈칫합니다.
        pauses = set()
        if steps > 8:
            pauses = set(random.sample(range(2, steps - 1),
                                       k=random.choice([0, 1, 1, 2])))

        for i in range(1, steps + 1):
            t = i / steps
            e = 1 - (1 - t) ** 2.3          # 붙을 때 빠르고 목표 근처에서 느려집니다
            px = (1 - e) ** 2 * x0 + 2 * (1 - e) * e * cx + e * e * x
            py = (1 - e) ** 2 * y0 + 2 * (1 - e) * e * cy + e * e * y
            if i < steps:                    # 마지막 점은 정확히 목표로
                px += rnd(-1.7, 1.7)
                py += rnd(-1.7, 1.7)
            self.page.mouse.move(px, py)
            time.sleep(dur / steps * rnd(0.55, 1.5))
            if i in pauses:
                time.sleep(rnd(0.03, 0.12) / MOUSE)
        self.x, self.y = x, y

    def move(self, x, y):
        x = max(4, min(W - 6, x))
        y = max(4, min(H - 6, y))
        dist = math.hypot(x - self.x, y - self.y)
        if dist < 2:
            return
        dur = (0.16 + min(0.5, dist / 1500)) * rnd(0.85, 1.25) * SPEED / MOUSE

        # 멀리 갈 때는 한 번에 딱 맞히지 않습니다. 살짝 지나쳤다가 고칩니다.
        if dist > 320 and random.random() < 0.55:
            ang = rnd(0, 2 * math.pi)
            off = rnd(14, 34)
            self._hop(x + math.cos(ang) * off, y + math.sin(ang) * off, dur * 0.8)
            time.sleep(rnd(0.05, 0.14) / MOUSE)
            self._hop(x, y, rnd(0.1, 0.18) / MOUSE)
        else:
            self._hop(x, y, dur)

    def _press(self):
        time.sleep(rnd(0.08, 0.2) / MOUSE)   # 누르기 직전 멈칫
        self.page.mouse.down()
        time.sleep(rnd(0.05, 0.11) / MOUSE)
        self.page.mouse.up()

    def point(self, selector, nth=0):
        """요소 위로 커서만 옮깁니다 (누르지는 않습니다)."""
        box = self._visible_box(selector, nth)
        if not box:
            return False
        self.move(box["x"] + box["width"] * rnd(0.3, 0.7),
                  box["y"] + box["height"] * rnd(0.3, 0.7))
        return True

    def click(self, selector, nth=0, after=0.5):
        """요소로 커서를 옮겨 누릅니다.

        el.click() 대신 mouse.down/up 을 씁니다. 그래야 화면에 그린 커서가
        있는 자리에서 정확히 눌리고, mousedown 링도 그 자리에 뜹니다.
        """
        box = self._visible_box(selector, nth)
        if not box:
            print(f"  ! 못 찾음: {selector}")
            return False
        # 정확한 중앙을 누르지 않습니다.
        self.move(box["x"] + box["width"] * rnd(0.32, 0.68),
                  box["y"] + box["height"] * rnd(0.34, 0.66))
        self._press()
        self.beat(after)
        return True

    def _visible_box(self, selector, nth=0):
        """요소가 화면에 들어오도록 휠을 굴린 뒤 좌표를 돌려줍니다.

        scroll_into_view_if_needed 는 순간이동이라 쓰지 않습니다.
        """
        el = self.page.locator(selector).nth(nth)
        try:
            el.wait_for(state="attached", timeout=6000)
        except Exception:
            return None

        # ★ 고정 요소(position: fixed)는 스크롤해도 안 움직입니다.
        #   챗봇 패널(.chat)과 AI 도우미 단추(.fab)가 여기 해당합니다.
        #   이걸 안 걸러내면 화면에 이미 보이는 입력칸을 '올리겠다'며
        #   페이지를 계속 내려버립니다 — 정작 총 N건이 화면 밖으로 밀려납니다.
        try:
            if el.evaluate(
                "e => { for (let n = e; n && n !== document.body; n = n.parentElement)"
                "        if (getComputedStyle(n).position === 'fixed') return true;"
                "       return false; }"):
                return el.bounding_box()
        except Exception:
            pass

        for _ in range(4):
            box = el.bounding_box()
            if not box:
                return None             # 숨은 요소입니다 (예: 관리자 아닐 때 .admin-only)
            mid = box["y"] + box["height"] / 2
            if 80 < mid < H - 80:
                return box
            self.scroll(mid - H * 0.45)
            after = el.bounding_box()
            if not after:
                return None
            if abs(after["y"] - box["y"]) < 2:
                # ★ 페이지 끝이라 더 못 내려갑니다 (푸터 안의 요소가 그렇습니다).
                #   화면 안에 있으면 그대로 누르고, 밖이면 None 을 돌려줍니다.
                #   여기서 화면 밖 좌표를 돌려주면 move() 가 가장자리로 잘라내서
                #   엉뚱한 것을 누르고도 성공한 줄 압니다.
                mid = after["y"] + after["height"] / 2
                return after if 4 < mid < H - 4 else None
        return el.bounding_box()

    # ── 스크롤 ───────────────────────────────────────────────────────────
    def scroll(self, dy, over=None):
        """휠을 잘게 굴립니다. 끊어서 하되 빠르게.

        over 를 주면 그 요소 위로 커서를 옮긴 뒤 굴립니다 (채팅창 등
        따로 스크롤되는 영역용).
        """
        if over:
            self.point(over)
            time.sleep(rnd(0.08, 0.18))
        else:
            self._poke()      # 휠은 mousemove 를 안 냅니다. 커서를 깨워 둡니다.
        if abs(dy) < 12:
            return
        sign = 1 if dy > 0 else -1
        left = abs(dy)
        while left > 0:
            amt = min(left, rnd(95, 145))
            self.page.mouse.wheel(0, sign * amt)
            left -= amt
            time.sleep(rnd(0.014, 0.036))
            if random.random() < 0.1:        # 가끔 한 박자 쉽니다
                time.sleep(rnd(0.05, 0.16))
        time.sleep(rnd(0.15, 0.32))

    def to_top(self):
        """목록 위쪽(총 N건·카테고리 탭)이 보이게 올라갑니다.

        ★ 이게 없으면 챗봇이 목록을 바꾸는 '순간'을 놓칩니다. 화면이
          아래쪽에 있으면 정작 71 → N 으로 바뀌는 숫자가 안 보입니다.
          채팅창이 아니라 왼쪽 본문 위에서 굴려야 페이지가 움직입니다.
        """
        el = self.page.locator("#total").first
        try:
            box = el.bounding_box()
        except Exception:
            box = None
        if box and 80 < box["y"] < H - 120:
            return                       # 이미 보이면 굳이 움직이지 않습니다
        self.move(rnd(360, 520), rnd(330, 430))
        self.scroll(-1000)

    # ── 키보드 ───────────────────────────────────────────────────────────
    def type(self, selector, text, enter=True):
        self.click(selector, after=0.0)
        time.sleep(rnd(0.3, 0.6))            # 누르고 바로 치지 않습니다
        for ch in text:
            self.page.keyboard.type(ch)
            d = rnd(0.055, 0.16)
            if ch == " ":
                d += rnd(0.04, 0.12)         # 띄어쓰기에서 조금 더
            if random.random() < 0.08:
                d += rnd(0.1, 0.28)          # 가끔 생각하는 시간
            time.sleep(d * SPEED)
        if enter:
            time.sleep(rnd(0.4, 0.8))        # 다 치고 한 번 읽어 봅니다
            self.page.keyboard.press("Enter")
            # 엔터가 페이지를 넘길 수도 있습니다 (통합 검색). 커서를 다시 깨웁니다.
            self.page.wait_for_timeout(400)
            self._settle()

    # ── 페이지 이동 ──────────────────────────────────────────────────────
    def _poke(self):
        """커서를 제자리에서 한 번 흔듭니다.

        오버레이는 mousemove 를 받아야 나타납니다. 휠·엔터만 이어지는
        구간에서는 그 이벤트가 안 나서 커서가 사라진 채로 녹화됩니다.
        """
        self.page.mouse.move(self.x + 0.6, self.y + 0.6)
        self.page.mouse.move(self.x, self.y)

    def _settle(self):
        """새 페이지에서 커서를 원래 자리에 다시 놓습니다.

        오버레이가 sessionStorage 로 좌표를 복원하긴 하지만, Python 쪽
        마우스 상태와도 맞춰 두어야 다음 이동이 엉뚱한 데서 시작하지 않습니다.
        """
        self._poke()

    def _wait_list(self):
        """목록이 실제로 그려질 때까지만 기다립니다 (빈 화면 방지)."""
        try:
            self.page.wait_for_function(
                "() => { const t = document.querySelector('#total');"
                "return !t || /[1-9]/.test(t.textContent); }", timeout=6000)
        except Exception:
            pass

    def open_url(self, path):
        self.page.goto(BASE + path, wait_until="domcontentloaded")
        self._wait_list()
        self.page.wait_for_timeout(400)
        self._settle()

    def nav(self, selector, nth=0, wait_url=None):
        """링크를 눌러서 이동합니다. 주소를 치지 않습니다.

        wait_url — 저장·삭제처럼 **API 응답을 받은 뒤에야** 페이지를 옮기는
        경우에 줍니다. 그때는 wait_for_load_state 가 지금 페이지를 보고 바로
        돌아와 버려서, 아직 안 넘어간 화면을 넘어간 줄 알게 됩니다.
        """
        if not self.click(selector, nth=nth, after=0.0):
            return False
        if wait_url:
            try:
                self.page.wait_for_url(wait_url, timeout=12000)
            except Exception:
                print(f"  ! 이동을 못 봤습니다: {wait_url}")
                return False
        self.page.wait_for_load_state("domcontentloaded")
        self._wait_list()
        self.page.wait_for_timeout(rnd(250, 500))
        self._settle()
        self.beat(0.4)
        return True

    def back(self):
        self.page.go_back(wait_until="domcontentloaded")
        self._wait_list()
        self.page.wait_for_timeout(rnd(250, 500))
        self._settle()
        self.beat(0.4)

    # ── 화면 읽기 ────────────────────────────────────────────────────────
    def total(self):
        """공지 목록의 '총 N건' 에서 숫자만 뽑습니다."""
        try:
            t = self.page.locator("#total").first.inner_text(timeout=2000)
            m = re.search(r"\d+", t)
            return m.group(0) if m else "?"
        except Exception:
            return "?"

    def ask(self, text, wait=3.0):
        """질문을 던집니다.

        추천 칩은 첫 질문 한 번에 전부 사라집니다 (js/common.js:271).
        그래서 첫 질문만 칩을 누르고, 나머지는 직접 칩니다.
        타이핑 장면은 자유 입력도 된다는 걸 보여 주므로 오히려 좋습니다.
        """
        chip = self.page.locator(f".suggests button:has-text('{text}')")
        if chip.count():
            self.click(f".suggests button:has-text('{text}')", after=0.0)
        else:
            self.type("#chatInput", text)
        self.page.wait_for_timeout(int(wait * 1000 * SPEED))


def record(page):
    r = Rec(page)

    # ── 1. 홈 ────────────────────────────────────────────────────────────
    r.mark("홈")
    r.open_url("/index.html")
    r.note("인하공업전문대학 홈페이지에 AI 공지 도우미를 붙였습니다\n"
           "링크 하나면 됩니다 — 설치도 로그인도 없습니다", 4.0, 0.8)
    r.scroll(430)                     # 훑어보듯 내려봅니다
    r.beat(1.0)
    r.scroll(-430)
    r.beat(0.5)

    # ── 2. 공지 목록 ─────────────────────────────────────────────────────
    r.mark("공지 목록")
    r.nav("#gnbMenu a:has-text('정보광장')")
    r.note("공지 71건 · 학사일정 33건 · 안내 문서 20건", 2.6, 0.5)
    r.scroll(330)
    r.beat(0.8)

    # ── 3. 공지 상세 ─────────────────────────────────────────────────────
    r.mark("공지 상세")
    r.nav("#tbody tr", nth=2)
    r.note("데이터는 MySQL 에 있고, 화면은 API 로 받아옵니다", 2.6, 0.4)
    r.scroll(360)
    r.beat(1.0)
    r.back()
    r.scroll(-400)                    # 목록 맨 위로 돌아옵니다

    # ── 4~8. ★ 챗봇 ─────────────────────────────────────────────────────
    #
    # 질문 순서는 '건수가 매번 눈에 띄게 달라지도록' 골랐습니다.
    # 71 → 2 → 6 → 2 → 13 → 13. 마지막 13 이 그대로인 것이 ⑤ 의 요점입니다.
    r.mark("챗봇 열기")
    r.to_top()
    base = r.total()
    r.click(".fab", after=1.0)

    def turn(label, question, why, wait=3.0, hold=3.0):
        """질문 하나를 던지고, 목록이 바뀌는 것을 보여줍니다."""
        r.mark(label)
        r.to_top()                    # 총 N건과 탭이 보이는 상태에서 물어봅니다
        before = r.total()
        r.ask(question, wait=wait)
        after = r.total()
        r.cap(why.format(n=after))
        r.beat(hold)
        r.clear()
        print(f"    {label}: {before}건 → {after}건")
        return after

    # ① 조건이 두 개 겹친 질문 — 유일하게 추천 칩으로 (칩은 첫 질문에 사라집니다)
    turn("① 이번 주 마감 + 장학",
         "이번 주 마감인 장학금 알려줘",
         "답변만 하는 게 아니라 화면을 대신 조작합니다\n총 " + base + "건  →  총 {n}건",
         wait=3.2, hold=3.4)

    # ② 하위 분류까지 — 여기서부터는 직접 타이핑합니다
    turn("② 근로 (하위 분류)",
         "근로장학금 공고 있어?",
         "'근로' 라고 하면 하위 분류까지 좁힙니다  →  총 {n}건",
         hold=2.8)

    # ③ 카테고리에 없는 말 — 본문까지 뒤지는 키워드 검색
    turn("③ 기숙사 (키워드)",
         "기숙사 얘기 있어?",
         "'기숙사' 는 카테고리에 없는 말입니다\n키워드로 찾습니다  →  총 {n}건",
         hold=2.8)

    # ④ 학생이 쓰는 말과 카테고리 이름이 다른 경우 ('취업' 은 '채용' 입니다)
    turn("④ 취업 (다른 이름)",
         "취업 관련 공지 보여줘",
         "'취업' 은 카테고리 이름이 아니지만 채용 공지를 찾습니다  →  총 {n}건",
         hold=2.8)

    # ⑤ 범위 밖 질문 — 목록이 '안 바뀌는' 것이 요점입니다
    r.mark("⑤ 범위 밖")
    r.to_top()
    keep = r.total()
    r.ask("오늘 점심 뭐 먹지?", wait=3.2)
    after = r.total()
    r.cap(f"학교와 무관한 질문에는 화면을 건드리지 않습니다  —  총 {after}건 그대로")
    r.beat(3.4)
    r.clear()
    r.note("AI 가 부르는 함수의 인자가 곧 화면 조작 명령입니다\n"
           "답변 문장을 파싱하지 않습니다", 4.6, 0.4)
    print(f"    ⑤ 점심: {keep}건 → {after}건 "
          f"({'그대로 — 정상' if keep == after else '★ 바뀌었습니다, 확인 필요'})")

    # ── 9. 근거 카드 → 실제 공지 ────────────────────────────────────────
    #
    # 대화를 맨 위까지 올려 ① 의 답변에 붙은 근거를 씁니다. 로그를 끝까지
    # 올려 두면 첫 카드 위치가 일정해서, 엉뚱한 데를 누를 일이 없습니다.
    r.mark("근거 카드")
    r.scroll(-2600, over="#chatLog")
    r.beat(0.7)
    if page.locator(".src-card").count():
        r.note("답변 아래에 근거가 붙습니다", 2.2, 0.4)
        if r.nav(".src-card"):
            r.note("누르면 실제 공지로 갑니다\n지어낸 말이 아닌지 바로 확인됩니다",
                   3.6, 1.4)
            r.scroll(280)
            r.beat(0.8)
            r.back()

    # ── 10. 학사일정 ────────────────────────────────────────────────────
    r.mark("학사일정")
    page.evaluate("() => document.body.classList.remove('chat-open')")
    r.beat(0.3)
    r.nav(".logo")
    r.scroll(520)                     # 타일이 있는 데까지 내려갑니다
    r.beat(0.4)
    if r.click(".tile.t-cyan", after=1.2):
        r.note("학사일정은 달력으로 봅니다", 2.6, 0.8)
        if page.locator("button[data-next]").count():
            r.click("button[data-next]", after=1.4)
        r.beat(0.8)
        for sel in ("[data-close]", ".modal .close", ".modal-back"):
            if page.locator(sel).count():
                r.click(sel, after=0.6)
                break
        else:
            page.keyboard.press("Escape")
            r.beat(0.6)

    # ── 11. 통합 검색 ───────────────────────────────────────────────────
    r.mark("검색")
    r.scroll(-560)
    r.nav(".gnb-search")
    if page.locator("#q").count():
        r.type("#q", "장학")
        page.wait_for_timeout(2000)
        r.scroll(300)
        r.beat(0.8)
    r.note("검색은 공지와 안내 문서를 함께 찾습니다", 3.0, 1.0)

    # ── 12. 관리자 모드 — 수정과 삭제 ───────────────────────────────────
    #
    # ★ 반드시 맨 뒤입니다. 삭제가 데이터를 실제로 지우기 때문에, 앞 장면의
    #   건수(71건)에 영향을 주면 안 됩니다.
    r.mark("관리자 켜기")
    r.to_top()                        # 토글은 상단 유틸바에 있습니다
    r.beat(0.4)
    r.click("#adminToggle", after=1.2)
    # 눌렸는지 확인합니다. 안 켜졌는데 계속 가면 '수정·삭제'가 통째로 빠집니다.
    on = page.evaluate("() => sessionStorage.getItem('admin') === '1'")
    print(f"    관리자 모드: {'켜짐' if on else '★ 안 켜짐'}")
    if on:
        r.note("오른쪽 위 토글을 켜면 관리자 모드가 됩니다", 3.0, 1.4)
        r.beat(0.8)

        r.mark("공지 수정")
        r.nav("#gnbMenu a:has-text('정보광장')")
        before = r.total()
        r.nav("#tbody tr", nth=1)
        r.beat(0.5)
        if r.nav('a.admin-only[href^="notice-form.html"]',
                 wait_url="**/notice-form.html*"):   # 수정 → 작성 화면
            r.note("공지를 고칠 수 있습니다", 2.4, 0.6)
            r.click("#title", after=0.0)
            page.keyboard.press("End")   # 제목 끝으로 가서 덧붙입니다
            r.beat(0.4)
            for ch in " (수정됨)":
                page.keyboard.type(ch)
                time.sleep(rnd(0.06, 0.17) * SPEED)
            r.beat(0.9)
            # 저장은 API 응답을 받은 뒤에 상세로 넘어갑니다 (notice-form.js:64)
            r.nav("#submitBtn", wait_url="**/notice.html*")
            r.note("고친 제목이 그대로 반영됩니다", 3.0, 2.2)

            r.mark("공지 삭제")
            if r.click("button.btn-danger.admin-only", after=1.2):
                r.note("삭제는 확인을 한 번 더 받습니다", 2.6, 1.6)
                # 삭제도 API 응답 뒤에 목록으로 넘어갑니다 (notice.js:101)
                if r.nav("[data-yes]", wait_url="**/notices.html*"):
                    after_n = r.total()
                    r.cap(f"삭제되어 총 {before}건 → 총 {after_n}건")
                    r.beat(3.2)
                    r.clear()
                    print(f"    삭제: {before}건 → {after_n}건")

        r.mark("관리자 끄기")
        r.to_top()
        r.click("#adminToggle", after=1.4)
        r.beat(0.8)

    if CAPTIONS:
        # 자막판에만 남기는 마무리. 무자막판에서는 정지 화면이라 뺍니다.
        r.mark("마무리(자막판)")
        r.nav(".logo")
        r.note("정적 파일과 API 를 nginx 한 대에서 서빙합니다\n"
               "그래서 링크가 하나입니다", 4.0)
        r.note("2단으로 막아 뒀습니다\n"
               "OpenAI 가 죽으면 규칙 엔진이, API 가 죽으면 목업이 답합니다", 5.0)
        r.note("공지를 찾는 데 걸리던 시간을,\n한 번 물어보는 것으로 줄였습니다", 4.4)

    r.beat(1.0)
    r.mark("끝")


def main():
    os.makedirs(OUT, exist_ok=True)
    started = time.time()
    print(f"자막 {'있음' if CAPTIONS else '없음'} · SPEED={SPEED} · {BASE}")
    with sync_playwright() as p:
        browser = p.chromium.launch(args=["--force-device-scale-factor=1"])
        ctx = browser.new_context(
            viewport={"width": W, "height": H},
            record_video_dir=OUT,
            record_video_size={"width": W, "height": H},
            locale="ko-KR",
            timezone_id="Asia/Seoul",
        )
        ctx.add_init_script(OVERLAY)
        page = ctx.new_page()
        try:
            record(page)
        finally:
            video = page.video
            ctx.close()          # ← 닫아야 영상이 기록됩니다
            browser.close()
            if video:
                src = video.path()
                dst = os.path.join(OUT, "demo.webm")
                if os.path.abspath(src) != os.path.abspath(dst):
                    os.replace(src, dst)
                print(f"webm  {dst}  ({os.path.getsize(dst)/1e6:.1f} MB)")
                to_mp4(dst)
    print(f"녹화 시간 {time.time()-started:.0f}초")


def to_mp4(webm):
    """mp4 로 변환합니다. 제출 포털이 webm 을 안 받는 경우가 많습니다."""
    # Playwright 번들 ffmpeg 은 libx264 가 빠진 축소판이라 인코딩이 안 됩니다.
    # 시스템 ffmpeg 을 먼저 찾습니다 (sudo apt-get install -y ffmpeg).
    from shutil import which
    ff = os.environ.get("FFMPEG") or which("ffmpeg")
    if not ff:
        print("ffmpeg 이 없어 mp4 변환을 건너뜁니다 (webm 은 그대로 씁니다)")
        return
    mp4 = webm.replace(".webm", ".mp4")
    cmd = [ff, "-y", "-i", webm, "-c:v", "libx264", "-preset", "medium",
           "-crf", "23", "-pix_fmt", "yuv420p", "-movflags", "+faststart", mp4]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode == 0 and os.path.exists(mp4):
        print(f"mp4   {mp4}  ({os.path.getsize(mp4)/1e6:.1f} MB)")
    else:
        print("mp4 변환 실패:", r.stderr[-400:])


if __name__ == "__main__":
    main()
