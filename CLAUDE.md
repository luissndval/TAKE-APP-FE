# TakeApp FE — Contexto del Proyecto

## Repositorio
- **Repo**: `github.com/luissndval/TAKE-APP-FE`
- **Working dir**: `takeapp-web/`
- **Estructura**: Monorepo sin root `package.json`. Cada app tiene su propio `package.json` y `node_modules`.

## Workflow Git

### Ramas

| Rama | Propósito | Deploy |
|---|---|---|
| `main` | Código estable. Todo PR llega acá. | VM GCP prod |
| `stage` | Recibe merges de `main` para probar. | VM GCP stage |
| `feature/*` | Una por tarea, sale de `main`, vuelve via PR. | — |

### Reglas obligatorias

- **Nunca hacer PR desde `stage` → `main`.**
- Los PRs siempre van desde `feature/*` → `main`.
- Usar **tags** en `main` para marcar releases (`v1.0.0`, `v1.1.0`, etc.).
- **NUNCA** pushear directo a `main`. Siempre abrir PR.

### Flujo

```bash
# 1. Nueva feature
git checkout main && git pull origin main
git checkout -b feature/nombre-ui
# ...trabajar...
git push -u origin feature/nombre-ui
# → PR → main

# 2. Probar en stage
git checkout stage && git merge main && git push origin stage

# 3. Deploy prod
git checkout main && git tag v1.x.0 && git push origin v1.x.0
```

---

## Apps

### Storefront (`apps/storefront/`)
- **Next.js 14.2**, App Router, TypeScript, puerto `3000`
- `output: "standalone"`, sin `basePath`
- **Stack**: Tailwind CSS, Zustand, TanStack Query, React Hook Form + Zod, Axios, MercadoPago SDK, Leaflet, motion

**Variables de entorno**
- `NEXT_PUBLIC_API_URL` — URL pública del backend (browser)
- `INTERNAL_API_URL` — URL interna del backend (SSR dentro de Docker, e.g. `http://backend:8000`)

**Proxy de API (`next.config.mjs`)**
```
/api/:path*     → ${INTERNAL_API_URL}/api/:path*
/uploads/:path* → ${INTERNAL_API_URL}/uploads/:path*
```

**Rutas**
```
/                    → root (redirige a /[negocio])
/[tenant]/           → menú público del tenant
/[tenant]/checkout   → checkout
/order/[id]          → seguimiento de pedido (?tenant=slug)
/order/success       → confirmación MP
/order/failure       → pago rechazado (?tenant=slug)
/order/transfer      → flujo transferencia bancaria
```

**Multi-tenancy**
- `middleware.ts` detecta subdominio y reescribe a `/[tenant]/...`
  - `laburgueria.andesit.io/` → rewrite a `/laburgueria`
  - Si el path ya tiene `/${tenant}`, lo deja pasar
- Hook `src/hooks/useTenantPath.ts` genera paths internos según modo:
  - Subdominio: `tenantPath('/checkout')` → `/checkout`
  - Path: `tenantPath('/checkout')` → `/laburgueria/checkout`
- Usar `useTenantPath` en TODOS los `router.push` y `<Link href>` que naveguen a rutas del tenant

**Theming**
- CSS variables: `--tenant-primary`, `--tenant-secondary`, `--font-sans`
- Layout SSR inyecta `<script>` síncrono para evitar flash de colores

**Estado global (`src/store/cart.ts`)**
- Zustand + persist (localStorage)
- `pendingCart` — carrito guardado para restaurar tras pago MP fallido (TTL 30 min)

**Pagos soportados**: MercadoPago (redirect), Transferencia bancaria (CBU/alias + comprobante), Efectivo

---

### Backoffice (`apps/backoffice/`)
- **Next.js 14.2**, App Router, TypeScript, puerto `3001`
- `output: "standalone"`, `basePath: "/backoffice"`
- **Stack**: Tailwind CSS, shadcn/ui (Radix UI), Zustand, TanStack Query, React Hook Form + Zod, Axios, Recharts, Leaflet

**Variables de entorno**
- `NEXT_PUBLIC_API_URL` — URL del backend

**Autenticación**
- JWT en `localStorage` (`access_token`, `refresh_token`)
- Auto-refresh en 401 via interceptor en `src/lib/api.ts`
- Store: `useAuthStore` (Zustand + persist en `auth-storage`)
- Al expirar sesión → redirect a `/login`

**Roles**
```
TenantRole:  kitchen < cashier < manager < owner
PlatformRole: superadmin, support, finance
```
- `kitchen` → solo accede a `/kitchen`
- PlatformRole → accede a `/admin/*`

**Rutas principales**
```
/login, /platform-login
/kitchen
/(app)/dashboard
/(app)/menu, /menu/products/[id], /menu/products/new
/(app)/menu/categories/new, /menu/combos/new, /menu/coupons
/(app)/orders, /orders/[id]
/(app)/users
/(app)/settings/* (appearance, payments, logistics, notifications, integrations, schedule, domain)
/(app)/admin/* (tenants, plans, stats, settings/email) — solo superadmin
```

**Bug pendiente**: `src/lib/tenant-utils.ts` referencia `takeapp.com` en lugar de `andesit.io`.

---

## Infraestructura

| Componente | Valor |
|---|---|
| VM | Google Cloud |
| IP | `35.193.49.140` |
| Dominio | `andesit.io` |
| DNS | Squarespace |

**Registros DNS activos**
- `@` → A → `35.193.49.140`
- `www` → A → `35.193.49.140`
- `*` → A → `35.193.49.140` ✅ (wildcard ya resuelve)

**Docker** (`Dockerfile` en raíz de `takeapp-web/`)
- Multi-stage: `base` → `deps-*` → `builder-*` → `production-*`
- `production-storefront`: puerto 3000, standalone
- `production-backoffice`: puerto 3001, standalone

**Nginx** (en la VM)
- Proxea `:80`/`:443` → storefront (:3000) y backoffice (:3001)
- Crítico: `proxy_set_header Host $host` para que el middleware detecte subdominios
- SSL wildcard `*.andesit.io` — **pendiente** de generar con certbot

**Puertos en la VM**
| Servicio | Puerto |
|---|---|
| Storefront | 3000 |
| Backoffice | 3001 |
| Backend (FastAPI) | 8000 |
| Nginx | 80, 443 |

**Flow de subdomain routing**
1. `laburgueria.andesit.io/` → DNS → `35.193.49.140`
2. Nginx proxea a `:3000` con `Host: laburgueria.andesit.io`
3. `middleware.ts` detecta subdominio, reescribe a `/laburgueria/`
4. Next.js sirve `[tenant]/page.tsx` con `params.tenant = 'laburgueria'`
