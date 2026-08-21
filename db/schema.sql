-- 인하공전 미니프로젝트 · 테이블 정의
--
-- 팀원이 만든 구조를 그대로 두고 설계서 요구사항만 채웠습니다.
--   · utf8mb4 명시        덤프에 선언이 없어 서버 기본값에 의존하던 것을 고정
--   · CHECK 제약          학사 공지에 '근로' 가 붙는 사고를 DB 가 막습니다
--   · chat_cache          설계서의 네 번째 테이블
--   · 인덱스              화면별 쿼리(카테고리·마감일·고정·최신순)에 맞춰 추가
--
-- 실행:  sudo mysql --default-character-set=utf8mb4 < schema.sql
-- 주의:  기존 테이블을 지웁니다. 먼저 ./deploy/04-backup.sh 로 백업하세요.

CREATE DATABASE IF NOT EXISTS mini_project
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE mini_project;

SET NAMES utf8mb4;

DROP TABLE IF EXISTS chat_cache;
DROP TABLE IF EXISTS pages;
DROP TABLE IF EXISTS academic_events;
DROP TABLE IF EXISTS notices;


-- ── 공지사항 ────────────────────────────────────────────────────────────
CREATE TABLE notices (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category     ENUM('학사','행사','장학','채용','일반') NOT NULL,
  sub_category VARCHAR(20)  DEFAULT NULL,
  title        VARCHAR(200) NOT NULL,
  content      TEXT         NOT NULL,
  author       VARCHAR(30)  NOT NULL,
  department   VARCHAR(30)  DEFAULT NULL,
  due_date     DATE         DEFAULT NULL,
  is_pinned    TINYINT      NOT NULL DEFAULT 0,
  views        INT UNSIGNED NOT NULL DEFAULT 0,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
                            ON UPDATE CURRENT_TIMESTAMP,

  -- 하위 분류는 장학 공지에만 붙습니다 (MySQL 8.0.16 이상에서만 동작)
  CONSTRAINT chk_notices_sub_category
    CHECK (sub_category IS NULL OR category = '장학'),

  KEY idx_notices_category   (category),
  KEY idx_notices_due_date   (due_date),
  KEY idx_notices_created_at (created_at),
  KEY idx_notices_list       (is_pinned, created_at)   -- 목록 기본 정렬
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ── 학사일정 ────────────────────────────────────────────────────────────
CREATE TABLE academic_events (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title        VARCHAR(100) NOT NULL,
  start_date   DATE         NOT NULL,
  end_date     DATE         NOT NULL,
  is_important TINYINT      NOT NULL DEFAULT 0,

  KEY idx_events_start (start_date)                    -- 달력 월별 조회
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ── 학교 안내 문서 ──────────────────────────────────────────────────────
CREATE TABLE pages (
  slug       VARCHAR(50)  PRIMARY KEY,
  menu       VARCHAR(20)  NOT NULL,
  title      VARCHAR(100) NOT NULL,
  body       TEXT         NOT NULL,
  sort_order SMALLINT     NOT NULL,

  KEY idx_pages_menu (menu, sort_order)                -- 메뉴별 사이드 목차
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ── 챗봇 응답 캐시 (선택) ───────────────────────────────────────────────
-- 같은 질문이 반복될 때 OpenAI 호출을 아낍니다.
CREATE TABLE chat_cache (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  question_hash CHAR(64)     NOT NULL,                 -- SHA-256 hex
  question      VARCHAR(500) NOT NULL,
  response      JSON         NOT NULL,                 -- { answer, action, sources }
  hit_count     INT UNSIGNED NOT NULL DEFAULT 0,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY uq_chat_cache_hash (question_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
