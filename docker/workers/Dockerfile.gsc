# AI SEO OS - Google Search Console Sync Worker
# Handles: GSC API calls, data fetching, token refresh

FROM node:20-alpine AS base

RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY package.json package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  else npm i; \
  fi

FROM base AS builder

COPY . .
RUN npm run build:workers

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 gscworker

COPY --from=builder --chown=gscworker:nodejs /app/dist/workers ./
COPY --from=builder --chown=gscworker:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=gscworker:nodejs /app/package.json ./package.json

USER gscworker

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node healthcheck.js || exit 1

CMD ["node", "gsc-worker.js"]
