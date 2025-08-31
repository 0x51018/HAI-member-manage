# DigitalOcean 배포 가이드

이 문서는 프로젝트를 DigitalOcean Droplet과 Container Registry에 배포하는 방법을 설명합니다. `hyuhai.org` 도메인이 Droplet에 연결되어 있다고 가정합니다.

## 1. 컨테이너 레지스트리 준비

1. DigitalOcean 대시보드에서 **Container Registry**를 생성합니다 (예: `registry.digitalocean.com/hyuhai`).
2. `Access Tokens` 메뉴에서 읽기/쓰기 권한을 가진 토큰을 발급합니다.
3. 로컬 또는 CI에서 다음 명령으로 로그인할 수 있습니다.
   ```bash
   docker login registry.digitalocean.com -u <토큰 ID> -p <토큰 값>
   ```

## 2. Droplet 생성 및 Docker 설치

1. Ubuntu 22.04 기반 Droplet을 생성하고 SSH로 접속합니다.
2. Docker와 docker-compose 플러그인을 설치합니다.
   ```bash
   apt update && apt install -y docker.io docker-compose-plugin
   ```
3. 위에서 발급한 토큰으로 레지스트리에 로그인합니다.
   ```bash
   sudo docker login registry.digitalocean.com -u <토큰 ID> -p <토큰 값>
   ```

## 3. GitHub Secrets 설정

GitHub Actions가 컨테이너 이미지를 빌드하고 레지스트리에 푸시할 수 있도록 다음 시크릿을 저장합니다.

| 시크릿 | 설명 |
| ------ | ----- |
| `REGISTRY_USERNAME` | DigitalOcean 접근 토큰의 ID |
| `REGISTRY_PASSWORD` | DigitalOcean 접근 토큰의 값 |
| `API_SSH_HOST` / `WEB_SSH_HOST` | 각 서비스가 배포될 Droplet의 IP 주소 |
| `API_SSH_USER` / `WEB_SSH_USER` | SSH 사용자 (보통 `root`) |
| `API_SSH_KEY` / `WEB_SSH_KEY` | SSH 개인키 (PEM 형식) |
| `API_ENV_FILE` / `WEB_ENV_FILE` | 각 서비스 컨테이너에서 사용될 `.env` 내용 |

## 4. 배포 과정

1. 변경 사항을 `main` 브랜치에 푸시하면 GitHub Actions가 실행되어 이미지를 레지스트리에 푸시합니다.
2. Droplet에 SSH로 접속하여 최신 이미지를 받고 컨테이너를 실행합니다.
   ```bash
   docker pull registry.digitalocean.com/hyuhai/api:latest
   docker pull registry.digitalocean.com/hyuhai/web:latest
   docker compose -f infra/docker-compose.prod.yml up -d
   ```
3. DB에 초기 데이터를 넣고 관리자 계정을 생성합니다.
   ```bash
   ADMIN_EMAIL=admin@example.com \
   ADMIN_PASSWORD=changeme \
   pnpm --filter @apps/api db:seed
   ```
   (pnpm이 설치되어 있지 않다면 `curl -fsSL https://get.pnpm.io/install.sh | sh -` 명령으로 설치합니다.)
4. 웹 애플리케이션은 3000번 포트를, API는 8000번 포트를 사용하므로 Nginx 등으로 프록시를 설정합니다.

## 5. 수동 배포

다음 명령으로 Droplet에서 이미지를 직접 받거나 컨테이너를 실행할 수 있습니다.

```bash
# 로그인
sudo docker login registry.digitalocean.com -u <REGISTRY_USERNAME> -p <REGISTRY_PASSWORD>

# 이미지 가져오기
docker pull registry.digitalocean.com/hyuhai/api:latest
docker pull registry.digitalocean.com/hyuhai/web:latest

# docker-compose 사용 시
docker compose -f infra/docker-compose.prod.yml up -d
```

`infra/docker-compose.prod.yml` 파일은 DO 레지스트리 이미지를 사용하도록 설정되어 있습니다.

## 6. 첫 로그인

브라우저에서 서비스를 열고 `.env`에 지정한 `ADMIN_EMAIL`/`ADMIN_PASSWORD`로 로그인합니다. 상단 **Guide** 메뉴에서 상세 사용법을 확인할 수 있습니다.

## 7. 도메인 구성

`hyuhai.org`는 이미 Droplet의 IP에 연결되어 있으므로, Nginx 등의 리버스 프록시에서 `server_name hyuhai.org;` 설정 후 웹 컨테이너(포트 3000)로 프록시하면 됩니다. HTTPS가 필요하다면 Let's Encrypt 등으로 인증서를 발급해 사용하세요.
