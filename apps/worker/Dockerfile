# syntax=docker.io/docker/dockerfile:1
# Build from the root directory with: docker build -f apps/worker/Dockerfile -t worker .

FROM node:22-alpine AS base

FROM base AS builder
RUN apk update
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN npm install -g turbo@^2.5.8
COPY . .
RUN turbo prune worker --docker

FROM base AS installer
RUN apk update
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies
COPY --from=builder /app/out/json/ .
RUN npm install

# Build the application
COPY --from=builder /app/out/full/ .

# Copy backend lib (needed for worker compilation, not included by turbo prune)
COPY apps/backend/lib ./apps/backend/lib
COPY apps/backend/tsconfig.json ./apps/backend/tsconfig.json

# Copy shared packages source (for compilation)
COPY packages/database ./packages/database
COPY packages/types ./packages/types
COPY packages/config ./packages/config
COPY packages/logging ./packages/logging
COPY packages/agenta ./packages/agenta

# Generate Prisma client before building
RUN npx prisma generate --schema=./packages/database/prisma/schema.prisma

# Build the worker TypeScript code
RUN npm run build --workspace=worker

# Production image
FROM base AS runner
WORKDIR /app

# Install OpenSSL 1.1 compatibility for Prisma, ca-certificates for TLS
RUN apk add --no-cache ca-certificates openssl cairo-dev jpeg-dev pango-dev giflib-dev ffmpeg

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 worker

# Create logs directory for Winston file transports
RUN mkdir -p /app/logs && chown worker:nodejs /app/logs

# Copy bundled worker (single file that includes all code except external deps)
COPY --from=installer --chown=worker:nodejs /app/apps/worker/dist ./apps/worker/dist

# Copy node_modules for runtime dependencies (prisma, bullmq, ioredis, fluent-ffmpeg, etc.)
COPY --from=installer --chown=worker:nodejs /app/node_modules ./node_modules

USER worker

# Run the bundled worker
CMD ["node", "apps/worker/dist/index.js"]