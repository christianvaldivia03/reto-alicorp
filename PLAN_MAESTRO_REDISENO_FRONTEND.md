# Plan Maestro de Rediseño y Refactorización del Frontend — Content Suite

> **Estado:** Propuesta de diseño (no implementada).
> **Guía rectora:** skill **UX-UI-Pro-Max** para todas las decisiones de UX/UI.
> **Objetivo de nivel:** experiencia *enterprise* comparable a Stripe, Linear, Notion, GitHub, Vercel y Figma.
> **Stack:** Next.js 16 (App Router) · React 19 · Tailwind v4 · base-ui · lucide-react.
> **Fecha:** 2026-07-13.

---

## 0. Diagnóstico honesto del estado actual

Antes de proponer, hay que ser exacto: el frontend **no parte de cero ni está "roto"**. Ya existe una base sólida que conviene conservar y formalizar, no tirar:

**Lo que ya está bien (conservar):**
- Sistema de tokens en `oklch` con dark mode completo (`globals.css`), regla 90/10 (neutros fríos + acento de marca).
- Primitivas unificadas (`Button` con CVA, `Input/Select/Textarea/Field`, `Card`, `Dialog`, `Skeleton`).
- Shell con sidebar por rol, `PageHeader` consistente, `Reveal` con respeto a `prefers-reduced-motion`.
- Estados vacíos y skeletons ya presentes en varias pantallas (approvals, audit, users).

**Gaps reales que impiden el nivel enterprise (esto es lo que se refactoriza):**

| # | Problema | Evidencia | Impacto |
|---|----------|-----------|---------|
| G1 | **Uso de color inconsistente**: se hardcodea `emerald-*` / `red-*` de Tailwind en vez de los tokens semánticos `success` / `destructive`. | `audit/page.tsx` (badges de veredicto), `admin/users/page.tsx` (badge de estado). | Rompe la coherencia de la paleta y el dark mode. |
| G2 | **No hay dashboard/landing por rol**: `/` solo redirige al primer ítem de nav. Un CREADOR aterriza en un formulario sin contexto. | `app/page.tsx`, `lib/roles.ts`. | Falta de orientación; se siente "app de formularios", no un producto. |
| G3 | **Formularios con ritmo y densidad dispares**: `space-y-4` suelto en Marcas vs. grid en Usuarios; sin escala de espaciado formal ni `hint`/validación inline por campo. | brand/content/users. | Percepción de "poco profesional". |
| G4 | **Listas sin metadata, filtros ni búsqueda**: colas y tablas no muestran autor/marca/fecha ni permiten filtrar/paginar. | approvals, audit, users. | No escala; no se siente enterprise. |
| G5 | **Feedback de errores solo visual**: sin `role="alert"`/`aria-live` garantizado. | `ErrorAlert` en todas las páginas. | Falla accesibilidad (WCAG). |
| G6 | **Tipografía única sin datos tabulares**: IDs, fechas y conteos usan la sans proporcional; no hay `font-mono`/`tabular-nums`. | Toda la app. | Datos "bailan" y cuesta escanear. |
| G7 | **Navegación plana**: header solo repite el título; sin breadcrumbs ni jerarquía. | `app-layout.tsx`. | Orientación pobre en flujos profundos. |

> **Sobre UX-UI-Pro-Max:** el motor (`--design-system`) confirma que el patrón correcto es **Data-Dense Dashboard** (WCAG AA, rendimiento excelente), acento **indigo + CTA emerald**, y tipografía **Minimal Swiss (Inter)** para paneles de administración. El sistema actual ya va en esa dirección; el plan lo **formaliza y corrige**, no lo reinventa.

---

## 1. Visión del nuevo diseño

> **"Una herramienta de gobierno de marca que se siente inevitable."**

Content Suite debe transmitir **precisión, confianza y control**. Cada pantalla es un panel operativo donde un profesional (creador, aprobador o admin) toma decisiones con consecuencias. El diseño prioriza **densidad legible, jerarquía clara y retroalimentación instantánea** por encima de la ornamentación. La referencia mental es **Linear (velocidad y foco) + Stripe (claridad de datos y formularios) + GitHub (flujos de revisión/aprobación)**.

