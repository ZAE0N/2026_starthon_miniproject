"""'오늘' 을 한 곳에서 정합니다.

서버는 UTC 로 도는데 이용자는 한국에 있습니다. `date.today()` 를 그대로 쓰면
한국 시각 00~09 시 사이에 서버 날짜가 하루 뒤처집니다. 그동안 챗봇은
'어제 마감' 공지를 아직 유효한 것으로 세고, 브라우저는 현지 날짜로 거르기
때문에 (`js/common.js:35` 의 TODAY) 답변의 건수와 화면의 '총 N건' 이 갈립니다.

그래서 서버도 한국 시각을 씁니다. KST 는 서머타임이 없어 고정 +9 로 충분하고,
tzdata 설치 여부에 영향을 받지 않습니다.
"""
from datetime import datetime, timedelta, timezone

KST = timezone(timedelta(hours=9))


def today():
    """한국 시각 기준 오늘 날짜."""
    return datetime.now(KST).date()
