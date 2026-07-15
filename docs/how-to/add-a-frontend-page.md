# How-to — Add a Frontend Page

Add a role-gated screen to the Next.js App Router frontend. The frontend is
presentation-only: it calls the API and renders state. Patterns:
[design/interaction-patterns](../design/interaction-patterns.md).

## 1. Add the API call (if new)

Put every HTTP call in the typed client — pages never `fetch` directly. Add a
method to the relevant group in [`frontend/lib/api.ts`](../../frontend/lib/api.ts)
(`authApi` / `brandApi` / `contentApi` / `usersApi`):

```ts
export const contentApi = {
  // ...
  myThing: (id: string): Promise<MyType> => request(`/content/${id}/thing`),
};
```

If the response is a new shape, mirror the backend DTO in
[`frontend/lib/types.ts`](../../frontend/lib/types.ts) — invent no fields.

## 2. Create the route

Add `frontend/app/<area>/<page>/page.tsx`. Wrap it in the guard + shell and
declare which roles may see it:

```tsx
'use client';
import { ProtectedRoute } from '@/components/protected-route';
import { AppLayout } from '@/components/layout/app-layout';
import { PageHeader } from '@/components/ui-custom/page-header';
import { Role } from '@/lib/types';

export default function MyPage() {
  return (
    <ProtectedRoute allow={[Role.CREADOR]}>
      <AppLayout>
        <div className="mx-auto max-w-5xl p-4 lg:p-6">
          <PageHeader title="My Page" description="…" />
          {/* content: skeletons while loading, EmptyState when empty, ErrorAlert/toast on failure */}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
```

## 3. Register route access + navigation

- Add the path → roles mapping to `ROUTE_ROLES`
  ([`frontend/lib/roles.ts:12`](../../frontend/lib/roles.ts)).
- Add a `NAV_ITEMS` entry (label, href, `roles`, lucide `icon`) so it appears in
  the sidebar for the right roles
  ([`app-layout.tsx:37`](../../frontend/components/layout/app-layout.tsx)).

## 4. Use the design system

- Reuse `ui-custom` primitives (`PageHeader`, `StatCard`, `StatusBadge`,
  `EmptyState`, `ErrorAlert`, `LoadingSpinner`) — see
  [component-contracts](../design/component-contracts.md).
- Colors only via tokens; skeletons for loading; show the API's `detail` on
  error; feedback via `useToast()`.

## 5. Data & auth

- Read the current user with `useAuth()`
  ([`auth-context.tsx:75`](../../frontend/contexts/auth-context.tsx)).
- The client auto-attaches the Bearer token and refreshes on 401
  ([`api.ts:67`](../../frontend/lib/api.ts)) — don't handle tokens in the page.

## Checklist

- [ ] All HTTP via `lib/api.ts`; new shapes typed in `lib/types.ts`.
- [ ] Page wrapped in `ProtectedRoute allow={[...]}` + `AppLayout`.
- [ ] `ROUTE_ROLES` + `NAV_ITEMS` updated for the same roles.
- [ ] Loading/empty/error states use the standard primitives.
- [ ] No business logic in the page — remember the backend enforces real access.
