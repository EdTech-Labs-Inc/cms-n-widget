# syntax=docker.io/docker/dockerfile:1
# Build from monorepo root:
# docker build -f apps/backend/Dockerfile -t backend .

# ⬇️ CHANGED: switch to Debian (glibc) to avoid Prisma/openssl issues
FROM node:22-bookworm-slim AS base
ENV DEBIAN_FRONTEND=noninteractive

# -----------------------------
# Builder: prune workspace
# -----------------------------
FROM base AS builder
# ⬇️ CHANGED: apk -> apt-get
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates git \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
RUN npm i -g turbo@^2.5.8
COPY . .
# If your package name is "backend", this is fine. Otherwise adjust to --filter=<pkg>
RUN turbo prune backend --docker

# -----------------------------
# Installer: install deps + build
# -----------------------------
FROM base AS installer
# ⬇️ CHANGED: apk -> apt-get (need openssl for Prisma at build time)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates openssl \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Install pruned deps
COPY --from=builder /app/out/json/ .
RUN npm ci

# Bring full sources for build
COPY --from=builder /app/out/full/ .

# ---- Build-time values for Next.js ----
# (SST will pass these as buildArgs via image.args)
ARG FRONTEND_URL
ENV FRONTEND_URL=${FRONTEND_URL}

# NEXT_PUBLIC_* variables must be available at build time
# because Next.js inlines them into the client-side JavaScript bundle
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}

# Generate Prisma client BEFORE building Next
RUN npm run --workspace=packages/database db:generate

# Copy Prisma migrations explicitly
COPY --from=builder /app/packages/database/prisma /app/packages/database/prisma

# Build the backend (Next.js with output: "standalone")
RUN npm run build --workspace=apps/backend

# -----------------------------
# Runtime: minimal image
# -----------------------------
FROM base AS runner
WORKDIR /app

# ⬇️ CHANGED: apk -> apt-get (runtime deps)
# Keep minimal: openssl for Prisma engine, ffmpeg for media, ca-certificates for TLS
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates openssl ffmpeg \
 && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=4000

# Non-root user
RUN groupadd -g 1001 nodejs && useradd -r -u 1001 -g nodejs nextjs

# ---- Copy runtime artifacts ----
# 1) Next standalone server bundle
COPY --from=installer --chown=nextjs:nodejs /app/apps/backend/.next/standalone ./
# 2) Next static assets
COPY --from=installer --chown=nextjs:nodejs /app/apps/backend/.next/static ./apps/backend/.next/static
# 3) Public assets (not present — intentionally left commented)
# COPY --from=installer --chown=nextjs:nodejs /app/apps/backend/public ./apps/backend/public
# 4) Prisma engines (keep to avoid runtime resolution surprises)
COPY --from=installer --chown=nextjs:nodejs /app/node_modules/@prisma /app/node_modules/@prisma
COPY --from=installer --chown=nextjs:nodejs /app/node_modules/.prisma /app/node_modules/.prisma
COPY --from=installer --chown=nextjs:nodejs /app/packages/database/prisma /app/packages/database/prisma

USER nextjs
EXPOSE 4000

# Next standalone server entrypoint
CMD ["node", "apps/backend/server.js"]
