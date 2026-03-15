# Code Review & Technical Debt Report — Proyecto Pachanga

**Fecha:** 2026-03-11 · **Revisión completa del backend** · **Score: 6.8 / 10**

---

## Resumen Ejecutivo

El proyecto tiene una **arquitectura modular sólida** (módulos con controller/service/routes), buen uso de Zod para validación, JWT con token rotation, y middleware bien separado. Sin embargo, **la deuda técnica es significativa** en seguridad, observabilidad, testing, y mantenibilidad.

---

## ❌ Problemas Críticos (Prioridad Alta)

### 1. Debug Endpoint Expuesto en Producción
**Archivos:** [server.ts](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/server.ts#L62-L80)

```typescript
// ❌ PRODUCCIÓN: Endpoint debug sin protección
app.get('/api/debug/db', async (_req, res) => {
  const count = await prisma.reservation.count();
  const recent = await prisma.reservation.findMany({...});
  res.json({
    databaseUrl: env.DATABASE_URL?.replace(/:([^:@]+)@/, ':***@'),
    reservationCount: count,
    recentReservations: recent,
  });
});
```

> [!CAUTION]
> Este endpoint expone información sensible de la base de datos (URL parcial, conteo de registros, datos de clientes) a **cualquier persona sin autenticación**. Debe eliminarse o protegerse con `authenticate + requireAdmin`.

---

### 2. Doble `$connect()` al Iniciar
**Archivos:** [prisma.ts](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/lib/prisma.ts#L22-L25) + [server.ts](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/server.ts#L97)

```diff
 // prisma.ts — Se conecta al importar el módulo
 prisma.$connect()
   .then(() => console.log('[Prisma] Connected'))

 // server.ts — Se conecta OTRA VEZ al arrancar
 await prisma.$connect();
```

Dos conexiones simultáneas pueden causar pool exhaustion y conectar antes de que los middlewares estén listos.

---

### 3. Query Logging Habilitado en Producción
**Archivo:** [prisma.ts](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/lib/prisma.ts#L13-L15)

```typescript
// ❌ 'query' en producción causa logs masivos de performance
log: process.env.NODE_ENV === 'development'
  ? ['query', 'error', 'warn']
  : ['query', 'error'],  // ← REMOVE 'query' in production
```

---

### 4. DATABASE_URL Logueada al Inicio
**Archivo:** [prisma.ts](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/lib/prisma.ts#L8-L10)

```typescript
// ❌ Leaks DB connection info to stdout (even masked, reveals host/port/dbname)
const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ':***@');
console.log('[Prisma] DATABASE_URL:', maskedUrl);
```

---

## 🔧 Problemas Arquitectónicos (Prioridad Media)

### 5. Cero Logger Estructurado — Solo `console.log/error`

`console.log` encontrado en **8 archivos** del backend. Sin niveles (info/warn/error/debug), sin timestamps, sin contexto de request, sin correlación de logs. Esto hace el debugging en producción extremadamente difícil.

**Archivos afectados:**
- [server.ts](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/server.ts)
- [prisma.ts](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/lib/prisma.ts)
- [reservation.controller.ts](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/modules/reservations/reservation.controller.ts#L9-L11)
- [whatsapp.service.ts](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/modules/whatsapp/whatsapp.service.ts)
- [token-cleanup.service.ts](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/services/token-cleanup.service.ts)
- [birthday-engine.ts](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/lib/cron/birthday-engine.ts)
- [reservation-cleanup.ts](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/lib/cron/reservation-cleanup.ts)
- [cron/index.ts](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/lib/cron/index.ts)

**Recomendación:** Implementar `pino` o `winston` con un módulo `logger.ts` centralizado.

---

### 6. `@types/*` en `dependencies` en vez de `devDependencies`
**Archivo:** [package.json](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/package.json#L33-L39)

```json
"dependencies": {
  "@types/bcryptjs": "^2.4.6",   // ← devDependency
  "@types/cors": "^2.8.17",      // ← devDependency
  "@types/express": "^4.17.21",  // ← devDependency
  "@types/jsonwebtoken": "^9.0.5", // ← devDependency
  "@types/node": "^20.10.0",     // ← devDependency
  "@types/node-cron": "^3.0.11", // ← devDependency
  "@types/qrcode": "^1.5.6",     // ← devDependency
  "typescript": "^5.9.3",        // ← devDependency
}
```

> [!WARNING]
> 8 paquetes de solo desarrollo están en `dependencies`, inflando el bundle de producción y el build de Docker.

---

### 7. Zona de Reserva Embedida en el Campo `message` (String Hack)
**Archivo:** [reservation.service.ts](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/modules/reservations/reservation.service.ts#L70-L80)

```typescript
// ❌ Datos estructurales mezclados con texto libre
let finalMessage = data.message || '';
if (data.zone) {
  const zoneLabel = ZONE_LABELS[data.zone] || data.zone;
  finalMessage = `[ZONA: ${zoneLabel}]${finalMessage ? ' ' + finalMessage : ''}`;
}
```

La zona debería ser una **columna propia** en el schema de Prisma (`zone TableZone?` en [Reservation](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/modules/crm/crm.service.ts#66-109)), no texto concatenado en `message`. Esto es imposible de filtrar/consultar eficientemente.

---


### 9. Directorio `routes/` Vacío
**Archivo:** [routes/](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/routes)

Directorio vacío sin archivos. Las rutas están dentro de cada módulo (`modules/*/routes.ts`). Este directorio es código muerto y debe eliminarse.

---

### 10. Archivos Basura y PNG Sueltos en Raíz

**~41 archivos PNG** y 8+ archivos [.md](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/README.md) de sprints/planes antiguos en la raíz del proyecto:

```
editorial_con_fondo.png, mapa_actual.png, piso1_arriba.png, 
scroll_efecto_1.png, tooltip_final.png, menu_whisky.png, 
final_piso1.png, mapa_mesas_corregido.png, etc.
```

Estos deberían moverse a un directorio de assets (`Material audiovisual/`) o eliminarse del repositorio.

---

### 11. Archivo Roto [tmp_typecheck.js](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/tmp_typecheck.js) en Backend Root

**Archivo:** [tmp_typecheck.js](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/tmp_typecheck.js) — Archivo temporal que no debería estar en el repo. También hay directorios corruptos (`{` y `{const`) en la raíz del backend.

---

## ⚠️ Problemas de Testing (Prioridad Alta)

### 12. Cobertura de Tests Mínima

| Módulo | Tests | Estado |
|--------|-------|--------|
| auth | ✅ [auth.test.ts](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/tests/integration/auth.test.ts) (5 tests) | Incompleto — no testea logout, refresh, me |
| reservations | ✅ [reservations.test.ts](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/tests/integration/reservations.test.ts) | Parcial |
| tables | ✅ [tables.test.ts](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/tests/integration/tables.test.ts) | Parcial |
| crm | ❌ Ninguno | **Sin tests** |
| whatsapp | ❌ Ninguno | **Sin tests** |
| analytics | ❌ Ninguno | **Sin tests** |
| services/token | ❌ Ninguno | **Sin tests** |
| services/socket | ❌ Ninguno | **Sin tests** |
| middleware | ❌ Ninguno | **Sin tests** |

> [!IMPORTANT]
> 3 de los 6 módulos no tienen NINGÚN test. Los servicios core (token rotation, socket auth, WhatsApp) tampoco están testeados. Cobertura estimada: **~15-20%**.

---

### 13. Tests de Auth Probablemente Rotos

[auth.test.ts](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/tests/integration/auth.test.ts#L26-L39) — El test de register espera `response.body.data.user.email` pero el controller responde directamente sin wrapper `data`:

```typescript
// Controller devuelve: res.status(201).json(result);
// Test espera: response.body.data.user.email ← likely fails
```

---

## 🔍 Problemas de Código (Prioridad Baja-Media)

### 14. `as unknown as` Casts en Validate Middleware

[validate.middleware.ts](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/middleware/validate.middleware.ts#L11-L51) — 4 type casts forzados. Son aceptables en middleware de validación pero podrían refactorizarse con generics más fuertes.

---

### 15. Inconsistencia en Response Format

| Endpoint | Response Shape |
|----------|---------------|
| `POST /reservations` | `{ data: reservation }` |
| `GET /reservations` | `{ data: [...], pagination: {...} }` |
| `POST /auth/login` | `{ user, accessToken, refreshToken }` (sin wrapper `data`) |
| `POST /crm/capture` | `{ success: true, message: '...' }` |
| `GET /crm/customers` | `{ data: [...], pagination: {...} }` |

No hay un **envelope estándar** (`{ success, data, error, pagination }`).

---

### 16. Fire-and-Forget Sin Retry en CRM y WhatsApp

```typescript
// reservation.service.ts — CRM link puede fallar silenciosamente
crmService.linkToReservation(phone, name, id).catch((err) => {
  console.error('[ReservationService] CRM link failed:', err.message);
});

// crm.controller.ts — WhatsApp welcome puede fallar silenciosamente
whatsappService.sendWelcome(customer).catch(() => {});
```

Sin queue, sin retry, sin métricas de fallo.

---

### 17. Schema de Create vs Service Interfaces Desincronizadas

`CreateReservationSchema` (Zod) define `zone: z.enum(['PALCO', 'VISITANTE', 'BARRA'])` pero el Prisma schema tiene `TableZone` como `SALON | TERRAZA | VIP | BARRA | PISTA`. Los valores del Zod **no corresponden** con los del enum de la DB.

---

### 18. Pagination Duplicada

El patrón `page/limit → skip/take → count → totalPages` se repite idénticamente en:
- [reservation.service.ts](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/modules/reservations/reservation.service.ts)
- [crm.service.ts](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/modules/crm/crm.service.ts) (2 veces: [findAll](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/modules/crm/crm.service.ts#110-134) y [getMessages](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/modules/crm/crm.service.ts#180-208))

Debería extraerse a un helper `paginateQuery<T>()`.

---

### 19. `CORS_ORIGIN: z.string().default('*')` — Wildcard por Defecto

[env.ts](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/config/env.ts#L23) + [server.ts](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/server.ts#L39)

```typescript
CORS_ORIGIN: z.string().optional().default('*'),
// ...
if (!origin || ALLOWED_ORIGINS.includes(origin) || ALLOWED_ORIGINS.includes('*')) {
```

Si `CORS_ORIGIN='*'`, **cualquier origen** es aceptado. Esto no es usado en las CORS origins (que se basan en `NODE_ENV`), pero el `CORS_ORIGIN` env var queda sin uso real y es confuso.

---

## ✅ Lo Que Está Bien

| Aspecto | Evaluación |
|---------|------------|
| **Arquitectura modular** | ✅ Excelente separación controller/service/routes |
| **Validación con Zod** | ✅ Schemas bien definidos con mensajes en español |
| **JWT con token rotation** | ✅ Access + refresh con blacklist y cleanup |
| **WebSocket tipado** | ✅ Socket.IO con tipos generics y auth middleware |
| **Rate limiting** | ✅ Global + por-ruta (auth, reservations) |
| **Helmet + CORS** | ✅ Security headers configurados |
| **Graceful shutdown** | ✅ SIGTERM/SIGINT con cleanup de cron y DB |
| **Prisma con transacciones** | ✅ Serializable isolation para reservas |
| **HMAC verification** | ✅ WhatsApp webhook con timingSafeEqual |
| **Env validation** | ✅ Zod schema en startup |
| **Naming conventions** | ✅ English code, Spanish user strings |

---

## Resumen de Deuda Técnica

| Categoría | Severidad | Items |
|-----------|-----------|-------|
| 🔴 Seguridad | CRÍTICA | Debug endpoint expuesto, DB URL logueada |
| 🔴 Testing | CRÍTICA | ~15-20% cobertura, 3 módulos sin tests |
| 🟡 Observabilidad | ALTA | Sin logger estructurado, solo console.log |
| 🟡 Arquitectura | MEDIA | Zone hack en message |
| 🟡 Build | MEDIA | @types en prod deps, archivos basura |
| 🟢 Código | BAJA | Pagination duplicada, response inconsistente |

---

## Plan de Remediación Recomendado (Sprint-Friendly)

### Sprint Inmediato (1-2 días)
1. ❌ **Eliminar** `/api/debug/db` endpoint
2. ❌ **Eliminar** el `console.log` de DATABASE_URL en [prisma.ts](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/lib/prisma.ts)
3. ❌ **Eliminar** el `$connect()` duplicado en [prisma.ts](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/lib/prisma.ts)
4. 🔧 **Quitar** `'query'` del log de Prisma en producción
5. 🔧 **Mover** `@types/*` y `typescript` a `devDependencies`
6. 🗑️ **Eliminar** directorio vacío `routes/`, [tmp_typecheck.js](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/tmp_typecheck.js), directorios rotos `{`, `{const`

### Sprint Corto (3-5 días)
7. 📝 Implementar logger (`pino`) centralizado
8. 🧪 Escribir tests unitarios para CRM, WhatsApp, analytics
9. 🧪 Arreglar tests de auth (response shape)
10. 🔧 Estandarizar response envelope `{ success, data, error }`

### Sprint Largo (1-2 semanas)
11. 🏗️ Agregar columna `zone` al modelo [Reservation](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/modules/crm/crm.service.ts#66-109) (migración)
12. 🔧 Extraer helper de paginación genérico

14. 📦 Organizar imágenes sueltas en la raíz del proyecto
15. 🧪 Alcanzar cobertura de tests ≥60%
