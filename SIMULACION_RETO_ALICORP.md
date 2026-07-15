# Simulación del Reto Alicorp — Content Suite

**Fecha:** 2026-07-14
**Método:** Prueba end-to-end en el navegador (localhost:3000) contra el backend real (localhost:8000), ejerciendo los 4 roles y los 4 módulos del reto.
**Resultado global:** ✅ El flujo completo funciona. Se encontró y corrigió **1 bug bloqueante** y se detectaron **2 mejoras pendientes** (ninguna crítica).

---

## 🔴 Bug bloqueante encontrado y corregido

**El login (y toda la app) estaba roto.** Al pulsar "Ingresar", la petición iba a `POST http://localhost:8000/auth/login` → **404 Not Found**.

- **Causa:** el backend expone sus rutas bajo el prefijo `/api/v1/...`, pero `frontend/.env` tenía `NEXT_PUBLIC_API_URL=http://localhost:8000` **sin** el prefijo. El `.env.example` sí lo traía correcto (`.../api/v1`).
- **Fix aplicado:** corregí `frontend/.env` → `NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1` y **reinicié el dev server** (las variables `NEXT_PUBLIC_*` se inyectan en build, no basta con recargar).
- **Verificación:** tras el fix, `POST /api/v1/auth/login` → **200 OK** y el resto del flujo funcionó.

> ⚠️ Al ser un cambio en `.env`, asegúrate de commitear el valor correcto o alinear `.env` con `.env.example` para que no vuelva a romperse.

---

## Paso a paso verificado en el navegador

### Módulo I · Brand DNA Architect ✅
1. Login como **Creador** (`creador@contentsuite.dev`) → dashboard por rol carga correcto.
2. `/studio/brand`: ingresé "Snack saludable de quinua andina", tono "Divertido pero profesional", público "Gen Z".
3. `POST /api/v1/brands` → **201 Created**. La IA (Groq) generó un **manual estructurado de 6 reglas** tipadas: `Prohibición`, `Obligación`, `Recomendación`, cada una con categoría (Comunicación, Imagen de marca, Redes sociales, etc.).
4. La marca queda **ACTIVA** y disponible en el selector de generación → confirma que se persiste para el RAG.

### Módulo II · Creative Engine (RAG) ✅
1. `/studio/content`: seleccioné la marca recién creada, tipo **Descripción**, brief para lanzamiento en Instagram.
2. `POST /api/v1/content` → **201 Created**.
3. **El RAG funciona de verdad:** la respuesta incluye una sección explícita **"REGLAS APLICADAS (RAG)"** listando las reglas recuperadas del manual, y el texto generado **usa los hashtags `#SnackSaludable #QuinuaAndina`** que estaban en una de las reglas. No es generación ciega: consulta el manual antes de escribir.
4. El contenido queda en estado **Pendiente**.

### Módulo III · Governance (flujo de aprobación) ✅
1. Login como **Aprobador A** (`aprobadorA@contentsuite.dev`).
2. `/studio/approvals`: el contenido aparece en la cola "PENDIENTES". El panel de detalle muestra el texto, el autor y las **reglas aplicadas**.
3. Pulsé **Aprobar** → `POST /api/v1/content/{id}/approve` → **200 OK**. El estado cambió a **Aprobado** y salió de la cola.
4. (El botón **Rechazar** está presente y cablea `/reject`.)

### Módulo III · Auditoría Multimodal ✅
1. Login como **Aprobador B** (`aprobadorB@contentsuite.dev`).
2. `/studio/audit`: seleccioné el contenido aprobado; aparece el widget "Subir imagen para auditar" (drag & drop / PNG-JPG).
3. Ejercí `POST /api/v1/content/{id}/audit` con una imagen de prueba → **200 OK**. El **modelo de visión (Gemini)** devolvió:
   - `veredicto: NO_CUMPLE`
   - `motivo:` *"La imagen es un degradado abstracto sin valor comunicativo ni presencia de marca, lo cual no cumple con los estándares mínimos de calidad visual…"*
   - `reglas_evaluadas:` incluye **"No utilizar imágenes de baja resolución en materiales de marketing"** → **contrasta la imagen contra el manual escrito**, tal como pide el reto.
