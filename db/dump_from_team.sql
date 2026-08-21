CREATE DATABASE mini_project;
USE mini_project;

CREATE TABLE notices(
	id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    category ENUM('학사', '행사', '장학','채용', '일반') NOT NULL,
    sub_category VARCHAR(20),
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    author VARCHAR(30) NOT NULL,
    department VARCHAR(30),
    due_date DATE,
    is_pinned TINYINT NOT NULL DEFAULT 0,
    views INT UNSIGNED NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL
			  DEFAULT CURRENT_TIMESTAMP
              ON UPDATE CURRENT_TIMESTAMP);
    
CREATE TABLE academic_events(
	id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_important TINYINT NOT NULL DEFAULT 0);
    
CREATE TABLE pages(
slug VARCHAR(50) PRIMARY KEY,
menu VARCHAR(20) NOT NULL,
title VARCHAR(100) NOT NULL,
body TEXT NOT NULL,
sort_order SMALLINT NOT NULL );

USE mini_project;

-- ========================================
-- 1. 공지사항(notices) 더미 데이터
-- ========================================

INSERT INTO notices
(category, sub_category, title, content, author, department, due_date, is_pinned, views)
VALUES
('학사', '수업',
 '2026학년도 2학기 개강 안내',
 '2026학년도 2학기 개강 일정을 안내합니다. 자세한 내용은 학사일정을 확인해 주세요.',
 '관리자', '교무처', NULL, 1, 152),

('장학', '국가장학',
 '2026학년도 2학기 국가장학금 신청 안내',
 '2026학년도 2학기 국가장학금 신청 기간을 안내합니다. 기간 내에 신청해 주세요.',
 '관리자', '학생지원팀', '2026-09-10', 1, 98),

('행사', '교내행사',
 '2026 교내 소프트웨어 경진대회 참가자 모집',
 '소프트웨어 경진대회 참가자를 모집합니다. 재학생 여러분의 많은 참여 바랍니다.',
 '관리자', '컴퓨터정보공학과', '2026-09-20', 0, 73),

('채용', '인턴',
 '2026 하반기 IT기업 인턴 채용 안내',
 'IT 관련 기업의 하반기 인턴 채용 정보를 안내합니다.',
 '취업담당자', '취업지원센터', '2026-09-30', 0, 45),

('일반', NULL,
 '학교 홈페이지 이용 안내',
 '학교 홈페이지 이용 방법 및 주요 기능을 안내합니다.',
 '관리자', NULL, NULL, 0, 21);


-- ========================================
-- 2. 학사일정(academic_events) 더미 데이터
-- ========================================

INSERT INTO academic_events
(title, start_date, end_date, is_important)
VALUES
('2026학년도 2학기 개강',
 '2026-09-01', '2026-09-01', 1),

('수강신청 정정 기간',
 '2026-09-01', '2026-09-07', 1),

('2학기 중간고사',
 '2026-10-19', '2026-10-23', 1),

('개교기념일',
 '2026-10-31', '2026-10-31', 0),

('2학기 기말고사',
 '2026-12-14', '2026-12-18', 1);


-- ========================================
-- 3. 학교 안내 페이지(pages) 더미 데이터
-- ========================================

INSERT INTO pages
(slug, menu, title, body, sort_order)
VALUES
('greeting',
 '대학안내',
 '인사말',
 '우리 대학 홈페이지를 방문해 주셔서 감사합니다.',
 1),

('history',
 '대학안내',
 '대학 연혁',
 '우리 대학의 주요 연혁을 소개합니다.',
 2),

('vision',
 '대학안내',
 '교육목표 및 비전',
 '미래 사회를 선도하는 전문 인재 양성을 목표로 합니다.',
 3),

('department',
 '학과안내',
 '학과 소개',
 '각 학과의 교육과정과 주요 정보를 안내합니다.',
 1),

('location',
 '대학안내',
 '오시는 길',
 '학교 위치와 대중교통 이용 방법을 안내합니다.',
 4);
 