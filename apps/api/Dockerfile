# Use Node.js 20 for building the API
FROM node:20 AS builder
WORKDIR /usr/src/app

# Copy workspace metadata and API package manifest
COPY package.json pnpm-workspace.yaml turbo.json ./
COPY packages ./packages
COPY apps/api/package.json apps/api/

# Install dependencies including devDependencies for build
RUN corepack enable \
    && pnpm install --filter @apps/api

# Copy API source code and build
COPY apps/api apps/api
WORKDIR /usr/src/app/apps/api
RUN pnpm build

# Production image
FROM node:20 AS runner
WORKDIR /usr/src/app

# Copy workspace metadata and install only production dependencies
COPY package.json pnpm-workspace.yaml turbo.json ./
COPY packages ./packages
COPY apps/api/package.json apps/api/
RUN corepack enable \
    && pnpm install --filter @apps/api --prod

# Copy built artifacts from the builder
COPY --from=builder /usr/src/app/apps/api/dist ./apps/api/dist

WORKDIR /usr/src/app/apps/api
EXPOSE 8000
CMD ["node", "dist/server.js"]
