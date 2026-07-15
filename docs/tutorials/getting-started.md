# Tutorial — Getting Started

Run Content Suite end to end and drive one full loop: create a brand → generate
content → approve/reject → audit an image. Assumes you have Python 3.12, Node +
pnpm, and a Supabase project.

## 1. Backend

```bash
cd backend
python -m venv .venv
.venv/Scripts/activate            # Windows;  source .venv/bin/activate elsewhere
pip install -r requirements.txt
pip install -r requirements-dev.txt   # optional: tests
cp .env.example .env               # then fill the keys below
```

Fill `.env` (see [`backend/.env.example`](../../backend/.env.example)):

| Key | Required | Note |
|---|:--:|---|
| `DATABASE_URL` | ✅ | Supabase **transaction pooler** (`...pooler.supabase.com:6543`) |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | ✅ | project settings |
| `GROQ_API_KEY` | ✅ | text generation |
| `GOOGLE_API_KEY` | ✅ | embeddings (RAG) + vision (audit) |
| `JWT_SECRET` | recommended | change from the dev default |
| `LANGFUSE_*` | optional | traces; omitted → app runs without them |

Create the schema and seed users (both idempotent):

```bash
python -m app.shared.db                         # creates extension + tables + migrations
python -m app.contexts.identity_access.seed     # prints one login per role
uvicorn app.main:app --reload --port 8000
```

Verify: `GET http://localhost:8000/health` → `{"status":"ok",...}`.
Swagger at `/docs` (hidden when `APP_ENV=production`).

## 2. Frontend

```bash
cd frontend
pnpm install
# frontend/.env → NEXT_PUBLIC_API_URL must include /api/v1 (default: http://localhost:8000/api/v1)
pnpm dev --port 3123
```

Open **http://localhost:3123** and log in with a seed credential.

## 3. Seed logins (one per role)

| Role | Email | Password | Lands on |
|---|---|---|---|
| SUPERADMIN | `superadmin@contentsuite.dev` | `Superadmin#2026` | `/admin/users` |
| CREADOR | `creador@contentsuite.dev` | `Creador#2026` | `/studio/content` |
| APROBADOR_A | `aprobadorA@contentsuite.dev` | `AprobadorA#2026` | `/studio/approvals` |
| APROBADOR_B | `aprobadorB@contentsuite.dev` | `AprobadorB#2026` | `/studio/audit` |

(Source: [`seed.py:12`](../../backend/app/contexts/identity_access/seed.py).)

## 4. Drive the full loop

1. **As CREADOR** → *Marcas* → create a brand (name required; category/tone/
   audience optional). The LLM generates rules; they're embedded into the RAG.
2. Still CREADOR → *Generar contenido* → pick the brand, a type
   (`DESCRIPCION`/`GUION`/`PROMPT_IMAGEN`) and a brief. The backend retrieves
   relevant rules **before** generating. Result is `PENDIENTE`.
3. **As APROBADOR_A** → *Cola de aprobación* → approve or reject (reject needs a
   reason).
4. **As APROBADOR_B** → *Auditoría de imágenes* → upload an image for a content
   piece; Gemini vision contrasts it against the brand's visual rules. A
   `NO_CUMPLE` verdict auto-rejects a still-pending piece.
5. **As SUPERADMIN** → *Usuarios* → create users, change roles, deactivate.

## Troubleshooting

- **App won't start / config error:** a required env var is missing — the app
  fails fast by design ([`config.py:15`](../../backend/app/config.py)).
- **CORS error in browser:** add your frontend origin to `CORS_ORIGINS`
  ([`main.py:33`](../../backend/app/main.py)).
- **401 loops:** `NEXT_PUBLIC_API_URL` must include `/api/v1`.
- **DB prepared-statement errors:** you're not on the transaction pooler / lost
  `prepare_threshold=None` — see [persistence](../architecture/persistence.md).
- **No traces in Langfuse:** both keys must be set; otherwise the app uses
  `NullTracer` silently — see [observability](../architecture/observability.md).

## Next

- Add a feature: [how-to guides](../how-to/).
- Understand a concern: [architecture SDDs](../architecture/README.md).
