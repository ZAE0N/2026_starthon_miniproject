#!/usr/bin/env python3
"""시연 영상을 자동으로 녹화합니다.  대본: docs/demo-script.md

    python3 docs/record_demo.py http://127.0.0.1:8120 out/

브라우저를 실제로 조작하며 화면을 녹화합니다. 결과는 webm 이고,
ffmpeg 이 있으면 mp4 로도 변환합니다.

알아둘 점
  · 무음입니다. 대본의 '말할 것'을 화면 자막으로 굽습니다.
  · 녹화 대상은 페이지 뷰포트뿐이라 주소창·브라우저 크롬은 안 잡힙니다.
    "링크 붙여넣기" 장면은 직접 찍어 앞에 붙이세요.
  · 건수는 실행 시점에 화면에서 읽어 자막에 넣습니다. 오늘 날짜에 따라
    '이번 주 마감' 결과가 달라지므로 숫자를 박아 두면 안 됩니다.
"""
import os
import re
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8120").rstrip("/")
OUT = os.path.abspath(sys.argv[2] if len(sys.argv) > 2 else "out")
W, H = 1280, 720
# 자막을 읽을 수 있는 선에서 전체 길이를 줄이는 손잡이입니다.
# 3분을 넘기면 이 값을 낮춥니다.
SPEED = float(os.environ.get("SPEED", "1.0"))

# 화면에 굽는 자막과 클릭 표시.
# ★ Playwright 녹화에는 마우스 커서가 안 찍힙니다. 그냥 두면 화면이 저절로
#   바뀌는 것처럼 보여서, 클릭 직전에 대상에 외곽선을 씌워 보이게 합니다.
OVERLAY = r"""
(() => {
  const css = `
    :root { --font: "Noto Sans CJK KR","Noto Sans KR","Pretendard",sans-serif !important; }
    #__cap {
      position: fixed; left: 50%; bottom: 28px; transform: translateX(-50%);
      max-width: 82%; z-index: 2147483647; pointer-events: none;
      background: rgba(12,14,18,.88); color: #fff;
      font: 600 21px/1.5 "Noto Sans CJK KR","Noto Sans KR",sans-serif;
      padding: 13px 24px; border-radius: 12px; text-align: center;
      box-shadow: 0 8px 28px rgba(0,0,0,.45);
      opacity: 0; transition: opacity .25s; white-space: pre-line;
    }
    #__cap.on { opacity: 1; }
    .__hl {
      outline: 3px solid #06b6d4 !important; outline-offset: 3px;
      box-shadow: 0 0 0 6px rgba(6,182,212,.28) !important;
      border-radius: 6px;
    }`;
  const add = () => {
    if (document.getElementById('__capstyle')) return;
    const s = document.createElement('style');
    s.id = '__capstyle'; s.textContent = css;
    document.head.appendChild(s);
    const d = document.createElement('div');
    d.id = '__cap';
    document.body.appendChild(d);
  };
  if (document.body) add();
  else document.addEventListener('DOMContentLoaded', add);
  window.__cap = (t) => {
    const d = document.getElementById('__cap');
    if (!d) return;
    if (t) { d.textContent = t; d.classList.add('on'); }
    else { d.classList.remove('on'); }
  };
})();
"""


