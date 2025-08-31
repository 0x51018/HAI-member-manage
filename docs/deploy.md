# CI/CD Deployment Guide

This project uses GitHub Actions to test, build, containerize, and deploy the
API and web applications. Two workflows are defined:

- `.github/workflows/api.yml` – handles the API service
- `.github/workflows/web.yml` – handles the web frontend

## Secrets

Create the following secrets in **Settings → Secrets and variables → Actions**:

| Secret | Description |
| ------ | ----------- |
| `REGISTRY_USERNAME` | Username for the container registry |
| `REGISTRY_PASSWORD` | Password or token for the container registry |
| `API_SSH_HOST` | SSH host for the API server |
| `API_SSH_USER` | SSH user for the API server |
| `API_SSH_KEY` | Private key (PEM format) for the API server |
| `API_ENV_FILE` | Contents of the API `.env` file |
| `WEB_SSH_HOST` | SSH host for the web server |
| `WEB_SSH_USER` | SSH user for the web server |
| `WEB_SSH_KEY` | Private key (PEM format) for the web server |
| `WEB_ENV_FILE` | Contents of the web `.env` file |

## Workflow steps

Each workflow performs the following operations:

1. Install dependencies with `pnpm install`.
2. Run tests using `pnpm test` for the respective application.
3. Build the application with `pnpm build`.
4. Log in to the GitHub Container Registry using the registry secrets.
5. Build and push a Docker image tagged with the commit SHA.
6. SSH into the target server and deploy the new container using the provided
   environment file.

Workflows trigger automatically on pushes or pull requests that modify the
corresponding application directories.

## Manual deployment

To trigger a deployment manually, push a commit to the relevant application
path or re-run the workflow from the GitHub Actions tab after configuring the
secrets above.

