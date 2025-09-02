# Use Node.js 20 for building the API
FROM node:20 AS builder
WORKDIR /usr/src/app

# Copy workspace metadata and API package manifest
COPY package.json pnpm-workspace.yaml turbo.json ./
COPY packages ./packages
COPY apps/api/package.json apps/api/


# Install dependencies (including dev) and generate Prisma client
RUN corepack enable \
    && pnpm install --filter @apps/api... \
    && pnpm --filter @apps/api prisma:generate

# Copy API source code, build, and prune dev dependencies

COPY apps/api apps/api
WORKDIR /usr/src/app/apps/api
RUN pnpm build && pnpm prune --prod

# Production image
FROM node:20 AS runner
WORKDIR /usr/src/app

# Copy production node_modules and built artifacts
COPY --from=builder /usr/src/app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /usr/src/app/apps/api/dist ./apps/api/dist
COPY apps/api/package.json apps/api/


WORKDIR /usr/src/app/apps/api
EXPOSE 8000
CMD ["node", "dist/server.js"]
