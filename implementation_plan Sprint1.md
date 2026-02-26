# Sprint 2 — Estado Actual y Plan para Kimi Code

---

## Estado del Sprint 2

| Tarea | Tipo | Estado | Notas |
|---|---|:---:|---|
| **TSK-10:** WebSocket Server | 🤖 Backend | ❌ Pendiente | `socket.io` no instalado, `socket.service.ts` no existe |
| **TSK-11:** UI Notificaciones | 🎨 Frontend | ❌ Pendiente | Depende de TSK-10 |
| **TSK-12:** Schemas Compartidos | 🤖+🎨 | ❌ Pendiente | Carpeta `shared/` no existe |
| **TSK-13:** Testing E2E | 🤖 Backend | ❌ Pendiente | `vitest`/`supertest` no instalados |
| **NUEVO:** Backend Mapa Mesas | 🤖 Backend | ✅ Listo | `GET /api/tables/map`, schema `floor`, seed 73 mesas |
| **NUEVO:** UI Mapa Interactivo | 🎨 Frontend | ❌ Pendiente | Contrato definido abajo |

---

## Tareas Pendientes de Backend (Antigravity)

### TSK-10: WebSocket Server (Socket.IO)

**Dependencias a instalar:**
```bash
npm install socket.io@^4.8.3
```

**Archivos a crear/modificar:**
- **[NEW]** `src/services/socket.service.ts` — Singleton Socket.IO con auth JWT en handshake
- **[MODIFY]** [src/server.ts](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/server.ts) — `app.listen()` → `httpServer.listen()`
- **[MODIFY]** [src/modules/reservations/reservation.service.ts](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/modules/reservations/reservation.service.ts) — Emitir `new-reservation` y `reservation-updated`

### TSK-12: Schemas Compartidos

- **[NEW]** `shared/schemas/reservation.schema.ts` — Schemas Zod sin dependencias de Prisma
- **[NEW]** `shared/schemas/table.schema.ts`
- **[NEW]** `shared/schemas/auth.schema.ts`
- **[NEW]** `shared/schemas/index.ts`

### TSK-13: Testing E2E

**Dependencias a instalar:**
```bash
npm install -D vitest@^3.0.0 supertest@^7.0.0 @types/supertest@^6.0.0
```

**Archivos a crear:**
- `tests/setup.ts`
- `tests/integration/auth.test.ts`
- `tests/integration/tables.test.ts`
- `tests/integration/reservations.test.ts`

---

## Tareas de Frontend para Kimi Code

### 1. Mapa Interactivo de Mesas (página pública `/reservas`)

**Endpoint:** `GET /api/tables/map?date=2026-03-01&time=20:00`

```json
{
  "data": {
    "floor1": {
      "label": "Primer Piso",
      "tables": [
        { "id": "uuid", "name": "P1", "capacity": 10, "zone": "SALON", "floor": 1, "isAvailable": true },
        { "id": "uuid", "name": "A",  "capacity": 2,  "zone": "BARRA", "floor": 1, "isAvailable": false }
      ]
    },
    "floor2": {
      "label": "Segundo Piso",
      "tables": [...]
    },
    "totalTables": 73,
    "availableTables": 70
  }
}
```

**Imagen de referencia:** [Material audiovisual/mapa_mesas_recortado.jpg](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/Material%20audiovisual/mapa_mesas_recortado.jpg)

**Reglas de negocio del mapa:**
| Prefijo | Capacidad | Color sugerido | Zona |
|---|:-:|---|---|
| P (P1-P21) | 10 personas | Verde/teal (grande) | SALON |
| V (V1-V35) | 4 personas | Dorado/marrón (redondo) | SALON |
| R (R1-R2) | 4 personas | Dorado/marrón (redondo) | SALON |
| Letra sola (A-Z) | 2 personas | Dorado oscuro (pequeño) | BARRA |

**UX esperada:**
- El cliente ve el mapa dividido en 2 pisos (tabs o scroll)
- Las mesas disponibles son clickeables → muestra tooltip con: nombre, capacidad, zona
- Las mesas ocupadas se muestran en gris/deshabilitadas
- Al seleccionar una mesa → se llena el `tableId` en el formulario de reserva

---

### 2. Formulario de Reservas (página pública)

**Endpoint:** `POST /api/reservations` (rate-limit: 10/min)

```json
// Request
{
  "customerName": "Juan Pérez",
  "customerPhone": "555-0101",
  "reservationDate": "2026-03-01",
  "reservationTime": "20:00",
  "partySize": 4,
  "tableId": "uuid-de-la-mesa",
  "message": "Cumpleaños"
}

// 201 Created
{ "data": { "id": "uuid", "status": "PENDING", ... } }

// 409 Conflict
{ "error": "Esta mesa ya está reservada para esa fecha y hora" }

// 400 Bad Request
{ "error": "No se pueden crear reservas para fechas pasadas" }
```

---

### 3. Notificaciones en Panel Admin (TSK-11)

> [!NOTE]
> Esta tarea depende de TSK-10 (WebSocket Server). El backend aún no tiene Socket.IO implementado.

**Conexión WebSocket (una vez implementado):**
```typescript
const socket = io('http://localhost:3001', {
  auth: { token: 'Bearer eyJhbG...' }
});

socket.on('new-reservation', (reservation) => { /* badge +1, sonido */ });
socket.on('reservation-updated', (reservation) => { /* actualizar UI */ });
```

---

### 4. Endpoints Admin ya disponibles

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/auth/login` | Login → `{ user, accessToken, refreshToken }` |
| `GET` | `/api/tables` | Listar todas las mesas |
| `GET` | `/api/tables/map?date=X&time=Y` | Mapa con disponibilidad |
| `GET` | `/api/tables/available?date=X&time=Y` | Solo mesas libres |
| `POST` | `/api/reservations` | Crear reserva (público) |
| `GET` | `/api/reservations?date=X&status=Y&page=1` | Listar con filtros (admin) |
| `GET` | `/api/reservations/stats` | Estadísticas del día (admin) |
| `PATCH` | `/api/reservations/:id` | Cambiar estado/mesa (admin) |
| `PATCH` | `/api/reservations/:id/cancel` | Cancelar (admin) |

> [!IMPORTANT]
> Antes de empezar a consumir la API, ejecutar:
> ```bash
> cd backend && npx prisma migrate dev --name add-table-floor && npx prisma db seed
> ```
