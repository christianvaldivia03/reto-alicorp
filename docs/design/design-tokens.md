# Design Tokens

All tokens are CSS variables defined in
[`frontend/app/globals.css`](../../frontend/app/globals.css) and exposed to
Tailwind v4 via `@theme inline`. Colors are **oklch** for smooth transitions and
consistent dark mode. Consume them through Tailwind utilities
(`bg-card`, `text-brand-text`, `ring-success/25`), never as literals.

## Color roles (the 90/10 rule)

| Group | Tokens | Role |
|---|---|---|
| Neutrals (90%) | `background`, `foreground`, `card`, `muted`, `accent`, `secondary`, `border` | layout, surfaces, text |
| Primary | `primary` / `primary-foreground` | near-black navy for primary buttons/text (not pure gray) |
| Brand accent (10%) | `brand`, `brand-foreground`, `brand-text` | CTAs, focus ring, active nav, links |
| Semantic | `success`, `warning`, `destructive` (+ `-foreground`, `-text`) | state feedback |
| Charts | `chart-1..5` | data viz |
| Sidebar | `sidebar*` | nav shell surfaces |

## Semantic state → meaning (fixed)

| Token | Meaning | Used by |
|---|---|---|
| `warning` | Pending | `StatusBadge` PENDIENTE |
| `success` | Approved / success toast | `StatusBadge` APROBADO, success toast |
| `destructive` | Rejected / error | `StatusBadge` RECHAZADO, `ErrorAlert`, error toast |
| `brand` | Focus / active / CTA accent | nav active, focus ring, `PageHeader` icon |

## Contrast tokens (`*-text`)

Base tokens (`--brand`, `--success`, …) are used for backgrounds, rings, and
dots. Text placed over a `/10` tint uses the **darkened** variants to meet WCAG
AA (≥ 4.5:1): `--brand-text`, `--success-text`, `--warning-text`,
`--destructive-text` ([`globals.css:98`](../../frontend/app/globals.css)).
Pattern: `bg-success/10 text-success-text ring-success/25`.

## Radius & shadow

- `--radius: 0.7rem`; derived scale `--radius-sm … --radius-4xl` computed as
  multiples ([`globals.css:53`](../../frontend/app/globals.css)).
- `.shadow-premium` — soft, cool-tinted elevation (not flat black)
  ([`globals.css:277`](../../frontend/app/globals.css)).

## Typography

- Sans: **Plus Jakarta Sans** (`--font-jakarta`); Mono: **Geist Mono**.
  Loaded in [`layout.tsx:8`](../../frontend/app/layout.tsx), mapped to
  `--font-sans`/`--font-mono` in `@theme`.
- Numeric displays use `tabular-nums` (e.g. `StatCard`) for aligned figures.
- Body enables `cv11`, `ss01` font features + antialiasing
  ([`globals.css:228`](../../frontend/app/globals.css)).

## Dark mode

Three-way resolution: explicit `.dark` / `.light` class wins, else
`prefers-color-scheme` ([`globals.css:128`](../../frontend/app/globals.css) and
`:175`). A pre-paint inline script applies the saved theme to avoid FOUC
([`layout.tsx:58`](../../frontend/app/layout.tsx)); toggled by
[`components/ui/theme-toggle.tsx`](../../frontend/components/ui/theme-toggle.tsx).

## Utilities

| Utility | Purpose | Where |
|---|---|---|
| `.reveal` | fade + rise on viewport entry (reduced-motion aware) | [`globals.css:240`](../../frontend/app/globals.css) |
| `.skeleton` | shimmer placeholder (replaces spinners in lists) | [`globals.css:252`](../../frontend/app/globals.css) |
| `.shadow-premium` | premium cool-tinted shadow | [`globals.css:277`](../../frontend/app/globals.css) |

## Reference index

| What | Where |
|---|---|
| `@theme inline` token map | [`globals.css:7`](../../frontend/app/globals.css) |
| Light palette (`:root`) | [`globals.css:67`](../../frontend/app/globals.css) |
| Dark palette (`.dark`) | [`globals.css:128`](../../frontend/app/globals.css) |
| System-dark fallback | [`globals.css:175`](../../frontend/app/globals.css) |
| Base layer + selection | [`globals.css:224`](../../frontend/app/globals.css) |

## Maintenance checklist

- [ ] New color? Add light + dark + (if used as text-over-tint) a `*-text`
      variant, and register it in `@theme inline`.
- [ ] Verify AA contrast for any text-over-tint pairing.
- [ ] New animation? Gate it behind `prefers-reduced-motion`.
- [ ] Never hard-code a color in a component (except the documented `RoleBadge`).
