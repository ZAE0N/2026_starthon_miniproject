#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""js/data.js 에서 db/seed.sql 을 생성합니다.

프론트엔드의 목업 데이터가 곧 DB 시드입니다. 한 곳만 고치면 양쪽이 같이 갱신되도록
data.js 를 단일 출처로 삼습니다.

사용법:
    python3 db/tools/gen_seed.py          # 저장소 루트에서 실행
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, 'js', 'data.js')
OUT = os.path.join(ROOT, 'db', 'seed.sql')

# 프론트 camelCase → DB snake_case
COLUMNS = {
    'notices': [
        ('id', 'id'), ('category', 'category'), ('subCategory', 'sub_category'),
        ('title', 'title'), ('content', 'content'), ('author', 'author'),
        ('department', 'department'), ('dueDate', 'due_date'),
        ('isPinned', 'is_pinned'), ('views', 'views'), ('createdAt', 'created_at'),
    ],
    'academic_events': [
        ('id', 'id'), ('title', 'title'), ('startDate', 'start_date'),
        ('endDate', 'end_date'), ('isImportant', 'is_important'),
    ],
    'pages': [
        ('slug', 'slug'), ('menu', 'menu'), ('title', 'title'),
        ('body', 'body'), ('sortOrder', 'sort_order'),
    ],
}


def read_array(src, name):
    """data.js 안의 window.<name> = [ ... ]; 를 파싱합니다."""
    start = src.index('window.%s = [' % name) + len('window.%s = ' % name)
    end = src.index('\n];', start) + 2
    return json.loads(src[start:end])


def sql_value(v, column):
    if v is None:
        return 'NULL'
    if isinstance(v, bool):
        return '1' if v else '0'
    if isinstance(v, (int, float)):
        return str(v)
    # 문자열 — MySQL 문자열 리터럴로 이스케이프
    out = (str(v)
           .replace('\\', '\\\\')
           .replace("'", "\\'")
           .replace('"', '\\"')
           .replace('\n', '\\n')
           .replace('\r', '\\r')
           .replace('\x00', '\\0')
           .replace('\x1a', '\\Z'))
    if column == 'created_at':          # DATE → DATETIME
        out = out + ' 00:00:00'
    return "'" + out + "'"


def build(table, rows):
    cols = COLUMNS[table]
    head = '(' + ', '.join(db for _, db in cols) + ')'
    lines = ['DELETE FROM %s;' % table,
             'INSERT INTO %s\n%s\nVALUES' % (table, head)]
    values = []
    for r in rows:
        vals = [sql_value(r.get(js), db) for js, db in cols]
        values.append('  (' + ', '.join(vals) + ')')
    lines.append(',\n'.join(values) + ';')
    return '\n'.join(lines)


def main():
    if not os.path.exists(SRC):
        sys.exit('js/data.js 를 찾을 수 없습니다: %s' % SRC)
    src = open(SRC, encoding='utf-8').read()

    notices = read_array(src, 'NOTICES')
    events = read_array(src, 'EVENTS')
    pages = read_array(src, 'PAGES')

    # 목록 정렬이 자연스럽도록 id 오름차순으로 넣습니다
    notices = sorted(notices, key=lambda x: x['id'])
    events = sorted(events, key=lambda x: x['id'])

    parts = [
        '-- 인하공전 미니프로젝트 · 시드 데이터',
        '--',
        '-- 이 파일은 js/data.js 에서 자동 생성됩니다. 직접 고치지 마세요.',
        '-- 데이터를 바꾸려면 js/data.js 를 고치고 아래를 다시 실행하세요.',
        '--',
        '--     python3 db/tools/gen_seed.py',
        '--',
        '-- 실행:  sudo mysql --default-character-set=utf8mb4 mini_project < seed.sql',
        '-- 주의:  기존 행을 지우고 다시 넣습니다 (재실행 가능).',
        '',
        'SET NAMES utf8mb4;',
        '',
        '-- 공지사항 %d건' % len(notices),
        build('notices', notices),
        '',
        '-- 학사일정 %d건' % len(events),
        build('academic_events', events),
        '',
        '-- 학교 안내 문서 %d건' % len(pages),
        build('pages', pages),
        '',
    ]
    open(OUT, 'w', encoding='utf-8').write('\n'.join(parts))
    print('생성 완료: %s' % os.path.relpath(OUT, ROOT))
    print('  공지 %d · 일정 %d · 문서 %d' % (len(notices), len(events), len(pages)))


if __name__ == '__main__':
    main()