Principios de la visión:
1. **Calma sobre ruido** — 90% neutros fríos, 10% acento. El color significa algo (estado, acción, foco).
2. **El dato manda** — números tabulares, tablas escaneables, estados siempre visibles.
3. **Cero pantallas muertas** — todo estado (carga, vacío, error) es diseñado, nunca un hueco en blanco.
4. **Un solo sistema** — mismos tokens, mismos componentes, mismo ritmo en las 8 pantallas.

---

## 2. Objetivos del rediseño

| Objetivo | Métrica de éxito |
|----------|------------------|
| O1. Coherencia visual total | 0 colores hardcodeados fuera de tokens; 1 sola escala de espaciado/tipografía. |
| O2. Nivel enterprise percibido | Todas las pantallas pasan el *Pre-Delivery Checklist* de UX-UI-Pro-Max. |
| O3. Accesibilidad WCAG 2.1 AA | Contraste ≥4.5:1, foco visible, `role=alert` en errores, navegación por teclado. |
| O4. Orientación por rol | Cada rol tiene un *home* con contexto, no un formulario suelto. |
| O5. Escalabilidad de listas | Búsqueda + filtros + paginación en colas y tablas. |
| O6. Responsive real | Sin scroll horizontal y usable en 375 / 768 / 1024 / 1440 px. |
| O7. Consistencia de estados | Loading/empty/error con un patrón único reutilizable. |

---

## 3. Principios de UX y UI

**UX (basados en UX-UI-Pro-Max, prioridad CRITICAL→LOW):**
- **Accesibilidad primero**: `label` + `for`, `aria-label` en botones-icono, `role="alert"`/`aria-live` en feedback, foco visible, orden de tab = orden visual.
- **Touch & interacción**: objetivos ≥44×44px, `cursor-pointer` en todo lo clicable, botones deshabilitados durante async, errores junto al problema.
- **Rendimiento**: reservar espacio para contenido async (evitar *layout shift*), `prefers-reduced-motion`, lazy en imágenes.
- **Feedback**: nunca UI congelada; skeleton/spinner en toda operación; toasts para confirmaciones no bloqueantes; diálogos para acciones destructivas.

**UI:**
- **Jerarquía tipográfica** de 6 niveles fija (ver §6).
- **Escala de espaciado** basada en 4px (ver §7).
- **Color con significado** (ver §5): acento = acción/foco; semánticos = estado.
- **Consistencia de componentes**: un `Button`, un `Field`, un `Table`, un `EmptyState` para toda la app.
- **Microinteracciones sobrias**: 150–300ms, `transform/opacity`, sin *scale* que desplace layout.

---

## 4. Uso de UX-UI-Pro-Max en cada etapa

| Etapa del proyecto | Comando / dominio | Qué aporta |
|--------------------|-------------------|------------|
| Fundamentos (Fase 0) | `--design-system --persist -p "Content Suite"` | Genera `design-system/MASTER.md` como fuente de verdad. |
| Cada pantalla | `--design-system --persist --page "<pantalla>"` | Override específico en `design-system/pages/<pantalla>.md`. |
| Tipografía | `--domain typography "enterprise dashboard"` | Confirma **Inter (Minimal Swiss)**. |
| Color | `--domain color "saas dashboard"` | Valida indigo + emerald sobre neutros. |
| Formularios/estados | `--domain ux "forms accessibility loading empty error"` | Reglas de error placement, empty states, loading. |
| Tablas/datos densos | `--domain style "data-dense dashboard"` | Patrón Data-Dense Dashboard. |
| Gráficos (dashboards por rol) | `--domain chart "trend comparison funnel"` | Tipo de gráfico por métrica. |
| Implementación | `--stack nextjs` y `--stack shadcn` | Buenas prácticas de Next/React y patrones de componentes. |
| Cierre de cada fase | *Pre-Delivery Checklist* de la skill | Verificación obligatoria antes de dar por hecha la fase. |

**Regla operativa:** ninguna fase se implementa sin (1) consultar el dominio relevante de la skill y (2) pasar su checklist al cerrar.

---

## 5. Design System propuesto

