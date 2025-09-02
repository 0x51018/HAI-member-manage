# DigitalOcean 배포 가이드

이 문서는 HAI Member Management Service를 DigitalOcean Container Registry와 Droplet에
배포하는 전체 절차를 정리합니다.

## 1. DigitalOcean 리소스 준비

1. **Container Registry 생성**
   - DigitalOcean 대시보드에서 레지스트리를 생성합니다.
     예) `registry.digitalocean.com/my-registry`.
   - `Access Tokens`에서 **읽기/쓰기** 권한을 가진 토큰을 발급합니다.
2. **Droplet 생성**
   - Ubuntu 22.04 이상의 이미지로 Droplet을 생성하고 SSH 키를 등록합니다.

## 2. 로컬(또는 CI)에서 이미지 빌드 및 업로드

```bash
git clone <repo-url>
cd HAI-member-manage

# API와 Web 이미지 빌드
docker build -t registry.digitalocean.com/my-registry/api:latest -f apps/api/Dockerfile .
docker build -t registry.digitalocean.com/my-registry/web:latest -f apps/web/Dockerfile .

# 레지스트리에 로그인 후 푸시
docker login registry.digitalocean.com -u <토큰 ID> -p <토큰 값>
docker push registry.digitalocean.com/my-registry/api:latest
docker push registry.digitalocean.com/my-registry/web:latest
```

## 3. Droplet 환경 설정

```bash
ssh root@<DROPLET_IP>

# Docker 및 docker compose 설치
apt update && apt install -y docker.io docker-compose-plugin

# 레지스트리 로그인
docker login registry.digitalocean.com -u <토큰 ID> -p <토큰 값>
```

## 4. 환경 변수 파일 업로드

Droplet에 `.env.api`, `.env.web` 두 파일을 업로드합니다.

`.env.api` 예시:

```env
DATABASE_URL=mysql://root:<MYSQL_ROOT_PASSWORD>@db:3306/club
PORT=8000
NODE_ENV=production
JWT_ACCESS_SECRET=<랜덤 값>
JWT_REFRESH_SECRET=<랜덤 값>
CORS_ORIGIN=https://<도메인 또는 IP>:3000
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=changeme
MYSQL_ROOT_PASSWORD=<DB 비밀번호>
```

`.env.web` 예시:

```env
NEXT_PUBLIC_API_BASE_URL=http://<DROPLET_IP>:8000
```

## 5. 컨테이너 실행

```bash
docker pull registry.digitalocean.com/my-registry/api:latest
docker pull registry.digitalocean.com/my-registry/web:latest
docker compose -f infra/docker-compose.prod.yml up -d

# 초기 데이터 및 관리자 계정 생성
ADMIN_EMAIL=admin@example.com \
ADMIN_PASSWORD=changeme \
pnpm --filter @apps/api db:seed
```

## 6. 접속 및 검증

- 브라우저에서 `http://<DROPLET_IP>:3000` 접속
- 위에서 지정한 관리자 계정으로 로그인하여 서비스가 정상인지 확인합니다.

## 7. (선택) 도메인 및 HTTPS 설정

1. 도메인을 Droplet IP로 지정하는 A 레코드를 생성합니다.
2. Nginx 등 리버스 프록시를 설정하여
   - Web 컨테이너(3000)와 API 컨테이너(8000)에 프록시
   - Let's Encrypt 등으로 HTTPS 적용

## 8. 업데이트 및 유지보수

1. 코드 변경 후 이미지를 다시 빌드하고 레지스트리에 푸시합니다.
2. Droplet에서 `docker pull` 후 `docker compose -f infra/docker-compose.prod.yml up -d`로 서비스 업데이트
3. `docker logs` 명령 등으로 로그를 확인하고 필요 시 `docker exec`으로 컨테이너에 접속합니다.

