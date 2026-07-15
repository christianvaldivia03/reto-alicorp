# Prompt — Destruir y rediseñar el frontend de Content Suite

Actúa como un **Design Engineer Senior y Director de UI/UX de élite en producto B2B SaaS**, al nivel de Linear, Vercel, Stripe, Superhuman y Notion. No diseñas tiendas: diseñas **herramientas de trabajo** donde la densidad de información, la velocidad de uso y la confianza importan más que el "wow" decorativo.

Quiero **destruir la estructura visual actual** del frontend y hacer una refactorización radical. **No te voy a pasar el código por partes: tú mismo agarras todo el frontend del proyecto, lo analizas y trabajas de forma autónoma.** Tu objetivo es reescribirlo por completo. No quiero parches: quiero código modular, ultra-optimizado y una experiencia de clase mundial. Nada de sobre-ingeniería: el código más limpio es el que no se escribe.

## Contexto del producto (no negociable)

**Content Suite** es una plataforma B2B de IA que impone consistencia de marca al lanzar productos a escala. **El backend ya existe** y maneja RBAC, RAG e IA; el frontend **solo** llama a su API REST y renderiza estado. **No implementes lógica de negocio en el cliente.**

Hay **4 roles**, cada uno con su vista:
- **CREADOR**: crea Manual de Marca y genera contenido (descripciones, guiones, prompts de imagen).
- **APROBADOR_A**: revisa contenido de texto pendiente y aprueba/rechaza (rechazo requiere motivo).
- **APROBADOR_B**: audita imágenes contra el manual con IA de visión (veredicto CUMPLE/NO_CUMPLE + explicación).
- **SUPERADMIN**: gestiona usuarios. No crea contenido (separación estricta de funciones).

Superficies clave a rediseñar: **Login**, **App Shell** (top bar + sidebar por rol), **Brand Studio**, **Content Studio**, **Cola de Aprobación**, **Auditoría Multimodal**, **Gestión de Usuarios**.

## Stack real (respétalo, no lo cambies)

- **Next.js 16 (App Router) + React 19 + TypeScript**
- **Tailwind CSS v4** (config CSS-first con `@theme`, no `tailwind.config.js` legacy)
- **shadcn/ui** + **Base UI** (`@base-ui/react`) como primitivas accesibles
- **lucide-react** para iconos (NUNCA emojis como iconos)
- `class-variance-authority` + `clsx` + `tailwind-merge` para variantes
- `tw-animate-css` disponible para animaciones utilitarias
- Todas las llamadas API aisladas en `lib/api.ts` (ya existe). Soporta **light y dark mode**.

## Dirección de arte (derivada de la skill `ui-ux-pro-max` para este producto)

Antes de escribir código, **invoca y respeta la skill `ui-ux-pro-max`** para validar estilo, paleta, tipografía y checklist de accesibilidad. El sistema base que ya arrojó para este producto es:

- **Estilo:** Flat Design refinado — 2D, líneas limpias, tipografía protagonista, jerarquía por espacio y peso, **no** por sombras pesadas ni gradientes decorativos.
- **Regla 90/10:** 90% neutros sofisticados (navy/slate), 10% acento para CTAs.
  - `--primary: #0F172A` (slate-900) · `--secondary: #334155` · `--cta/accent: #0369A1` (azul) · `--background: #F8FAFC` · `--text: #020617`
  - Mapea estos a variables CSS nativas dentro de `@theme` y a los tokens de shadcn (`--primary`, `--accent`, `--muted`, etc.). Un solo color de acento; todo lo demás neutro.
- **Estados semánticos consistentes en TODA la app:** PENDIENTE=amber, APROBADO/CUMPLE=green, RECHAZADO/NO_CUMPLE=red. El color nunca es el único indicador (añade icono/label).
- **Tipografía:** **Plus Jakarta Sans** para heading y body (vía `next/font`, no `@import` externo). Escala de títulos con `clamp()`/`rem`; body ≥16px; `line-height` 1.5–1.75; longitud de línea 65–75ch.
- **Espacio en blanco radical** pero con densidad B2B: generoso sin desperdiciar viewport en vistas de datos.
- **Evita:** animación excesiva, dark mode por defecto (ofrécelo, no lo impongas), div soup, sombras/gradientes gratuitos.

## Directrices técnicas obligatorias

### 1. Arquitectura limpia y modular
- Elimina div soup, estilos redundantes y wrappers inútiles. HTML semántico.
- Componentes reutilizables tipados (variantes con `cva`, no `if` de className). Server Components por defecto; `"use client"` solo donde haya interacción.
- CSS moderno: Grid, Flexbox, `container queries`, variables CSS nativas. Layouts con Grid, algo de asimetría donde aporte foco (hero de login, verdict de auditoría), sin romper la legibilidad de tablas/colas.