### 5.1 Filosofía
Formalizar el sistema existente como **"Data-Dense Dashboard refinado"** (validado por UX-UI-Pro-Max). Regla **90/10**: 90% neutros fríos slate, 10% acento indigo. Los semánticos (success/warning/destructive) solo comunican estado.

### 5.2 Paleta de colores

**Se mantiene el sistema `oklch` de `globals.css` y se corrige G1** (prohibido usar `emerald-*`/`red-*` crudos: siempre tokens).

| Token | Light (oklch) | Uso |
|-------|---------------|-----|
| `--background` | `0.994 0.002 250` | Fondo app |
| `--foreground` | `0.21 0.03 264` | Texto principal (contraste ≥ 12:1) |
| `--card` | `1 0 0` | Superficies |
| `--muted-foreground` | `0.5 0.02 260` | Texto secundario (≥ 4.5:1 — **mínimo permitido**) |
| `--primary` | `0.24 0.03 264` | Botón primario (navy) |
| `--brand` (acento 10%) | `0.55 0.19 258` | Foco, links, estado activo, CTA |
| `--success` | `0.6 0.14 155` | Aprobado / Cumple |
| `--warning` | `0.75 0.15 75` | Pendiente / atención |
| `--destructive` | `0.58 0.22 25` | Rechazado / No cumple / eliminar |
| `--border` | `0.922 0.005 255` | Bordes |
| `--ring` | `= --brand` | Anillo de foco |

Dark mode ya definido con los mismos tokens desplazados en luminosidad. **Regla:** todo componente usa `bg-success/10 text-success ring-success/20` (etc.), nunca `bg-emerald-50 text-emerald-800`.

**Escala de datos (charts)** — `--chart-1..5` ya existen (indigo, teal, green, amber, red); accesibles y distinguibles en ambos modos.

### 5.3 Tipografía

UX-UI-Pro-Max → **Minimal Swiss (Inter)** para paneles enterprise (es la familia de Stripe/Linear/Vercel/GitHub).

| Rol | Fuente | Notas |
|-----|--------|-------|
| Sans (UI/headings/body) | **Inter** (var) | Reemplaza/complementa Plus Jakarta. `font-feature-settings: 'cv11','ss01'`. |
| Mono (datos/IDs/código) | **Geist Mono** (ya presente) | IDs, fechas, tokens, conteos. |
| Numérico | `tabular-nums` (feature de Inter) | Tablas, contadores, métricas — corrige G6. |

**Escala tipográfica (6 niveles fija):**

| Nivel | Tamaño | Peso | Uso |
|-------|--------|------|-----|
| Display | `clamp(1.5rem,3vw,2rem)` | 700 | Título de página (`PageHeader`) |
| H2 | `1.125rem` (18) | 600 | Título de card/sección |
| H3 | `0.875rem` (14) upper | 600 | Etiquetas de grupo (uppercase, tracking-wide) |
| Body | `0.875rem` (14) | 400 | Texto general, line-height 1.6 |
| Small | `0.8rem` (13) | 400/500 | Metadata, hints |
| Micro | `0.75rem` (12) | 500 | Badges, chips, timestamps |

**Reglas:** line-height 1.5–1.75 en cuerpo; largo de línea 65–75ch (`max-w-2xl`/`prose`); 16px mínimo en móvil para inputs.

### 5.4 Sistema de espaciado (base 4px)

| Token | px | Uso |
|-------|----|----|
| `space-1` | 4 | Micro-gaps (icono↔texto) |
| `space-2` | 8 | Gap intra-componente |
| `space-3` | 12 | Padding de controles compactos |
| `space-4` | 16 | Padding de card / gap de campos de form |
| `space-6` | 24 | Padding de card (`CardHeader/Content`), gap de grid |
| `space-8` | 32 | Separación entre secciones |
| `space-12` | 48 | Padding de página (desktop) |

**Radios:** `--radius: 0.7rem`; cards `rounded-2xl`, controles `rounded-lg`, chips `rounded-full`.
**Sombras:** `shadow-premium` (tinte frío) para elevación; sin sombras negras planas.

### 5.5 Grid y layouts

