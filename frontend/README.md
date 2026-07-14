# Content Suite — Frontend (Next.js)

Interfaz web de Content Suite. **No implementa lógica de negocio**: consume la API REST del
backend y renderiza estado diferenciado por rol. App Router + TypeScript + Tailwind v4 +
shadcn/ui, con soporte de **modo claro/oscuro**.

```
app/
  layout.tsx · globals.css            # design system (tokens, tipografía, motion)
  login/                              # inicio de sesión (2 paneles)
  studio/brand · studio/content       # Módulos I y II (CREADOR)
  studio/approvals · studio/audit     # Módulo III (APROBADOR_A / _B)
  admin/users                         # gestión de usuarios (SUPERADMIN)
components/
  layout/app-layout.tsx               # shell: sidebar por rol + header + theme toggle
  ui/                                 # primitivas (button, card, input, dialog, skeleton…)
  ui-custom/                          # badges, page-header, empty/error states
contexts/  auth-context · toast-context
lib/  api.ts (todas las llamadas) · roles · types · utils
```

## Requisitos

- **Node.js 18+** y **pnpm** (hay `pnpm-lock.yaml`)
- El **backend corriendo** (ver [`../backend/README.md`](../backend/README.md))

## 1. Instalación

```bash
cd frontend
pnpm install
```

> Sin pnpm: `npm install` también funciona (ignora el lockfile de pnpm).

## 2. Variables de entorno

El archivo `.env` ya existe y apunta al backend local:

```bash
# frontend/.env
NEXT_PUBLIC_API_URL=http://localhost:8000     # URL base del backend
NEXT_PUBLIC_LANGFUSE_URL=                      # opcional: enlace "Observabilidad" (Superadmin)
```

Si levantaste el backend en otro puerto (p. ej. `8010`), cámbialo aquí **y** añade el
origen del frontend a `CORS_ORIGINS` en el backend.

## 3. Desarrollo

```bash
pnpm dev --port 3123
```

Abre **http://localhost:3123**. Inicia sesión con las credenciales semilla (ver README raíz);
cada rol aterriza en su vista y el sidebar solo muestra sus secciones.

## 4. Build de producción

```bash
pnpm build
pnpm start
```

## Scripts

| Comando | Acción |
|---|---|
| `pnpm dev` | Servidor de desarrollo (Turbopack) |
| `pnpm build` | Build optimizado |
| `pnpm start` | Sirve el build |
| `pnpm lint` | ESLint |

## Notas de diseño

- **Design system** centralizado en `app/globals.css` (`@theme` de Tailwind v4): paleta
  neutra fría + acento de marca (regla 90/10), tipografía Plus Jakarta Sans, skeletons con
  shimmer, animaciones `reveal` que respetan `prefers-reduced-motion`.
- **Tema claro/oscuro**: toggle en el header; se persiste en `localStorage` y se aplica sin
  flash mediante un script en `layout.tsx`.
- **Todas** las llamadas HTTP están aisladas en `lib/api.ts` (tipadas). Cambiar de endpoint
  o de contrato se hace en un solo lugar.
