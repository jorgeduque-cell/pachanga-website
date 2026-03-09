# Correcciones del Sistema de Reservas

## Problemas Identificados y Soluciones

### 1. ✅ Validación de Mesas Ocupadas (Corregido)

**Problema**: El sistema solo verificaba reservas con estado `CONFIRMED`, permitiendo reservar mesas que ya tenían reservas `PENDING`.

**Solución**: Se actualizó la validación para verificar tanto `PENDING` como `CONFIRMED`.

**Archivos modificados**:
- `backend/src/modules/reservations/reservation.service.ts`
  - `validateTableForReservation()`: Ahora verifica `status: { in: ['CONFIRMED', 'PENDING'] }`
  - `validateNoConflict()`: Ahora verifica `status: { in: ['CONFIRMED', 'PENDING'] }`

- `backend/src/modules/tables/table.service.ts`
  - `getReservedTableIds()`: Ahora incluye validación por defecto para PENDING y CONFIRMED

### 2. ✅ Cron Job para Liberar Reservas (Nuevo)

**Funcionalidad**: Todos los domingos a las 12:00 PM, se cancelan automáticamente todas las reservas `PENDING` y `CONFIRMED`.

**Archivo creado**:
- `backend/src/lib/cron/reservation-cleanup.ts`: Implementa el cron job

**Archivos modificados**:
- `backend/src/lib/cron/index.ts`: Registra el nuevo cron job

### 3. ✅ Logging Mejorado (Agregado)

Se agregó logging detallado en el servicio de reservas para ayudar a diagnosticar problemas:
- Log al crear una reserva
- Log cuando la reserva se crea exitosamente
- Log de errores durante la creación

## Diagnóstico del Problema Principal

Si las reservas siguen sin guardarse en Supabase, verificar:

### 1. Conexión Backend-Supabase

```bash
cd backend
npx tsx test-reservation.ts
```

Este script probará:
- Conexión a la base de datos
- Lectura de mesas y reservas
- Creación y eliminación de una reserva de prueba

### 2. Variables de Entorno en Render

Verificar que en Render (donde está deployado el backend) estén configuradas las variables:

```
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
NODE_ENV=production
```

### 3. URL del Backend en el Frontend

Verificar en `app/src/lib/api.ts` que la URL apunte al backend correcto:

```typescript
const PROD_API_URL = 'https://pachanga-api.onrender.com/api';
```

### 4. Rebuild y Redeploy

Después de estos cambios, es necesario:

```bash
# En el backend
cd backend
npm run build

# Hacer commit y push
git add .
git commit -m "Fix: Validación de reservas y cron job de limpieza"
git push
```

Render debería redeployar automáticamente.

## Comportamiento Esperado Después de los Cambios

1. **Reservas Duplicadas Bloqueadas**: Si una mesa ya tiene una reserva PENDING o CONFIRMED para una fecha/hora específica, el sistema devolverá error 409.

2. **Mensaje de Error en Frontend**: El usuario verá el mensaje: "Esta mesa ya está reservada para esa fecha y hora"

3. **Liberación Automática**: Todos los domingos a las 12:00 PM, todas las reservas activas se cancelan automáticamente.

## Próximos Pasos

1. Ejecutar el script de prueba para verificar conexión con Supabase
2. Verificar logs en Render (Dashboard > Logs)
3. Si hay errores de conexión, verificar las credenciales de Supabase