- **Contenedores:** ancho máximo **único por tipo de vista** — formularios `max-w-4xl/5xl`, tablas/master-detail `max-w-7xl`. (Corrige mezcla actual de anchos.)
- **Shell:** sidebar fija 256px (`lg`), colapsable en móvil con overlay; header sticky 64px con blur.
- **Master-detail** (colas/auditoría): `lg:grid-cols-3` → lista `col-span-1`, detalle `col-span-2`.
- **Formulario + resultado** (marca): `lg:grid-cols-5` → form `col-span-2` sticky, resultado `col-span-3`.
- **Padding de página:** `p-4 md:p-6 lg:p-8` (estándar en toda la app).

### 5.6 Componentes reutilizables (biblioteca objetivo)

**Existentes a conservar/refinar:** `Button`, `Input/Select/Textarea/Field/Label`, `Card*`, `Dialog`, `Skeleton/SkeletonCard`, `Reveal`, `ThemeToggle`, `PageHeader`, `RoleBadge`, `StatusBadge`, `RuleTypeBadge`, `ErrorAlert`, `EmptyState`, `LoadingSpinner`, `ProtectedRoute`, `AppLayout`.

**Nuevos a construir:**
| Componente | Por qué | Fase |
|-----------|---------|------|
| `DataTable` | Tabla con header sticky, orden, densidad, skeleton y empty integrados (users y futuras listas). | 0/7 |
| `Toolbar` (search + filtros) | Búsqueda/filtrado consistente en colas y tablas (G4). | 0 |
| `Breadcrumbs` | Orientación jerárquica en header (G7). | 2 |
| `StatCard` / `MetricTile` | KPIs de los dashboards por rol (G2). | 2 |
| `Avatar` (iniciales) | Marca/usuario; ya usado ad-hoc, formalizar. | 0 |
| `RulePill` / `RuleCard` | Reglas RAG y chips aplicados (unificar 3 variantes actuales). | 3 |
| `FileDropzone` | Extraer el dropzone de auditoría a componente reutilizable. | 6 |
| `Pagination` | Listas largas. | 7 |
| `ConfirmDialog` | Envoltura estándar sobre `Dialog` para destructivos. | 0 |
| `FormRow` / `FieldError` | Validación inline por campo (G3, error placement). | 0 |
| `PageState` | Un componente que resuelve loading/empty/error (G7). | 0 |

### 5.7 Formularios

Reglas UX-UI-Pro-Max (dominio `ux → Forms`):
- **Un label por campo** (`Field` ya lo hace) + `hint` opcional debajo.
- **Error placement:** mensaje **bajo el campo** afectado (`FieldError`), no solo al tope del form.
- **Validación:** deshabilitar submit hasta validez (ya se hace); estados `aria-invalid`.
- **Ritmo:** `space-y-4` entre campos, `space-y-6` entre grupos — **estandarizar** (hoy varía).
- **Botón de envío:** ancho completo en móvil, con spinner + texto ("Generando…"), deshabilitado durante async.
- **Inputs:** altura 40px (`h-10`), 16px en móvil, foco `ring-brand/25`.
- **Selects:** chevron propio ya implementado; mantener.

### 5.8 Tablas

Patrón **Data-Dense** (nuevo `DataTable`):
- Header sticky, `bg-muted/40`, uppercase micro, `tracking-wide`.
- Filas con `hover:bg-muted/40`, divisores `divide-border`.
- **Datos numéricos/ID:** `font-mono tabular-nums`.
- **Acciones:** agrupadas a la derecha; destructivas via `ConfirmDialog`.
- **Estados integrados:** skeleton de filas (ya en users), empty row diseñado, error.
- **Escala:** `Toolbar` (search+filtros) + `Pagination`.
- Refactor concreto: en Usuarios, separar **badge de rol** (lectura) del **cambio de rol** (mover a menú de acciones o edición explícita, no un `Select` pegado al badge).

### 5.9 Dashboards (nuevos, por rol)

Cada rol recibe un *home* con contexto (resuelve G2). Patrón: fila de `StatCard` + lista/acción principal.

