# Use Node.js 20 for building and running the web app
FROM node:20 AS base
WORKDIR /usr/src/app

# Copy workspace metadata and web package manifest
COPY package.json pnpm-workspace.yaml turbo.json ./
COPY packages ./packages
COPY apps/web/package.json apps/web/

# Install web dependencies only
RUN corepack enable \
    && pnpm install --filter @apps/web --prod

# Copy web source code
COPY apps/web apps/web

# Build the web app
WORKDIR /usr/src/app/apps/web
RUN pnpm build

EXPOSE 3000
CMD ["pnpm", "start"]