### 2. Motor de interacción (premium feel, sobrio)
- **Entrada al viewport:** fade/translate sutil con Intersection Observer o `tw-animate-css`; respeta `prefers-reduced-motion`.
- **Hover states:** feedback por color/opacidad/borde, **sin** transforms que muevan el layout. Transiciones 150–300ms `ease` (ej. `cubic-bezier(0.25, 1, 0.5, 1)`).
- **Carga:** skeletons con shimmer (`@keyframes`) en lugar de spinners para listas/tablas; reserva espacio para evitar content jumping.
- **Acciones de IA (varios segundos):** botón deshabilitado + spinner etiquetado ("Generando manual…", "Auditando imagen…"). Todo estado de datos maneja **loading / empty / error / success** explícitamente.

### 3. Componentes clave a reescribir (equivalentes B2B, no e-commerce)
- **App Shell:** top bar con nombre, email del usuario, **badge de rol** con color, toggle de tema y logout. Sidebar que muestra **solo** los ítems permitidos por rol; drawer en móvil. Escala de z-index definida (10/20/30/50), sin peleas de z-index.
- **Command palette / navegación rápida (⌘K):** opcional pero recomendado para saltar entre vistas — feel Linear/Superhuman.
- **Paneles deslizantes (slide-out):** detalle de contenido en la cola de aprobación y detalle de auditoría como panel lateral asíncrono (Base UI Dialog/Popover), sin recargar la página.
- **Barra de acción fija (sticky action bar):** en Brand/Content Studio, los CTAs de "Generar" quedan accesibles al hacer scroll en formularios largos.
- **Verdict de auditoría prominente:** CUMPLE → check verde grande + "Cumple con el manual"; NO_CUMPLE → cruz roja + motivo + `reglas_evaluadas`.

## Accesibilidad y calidad (checklist de la skill, obligatorio)
- Contraste texto ≥4.5:1 en light y dark. Focus rings visibles en todo elemento interactivo.
- `label` con `for` en cada input; `aria-label` en botones solo-icono; alt descriptivo en imágenes con significado.
- Touch targets ≥44×44px; `cursor-pointer` en todo lo clickeable; orden de tabulación = orden visual.
- Responsive verificado en 375 / 768 / 1024 / 1440px, sin scroll horizontal.
- `prefers-reduced-motion` respetado.

## Superficie a intervenir (todo el frontend, en `frontend/`)

```
app/
  layout.tsx · globals.css · page.tsx
  login/page.tsx
  admin/users/page.tsx
  studio/brand/page.tsx · studio/content/page.tsx
  studio/approvals/page.tsx · studio/audit/page.tsx
components/
  layout/app-layout.tsx · protected-route.tsx
  ui/button.tsx
  ui-custom/{empty-state,error-alert,loading-spinner,role-badge,rule-badge,status-badge}.tsx
contexts/ auth-context.tsx · toast-context.tsx
lib/ api.ts · roles.ts · types.ts · utils.ts
```

`lib/`, `contexts/` y el contrato de la API **no se tocan** (salvo bugs evidentes): son la lógica y no cambian con el rediseño. Todo lo demás (`app/**`, `components/**`, `globals.css`) es material a destruir y reconstruir.

## Cómo vas a trabajar (autónomo, sin que yo te pase código)

1. **Recon:** lee todo el frontend real del proyecto (rutas de arriba), mapea la arquitectura actual e identifica la deuda técnica y los errores de diseño (div soup, tokens inconsistentes, estados faltantes, a11y).
2. **Fija el sistema de diseño:** invoca la skill `ui-ux-pro-max`, consolida tokens en `globals.css` (`@theme` de Tailwind v4) y en los tokens de shadcn. Este paso va primero: todo lo demás hereda de aquí.
3. **Refactoriza vista por vista**, en orden de mayor impacto (App Shell → Login → Studios → Aprobación → Auditoría → Usuarios), reescribiendo cada `page.tsx`/componente completo, listo para producción. Reusa `lib/api.ts`, `contexts/*` y los tipos; no dupliques lógica ni rompas el contrato.
4. **Autovalida** al final: `next build`/lint, y el checklist de accesibilidad y responsive de la skill (375/768/1024/1440, light+dark).
5. Al terminar, un resumen **breve** (máx. 5–8 líneas): qué destruiste, decisiones de arquitectura que dan el feel premium y qué quedó pendiente. Nada de ensayos.

Para empezar: confirma que entiendes tu rol y este stack, **haz el recon del frontend completo**, invoca `ui-ux-pro-max` para fijar el sistema de diseño, y arranca por el App Shell. No me pidas fragmentos: tú tienes el código, trabaja.
