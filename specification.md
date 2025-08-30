Codegen Brief — 동아리 부원 관리 서비스 v1.1 (for Codex)

이 문서의 목적: 아래 명세와 스택을 바탕으로 자동 코드 생성 에이전트(예: Codex)가 즉시 레포지토리를 생성하고, 프론트/백엔드/배포까지 동작 가능한 상태의 v0를 완성하도록 지시한다.
범위: 내부 운영진 전용(총 14명). 학번(studentId)=PK, 학기(Term) 중심 모델, 학기별 고정 출석일(8–9회), 이벤트 명단 내보내기(카톡 초대 보조).

⸻

0) 스택 & 리포 레이아웃
	•	모노레포: pnpm + Turborepo
	•	언어/런타임: TypeScript, Node.js 20 LTS
	•	Backend: Express + Prisma + MySQL 8
	•	Frontend: Next.js 15(App Router) + TanStack Query + React Hook Form + Zod
	•	인증: 이메일+비밀번호, JWT Access(30m) + Refresh(30d, httpOnly 쿠키, 장치별 Session)
	•	권한: ADMIN/STAFF + 분반 스코프(SectionManager)
	•	배포: Docker Compose(개발/운영) + (옵션) Cloudflare Tunnel

repo/
  apps/
    api/                 # Express API (TS)
    web/                 # Next.js 15 (App Router)
  packages/
    db/                  # Prisma schema, migrations, seed
    types/               # 공유 TS 타입 & Zod 스키마
    config/              # tsconfig/eslint/prettier 공통
  infra/
    docker-compose.dev.yml
    docker-compose.prod.yml
    .env.example.api
    .env.example.web
  turbo.json
  pnpm-workspace.yaml


⸻

1) 환경 변수(.env)

API (infra/.env.example.api)

DATABASE_URL="mysql://root:root@db:3306/club"
PORT=8000
NODE_ENV=development
JWT_ACCESS_SECRET=change_me_access
JWT_REFRESH_SECRET=change_me_refresh
CORS_ORIGIN=http://localhost:3000

WEB (infra/.env.example.web)

NEXT_PUBLIC_API_BASE_URL=http://localhost:8000


⸻

2) Docker Compose

개발(infra/docker-compose.dev.yml)

services:
  db:
    image: mysql:8.4
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: club
    ports: ["3306:3306"]
    volumes: ["mysql_data:/var/lib/mysql"]
  api:
    build: ../apps/api
    env_file: ../infra/.env.example.api
    depends_on: [db]
    ports: ["8000:8000"]
    volumes: ["../apps/api:/usr/src/app"]
  web:
    build: ../apps/web
    env_file: ../infra/.env.example.web
    depends_on: [api]
    ports: ["3000:3000"]
    volumes: ["../apps/web:/usr/src/app"]
volumes:
  mysql_data: {}

운영(infra/docker-compose.prod.yml)

services:
  db:
    image: mysql:8.4
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: club
    volumes: ["mysql_data:/var/lib/mysql"]
    restart: unless-stopped
  api:
    image: club-api:latest
    env_file: .env.api
    depends_on: [db]
    ports: ["8000:8000"]
    restart: unless-stopped
  web:
    image: club-web:latest
    env_file: .env.web
    depends_on: [api]
    ports: ["3000:3000"]
    restart: unless-stopped
volumes:
  mysql_data: {}


⸻

3) Turborepo & pnpm 워크스페이스

pnpm-workspace.yaml

