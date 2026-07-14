# Content Suite

Plataforma B2B de IA que **impone consistencia de marca** al lanzar productos a escala:
genera un manual de marca, produce contenido coherente vía **RAG**, y gobierna su
publicación con un flujo de aprobación y **auditoría multimodal** de imágenes.

Monorepo: **`backend/`** (FastAPI + RAG) y **`frontend/`** (Next.js).

## Arquitectura

```
┌────────────┐   REST/JSON    ┌───────────────────────┐   SQL/pgvector   ┌────────────┐
│  frontend  │ ─────────────▶ │       backend         │ ───────────────▶ │  Supabase  │
│  Next.js   │  Bearer JWT    │  FastAPI (DDD)        │                  │  Postgres  │
│  :3123     │ ◀───────────── │  :8000                │                  │  + pgvector│
└────────────┘                └──────────┬────────────┘                  └────────────┘
                                          │ Groq (texto) · Gemini (embeddings + visión) · Langfuse (trazas)
                                          ▼
```

- **Backend**: FastAPI con arquitectura hexagonal por contexto (identidad, brand_identity,
  content_creation, governance). Toda la lógica de negocio, RBAC, RAG e IA vive aquí.
- **Frontend**: Next.js (App Router) + TypeScript + Tailwind v4 + shadcn/ui. **No** implementa
  lógica de negocio: solo consume la API y renderiza estado por rol.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind v4, shadcn/ui, Base UI, lucide-react |
| Backend | FastAPI, Python 3.12, arquitectura DDD/hexagonal |
| Base de datos | Supabase (Postgres + **pgvector** para el RAG) |
| LLM texto | **Groq** (Llama 3.3) |
| Multimodal / embeddings | **Google Gemini** (visión + `gemini-embedding-001`) |
| Observabilidad | **Langfuse** (trazas de cada interacción) |
| Auth | JWT (access + refresh), RBAC por rol |

## Puesta en marcha rápida

Necesitas el **backend** y el **frontend** corriendo a la vez. Detalle en cada README:

- 👉 [`backend/README.md`](backend/README.md)
- 👉 [`frontend/README.md`](frontend/README.md)

Resumen (dos terminales):

```bash
# Terminal 1 — Backend (http://localhost:8000)
cd backend
python -m venv .venv && .venv/Scripts/activate      # Windows;  source .venv/bin/activate en macOS/Linux
pip install -r requirements.txt
cp .env.example .env                                 # y rellena las llaves (ver backend/README)
python -m app.shared.db                              # crea/migra el esquema (idempotente)
python -m app.contexts.identity_access.seed          # crea los usuarios de los 4 roles
uvicorn app.main:app --reload --port 8000

# Terminal 2 — Frontend (http://localhost:3123)
cd frontend
pnpm install
# frontend/.env ya apunta a http://localhost:8000
pnpm dev --port 3123
```

Abre **http://localhost:3123** e inicia sesión con cualquier credencial semilla (abajo).

> **Nota de puertos:** si el 8000 está ocupado, levanta el backend en otro puerto
> (p. ej. `--port 8010`) y ajusta `NEXT_PUBLIC_API_URL` en `frontend/.env`.
> Añade el origen del frontend a `CORS_ORIGINS` del backend si cambias su puerto.

## Credenciales semilla (uno por rol)

Generadas por `python -m app.contexts.identity_access.seed`:

| Rol | Email | Password | Vista inicial |
|---|---|---|---|
| SUPERADMIN | `superadmin@contentsuite.dev` | `Superadmin#2026` | `/admin/users` |
| CREADOR | `creador@contentsuite.dev` | `Creador#2026` | `/studio/content` |
| APROBADOR_A | `aprobadorA@contentsuite.dev` | `AprobadorA#2026` | `/studio/approvals` |
| APROBADOR_B | `aprobadorB@contentsuite.dev` | `AprobadorB#2026` | `/studio/audit` |

## Módulos del reto → dónde viven

| Módulo | Descripción | Backend | Frontend |
|---|---|---|---|
| **I · Brand DNA Architect** | Manual de marca estructurado + RAG (pgvector) | `POST /brands` | `/studio/brand` |
| **II · Creative Engine** | Genera contenido consultando el RAG | `POST /content` | `/studio/content` |
| **III · Governance** | Flujo Pendiente→Aprobado/Rechazado | `POST /content/{id}/approve` · `/reject` | `/studio/approvals` |
| **III · Auditoría multimodal** | Visión contrasta imagen vs. manual | `POST /content/{id}/audit` | `/studio/audit` |
| **IV · Observabilidad** | Trazas de cada interacción | Langfuse (spans en cada use case) | enlace en sidebar (Superadmin) |
| **RBAC** | 4 roles, separación de funciones | JWT + guards por acción | vistas y navegación por rol |

## Documentación adicional

En la raíz hay documentos de diseño: `VISION_PRODUCTO.md`, `BACKEND_REQUERIMIENTOS.md`,
`FRONTEND_REQUERIMIENTOS.md`, `SERVICIOS.md`, `GOOGLE_ADK_GUIDE.md`.