4. En la UI, el panel **"Historial de auditorías (1/1)"** renderiza el resultado (No cumple, actor, fecha, motivo) con filtro Cumple/No cumple. Verificado en el navegador.

### Módulo IV · Observabilidad (Langfuse) ⚠️ (funciona en backend, oculto en UI)
- El backend tiene credenciales Langfuse configuradas (`LANGFUSE_PUBLIC_KEY`, `SECRET_KEY`, `HOST`) y un `langfuse_tracer.py` cableado en **todos** los contextos (brand_identity, content_creation, governance) con `flush()`. Las trazas se envían al proyecto Langfuse.
- **Pero** el enlace "Observabilidad" en el sidebar del Superadmin **no aparece** porque `NEXT_PUBLIC_LANGFUSE_URL` está **vacío** en `frontend/.env`. Ver mejoras.

### RBAC / Superadmin ✅
- Login como **Superadmin** → `/admin/users`: tabla de 6 usuarios con **cambio de rol por dropdown** y botón **Desactivar**, más "Añadir usuario".
- Cada rol ve navegación y vistas distintas (Creador ve Marcas/Generar; Aprobador A ve solo la cola; Aprobador B ve solo Auditoría; Superadmin ve Usuarios). Separación de funciones correcta.

---

## Resumen de cobertura

| Requisito del reto | Estado | Evidencia |
|---|---|---|
| Módulo I · Brand DNA + RAG | ✅ | Manual de 6 reglas, 201 Created, marca ACTIVA |
| Módulo II · Creative Engine consulta RAG | ✅ | Sección "REGLAS APLICADAS (RAG)" + hashtags del manual |
| Módulo III · Flujo Pendiente→Aprobado/Rechazado | ✅ | approve 200 OK, estado actualizado |
| Módulo III · Auditoría multimodal (visión vs manual) | ✅ | Gemini NO_CUMPLE citando regla del manual |
| Módulo IV · Langfuse | ⚠️ | Backend traza OK; enlace UI oculto (env vacío) |
| RBAC 4 roles | ✅ | Vistas y gestión de usuarios por rol |

---

## Mejoras / pendientes detectados

1. **(Bloqueante, ya corregido) `frontend/.env` sin el prefijo `/api/v1`.** Alinear `.env` con `.env.example` y commitearlo para que no regrese.
2. **Enlace de Observabilidad oculto.** Definir `NEXT_PUBLIC_LANGFUSE_URL` en `frontend/.env` con la URL del proyecto Langfuse para que el Superadmin vea el enlace (el reto pide entregar la URL de Langfuse accesible).
3. **Higiene de datos semilla.** En el selector de marcas hay entradas de prueba basura (`sdfds — dsfsd`) y contenidos con autor "Desconocido". Conviene limpiar/validar antes de la entrega o demo.
4. **Subida de imagen no automatizable desde el navegador embebido** (limitación de la herramienta, no de la app): el `input[type=file]` funciona; la auditoría se validó vía API con imagen real y el resultado se reflejó correctamente en la UI.

### Entregables del reto aún no verificados aquí (fuera del alcance de la simulación local)
- **Despliegue en la nube con URL pública** (probado solo en local).
- **Presentación ejecutiva (≤6 slides).**
- **URL pública del proyecto Langfuse** accesible para el evaluador.

---

## Credenciales usadas (todas funcionan)

| Rol | Email | Password |
|---|---|---|
| Superadmin | `superadmin@contentsuite.dev` | `Superadmin#2026` |
| Creador | `creador@contentsuite.dev` | `Creador#2026` |
| Aprobador A | `aprobadorA@contentsuite.dev` | `AprobadorA#2026` |
| Aprobador B | `aprobadorB@contentsuite.dev` | `AprobadorB#2026` |