| Rol | KPIs sugeridos | Acción principal |
|-----|----------------|------------------|
| CREADOR | Marcas activas · Contenidos generados · % aprobados | "Generar contenido" |
| APROBADOR_A | Pendientes en cola · Aprobados hoy · Tiempo medio | "Ir a la cola" |
| APROBADOR_B | Imágenes por auditar · % cumple · Rechazos | "Auditar imagen" |
| SUPERADMIN | Usuarios activos · por rol · Actividad · link Observabilidad | "Gestionar usuarios" |

### 5.10 Gráficos

UX-UI-Pro-Max (dominio `chart`) + tokens `--chart-1..5`:
- **Tendencia** (aprobaciones/tiempo) → línea/área.
- **Comparación** (contenido por tipo/estado) → barras.
- **Composición** (usuarios por rol) → donut (máx 4–5 segmentos).
- **Embudo** (generado→pendiente→aprobado) → funnel.
- Reglas: paleta accesible de tokens, tooltips en hover, **alternativa en tabla** para lectores de pantalla, sin 3D ni ornamento.
- Librería sugerida: Recharts o visx (ligeras, theming por CSS vars). *YAGNI: solo si se aprueban los dashboards de Fase 2.*

### 5.11 Navegación

- **Sidebar por rol** (ya existe) — refinar: sección "Espacio de trabajo", ítem activo con `bg-brand/10 text-brand`, footer con usuario + logout.
- **Header** — añadir `Breadcrumbs` (G7) + acciones contextuales (a la derecha: theme, usuario).
- **Home por rol** (`homeForRole`) → apunta al **dashboard** de cada rol, no al primer formulario.
- **Estados de nav:** hover, activo, foco por teclado; `aria-current="page"` (ya presente).

### 5.12 Microinteracciones

- Hover: transición de **color/opacidad/borde** 150–200ms; nunca `scale` que mueva layout.
- Foco: anillo `ring-brand/25` visible en todo control.
- Selección (master-detail): `border-brand bg-brand/5 ring-brand/20` (ya usado — estandarizar).
- Botones: `active:translate-y-px` (ya en `Button`).
- Toasts: entrada/salida suave; auto-dismiss.

### 5.13 Animaciones

- `Reveal`: fundido + subida 12px, 500ms, `cubic-bezier(.25,1,.5,1)` (ya existe).
- Skeleton shimmer 1.6s (ya existe).
- **Regla global:** todo animable respeta `@media (prefers-reduced-motion: reduce)` (ya implementado — mantener en componentes nuevos).
- Transiciones de layout via `transform/opacity` únicamente.

### 5.14 Accesibilidad (WCAG 2.1 AA — CRITICAL)

- Contraste texto ≥4.5:1 (body), ≥3:1 (UI grande). `muted-foreground` es el piso.
- **`role="alert"` / `aria-live="assertive"` en `ErrorAlert`** (corrige G5).
- Foco visible en 100% de interactivos; orden de tab = visual.
- `aria-label` en botones-icono (editar/eliminar/cerrar) — ya presente en su mayoría, auditar.
- Labels asociados (`Field`), `aria-invalid` + `aria-describedby` para errores de campo.
- Color nunca es el único indicador (añadir icono/texto a estados).
- Navegación por teclado completa en diálogos (focus-trap) y master-detail.

### 5.15 Responsive Design

- Breakpoints: **375 / 768 / 1024 / 1440**.
- Sin scroll horizontal; tablas en contenedor `overflow-x-auto`.
- Sidebar → drawer con overlay en `<lg`.
- Grids master-detail y form/resultado → 1 columna en móvil.
- Inputs 16px en móvil (evita zoom iOS).
- Objetivos táctiles ≥44px.

### 5.16 Estados de carga, error y vacío

Unificar en **`PageState`** + patrones fijos:
- **Loading:** skeletons que reservan el espacio final (no spinners sueltos salvo acciones puntuales).
- **Empty:** icono + mensaje + acción (ej. "Aún no hay marcas → Crear la primera"). Nunca hueco en blanco.
- **Error:** `ErrorAlert` con `role="alert"`, mensaje claro, acción de reintento cuando aplique; errores de campo inline.

### 5.17 Consistencia visual y buenas prácticas

