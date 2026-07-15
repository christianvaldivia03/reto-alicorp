# Design System — Prisma

The frontend's UI system. It exists to keep every screen visually and
behaviorally consistent while the frontend stays **presentation-only** (no
business logic — that's the backend's job).

Design language: **refined Flat Design**, generated via the `ui-ux-pro-max`
skill, following a **90/10 rule** — 90% cool neutrals (slate), 10% brand accent
(blue) reserved for CTAs, focus, and active state
([`app/globals.css:62`](../../frontend/app/globals.css)).

## Index

| Doc | Covers |
|---|---|
| [design-tokens](design-tokens.md) | oklch palette, semantic colors, dark mode, radius/shadow, typography |
| [interaction-patterns](interaction-patterns.md) | RBAC-driven nav, loading/empty/error states, toasts, motion, a11y |
| [component-contracts](component-contracts.md) | `ui-custom/` primitives + layout & route-guard contracts |

## Non-negotiable rules

1. **Color only through tokens.** Never hard-code a hex/oklch in a component;
   use the CSS-variable-backed Tailwind tokens (`bg-brand`, `text-muted-foreground`,
   `ring-success/25`, …). The one sanctioned exception is `RoleBadge`, which uses
   Tailwind's named palette for four distinct role hues
   ([`components/ui-custom/role-badge.tsx:4`](../../frontend/components/ui-custom/role-badge.tsx)).
2. **90/10 discipline.** Brand blue is an accent, not a background. Neutrals
   carry the layout.
3. **Semantic state colors are fixed.** `warning` = pending, `success` =
   approved, `destructive` = rejected/error — same everywhere
   ([`status-badge.tsx:3`](../../frontend/components/ui-custom/status-badge.tsx)).
4. **WCAG AA text contrast.** Text over a `/10` tint uses the darkened
   `*-text` tokens (`--brand-text`, `--success-text`, …) to stay ≥ 4.5:1
   ([`app/globals.css:98`](../../frontend/app/globals.css)).
5. **Both themes always.** Every color has a light and dark value; the theme is
   applied before paint to avoid FOUC
   ([`app/layout.tsx:58`](../../frontend/app/layout.tsx)).
6. **Respect `prefers-reduced-motion`.** Reveal/shimmer animations disable
   themselves ([`app/globals.css:284`](../../frontend/app/globals.css)).
7. **Reuse `ui-custom/` primitives.** Don't reinvent a badge, empty state, or
   header — see [component-contracts](component-contracts.md).

## Where things live

```
frontend/
  app/globals.css            ← tokens, 90/10 palette, utilities (reveal, skeleton, shadow-premium)
  app/layout.tsx             ← fonts, metadata, theme-before-paint, providers
  components/
    ui/                      ← shadcn/Base UI primitives (button, card, dialog, input, skeleton, theme-toggle)
    ui-custom/               ← app-specific primitives (badges, cards, states)
    layout/app-layout.tsx    ← sidebar + header shell, role-filtered nav
    protected-route.tsx      ← client-side route guard (UX only)
  contexts/
    auth-context.tsx         ← session state
    toast-context.tsx        ← toast stack
```
