# Documentation

Navigable docs for **Content Suite** ("Prisma"), organized by the
**Diátaxis × arc42** model: architecture is split by *domain* and one file per
*cross-cutting concern*; UI has its own design system; task recipes and a
learning path sit alongside.

> All docs are in **English**. Every `path:line` reference is verified against
> the code at the time of writing — if a line drifts, the maintenance checklist
> in each SDD is where you re-anchor it.

## How this tree is governed

| Diátaxis quadrant | Purpose | Where |
|---|---|---|
| **Tutorials** | Learning-oriented, start-to-finish | [`tutorials/`](tutorials/) |
| **How-to guides** | Task-oriented recipes | [`how-to/`](how-to/) |
| **Reference + Explanation** | arc42 Solution Design Docs (SDDs) | [`architecture/`](architecture/) |
| **Design system** | UI patterns, contracts, non-negotiables | [`design/`](design/) |

**Rule:** one file per concern, no duplication — link between docs instead of
repeating. When you add a doc, register it in the relevant index (`architecture/README.md`
or `design/README.md`) so this tree stays discoverable.

## Map

### Start here
- [Getting started](tutorials/getting-started.md) — run backend + frontend, seed
  users, drive a full brand → content → approval → audit loop.

### Architecture — [`architecture/README.md`](architecture/README.md)
Bounded-context map, C4 view, and one SDD per cross-cutting concern:

| SDD | Concern |
|---|---|
| [authentication-authorization](architecture/authentication-authorization.md) | JWT (access/refresh) + RBAC matrix |
| [persistence](architecture/persistence.md) | Postgres/Supabase pooler, DDL, idempotent migrations |
| [rag-retrieval](architecture/rag-retrieval.md) | Embeddings + pgvector, retrieve-before-generate |
| [external-integrations](architecture/external-integrations.md) | Groq (text), Gemini (embeddings + vision) |
| [observability](architecture/observability.md) | Langfuse tracing, SafeTracer |
| [security-and-pii](architecture/security-and-pii.md) | Hashing, secrets, CORS, prod hardening |
| [content-lifecycle](architecture/content-lifecycle.md) | Content state machine + governance + audit |

> **No jobs/queues SDD:** the system has no background workers — every use case
> is synchronous request/response. See `architecture/README.md` for the rationale.

### Design — [`design/README.md`](design/README.md)
- [design-tokens](design/design-tokens.md) — oklch palette, 90/10 flat-design rule, dark mode
- [interaction-patterns](design/interaction-patterns.md) — RBAC nav, loading/empty/error, toasts
- [component-contracts](design/component-contracts.md) — ui-custom + layout/route guards

### How-to
- [Add a bounded context](how-to/add-a-bounded-context.md)
- [Add an LLM integration](how-to/add-an-llm-integration.md)
- [Add a frontend page](how-to/add-a-frontend-page.md)

### Reference
- [Glossary](glossary.md) — domain terms that aren't obvious from the code.

## SDD anatomy

Every file in `architecture/` follows the same skeleton so they're scannable:

1. **Metadata table** — status, owner scope, source-of-truth paths.
2. **TL;DR** — the concern in three sentences.
3. **Flow / component diagram** — mermaid.
4. **Reference index** — verified `path:line` anchors into the code.
5. **Maintenance checklist** — what to re-check when the code changes.
