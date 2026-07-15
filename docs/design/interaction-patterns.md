# Interaction Patterns

How the UI behaves. These patterns are consistent across every screen so users
learn them once.

## RBAC-driven navigation

The frontend renders **only** what the current role can use — but this is UX,
not security (the backend enforces 401/403).

- Sidebar nav items are filtered by `user.rol`
  ([`app-layout.tsx:58`](../../frontend/components/layout/app-layout.tsx)); item
  visibility is declared per-item via `roles`
  ([`app-layout.tsx:37`](../../frontend/components/layout/app-layout.tsx)).
- Route access is declared in `ROUTE_ROLES` and checked with `canAccess`
  ([`frontend/lib/roles.ts:12`](../../frontend/lib/roles.ts)).
- After login and from `/`, users land on `/dashboard` (role dashboard), not a
  bare form ([`roles.ts:7`](../../frontend/lib/roles.ts)).
- Superadmin-only "Observabilidad" link appears when
  `NEXT_PUBLIC_LANGFUSE_URL` is set ([`app-layout.tsx:60`](../../frontend/components/layout/app-layout.tsx)).

## Session & auth flow

- Session rehydrates on load via `/auth/me` if a token exists
  ([`auth-context.tsx:24`](../../frontend/contexts/auth-context.tsx)).
- All HTTP goes through one client; a 401 on a non-auth route triggers a single
  transparent refresh + retry, else redirect to `/login`
  ([`frontend/lib/api.ts:83`](../../frontend/lib/api.ts)).
- `ProtectedRoute` guards client routes: unauthenticated → `/login`,
  wrong-role → role home; shows a spinner while auth resolves
  ([`protected-route.tsx:16`](../../frontend/components/protected-route.tsx)).

## Loading / empty / error states

| State | Pattern | Component |
|---|---|---|
| Loading (list/table) | shimmer skeletons, not spinners | `.skeleton` / `Skeleton`, `StatCard loading` |
| Loading (full page/auth) | centered spinner | `LoadingSpinner` |
| Empty | icon + title + description + optional action | `EmptyState` |
| Inline error | dismissible red alert, `role="alert"` | `ErrorAlert` |
| Transient feedback | auto-dismissing toast (3.5s) | `useToast()` |

- Errors from the API arrive as `ApiError` with the backend's `detail` string —
  surface that message directly ([`api.ts:94`](../../frontend/lib/api.ts)).
- Toasts: `success` (green) or `error` (red); the stack lives bottom-right and is
  screen-reader announced (`status`/`alert`)
  ([`toast-context.tsx:31`](../../frontend/contexts/toast-context.tsx)).

## Motion

- `.reveal` for on-scroll entrance (fade + 12px rise); `.skeleton` shimmer for
  loading. Both no-op under `prefers-reduced-motion`
  ([`globals.css:284`](../../frontend/app/globals.css)).

## Accessibility baseline

- Focus ring uses `--ring` (brand) via `outline-ring/50` on all elements
  ([`globals.css:225`](../../frontend/app/globals.css)).
- Alerts/toasts set `role` + `aria-live`; icon-only buttons have `aria-label`
  (e.g. sidebar close, error dismiss).
- Active nav marks `aria-current="page"`; breadcrumb marks the current page
  ([`app-layout.tsx:100`](../../frontend/components/layout/app-layout.tsx)).
- Mobile sidebar has an overlay + labeled open/close buttons.

## Maintenance checklist

- [ ] New route? Add it to `ROUTE_ROLES`, add a nav item with `roles`, and wrap
      the page in `ProtectedRoute allow={[...]}`.
- [ ] New async view? Use skeletons for lists, `EmptyState` for empties,
      `ErrorAlert`/toast for failures — don't invent new patterns.
- [ ] Show the API's `detail` message on error; don't swallow it.
- [ ] Any new animation respects reduced-motion.