- **0 emojis como iconos** → solo lucide (ya cumplido).
- Tokens de color siempre; nunca hex/Tailwind crudo de color.
- Un ancho máximo por tipo de vista; un ritmo de espaciado; una escala tipográfica.
- Componentes desde la biblioteca; prohibido reescribir clases de input/botón inline.
- Cerrar **cada** pantalla con el *Pre-Delivery Checklist* de UX-UI-Pro-Max.

---

## 6. Hoja de ruta por fases (Login → Super Admin)

> Cada fase: **Objetivo · Alcance · Pantallas · Componentes · Mejoras UX/UI · Aplicación UX-UI-Pro-Max · Dependencias · Prioridad · Criterios de aceptación · Resultado esperado.**

### Fase 0 — Fundamentos del Design System *(prerrequisito de todo)*

- **Objetivo:** establecer la fuente de verdad visual y la biblioteca de componentes base.
- **Alcance:** tokens, tipografía Inter+Geist Mono, escala de espaciado, primitivas nuevas (`PageState`, `DataTable`, `Toolbar`, `ConfirmDialog`, `FieldError`, `Avatar`, `Pagination`). Corrección de G1 (color) y G5 (`role=alert`) a nivel de componente.
- **Pantallas:** ninguna (capa transversal).
- **Componentes:** construir los nuevos de §5.6; refactorizar `ErrorAlert`, `StatusBadge`, badges de estado para usar tokens semánticos.
- **Mejoras UX/UI:** coherencia de color/tipografía/espaciado; base de accesibilidad.
- **UX-UI-Pro-Max:** `--design-system --persist -p "Content Suite"` → `design-system/MASTER.md`; `--domain typography`, `--domain color`, `--stack shadcn`.
- **Dependencias:** ninguna.
- **Prioridad:** **P0 (bloqueante).**
- **Criterios de aceptación:** `MASTER.md` generado; Inter cargada; 0 usos de `emerald-*`/`red-*` crudos en el repo; `ErrorAlert` con `role="alert"`; Storybook o página de showcase de primitivas.
- **Resultado esperado:** cualquier pantalla posterior se arma solo componiendo la biblioteca.

### Fase 1 — Login y Autenticación

- **Objetivo:** primera impresión enterprise y acceso robusto.
- **Alcance:** login, redirección `/`, `ProtectedRoute`, pantalla de carga.
- **Pantallas:** `app/login/page.tsx`, `app/page.tsx`.
- **Componentes:** `Field`, `Input`, `Button`, `ErrorAlert`, panel de marca; añadir `FieldError` + estados de carga del splash.
- **Mejoras UX/UI:** el login ya es fuerte (split asimétrico); refinar contraste del panel, foco, mensajes de error con `role=alert`, autocompletado. Splash con skeleton coherente en vez de spinner solo.
- **UX-UI-Pro-Max:** `--domain ux "forms accessibility error"`; checklist de contraste light/dark.
- **Dependencias:** Fase 0.
- **Prioridad:** **P0.**
- **Criterios de aceptación:** login usable con teclado; error anunciado; contraste AA en el panel primary; sin *layout shift* al validar; responsive 375–1440.
- **Resultado esperado:** entrada al producto que "vende" el nivel enterprise.

### Fase 2 — App Shell, Navegación y Dashboards por rol

- **Objetivo:** dar contexto y orientación (resuelve G2, G7).
- **Alcance:** sidebar, header, breadcrumbs, y **4 dashboards** (uno por rol) como nuevos *home*.
- **Pantallas:** `app-layout.tsx` (refactor) + nuevas rutas `/dashboard` por rol (o home contextual). `homeForRole` apunta aquí.
- **Componentes:** `Breadcrumbs`, `StatCard/MetricTile`, gráficos base (línea/barras/donut), refino de sidebar/header.
- **Mejoras UX/UI:** KPIs + acción principal por rol; breadcrumbs; header con acciones contextuales; datos con `tabular-nums`.
- **UX-UI-Pro-Max:** `--domain chart "trend comparison funnel"`, `--domain style "data-dense dashboard"`, `--stack nextjs`.
- **Dependencias:** Fase 0. (Métricas dependen de endpoints; si no existen, mostrar *empty state* diseñado — no bloquea.)
- **Prioridad:** **P1.**
- **Criterios de aceptación:** cada rol aterriza en su dashboard; KPIs con estados loading/empty/error; gráficos con alternativa en tabla; responsive.
- **Resultado esperado:** la app deja de sentirse "formularios sueltos".