class Rec:
    def __init__(self, page):
        self.page = page
        self.t0 = time.time()
        self.mark_t = self.t0

    def mark(self, label):
        now = time.time()
        print(f"  [{now-self.t0:6.1f}s] (+{now-self.mark_t:5.1f}) {label}", flush=True)
        self.mark_t = now

    def cap(self, text, hold=0.0):
        """자막을 띄웁니다. hold 초 뒤에 지우려면 clear() 를 부르세요."""
        self.page.evaluate("t => window.__cap && window.__cap(t)", text)
        if hold:
            time.sleep(hold * SPEED)

    def clear(self):
        self.page.evaluate("() => window.__cap && window.__cap('')")

    def say(self, text, hold=3.0):
        self.cap(text)
        time.sleep(hold * SPEED)
        self.clear()
        time.sleep(0.25)

    def beat(self, sec):
        time.sleep(sec * SPEED)

    def goto(self, path):
        self.page.goto(BASE + path, wait_until="domcontentloaded")
        # 목록이 실제로 그려질 때까지만 기다립니다 (빈 스켈레톤 화면 방지)
        try:
            self.page.wait_for_function(
                "() => { const t = document.querySelector('#total');"
                "return !t || /[1-9]/.test(t.textContent); }", timeout=6000)
        except Exception:
            pass
        self.page.wait_for_timeout(500)

    def click(self, selector, pre=0.9, post=0.6):
        """클릭 전에 대상을 강조해서, 무엇을 눌렀는지 보이게 합니다."""
        el = self.page.locator(selector).first
        el.scroll_into_view_if_needed(timeout=8000)
        el.evaluate("e => e.classList.add('__hl')")
        time.sleep(pre * SPEED)
        el.click()
        # ★ 강조를 지울 때 el.evaluate 를 쓰면 안 됩니다.
        #   추천 질문 칩은 누르는 순간 페이지가 지워 버리고(js/common.js:271),
        #   목록 행·근거 카드는 눌리면 다른 페이지로 갑니다. 그러면 그 요소를
        #   다시 찾느라 기본 타임아웃 30초를 꼬박 기다립니다. 클릭 네 번이면 2분입니다.
        #   문서 전체에서 지우면 대상이 사라졌든 이동했든 즉시 끝납니다.
        self.page.evaluate(
            "() => document.querySelectorAll('.__hl')"
            ".forEach(e => e.classList.remove('__hl'))")
        time.sleep(post * SPEED)

    def total(self):
        """공지 목록의 '총 N건' 에서 숫자만 뽑습니다."""
        try:
            t = self.page.locator("#total").first.inner_text(timeout=2000)
            m = re.search(r"\d+", t)
            return m.group(0) if m else "?"
        except Exception:
            return "?"

    def open_chat(self):
        if not self.page.locator("body.chat-open").count():
            self.click(".fab", pre=0.7, post=1.0)

    def ask(self, text, wait=3.2):
        """질문을 던집니다.

        추천 질문 칩은 한 번 물어보면 사라집니다 (js/common.js:271).
        그래서 칩이 남아 있으면 누르고, 없으면 직접 타이핑합니다.
        타이핑 장면은 자유 입력도 된다는 걸 보여 주므로 오히려 좋습니다.
        """
        chip = self.page.locator(f".suggests button:has-text('{text}')")
        if chip.count():
            self.click(f".suggests button:has-text('{text}')", pre=1.0, post=0.4)
        else:
            self.page.fill("#chatInput", text)
            time.sleep(0.9 * SPEED)
            self.page.press("#chatInput", "Enter")
        self.page.wait_for_timeout(int(wait * 1000 * SPEED))


