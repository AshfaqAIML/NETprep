# =============================================================================
# NETPrep Hub — Dockerfile (multi-stage, production-ready)
# =============================================================================
# Builds a standalone Next.js image that runs anywhere Docker runs.
# =============================================================================

# ---- Builder stage ----
FROM node:20-alpine AS builder

# Install dependencies needed by Prisma + sharp on alpine
RUN apk add --no-cache libc6-compat openssl python3 make g++

WORKDIR /app

# Enable Bun for faster installs (optional; falls back to npm/yarn)
RUN npm install -g bun

# Copy package manifests first for layer caching
COPY package.json bun.lock* yarn.lock* package-lock.json* ./
COPY prisma ./prisma

# Install dependencies
RUN if [ -f bun.lock ]; then bun install --frozen-lockfile; \
    elif [ -f package-lock.json ]; then npm ci; \
    elif [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
    else echo "No lockfile found" && exit 1; fi

# Copy the rest of the source
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the Next.js application (standalone output)
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---- Runner stage (minimal production image) ----
FROM node:20-alpine AS runner

RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# Copy standalone Next.js output + static assets
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma files for runtime migrations
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

# Copy the seed script
COPY --from=builder /app/prisma/seed.ts ./prisma/seed.ts

# Create data directory for SQLite (if used) and local uploads
RUN mkdir -p /app/data /app/public/uploads \
 && chown -R nextjs:nodejs /app/data /app/public/uploads

USER nextjs

EXPOSE 3000

ENV DATABASE_URL=file:/app/data/custom.db
ENV STORAGE_PROVIDER=local
ENV STORAGE_LOCAL_PATH=/app/public/uploads

# Healthcheck (uses wget which is in alpine)
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
