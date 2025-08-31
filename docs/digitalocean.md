# DigitalOcean 배포 가이드

이 문서는 프로젝트를 DigitalOcean Droplet과 Container Registry에 배포하는 방법을 설명합니다. 이미 `hyuhai.org` 도메인이 Droplet에 연결되어 있다고 가정합니다.

## 사전 준비

- DigitalOcean 계정과 Droplet (Ubuntu 22.04 기준)
- DigitalOcean Container Registry (예: `registry.digitalocean.com/hyuhai`)
- Droplet에 Docker와 docker-compose 설치
- 레지스트리 접근 토큰 (읽기/쓰기 권한)

## GitHub Secrets 설정

GitHub Actions가 컨테이너 이미지를 빌드하고 레지스트리에 푸시할 수 있도록 다음 시크릿을 저장합니다.

| 시크릿 | 설명 |
| ------ | ----- |
| `REGISTRY_USERNAME` | DigitalOcean 접근 토큰의 ID |
| `REGISTRY_PASSWORD` | DigitalOcean 접근 토큰의 값 |
| `API_SSH_HOST` / `WEB_SSH_HOST` | 각 서비스가 배포될 Droplet의 IP 주소 |
| `API_SSH_USER` / `WEB_SSH_USER` | SSH 사용자 (보통 `root`) |
| `API_SSH_KEY` / `WEB_SSH_KEY` | SSH 개인키 (PEM 형식) |
| `API_ENV_FILE` / `WEB_ENV_FILE` | 각 서비스 컨테이너에서 사용될 `.env` 내용 |

## 배포 과정

1. 변경 사항을 `main` 브랜치에 푸시하면 GitHub Actions가 실행됩니다.
2. 워크플로는 애플리케이션을 빌드하고 이미지를 `registry.digitalocean.com/hyuhai`에 푸시합니다.
3. 이후 Droplet에 SSH로 접속하여 최신 이미지를 풀(pull)하고 컨테이너를 재시작합니다.
4. 웹 애플리케이션 컨테이너는 기본적으로 3000번 포트를 사용하므로, Nginx와 같은 리버스 프록시를 통해 `hyuhai.org`의 80/443 포트를 해당 컨테이너로 연결합니다.
5. API 컨테이너는 8000번 포트를 사용하며, 필요 시 별도의 서브도메인 또는 프록시 설정을 적용합니다.

## 수동 배포

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

## 도메인 구성

`hyuhai.org`는 이미 Droplet의 IP에 연결되어 있으므로, Nginx 등의 리버스 프록시에서 `server_name hyuhai.org;` 설정 후 웹 컨테이너(포트 3000)로 프록시하면 됩니다. HTTPS가 필요하다면 Let's Encrypt 등으로 인증서를 발급해 사용하세요.

