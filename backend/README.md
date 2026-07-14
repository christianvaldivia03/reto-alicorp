# Content Suite — Backend (FastAPI)

API REST que concentra **toda la lógica de negocio**: RBAC, RAG (pgvector), generación con
Groq, auditoría multimodal con Gemini y trazas con Langfuse. Arquitectura **DDD/hexagonal**:
cada contexto tiene `domain / application / infrastructure / interfaces`.

```
app/
  main.py                     # ASGI app + routers + CORS + /health
  config.py                   # settings desde .env (fail-fast)
  shared/
    db.py                     # conexión Postgres + DDL (init_db)
    langfuse_tracer.py        # observabilidad (spans) — Módulo IV
  contexts/
    identity_access/          # login, JWT, RBAC, usuarios, seed
    brand_identity/           # Módulo I — manual de marca + embeddings (RAG)
    content_creation/         # Módulo II — generación coherente vía RAG
    governance/               # Módulo III — aprobación + auditoría multimodal
tests/                        # unit + integration (pytest)
```

## Requisitos

- **Python 3.12**
- Cuenta **Supabase** (Postgres con extensión `vector`)
- API keys: **Groq**, **Google (Gemini)**; opcional **Langfuse**

## 1. Entorno e instalación

```bash
cd backend
python -m venv .venv

# Activar el venv:
.venv/Scripts/activate           # Windows (PowerShell/Git Bash)
# source .venv/bin/activate      # macOS / Linux

pip install -r requirements.txt          # runtime
pip install -r requirements-dev.txt      # + pytest (opcional, para tests)
```

## 2. Variables de entorno

Copia la plantilla y rellena las llaves:

```bash
cp .env.example .env
```

| Variable | Obligatoria | Descripción |
|---|:--:|---|
| `DATABASE_URL` | ✅ | Postgres de Supabase. Usa el **pooler IPv4** (`...pooler.supabase.com:6543`). |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Proyecto Supabase. |
| `GROQ_API_KEY` | ✅ | Modelo de texto. |
| `GOOGLE_API_KEY` | ✅* | Embeddings (RAG) y visión (auditoría). |
| `GROQ_MODEL` | | Default `llama-3.3-70b-versatile`. |
| `EMBEDDING_MODEL`, `EMBEDDING_DIM` | | Default `gemini-embedding-001`, `768`. |
| `VISION_MODEL` | | Default `gemini-flash-lite-latest`. |
| `JWT_SECRET`, `JWT_TTL_MIN` | | Firma de tokens (cámbialo en prod). |
| `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`, `LANGFUSE_HOST` | | Observabilidad (Módulo IV). Sin ellas, la app corre igual sin trazas. |
| `CORS_ORIGINS` | | Orígenes permitidos, coma-separados. Default `http://localhost:3000,http://localhost:3123`. |

\* Sin `GOOGLE_API_KEY` no funcionan el RAG ni la auditoría de imágenes.

## 3. Inicializar la base de datos (idempotente)

Crea la extensión `vector`, las tablas y aplica migraciones (`created_by`, etc.):

```bash
python -m app.shared.db
```

## 4. Crear los usuarios semilla (uno por rol)

```bash
python -m app.contexts.identity_access.seed
```

Imprime las credenciales de los 4 roles (ver README raíz).

## 5. Levantar el servidor

```bash
uvicorn app.main:app --reload --port 8000
```

- Salud: **http://localhost:8000/health**
- Docs OpenAPI (Swagger): **http://localhost:8000/docs**

## Endpoints principales

| Método | Ruta | Rol | Módulo |
|---|---|---|---|
| POST | `/auth/login` · `/auth/refresh` · GET `/auth/me` | — | Auth |
| POST | `/brands` · GET `/brands` · `/brands/{id}` | CREADOR | I |
| POST | `/content` · GET `/content?estado=` · `/content/{id}` | CREADOR / auth | II |
| POST | `/content/{id}/approve` · `/content/{id}/reject` | APROBADOR_A | III |
| POST | `/content/{id}/audit` (multipart `image`) · GET `/content/{id}/audits` | APROBADOR_B | III |
| GET/POST | `/users` · PATCH `/users/{id}/role` · POST `/users/{id}/deactivate` | SUPERADMIN | RBAC |

## Tests

```bash
pytest                       # unitarios
pytest -m integration        # requiere credenciales reales (Groq/Gemini/Supabase)
```

## Notas

- El **CORS** está habilitado en `main.py` para que el frontend llame desde el navegador.
  Ajusta `CORS_ORIGINS` si sirves el frontend en otro origen.
- El pooler de Supabase (modo transacción) no soporta prepared statements →
  la conexión usa `prepare_threshold=None`.
