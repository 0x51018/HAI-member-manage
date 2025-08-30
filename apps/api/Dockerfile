# Use Node.js 20 for building and running the API
FROM node:20 AS base
WORKDIR /usr/src/app

# Copy workspace metadata and API package manifest
COPY package.json pnpm-workspace.yaml turbo.json ./
COPY packages ./packages
COPY apps/api/package.json apps/api/

# Install API dependencies only
RUN corepack enable \
    && pnpm install --filter @apps/api --prod

# Copy API source code
COPY apps/api apps/api

# Build the API
WORKDIR /usr/src/app/apps/api
RUN pnpm build

EXPOSE 8000
CMD ["node", "dist/server.js"]
