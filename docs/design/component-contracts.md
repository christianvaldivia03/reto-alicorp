# Component Contracts

The reusable building blocks. Prefer these over bespoke markup so screens stay
consistent. Primitives live in
[`frontend/components/ui-custom/`](../../frontend/components/ui-custom/) (app
-specific) and [`frontend/components/ui/`](../../frontend/components/ui/)
(shadcn / Base UI wrappers).

## `ui-custom/` primitives

| Component | Props | Contract | Source |
|---|---|---|---|
| `StatusBadge` | `status: ContentStatus \| string` | Pill + colored dot; maps PENDIENTE→warning, APROBADO→success, RECHAZADO→destructive; unknown → neutral fallback | [`status-badge.tsx:21`](../../frontend/components/ui-custom/status-badge.tsx) |
| `RoleBadge` | `role: Role` | Distinct hue per role (purple/cyan/orange/pink), light+dark; label from `ROLE_LABELS` | [`role-badge.tsx:11`](../../frontend/components/ui-custom/role-badge.tsx) |
| `RuleBadge` | rule type | Badge for `PROHIBICION`/`RECOMENDACION`/`OBLIGACION` | [`rule-badge.tsx`](../../frontend/components/ui-custom/rule-badge.tsx) |
| `StatCard` | `label, value, hint?, icon?, loading?` | KPI card; `tabular-nums` value; skeleton when `loading` | [`stat-card.tsx:5`](../../frontend/components/ui-custom/stat-card.tsx) |
| `PageHeader` | `title, description?, icon?, action?` | Standard page header; clamp-sized title, brand-tinted icon chip, right-aligned action slot | [`page-header.tsx:4`](../../frontend/components/ui-custom/page-header.tsx) |
| `EmptyState` | `title, description?, action?` | Centered icon + copy + optional CTA button | [`empty-state.tsx:10`](../../frontend/components/ui-custom/empty-state.tsx) |
| `ErrorAlert` | `message, onDismiss?` | `role="alert"` `aria-live="assertive"`; dismissible; destructive styling | [`error-alert.tsx:6`](../../frontend/components/ui-custom/error-alert.tsx) |
| `LoadingSpinner` | `size?` | Centered spinner for full-page/auth waits | [`loading-spinner.tsx`](../../frontend/components/ui-custom/loading-spinner.tsx) |

## `ui/` primitives (shadcn / Base UI)

`button`, `card`, `dialog`, `input`, `skeleton`, `theme-toggle`, `reveal` —
thin wrappers. Use them rather than raw HTML so tokens and focus states apply.
`Reveal` wraps content in the `.reveal` entrance animation; `ThemeToggle` flips
the `.dark`/`.light` class.

## Layout & guard contracts

### `AppLayout` — [`components/layout/app-layout.tsx:53`](../../frontend/components/layout/app-layout.tsx)
The authenticated shell: fixed sidebar (role-filtered nav + user card + logout),
top header (mobile menu, breadcrumb, theme toggle, email), scrollable `<main>`.
- **Nav source of truth:** `NAV_ITEMS` with per-item `roles`
  ([`app-layout.tsx:37`](../../frontend/components/layout/app-layout.tsx)).
- Active item styled with `bg-brand/10 text-brand-text` + `aria-current`.

### `ProtectedRoute` — [`components/protected-route.tsx:16`](../../frontend/components/protected-route.tsx)
Client guard. Props: `children`, optional `allow?: Role[]`.
- Not authenticated → redirect `/login`.
- Authenticated but role ∉ `allow` → redirect to role home.
- While auth resolves → `LoadingSpinner`.
- **UX only** — the backend is the real authority.

### Providers — [`app/layout.tsx:61`](../../frontend/app/layout.tsx)
`AuthProvider` (session) wraps `ToastProvider` (toast stack) at the root.
Access via `useAuth()` and `useToast()`.

## Data contract

Frontend types mirror the backend response shapes exactly and invent no fields
([`frontend/lib/types.ts:1`](../../frontend/lib/types.ts)). The typed API client
is the only allowed HTTP surface ([`frontend/lib/api.ts`](../../frontend/lib/api.ts)).

## Maintenance checklist

- [ ] Reuse an existing `ui-custom` primitive before writing new markup.
- [ ] New status/role/rule value? Extend the badge's config map (+ keep the
      neutral fallback).
- [ ] New page? Compose `PageHeader` + states; wrap in `AppLayout` +
      `ProtectedRoute`.
- [ ] Keep `lib/types.ts` in sync with backend DTOs when the contract changes.