def record(page):
    r = Rec(page)

    r.mark("티저")
    # ── 0:00 티저 — 해설 없이 목록이 바뀌는 장면만 ──────────────────────
    r.goto("/notices.html")
    before = r.total()
    r.cap("말로 물어보면, 화면이 바뀝니다")
    r.beat(1.6)
    r.open_chat()
    r.ask("이번 주 마감인 장학금", wait=3.4)
    after = r.total()
    r.cap(f"총 {before}건  →  총 {after}건")
    r.beat(3.4)
    r.clear()
    r.beat(0.5)

    r.mark("링크/홈")
    # ── 0:10 링크 하나로 실행 ────────────────────────────────────────────
    page.evaluate("() => document.body.classList.remove('chat-open')")
    r.goto("/index.html")
    r.say("인하공업전문대학 홈페이지에 AI 공지 도우미를 붙였습니다\n링크 하나면 됩니다 — 설치도 로그인도 없습니다", 4.0)

    r.mark("기본 흐름")
    # ── 0:25 기본 흐름 — 홈 → 목록 → 상세 ────────────────────────────────
    r.cap("공지 71건 · 학사일정 33건 · 안내 문서 20건")
    r.beat(2.6)
    r.clear()
    r.goto("/notices.html")
    r.cap("데이터는 MySQL 에 있고, 화면은 API 로 받아옵니다")
    r.beat(2.4)
    r.clear()
    # 목록의 행은 <a> 가 아니라 <tr onclick=...> 입니다 (js/notices.js:110)
    r.click("#tbody tr", pre=1.0, post=0.6)
    page.wait_for_load_state("networkidle")
    r.say("공지 하나를 열면 상세가 보입니다", 3.0)

    r.mark("챗봇 시작")
    # ── 0:45 ★ 챗봇 (가장 중요) ──────────────────────────────────────────
    r.goto("/notices.html")
    base_total = r.total()
    r.open_chat()

    # ① 여러 조건이 겹친 질문
    r.cap("'이번 주' 와 '장학금' — 조건이 두 개 겹쳤습니다")
    r.beat(2.4)
    r.clear()
    r.ask("이번 주 마감인 장학금", wait=3.4)
    n1 = r.total()
    r.cap(f"답변만 하는 게 아니라 화면을 대신 조작합니다\n총 {base_total}건  →  총 {n1}건")
    r.beat(4.2)
    r.clear()
    r.cap("카테고리 탭이 '장학' 으로 옮겨지고\n마감 조건이 칩으로 붙었습니다")
    r.beat(3.6)
    r.clear()

    r.mark("챗봇 ① 끝")
    # ② 근거 확인
    r.cap("답변 아래에 근거가 붙습니다")
    r.beat(2.2)
    r.clear()
    if page.locator(".src-card").count():
        r.click(".src-card", pre=1.2, post=0.8)
        page.wait_for_load_state("networkidle")
        r.say("누르면 실제 공지로 갑니다.\n지어낸 말이 아닌지 바로 확인됩니다", 3.8)
        r.goto("/notices.html")
        r.open_chat()

    r.mark("챗봇 ② 끝")
    # ③ 다른 방식의 질문 두 개
    r.ask("근로장학금 공고", wait=3.2)
    r.cap(f"'근로' 라고 하면 하위 분류까지 좁힙니다  →  총 {r.total()}건")
    r.beat(3.6)
    r.clear()

    r.ask("기숙사 얘기", wait=3.2)
    r.cap(f"'기숙사' 는 카테고리에 없는 말입니다\n키워드로 찾습니다  →  총 {r.total()}건")
    r.beat(4.0)
    r.clear()

    r.mark("챗봇 ③ 끝")
    # ④ 범위 밖 질문 — 목록이 안 바뀌는 것이 포인트
    r.cap("학교와 무관한 질문을 해 봅니다")
    r.beat(2.2)
    r.clear()
    r.ask("오늘 점심 뭐 먹지?", wait=3.4)
    r.cap(f"답만 하고 화면은 건드리지 않습니다  —  총 {r.total()}건 그대로")
    r.beat(4.0)
    r.clear()

    r.say("이게 가능한 이유는, AI 가 부르는 함수의 인자가\n곧 화면 조작 명령이기 때문입니다\n답변 문장을 파싱하지 않습니다", 5.2)

    r.mark("챗봇 전체 끝")
    # ── 2:15 나머지 화면 ─────────────────────────────────────────────────
    page.evaluate("() => document.body.classList.remove('chat-open')")
    r.goto("/calendar.html")
    r.cap("학사일정은 달력으로 봅니다")
    r.beat(2.8)
    r.clear()

    r.goto("/search.html")
    if page.locator("#q").count():
        page.fill("#q", "장학")
        r.beat(0.8)
        page.keyboard.press("Enter")
        page.wait_for_timeout(2200)
    r.say("검색은 공지와 안내 문서를 함께 찾습니다", 3.2)

    r.mark("달력/검색 끝")
    # ── 2:35 구조와 안전장치 ─────────────────────────────────────────────
    r.goto("/index.html")
    r.say("정적 파일과 API 를 nginx 한 대에서 서빙합니다\n그래서 링크가 하나입니다", 4.0)
    r.say("2단으로 막아 뒀습니다\nOpenAI 가 죽으면 규칙 엔진이, API 가 죽으면 목업이 답합니다\n시연 도중 외부 서비스가 멈춰도 챗봇이 멈추지 않습니다", 5.4)
    r.say("공지를 찾는 데 걸리던 시간을,\n한 번 물어보는 것으로 줄였습니다", 4.4)
    r.beat(1.0)
    r.mark("끝")


def main():
    os.makedirs(OUT, exist_ok=True)
    started = time.time()
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
    """번들 ffmpeg 으로 mp4 변환. 제출 포털이 webm 을 안 받는 경우가 많습니다."""
    # Playwright 번들 ffmpeg 은 libx264 가 빠진 축소판이라 인코딩이 안 됩니다.
    # 시스템 ffmpeg 을 먼저 찾습니다 (apt-get install ffmpeg).
    from shutil import which
    ff = os.environ.get("FFMPEG") or which("ffmpeg")
    if not ff:
        print("ffmpeg 이 없어 mp4 변환을 건너뜁니다 (webm 은 그대로 씁니다)")
        print("  설치: sudo apt-get install -y ffmpeg")
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
