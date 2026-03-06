# TakeApp Frontend — Contexto (TAKE-APP-FE)

> Para el contexto completo del proyecto ver `take-app/CLAUDE.md`.

---

## Stack

Next.js 14 (App Router) + TypeScript + Tailwind 3 + TanStack Query + Zustand + Zod

## Estructura

```
apps/
├── storefront/          # puerto 3000 — menú público + checkout + tracking
│   ├── src/app/[tenant]/
│   ├── src/lib/api.ts
│   └── src/store/cart.ts
└── backoffice/          # puerto 3001 — panel tenant + superadmin
    ├── src/app/(app)/
    ├── src/app/kitchen/
    └── next.config.mjs  # basePath: "/backoffice"
```

## Convenciones

- CSS variables en hex (sin oklch), sin dark mode
- Radix + react-hook-form → usar `<Controller>` para Select, Switch, RadioGroup
- `z.coerce.number()` con zodResolver → castear `as Resolver<FormValues>`
- Docker node_modules: usar `-V` al recrear contenedores si cambian dependencias

## Deuda técnica pendiente

- Zod v3 (storefront) vs v4 (backoffice) → estandarizar a v4
- Next.js 14.2.18 (storefront) vs 14.2.23 (backoffice) → actualizar storefront
- Backoffice sin `output: "standalone"` en `next.config.mjs`

---

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

> Commits en inglés, conventional commits. Respuestas de Claude en español.
