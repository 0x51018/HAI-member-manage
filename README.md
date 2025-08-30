# HAI Member Management Service

## Development Status

- pnpm/Turborepo 기반 모노레포 구성 (apps/api, apps/web, packages/db 등)
- Prisma 스키마 및 시드 스크립트: 관리자 계정, 2025-S1 학기(8회 MeetingDay), 샘플 분반 생성
- JWT 기반 인증 라우트(`/auth/login`, `/auth/refresh`, `/auth/logout`)와 장치별 Session 관리
- 회원 API(`/members`): 목록 조회, 상세, 메모 조회/작성
- Import v1(`/import/spreadsheet/v1`): 스프레드시트 행을 파싱해 Member/MemberTerm/Section 업서트
- 학기·분반·팀 API: 학기 목록/생성, MeetingDay 일괄 등록, 분반 생성·조회, 팀 생성 및 리더 지정
- Next.js 15 웹 앱: 로그인 폼과 회원 목록/상세 페이지를 React Query·React Hook Form·Zod와 연동 (React 19 RC 기반)

## User Guide

1. 개발 환경 준비
   - `docker compose -f infra/docker-compose.dev.yml up -d`로 MySQL·API·웹 컨테이너 실행
   - `pnpm --filter @apps/api db:seed`로 기본 관리자와 학기/분반 데이터 시드
2. 로그인
   - `POST /auth/login`에 이메일/비밀번호 및 선택적 `deviceLabel`을 보내 access 토큰과 refresh 쿠키 획득
3. 회원 관리
   - `GET /members`로 검색·필터링된 회원 목록 조회
   - `GET /members/:studentId`로 상세 정보 및 최근 메모 확인
   - `POST /members/:studentId/memos`로 메모 작성
4. 학기·분반·팀 관리
   - `POST /terms`로 학기 생성, `POST /terms/:termId/meetings/bulk`로 고정 출석일 등록
   - `POST /terms/:termId/sections`로 분반 생성, `GET /terms/:termId/sections?with=teams`로 팀 포함 조회
   - `POST /sections/:sectionId/teams`로 팀 생성, `PATCH /teams/:teamId/leader`로 팀장 지정
5. 스프레드시트 Import
   - `POST /import/spreadsheet/v1`에 `{ rows: [...] }` 형식의 데이터를 전송하면 회원·분반·학기 정보가 일괄 업데이트됩니다.

추가 기능과 UI는 향후 업데이트될 예정입니다.
