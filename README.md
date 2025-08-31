# HAI Member Management Service

동아리 내부 운영진을 위한 회원·출석 관리용 모노레포입니다. pnpm과 Turborepo를 사용하며 Express API와 Next.js 웹 프론트엔드가 포함되어 있습니다.

## 주요 기능

- **인증 및 세션**
  - 이메일/비밀번호 로그인, Access/Refresh JWT 발급
  - 장치별 Session 테이블에 리프레시 토큰 해시와 UA/IP 기록
- **회원 관리**
  - 회원 목록·검색·상세 조회
  - 메모 조회/작성/삭제 및 감사 로그 기록
- **학기/분반/팀**
  - 학기 생성과 MeetingDay 일괄 등록
  - 분반 생성, 팀 생성 및 팀장 지정
- **출석 관리**
  - 분반별 출석 세션 자동 생성
  - 세션별 출석 상태 조회·수정
- **스프레드시트 Import v1**
  - `termId`를 지정하여 CSV 업로드
  - 전화번호 하이픈 자동 제거 후 Member/MemberTerm/Section upsert
  - 결과 통계와 JSON 리포트 다운로드
- **이벤트 관리**
  - 이벤트 생성·목록·상세 조회
  - 참가자 검색·추가 및 전화번호/이름 CSV/TXT 내보내기
- **감사 로그**
  - 주요 API 요청 내역 조회

## 레포지토리 구조

```
repo/
  apps/
    api/   # Express REST API
    web/   # Next.js 15(App Router) 프론트엔드
  packages/
    db/    # Prisma 스키마 및 seed 스크립트
    types/ # 공유 타입/Zod 스키마
    config/# ESLint/Prettier/tsconfig 공통 설정
  infra/
    docker-compose.dev.yml
    docker-compose.prod.yml
    .env.example.api
    .env.example.web
```

## 개발 환경 설정

1. **필수 도구**: Docker, Docker Compose, Node.js 20+ (pnpm 사용 시 `corepack enable`)
2. **환경 변수 준비**  
   `infra/.env.example.api`와 `infra/.env.example.web`을 참고해 다음 파일을 작성합니다.
   - `infra/.env.example.api`:
     ```env
     DATABASE_URL=mysql://root:root@db:3306/club
     PORT=8000
     NODE_ENV=development
     JWT_ACCESS_SECRET=change_me_access
     JWT_REFRESH_SECRET=change_me_refresh
     CORS_ORIGIN=http://localhost:3000
     ADMIN_EMAIL=admin@example.com
     ADMIN_PASSWORD=changeme
     ```
   - `infra/.env.example.web`:
     ```env
     NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
     ```
3. **컨테이너 실행 및 시드 데이터**
   ```bash
   docker compose -f infra/docker-compose.dev.yml up -d
   pnpm --filter @apps/api db:seed
   ```
4. **접속**  
   브라우저에서 `http://localhost:3000` 접속 후 예시 관리자 계정으로 로그인합니다.

## 주요 스크립트

- `pnpm dev` – API와 웹을 동시에 개발 모드로 실행
- `pnpm build` – 전체 프로젝트 빌드
- `pnpm lint` – 각 패키지의 ESLint 실행

## 운영 배포 가이드

1. **이미지 빌드**
   ```bash
   docker build -t club-api:latest -f apps/api/Dockerfile .
   docker build -t club-web:latest -f apps/web/Dockerfile .
   ```
2. **운영용 환경 변수 파일 작성** (`.env.api`, `.env.web`)
   - `.env.api`는 데이터베이스 URL과 JWT 시크릿 등을 설정합니다.
   - `.env.web`에는 `NEXT_PUBLIC_API_BASE_URL`을 API 주소로 지정합니다.
3. **서비스 실행**
   ```bash
   docker compose -f infra/docker-compose.prod.yml up -d
   ```
4. **(옵션) Cloudflare Tunnel**  
   외부 노출 없이 배포하려면 Cloudflare Tunnel을 통해 3000/8000 포트를 공개합니다.

## 라이선스

MIT