### Fase 3 — Creador: Marcas (crear + gestionar)

- **Objetivo:** flujo de definición de ADN de marca de nivel producto.
- **Alcance:** creación de marca con parámetros dinámicos + listado/edición inline de reglas.
- **Pantallas:** `studio/brand/page.tsx`, `studio/brands/page.tsx`.
- **Componentes:** `RuleCard/RulePill` unificado, `Avatar` de marca, `PageState`, `ConfirmDialog` (ya usado en delete), form con `FieldError`.
- **Mejoras UX/UI:** columna de resultado con empty/loading diseñado (ya iniciado); tarjetas de marca con avatar + metadata; agrupar reglas por tipo; ritmo de form estandarizado; parámetros dinámicos más claros.
- **UX-UI-Pro-Max:** `--design-system --persist --page "brands"`; `--domain ux "forms empty loading"`.
- **Dependencias:** Fase 0; consume `brandApi`.
- **Prioridad:** **P1.**
- **Criterios de aceptación:** sin columnas vacías; edición inline con feedback de embedding; reglas escaneables; a11y de form; responsive.
- **Resultado esperado:** gestión de marca clara, densa y consistente.

### Fase 4 — Creador: Generación de Contenido

- **Objetivo:** generar contenido con reglas RAG visibles y accionable.
- **Alcance:** formulario (marca/tipo/brief) + resultado con reglas aplicadas y estado.
- **Pantallas:** `studio/content/page.tsx`.
- **Componentes:** `RulePill`, `StatusBadge`, skeleton de resultado, acciones sobre el resultado (copiar / ver en cola).
- **Mejoras UX/UI:** skeleton mientras genera; resultado en superficie diferenciada (`bg-muted/30`); chips RAG con el token de marca; acciones post-generación; empty de "sin marcas → crear".
- **UX-UI-Pro-Max:** `--design-system --persist --page "content"`; `--domain ux "loading feedback"`.
- **Dependencias:** Fase 3 (necesita marcas); `contentApi`.
- **Prioridad:** **P1.**
- **Criterios de aceptación:** feedback de carga; reglas aplicadas legibles; estado claro; copiar funciona; responsive.
- **Resultado esperado:** generación fluida con trazabilidad RAG.

### Fase 5 — Aprobador A: Cola de Aprobación

- **Objetivo:** revisión eficiente con separación estricta de funciones.
- **Alcance:** lista de pendientes + detalle con aprobar/rechazar (motivo obligatorio).
- **Pantallas:** `studio/approvals/page.tsx`.
- **Componentes:** master-detail estandarizado, `Toolbar` (filtro por tipo/marca/fecha), metadata en item (autor/fecha), `ConfirmDialog` de rechazo.
- **Mejoras UX/UI:** items con autor/fecha/marca (G4); búsqueda/filtro; contador; acciones grandes (≥44px) success/destructive con tokens; empty diseñado.
- **UX-UI-Pro-Max:** `--design-system --persist --page "approvals"`; `--domain ux "touch-target error-feedback"`.
- **Dependencias:** Fase 4 (genera contenido); `contentApi`.
- **Prioridad:** **P1.**
- **Criterios de aceptación:** rechazo exige motivo; filtros funcionan; estados loading/empty/error; teclado en diálogo; responsive.
- **Resultado esperado:** cola tipo GitHub-review, rápida y trazable.

### Fase 6 — Aprobador B: Auditoría de Imágenes