packages:
  - apps/*
  - packages/*
  - infra

turbo.json

{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**", ".next/**"] },
    "dev":    { "cache": false, "persistent": true },
    "lint":   {},
    "test":   { "dependsOn": ["^build"] }
  }
}


⸻

4) 데이터 모델 (Prisma)

핵심 원칙: Member.studentId = PK, 모든 활동은 Term 종속, 출석은 MeetingDay(학기 고정 8–9일) 기준, 분반 스코프.

packages/db/prisma/schema.prisma

generator client { provider = "prisma-client-js" }
datasource db { provider = "mysql"; url = env("DATABASE_URL") }

enum Role { ADMIN STAFF }
enum UserStatus { ACTIVE SUSPENDED }
enum MemberStatus { ACTIVE INACTIVE ALUMNI }
enum TeamRole { LEADER MEMBER }
enum AttendanceStatus { PRESENT LATE ABSENT EXCUSED }
enum MemoSensitivity { NORMAL CAUTION PRIVATE }
enum Semester { S1 S2 }

model User {
  id           String     @id @default(cuid())
  email        String     @unique
  name         String?
  role         Role       @default(STAFF)
  status       UserStatus @default(ACTIVE)
  passwordHash String
  createdAt    DateTime   @default(now())
  sessions     Session[]
  auditLogs    AuditLog[] @relation("AuditActor")
}

model Session {
  id           String   @id @default(cuid())
  user         User     @relation(fields: [userId], references: [id])
  userId       String
  refreshHash  String
  deviceLabel  String?
  userAgent    String?
  ip           String?
  lastUsedAt   DateTime @default(now())
  expiresAt    DateTime
  @@index([userId])
}

model Member {
  studentId String       @id
  name      String
  phone     String?
  email     String?
  department String?
  honorary  Boolean      @default(false)
  note      String?
  status    MemberStatus @default(ACTIVE)
  joinedAt  DateTime?
  createdAt DateTime     @default(now())
  terms     MemberTerm[]
  memos     Memo[]
}

model Term {
  id        String   @id @default(cuid())
  year      Int
  semester  Semester
  sections  Section[]
  meetings  MeetingDay[]
  members   MemberTerm[]
  @@unique([year, semester])
}

model MeetingDay {
  id       String  @id @default(cuid())
  term     Term    @relation(fields: [termId], references: [id])
  termId   String
  ordinal  Int
  date     DateTime
  label    String?
  @@unique([termId, ordinal])
}

model Section {
  id        String   @id @default(cuid())
  term      Term     @relation(fields: [termId], references: [id])
  termId    String
  name      String
  teams     Team[]
  sessions  AttendanceSession[]
  managers  SectionManager[]
  @@unique([termId, name])
}

model Team {
  id         String  @id @default(cuid())
  section    Section @relation(fields: [sectionId], references: [id])
  sectionId  String
  teamNumber Int
  name       String?
  leader     MemberTerm? @relation("TeamLeader", fields: [leaderMemberTermId], references: [id])
  leaderMemberTermId String?
  members    MemberTerm[] @relation("TeamMembers")
  @@unique([sectionId, teamNumber])
}

model MemberTerm {
  id           String   @id @default(cuid())
  member       Member   @relation(fields: [memberStudentId], references: [studentId])
  memberStudentId String
  term         Term     @relation(fields: [termId], references: [id])
  termId       String
  section      Section? @relation(fields: [sectionId], references: [id])
  sectionId    String?
  team         Team?    @relation(fields: [teamId], references: [id])
  teamId       String?
  teamRole     TeamRole?
  isExecutive  Boolean  @default(false)
  onBreak      Boolean  @default(false)
  isNewJoiner  Boolean  @default(false)
  active       Boolean  @default(true)
  attendances  AttendanceRecord[]
  @@unique([memberStudentId, termId])
}

model AttendanceSession {
  id           String      @id @default(cuid())
  section      Section     @relation(fields: [sectionId], references: [id])
  sectionId    String
  meetingDay   MeetingDay  @relation(fields: [meetingDayId], references: [id])
  meetingDayId String
  createdBy    String
  createdAt    DateTime    @default(now())
  records      AttendanceRecord[]
  @@unique([sectionId, meetingDayId])
}

model AttendanceRecord {
  id           String            @id @default(cuid())
  session      AttendanceSession @relation(fields: [sessionId], references: [id])
  sessionId    String
  memberTerm   MemberTerm        @relation(fields: [memberTermId], references: [id])
  memberTermId String
  status       AttendanceStatus
  markedBy     String
  markedAt     DateTime          @default(now())
  @@unique([sessionId, memberTermId])
}

model Memo {
  id          String          @id @default(cuid())
  member      Member          @relation(fields: [memberStudentId], references: [studentId])
  memberStudentId String
  author      User            @relation(fields: [authorId], references: [id])
  authorId    String
  body        String
  sensitivity MemoSensitivity @default(NORMAL)
  term        Term?           @relation(fields: [termId], references: [id])
  termId      String?
  createdAt   DateTime        @default(now())
}

model SectionManager {
  id        String  @id @default(cuid())
  user      User    @relation(fields: [userId], references: [id])
  userId    String
  section   Section @relation(fields: [sectionId], references: [id])
  sectionId String
  @@unique([userId, sectionId])
}

model Event {
  id         String   @id @default(cuid())
  term       Term?    @relation(fields: [termId], references: [id])
  termId     String?
  title      String
  type       String?
  createdBy  String
  createdAt  DateTime @default(now())
  participants EventParticipant[]
}

model EventParticipant {
  id           String  @id @default(cuid())
  event        Event   @relation(fields: [eventId], references: [id])
  eventId      String
  memberTerm   MemberTerm @relation(fields: [memberTermId], references: [id])
  memberTermId String
  @@unique([eventId, memberTermId])
}

model AuditLog {
  id        String   @id @default(cuid())
  actor     User?    @relation("AuditActor", fields: [actorId], references: [id])
  actorId   String?
  action    String
  entityType String?
  entityId   String?
  diff      Json?
  ip        String?
  ua        String?
  at        DateTime @default(now())
}

Seed 스크립트 요구 (packages/db/seed.ts):
	•	ADMIN 1명 생성(이메일/비번 .env에서)
	•	2025-S1 Term + MeetingDay 1..8 생성 (날짜는 임시 오늘 기준 주간 간격)
	•	샘플 Section 1개 생성(예: “논문 리딩반”)

⸻

5) API 명세 (요약표 + 상세 스키마)

공통
	•	응답 에러 포맷: { message: string, code?: string, details?: any }
	•	인증: Authorization: Bearer <access> 헤더, Refresh는 httpOnly 쿠키(refresh)

Auth
	1.	POST /auth/login
	•	body: { email, password, deviceLabel? }
	•	200: { access: string } + Set-Cookie(refresh)
	2.	POST /auth/refresh → 200: { access } (+ refresh cookie rotation)
	3.	POST /auth/logout → 200: { ok: true }

Members
	•	GET /members ?q=&termId=&sectionId=&teamId= → 멤버 요약 배열
	•	GET /members/:studentId → 멤버 기본 + timeline: MemberTerm[] + 최근 메모
	•	POST /members/:studentId/memos { body, sensitivity?, termId? } → 201: Memo
	•	**GET /members/:studentId/memos` → Memo[]

Import v1
	•	POST /import/spreadsheet/v1
	•	body: { rows: Array<{ 이름, 명예회원?, 임원진?, 휴식회원?, 신입회원?, 전화번호?, 학번, 학과?, 노션초대용이메일?, 분반2025?, 비고? }> }
	•	서버 설정: 기본 term=2025-S1, sectionColumn=분반2025
	•	200: { created:{members,n}, updated:{members,n}, memberTerms:{created,updated}, sections:{created}, errors:[{row,reason}] }

Terms & Meetings
	•	GET /terms / POST /terms { year, semester: "S1|S2" }
	•	POST /terms/:termId/meetings/bulk { items:[{ ordinal,date,label? }] }

Sections & Teams
	•	POST /terms/:termId/sections { name }
	•	**GET /terms/:termId/sections?with=teams` → 섹션-팀 트리
	•	POST /sections/:sectionId/teams { teamNumber, name? }
	•	PATCH /teams/:teamId/leader { memberStudentId } → 해당 term의 MemberTerm으로 연결

Attendance
	•	POST /sections/:sectionId/sessions/generate → 모든 MeetingDay에 대해 세션 생성
	•	GET /sections/:sectionId/sessions → 세션 목록(ordinal, date)
	•	GET /sessions/:sessionId/attendance → { roster:[{ memberStudentId,name,teamNumber? }], records:[{ memberStudentId,status }] }
	•	PUT /sessions/:sessionId/attendance { records:[{ memberStudentId,status }] } (분반 스코프 필요)

Events
	•	POST /events { termId?, title, type? }
	•	POST /events/:eventId/participants { memberStudentIds:string[], termId? }
	•	**GET /events/:eventId/export?fields=phone,name&format=csv|txt→text/csvortext/plain`

Audit Logs
	•	**GET /audit-logs?actorId=&entityType=&entityId=&from=&to=&actionPrefix=`

⸻

6) 백엔드 구현 지시 (Express)
	•	apps/api/src 구조

src/
  server.ts
  lib/prisma.ts
  middleware/
    auth.ts          # requireAuth, requireSectionManager
    audit.ts         # request meta 로그 + 라우트에서 diff 기록
  routes/
    auth.ts
    members.ts
    import-v1.ts
    terms.ts
    sections.ts
    teams.ts
    attendance.ts
    events.ts
    audit.ts
  utils/
    phone.ts         # 하이픈 제거, 숫자만
    boolean.ts       # "o"/"O"/"1"/true 파서
    errors.ts
  types/
    dto.ts           # 요청/응답 Zod 스키마

	•	핵심 미들웨어
	•	requireAuth: JWT 검증, req.user={ id, role, sections:string[] }
	•	requireSectionManager(getSectionId): ADMIN 또는 req.user.sections 포함 시 통과
	•	auditMiddleware: 모든 요청에 meta 로그 생성. 각 라우트에서 auditDiff(before,after) 호출
	•	보안
	•	CORS: CORS_ORIGIN
	•	Cookies: refresh only httpOnly, sameSite=lax, secure=false(dev)
	•	비밀번호: bcryptjs
	•	세션/리프레시 로테이션
	•	로그인 시 Session 레코드 생성(refreshHash=sha256(refresh))
	•	/auth/refresh에서 새 refresh 발급 후 hash 교체 + lastUsedAt 갱신
	•	재사용 공격 탐지 시(옵션) 전체 세션 폐기

⸻

7) 프론트엔드 구현 지시 (Next.js 15)
	•	라우트 구조(App Router)

/app
  /login
  /dashboard
  /members
    /[studentId]
  /terms
    /[termId]
  /sections
    /[sectionId]
      /attendance           # 세션 목록
      /attendance/[sessionId]
  /events
    /[eventId]
  /audit
  /devices                 # 내 장치 세션 관리(선택)

	•	공통
	•	API 클라이언트: lib/api.ts — fetch wrapper, 401 시 /auth/refresh 호출 후 재시도
	•	상태: TanStack Query (쿼리키: ['members', filters], ['member', studentId], ['sessions', sectionId] …)
	•	폼: React Hook Form + ZodResolver
	•	UI: 테이블(정렬/필터), 배지(플래그), 모달(메모 작성)
	•	페이지 요건
	•	/login: 이메일/비번 + deviceLabel 입력 → access 저장(메모리/쿠키), 성공 시 /dashboard
	•	/members: 필터(학기/분반/조/상태), 컬럼(학번, 이름, 분반, 조, 팀장?, 상태, 전화, 이메일)
	•	/members/[studentId]: 기본정보 + 타임라인(학기별 카드) + 메모 탭(CRUD)
	•	/terms: 학기 생성, MeetingDay(1..9) bulk 입력/편집
	•	/sections/[sectionId]/attendance: 세션 목록(ordinal/date), 클릭 시 상세로 이동
	•	/sections/[sectionId]/attendance/[sessionId]: 출석 테이블(멤버 목록 + 상태 토글), 저장 버튼
	•	/events: 이벤트 생성/참여자 선택(검색: 학번/이름), Export CSV/TXT 버튼
	•	/audit: 필터(기간/actor/엔터티), 타임라인 뷰
	•	컴포넌트
	•	MemberTable, AttendanceGrid, Timeline, MeetingDayEditor, ExportButtons

⸻

8) 스프레드시트 Import v1 (프론트 UX)
	•	CSV 업로드 → 헤더 자동 매칭(한국어 키워드) → 5행 미리보기
	•	전화번호 하이픈 제거 자동 적용 안내
	•	커밋 후 결과 리포트(생성/업데이트/스킵/오류) 표시 & 다운로드

지원 헤더(동치 인식):
	•	이름, 명예 회원, 임원진, 휴식 회원, 신입 회원, 전화 번호, 학번, 학과, 노션 초대용 이메일, 2025 분반, 비고

⸻

9) 초기 작업 순서 (에이전트 실행 지침)
	1.	루트에 pnpm-workspace.yaml, turbo.json 생성
	2.	apps/api, apps/web, packages/db, packages/types, packages/config, infra 디렉터리 생성
	3.	packages/config: eslint/prettier/tsconfig 공통 템플릿 생성 및 각 앱에 참조
	4.	packages/db: 위 Prisma 스키마 저장 → npx prisma generate
	5.	apps/api: Express 초기화, 미들웨어/라우트 파일 생성, .env 로딩
	6.	apps/web: Next.js(App Router) 초기화, 페이지/컴포넌트 스캐폴드
	7.	infra/docker-compose.dev.yml 작성 → docker compose -f infra/docker-compose.dev.yml up -d
	8.	packages/db/seed.ts 작성 → pnpm -r db:seed (스크립트 설정)
	9.	최소 경로 연결 확인: 로그인→멤버 목록→멤버 상세→학기 생성→MeetingDay 생성→분반 생성→세션 자동 생성→출석 입력

⸻

10) package.json 스크립트 (예시)

루트

{
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "test": "turbo run test"
  }
}

apps/api/package.json

{
  "name": "@apps/api",
  "type": "commonjs",
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/server.ts",
    "build": "tsc -p .",
    "start": "node dist/server.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "db:seed": "ts-node src/seed.ts"
  }
}

apps/web/package.json

{
  "name": "@apps/web",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  }
}


⸻

11) CI/CD (GitHub Actions 예시)
	•	api.yml (paths: apps/api/**, packages/db/**, packages/types/**)
	•	steps: checkout → setup pnpm/node → build → (선택) docker build & push → ssh deploy or artifact
	•	web.yml (paths: apps/web/**, packages/types/**)
	•	steps: checkout → setup pnpm/node → build → (선택) docker build & push → deploy

⸻

12) 배포 절차 (운영 서버)
	1.	서버에 Docker & Compose 설치, .env.api, .env.web 생성(비밀키 설정)
	2.	레포 clone → docker compose -f infra/docker-compose.prod.yml up -d
	3.	(옵션) Cloudflare Tunnel: cloudflared tunnel run으로 3000/8000 노출

⸻

13) 수용 기준(최소 기능 완전성)
	•	로그인/리프레시/로그아웃 정상 동작, 장치별 세션 기록/폐기 가능
	•	Import v1로 제공된 스프레드시트를 매핑 없이 업로드해도 0 오류 커밋
	•	학기/MeetingDay 없이는 출석 세션 생성 불가, 생성 시 분반×고정일 1:1
	•	분반 스코프 없는 사용자는 타 분반 출석 수정 불가(403)
	•	멤버 상세에서 가입일+학기별 타임라인 확인 가능
	•	이벤트 참가자 추가 후 전화번호/이름 CSV/TXT 내보내기 가능
	•	감사 로그에서 주요 CRUD/출석 변경 확인 가능

⸻

14) 샘플 데이터

CSV 헤더 & 한 행 예시

이름,명예 회원,임원진,휴식 회원,신입 회원,전화 번호,학번,학과,노션 초대용 이메일,2025 분반,비고
강민규,,, ,o,010-2206-8581,2023055232,컴퓨터소프트웨어학부,sam0304@hanyang.ac.kr,논문 리딩반,


⸻

15) 테스트 시나리오(핵심)
	1.	ADMIN 생성 → 로그인 → access/refresh 수령
	2.	Terms: 2025-S1 생성 → MeetingDay 1..8 추가
	3.	Sections: 논문 리딩반 생성
	4.	Import v1: 위 CSV 업로드 → Member/MemberTerm/Section upsert 확인
	5.	세션 생성: 해당 분반에 대해 generate → 8개 세션 확인
	6.	출석 입력: 특정 세션에서 3명 상태 토글 후 저장 → records 반영
	7.	멤버 상세: 타임라인에 2025-S1 카드 노출
	8.	메모 작성/조회/삭제
	9.	이벤트 생성 → 참가자 추가(검색) → CSV export
	10.	감사 로그 조회: 위 액션들이 타임라인에 보이는지 확인

⸻

16) 비고
	•	일반 부원은 로그인하지 않으므로 User↔Member FK를 두지 않는다.
	•	팀 번호만 기본 사용(teamNumber), 라벨은 선택.
	•	과거 학기 기록은 POST /terms/:termId/rosters 같은 배치 API로 확장 가능.

위 지시를 그대로 구현하면 v1.1 요구사항을 충족하는 실행 가능한 풀스택 서비스가 생성된다.
