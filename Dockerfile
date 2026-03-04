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

# ── Desarrollo (target para docker-compose) ──
FROM base AS development
WORKDIR /app
# node_modules instalados en imagen — protegidos por volúmenes anónimos en docker-compose
COPY --from=deps-storefront /app/apps/storefront/node_modules ./apps/storefront/node_modules
COPY --from=deps-backoffice /app/apps/backoffice/node_modules ./apps/backoffice/node_modules
# Código fuente (los bind mounts del compose sobreescriben en runtime para hot reload)
COPY apps/ ./apps/
EXPOSE 3000 3001
