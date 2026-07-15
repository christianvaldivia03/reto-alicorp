# CLAUDE.md

Guidance for working in this repository. Read this first, then follow the
pointers into [`docs/`](docs/README.md) for anything deeper.

> **Language rule:** all identifiers, comments, and documentation are in
> **English**. (Existing code/comments are in Spanish; new code follows English.)

## What this is

**Content Suite** ("Prisma") — a B2B AI platform that enforces brand consistency
at scale: it generates a structured brand manual, produces on-brand content via
**RAG**, and governs publication with an approval flow plus **multimodal image
audit**.

Monorepo: [`backend/`](backend/) (FastAPI + RAG, all business logic) and
[`frontend/`](frontend/) (Next.js, presentation only).

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind v4, shadcn/ui, Base UI, lucide-react |
| Backend | FastAPI, Python 3.12, DDD / hexagonal per bounded context |
| Database | Supabase (Postgres + **pgvector** for RAG) |
| Text LLM | **Groq** (Llama 3.3) |
| Embeddings + Vision | **Google Gemini** (`gemini-embedding-001` + vision) |
| Observability | **Langfuse** (spans per use case) |
| Auth | JWT (access + refresh), RBAC by role |

## Build / run / test

### Backend (`backend/`)

```bash
python -m venv .venv && .venv/Scripts/activate   # Windows; source .venv/bin/activate elsewhere
pip install -r requirements.txt                  # runtime
pip install -r requirements-dev.txt              # + pytest
cp .env.example .env                             # fill keys (see backend/README.md)
python -m app.shared.db                          # create/migrate schema (idempotent)
python -m app.contexts.identity_access.seed      # seed one user per role
uvicorn app.main:app --reload --port 8000        # http://localhost:8000
```

- Health: `GET /health` · Swagger: `/docs` (disabled when `APP_ENV=production`).
- Tests: `pytest` (unit + e2e with fakes). `pytest -m integration` needs real
  Groq/Gemini/Supabase credentials.
- No linter/formatter is configured for the backend; match the surrounding style.

### Frontend (`frontend/`)

```bash
pnpm install
pnpm dev --port 3123     # http://localhost:3123 (frontend/.env → NEXT_PUBLIC_API_URL)
pnpm build               # production build
pnpm lint                # eslint
```

`NEXT_PUBLIC_API_URL` **must include the `/api/v1` prefix** (see
[`frontend/.env.example`](frontend/.env.example)); the API client sends bare
paths like `/auth/login`.

## Architecture at a glance

```
frontend (Next.js) ──REST/JSON, Bearer JWT──▶ backend (FastAPI, DDD) ──SQL/pgvector──▶ Supabase
                                                    │
                                    Groq · Gemini · Langfuse
```

**Backend** is hexagonal, one folder per bounded context under
[`backend/app/contexts/`](backend/app/contexts/):

| Context | Responsibility | Module |
|---|---|---|
| `identity_access` | login, JWT, RBAC, users, seed | Auth / RBAC |
| `brand_identity` | brand manual + rule embeddings (RAG index) | I |
| `content_creation` | on-brand generation via RAG | II |
| `governance` | approval flow + multimodal audit | III |

Each context has the same four layers:

- `domain/` — models, invariants, ports (`Protocol` interfaces). No I/O.
- `application/` — use cases; orchestrate domain + ports.
- `infrastructure/` — adapters implementing ports (Postgres, Groq, Gemini, Langfuse).
- `interfaces/` — FastAPI router + dependency wiring (`deps.py`).

Routers are mounted under `/api/v1` in [`backend/app/main.py:44`](backend/app/main.py).

**Frontend** implements **no business logic** — it consumes the API and renders
state by role. All HTTP goes through [`frontend/lib/api.ts`](frontend/lib/api.ts);
types mirror the backend contract in [`frontend/lib/types.ts`](frontend/lib/types.ts).

## Project rules / conventions

- **Business logic lives in the backend only.** The frontend's RBAC
  ([`frontend/lib/roles.ts`](frontend/lib/roles.ts)) is UX; the real guard is the
  backend `require(action)` dependency ([`backend/app/contexts/identity_access/interfaces/deps.py:60`](backend/app/contexts/identity_access/interfaces/deps.py)).
- **Ports & adapters.** Domain and use cases depend on `Protocol` ports, never on
  concrete SDKs. Swap a provider by writing a new adapter and rewiring `deps.py`.
  See [how-to: add an LLM integration](docs/how-to/add-an-llm-integration.md).
- **Fail-fast config.** Missing required env vars crash on startup
  ([`backend/app/config.py:15`](backend/app/config.py)).
- **Domain errors → HTTP.** Use cases raise `DomainError`; routers translate to
  4xx ([`backend/app/shared/errors.py:1`](backend/app/shared/errors.py)).
- **RAG invariant: retrieve *before* generate.** Content generation and image
  audit query pgvector first, then feed rules into the prompt
  ([`backend/app/contexts/content_creation/application/generate_content.py:70`](backend/app/contexts/content_creation/application/generate_content.py)).
- **Observability is best-effort.** Tracing never breaks a use case
  (`SafeTracer`, [`backend/app/shared/tracing.py:40`](backend/app/shared/tracing.py)).
- **Separation of duties.** Each role owns exactly one stage; the RBAC matrix is
  the single source of truth ([`backend/app/contexts/identity_access/domain/models.py:22`](backend/app/contexts/identity_access/domain/models.py)).
- `ponytail:` comments mark deliberate MVP shortcuts with their upgrade path —
  respect them, don't "fix" them silently.

## Documentation tree

Everything else is under [`docs/`](docs/README.md), governed by its README:

- [`docs/architecture/`](docs/architecture/README.md) — one SDD per cross-cutting
  concern (auth, persistence, RAG, integrations, observability, security/PII,
  content lifecycle).
- [`docs/design/`](docs/design/README.md) — UI design system (tokens, patterns,
  component contracts).
- [`docs/tutorials/`](docs/tutorials/getting-started.md) — run it end-to-end.
- [`docs/how-to/`](docs/how-to/) — add a context, integration, or page.
- [`docs/glossary.md`](docs/glossary.md) — domain terms.
