# Glossary

Domain terms whose meaning isn't obvious from the code. Values in `CAPS` are
literal enum values used across backend and frontend.

| Term | Meaning |
|---|---|
| **Brand Manual** (`BrandManual`) | Aggregate root for a brand: its parameters plus a non-empty list of rules. Source of truth for consistency. Must have ≥1 rule ([`domain/models.py:59`](../backend/app/contexts/brand_identity/domain/models.py)). |
| **Brand Rule** (`BrandRule`) | One rule of the manual: `categoria`, `texto`, `tipo`. Indexed with an embedding for RAG retrieval. |
| **Rule type** (`tipo`) | `PROHIBICION` (forbidden), `RECOMENDACION` (recommended), `OBLIGACION` (mandatory). |
| **Brand Parameters** | Immutable value object of brand inputs. Only `nombre` is required; `categoria`/`tono`/`publico` and free-form `extras` are optional prompt signals. |
| **RAG** | Retrieval-Augmented Generation. Relevant brand rules are retrieved from pgvector by semantic similarity **before** the LLM generates, and injected into the prompt. |
| **Embedding** | 768-dim vector from Gemini `gemini-embedding-001` representing a rule's meaning; compared with cosine distance (`<=>`). |
| **Content** | Aggregate for one generated piece. Born `PENDIENTE`, transitions to `APROBADO`/`RECHAZADO`. Invariants live in the aggregate ([`domain/models.py:14`](../backend/app/contexts/content_creation/domain/models.py)). |
| **Content type** (`tipo`) | `DESCRIPCION` (product description), `GUION` (short video script), `PROMPT_IMAGEN` (English image-generation prompt). |
| **Content status** (`estado`) | `PENDIENTE` → `APROBADO` \| `RECHAZADO`. Only `PENDIENTE` can transition. |
| **Compliance guard** | Deterministic denylist backstop over generated text — a safety net beneath the LLM's rule-following ([`domain/compliance.py:12`](../backend/app/contexts/content_creation/domain/compliance.py)). |
| **Audit Report** (`AuditReport`) | Result of contrasting an image against the brand's visual rules. A `NO_CUMPLE` verdict must carry a reason. |
| **Verdict** (`veredicto`) | `CUMPLE` (passes) \| `NO_CUMPLE` (fails). A failing audit on a still-`PENDIENTE` content auto-rejects it. |
| **Role** (`rol`) | `SUPERADMIN`, `CREADOR`, `APROBADOR_A`, `APROBADOR_B`. |
| **Action** | Permission unit in the RBAC matrix: `CREATE_BRAND`, `GENERATE_CONTENT`, `APPROVE_CONTENT`, `AUDIT_IMAGE`, `MANAGE_USERS`. |
| **Permission matrix** | Role → allowed actions. Enforces strict separation of duties: each role owns exactly one stage ([`domain/models.py:22`](../backend/app/contexts/identity_access/domain/models.py)). |
| **Separation of duties** | The creator can't approve, approver A can't audit, etc. No role spans two stages — a governance requirement, not an accident of wiring. |
| **Port** | A `Protocol` interface in `domain/ports.py`. Use cases depend on ports, not concrete SDKs. |
| **Adapter** | A concrete implementation of a port in `infrastructure/` (e.g. `GroqTextLlm`, `PgVectorStore`). |
| **Use case** | A class in `application/` orchestrating domain + ports for one operation (`.execute(...)`). |
| **Tracer / Span** | Observability port. `SafeTracer` wraps Langfuse so a tracing failure never breaks a use case; `NullTracer` is the no-op default. |
| **Pooler (Supabase)** | Transaction-mode connection pooler on port 6543. Doesn't support prepared statements → `prepare_threshold=None`. |
| **Seed users** | One account per role created idempotently by `python -m app.contexts.identity_access.seed`. |
