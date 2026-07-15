# How-to — Add a Bounded Context

Add a new backend domain following the hexagonal layout every context uses.
Use an existing one (e.g. `governance`) as the template.

## 1. Scaffold the four layers

```
backend/app/contexts/<name>/
  __init__.py
  domain/
    __init__.py
    models.py      # dataclasses + invariants (raise DomainError)
    ports.py       # Protocol interfaces for I/O
  application/
    __init__.py
    <use_case>.py  # class with .execute(...), depends on ports
  infrastructure/
    __init__.py
    postgres_repo.py   # adapter(s) implementing the ports
  interfaces/
    __init__.py
    router.py      # FastAPI APIRouter + Pydantic DTOs
    deps.py        # composition root: build use cases with real adapters
```

## 2. Domain first

- Put invariants in the aggregate's `__post_init__` / methods, not in use cases
  — mirror `Content.aprobar()`
  ([`content_creation/domain/models.py:34`](../../backend/app/contexts/content_creation/domain/models.py)).
- Declare I/O needs as `Protocol` ports
  ([`identity_access/domain/ports.py`](../../backend/app/contexts/identity_access/domain/ports.py)).
- Raise `DomainError` for business-rule violations
  ([`shared/errors.py:1`](../../backend/app/shared/errors.py)).

## 3. Use case

A class taking ports via the constructor, exposing `.execute(...)`. Accept an
optional `tracer` (default `NullTracer`) and wrap any AI call in `tracer.span`
— see [observability](../architecture/observability.md). Template:
[`governance/application/approve_content.py:18`](../../backend/app/contexts/governance/application/approve_content.py).

## 4. Infrastructure

- Persistence adapters borrow a pooled connection with `with connect() as conn:`
  and use plain SQL ([`content_creation/infrastructure/postgres_repo.py:17`](../../backend/app/contexts/content_creation/infrastructure/postgres_repo.py)).
- Add any new tables to `_DDL` as `create/alter ... if not exists`
  ([`shared/db.py:12`](../../backend/app/shared/db.py)) — keep `init_db()` idempotent.

## 5. Interfaces

- `deps.py` is the composition root — construct use cases with concrete
  adapters; these are overridable in tests via `app.dependency_overrides`
  ([`governance/interfaces/deps.py:28`](../../backend/app/contexts/governance/interfaces/deps.py)).
- Router: define Pydantic DTOs, guard writes with `require(Action.X)` and reads
  with `get_current_user`, and translate `DomainError` → `HTTPException`
  ([`governance/interfaces/router.py:66`](../../backend/app/contexts/governance/interfaces/router.py)).
- If you add a new action, extend `Action` + the RBAC matrix
  ([`identity_access/domain/models.py:14`](../../backend/app/contexts/identity_access/domain/models.py)) —
  see [auth](../architecture/authentication-authorization.md).

## 6. Mount the router

Add it in [`main.py:44`](../../backend/app/main.py) under the `/api/v1` prefix:

```python
from app.contexts.<name>.interfaces.router import router as <name>_router
app.include_router(<name>_router, prefix=_API)
```

## 7. Test

Add `tests/unit/<name>/` with fakes (see [`tests/fakes.py`](../../backend/tests/fakes.py))
and, if it hits an endpoint, a `tests/e2e/` test overriding `deps.py`. Run
`pytest`.

## Checklist

- [ ] Four layers, dependencies pointing inward (domain has no I/O imports).
- [ ] Invariants in the aggregate; `DomainError` for rule violations.
- [ ] Ports as `Protocol`; adapters in `infrastructure/`.
- [ ] Router guarded by `require(...)` / `get_current_user`; DTOs defined.
- [ ] New tables idempotent in `_DDL`; new actions in the RBAC matrix.
- [ ] Router mounted under `/api/v1`; unit + e2e tests pass.