- **Objetivo:** auditoría multimodal clara y confiable.
- **Alcance:** selección de contenido + dropzone + veredicto + historial.
- **Pantallas:** `studio/audit/page.tsx`.
- **Componentes:** `FileDropzone` (extraído), tarjeta de veredicto con **tokens** success/destructive (corrige G1), `PageState`, historial.
- **Mejoras UX/UI:** veredicto con `success`/`destructive` (no emerald/red crudo); preview de imagen; manejo de error 502 del modelo (ya existe) con reintento; drag&drop accesible; historial escaneable.
- **UX-UI-Pro-Max:** `--design-system --persist --page "audit"`; `--domain ux "loading error accessibility"`.
- **Dependencias:** Fase 0; `contentApi.audit`.
- **Prioridad:** **P2.**
- **Criterios de aceptación:** 0 colores crudos; veredicto legible en ambos modos; error de visión manejado; dropzone usable por teclado; responsive.
- **Resultado esperado:** auditoría visual coherente con el resto del sistema.

### Fase 7 — Super Admin: Usuarios (y cierre de gobierno)

- **Objetivo:** administración de equipo escalable y segura.
- **Alcance:** tabla de usuarios, alta, cambio de rol, desactivación; link a Observabilidad.
- **Pantallas:** `admin/users/page.tsx`.
- **Componentes:** `DataTable` (nuevo), `Toolbar` (search + filtro por rol/estado), `Pagination`, `ConfirmDialog`, badge de estado con **tokens** (corrige G1).
- **Mejoras UX/UI:** separar badge de rol (lectura) del cambio de rol (acción explícita, no select pegado); búsqueda/filtro/paginación; estado activo/inactivo con token success; skeleton de filas (ya existe).
- **UX-UI-Pro-Max:** `--design-system --persist --page "users"`; `--domain style "data-dense"`, `--domain ux "tables accessibility"`.
- **Dependencias:** Fase 0; `usersApi`.
- **Prioridad:** **P2.**
- **Criterios de aceptación:** tabla con search/filtro/paginación; desactivación confirmada; 0 colores crudos; a11y de tabla; responsive con `overflow-x-auto`.
- **Resultado esperado:** panel admin nivel enterprise.

### Fase 8 — Pulido transversal y verificación final

- **Objetivo:** cerrar coherencia, accesibilidad y responsive de toda la app.
- **Alcance:** auditoría global contra el *Pre-Delivery Checklist*; QA de estados; QA de motion; QA responsive 375/768/1024/1440; dark/light.
- **Pantallas:** todas.
- **Componentes:** ajustes finales; eliminación de estilos inline residuales.
- **Mejoras UX/UI:** consistencia final; performance (evitar CLS); revisión de foco/tab global.
- **UX-UI-Pro-Max:** *Pre-Delivery Checklist* completo + `--domain ux "accessibility z-index reduced-motion"`.
- **Dependencias:** Fases 0–7.
- **Prioridad:** **P2.**
- **Criterios de aceptación:** checklist 100% en las 8 pantallas; 0 hallazgos de contraste; sin scroll horizontal; reduced-motion respetado en todo.
- **Resultado esperado:** producto homogéneo, accesible y responsive de punta a punta.

---

## 7. Resumen de prioridades y dependencias

```
Fase 0 (P0) ─┬─> Fase 1 (P0)
             ├─> Fase 2 (P1) ──> [dashboards]
             ├─> Fase 3 (P1) ──> Fase 4 (P1) ──> Fase 5 (P1)
             ├─> Fase 6 (P2)
             └─> Fase 7 (P2)
                         todas ──> Fase 8 (P2)
```

**Orden recomendado:** 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8.
**Ruta crítica de valor:** 0 → 3 → 4 → 5 (el flujo creador→aprobación es el corazón del producto).

---

## 8. Definición de "Hecho" (global)

Una fase está terminada cuando:
1. Usa **solo** tokens y componentes de la biblioteca (0 color/estilo crudo).
2. Pasa el **Pre-Delivery Checklist** de UX-UI-Pro-Max.
3. Cumple **WCAG AA** (contraste, foco, `role=alert`, teclado).
4. Tiene los **tres estados** diseñados (loading/empty/error).
5. Es **responsive** en 375/768/1024/1440 sin scroll horizontal.
6. Su override existe en `design-system/pages/<pantalla>.md`.

---

*Documento base para la reconstrucción del frontend. La siguiente etapa implementa fase por fase siguiendo este plan sin redefinir la estrategia de diseño.*
