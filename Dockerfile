# ═══════════════════════════════════════
#  TakeApp Web — Dockerfile
#  Ubicación: takeapp-web/Dockerfile
#
#  Monorepo: apps/storefront + apps/backoffice (sin root package.json)
#  Cada app tiene su propio package.json y node_modules.
# ═══════════════════════════════════════

# ── Base ──
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat

# ── Deps Storefront ──
FROM base AS deps-storefront
WORKDIR /app/apps/storefront
COPY apps/storefront/package.json apps/storefront/package-lock.json* ./
RUN npm install

# ── Deps Backoffice ──
FROM base AS deps-backoffice
WORKDIR /app/apps/backoffice
COPY apps/backoffice/package.json apps/backoffice/package-lock.json* ./
RUN npm install

# ── Desarrollo (target para docker-compose local) ──
FROM base AS development
WORKDIR /app
# node_modules instalados en imagen — protegidos por volúmenes anónimos en docker-compose
COPY --from=deps-storefront /app/apps/storefront/node_modules ./apps/storefront/node_modules
COPY --from=deps-backoffice /app/apps/backoffice/node_modules ./apps/backoffice/node_modules
# Código fuente (los bind mounts del compose sobreescriben en runtime para hot reload)
COPY apps/ ./apps/
EXPOSE 3000 3001

# ── Builder Storefront ──────────────────────────────────────
FROM base AS builder-storefront
WORKDIR /app/apps/storefront
COPY --from=deps-storefront /app/apps/storefront/node_modules ./node_modules
COPY apps/storefront/ ./
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=512"
RUN npm run build

# ── Builder Backoffice ──────────────────────────────────────
FROM base AS builder-backoffice
WORKDIR /app/apps/backoffice
COPY --from=deps-backoffice /app/apps/backoffice/node_modules ./node_modules
COPY apps/backoffice/ ./
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=512"
RUN npm run build

# ── Producción Storefront ───────────────────────────────────
# Standalone output: .next/standalone/server.js + necesita public/ y .next/static/
FROM base AS production-storefront
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=builder-storefront /app/apps/storefront/.next/standalone ./
COPY --from=builder-storefront /app/apps/storefront/.next/static     ./.next/static
COPY --from=builder-storefront /app/apps/storefront/public           ./public
EXPOSE 3000
CMD ["node", "server.js"]

# ── Producción Backoffice ───────────────────────────────────
FROM base AS production-backoffice
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
COPY --from=builder-backoffice /app/apps/backoffice/.next/standalone ./
COPY --from=builder-backoffice /app/apps/backoffice/.next/static     ./.next/static
EXPOSE 3001
CMD ["node", "server.js"]
