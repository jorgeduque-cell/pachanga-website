# 🛡️ Auditoría DevSecOps — Sprint 1 (Mesas + Reservas)

**Auditor:** THE GUARDIAN | **Fecha:** 2026-02-25 | **Alcance:** Módulos `tables/` y `reservations/` (9 archivos)

---

## VEREDICTO: [RECHAZADO]

Se identificaron **1 ALTO** y **4 MEDIO** que deben remediarse.

---

## HALLAZGOS

### 🟠 ALTO-1: Race Condition (TOCTOU) en Creación y Confirmación de Reservas

**Archivos:** [reservation.service.ts L64-75](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/modules/reservations/reservation.service.ts#L64-L75) | [L177-189](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/modules/reservations/reservation.service.ts#L177-L189)

El método [create()](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/modules/tables/table.controller.ts#40-48) verifica si una mesa está libre (L64), y luego crea la reserva (L78). Entre ambas operaciones, otro request concurrente podría reservar la misma mesa → **overbooking**. Lo mismo ocurre en [update()](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/modules/reservations/reservation.controller.ts#51-60) al confirmar.

```typescript
// L64-75: Time-of-Check vs Time-of-Use — NO HAY TRANSACCIÓN
const existingReservation = await prisma.reservation.findFirst({...}); // CHECK
// ⚠️ Otro request puede insertar aquí
return prisma.reservation.create({...}); // USE
```

Según el ERS: *"El sistema debe soportar 50 solicitudes simultáneas"* — este bug es explotable en escenarios reales.

---

### 🟡 MEDIO-1: Uso de `any` en TypeScript (Violación de Regla del Sistema)

**Archivo:** [table.service.ts L42](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/modules/tables/table.service.ts#L42)

```typescript
const where: any = { // ❌ Regla #4: "tipado estricto, sin any"
```

---

### 🟡 MEDIO-2: Cast `as any` en Controller de Reservas

**Archivo:** [reservation.controller.ts L20](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/modules/reservations/reservation.controller.ts#L20)

```typescript
status: status as any, // ❌ Elude el tipo ReservationStatus
```

---

### 🟡 MEDIO-3: Params `:id` Sin Validación UUID en Routes

**Archivos:** [table.routes.ts L16-17](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/modules/tables/table.routes.ts#L16-L17) | [reservation.routes.ts L22-24](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/modules/reservations/reservation.routes.ts#L22-L24)

Los `TableIdParamSchema` y `ReservationIdParamSchema` existen pero se usan con [validateQuery()](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/middleware/validate.middleware.ts#28-50) en vez de [validateParams()](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/middleware/validate.middleware.ts#51-73). En las rutas PATCH/DELETE, no se valida el `:id` en absoluto. Un atacante puede enviar `PATCH /api/reservations/../../etc/passwd` como ID.

```typescript
// table.routes.ts L12 — INCORRECTO: valida query en vez de params
router.get('/:id', validateQuery(TableIdParamSchema), tableController.getById);
//                  ^^^^^^^^^^^^^ debería ser validateParams

// L16-17 — SIN validación de :id
router.patch('/:id', authenticate, requireAdmin, validateBody(UpdateTableSchema), tableController.update);
router.delete('/:id', authenticate, requireAdmin, tableController.deactivate);
```

---

### 🟡 MEDIO-4: Paginación Sin Límite Máximo — DoS por Memoria

**Archivo:** [reservation.service.ts L97](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/modules/reservations/reservation.service.ts#L97)

```typescript
const limit = filters.limit || 10; // Un atacante puede enviar limit=100000
```

Si el atacante envía `?limit=999999`, el servidor intenta cargar toda la tabla en memoria.

---

## CÓDIGO DE REMEDIACIÓN

### Fix ALTO-1: Envolver en transacción Prisma

```diff
  // reservation.service.ts — método create()
  async create(data: CreateReservationData) {
+   return prisma.$transaction(async (tx) => {
      const reservationDate = new Date(data.reservationDate);
      // ... validaciones ...

      if (data.tableId) {
-       const table = await prisma.table.findUnique({
+       const table = await tx.table.findUnique({
          where: { id: data.tableId },
        });
        // ... validaciones de mesa ...

-       const existingReservation = await prisma.reservation.findFirst({
+       const existingReservation = await tx.reservation.findFirst({
          where: { tableId: data.tableId, reservationDate, reservationTime: data.reservationTime, status: 'CONFIRMED' },
        });
        // ...
      }

-     return prisma.reservation.create({ data: {...}, include: { table: true } });
+     return tx.reservation.create({ data: {...}, include: { table: true } });
+   }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }
```

Aplicar lo mismo al método [update()](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/modules/reservations/reservation.controller.ts#51-60) L159-209.

---

### Fix MEDIO-1: Tipar `where` correctamente

```diff
- const where: any = {
+ const where: Prisma.TableWhereInput = {
    isActive: true,
    id: { notIn: reservedIds },
  };

  if (partySize) {
    where.capacity = { gte: partySize };
  }
```

Agregar import: `import { Prisma } from '@prisma/client';`

---

### Fix MEDIO-2: Usar tipo correcto en vez de `as any`

```diff
- status: status as any,
+ status: status as ReservationStatus | undefined,
```

Agregar import: `import { ReservationStatus } from '@prisma/client';`

---

### Fix MEDIO-3: Usar [validateParams](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/middleware/validate.middleware.ts#51-73) + agregar validación en PATCH/DELETE

```diff
  // table.routes.ts
+ import { validateParams } from '../../middleware/validate.middleware.js';
+
- router.get('/:id', validateQuery(TableIdParamSchema), tableController.getById);
+ router.get('/:id', validateParams(TableIdParamSchema), tableController.getById);
- router.patch('/:id', authenticate, requireAdmin, validateBody(UpdateTableSchema), tableController.update);
+ router.patch('/:id', authenticate, requireAdmin, validateParams(TableIdParamSchema), validateBody(UpdateTableSchema), tableController.update);
- router.delete('/:id', authenticate, requireAdmin, tableController.deactivate);
+ router.delete('/:id', authenticate, requireAdmin, validateParams(TableIdParamSchema), tableController.deactivate);
```

Aplicar lo mismo en [reservation.routes.ts](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/modules/reservations/reservation.routes.ts) con `ReservationIdParamSchema`.

---

### Fix MEDIO-4: Limitar paginación

```diff
  // reservation.schema.ts
  limit: z.string().regex(/^\d+$/).optional().transform((val) => {
    const num = val ? parseInt(val, 10) : 10;
-   return num;
+   return Math.min(Math.max(num, 1), 100); // Mín 1, Máx 100
  }),
  page: z.string().regex(/^\d+$/).optional().transform((val) => {
    const num = val ? parseInt(val, 10) : 1;
-   return num;
+   return Math.max(num, 1); // Mínimo 1
  }),
```

---

## RESUMEN

| Categoría | Estado |
|---|---|
| **Concurrencia** | ❌ Race condition en reservas (ALTO) |
| **TypeScript Estricto** | ❌ `any` y `as any` presentes |
| **Input Validation** | ❌ `:id` params sin UUID validation en PATCH/DELETE |
| **DoS** | ⚠️ Paginación sin tope |
| **SOLID** | ✅ Service/Controller/Routes bien separados |
| **Validación Zod** | ✅ Schemas completos con mensajes en español |
| **Rate Limiting** | ✅ `reservationLimiter` 10/min aplicado |
| **Auth/RBAC** | ✅ Rutas admin protegidas con [authenticate](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/middleware/auth.middleware.ts#14-82) + [requireAdmin](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/middleware/auth.middleware.ts#83-100) |

> [!CAUTION]
> **No desplegar** hasta remediar ALTO-1. Un viernes a medianoche con 50 clientes reservando, el overbooking es inevitable sin transacción atómica.
