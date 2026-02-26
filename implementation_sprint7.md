# Sprint 7 — Dashboard Admin CRM (Backend)

## Análisis Breve

| TSK | Título | Estado |
|:---:|---|:---:|
| ~~35~~ | API Analytics KPIs | ⚡ Parcial — [getStats()](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/modules/crm/crm.controller.ts#107-115) ya existe (S6), faltan **charts** |
| ~~36~~ | API Admin CRM — Clientes y Mensajes | ✅ S5 |
| ~~37~~ | API Config CRM | ✅ S5 |
| **38** | Dashboard Admin CRM (Frontend) | 🎨 Kimi |
| **39** | Generador de Códigos QR | 🤖 Antigravity |
| **40** | Auditoría DevSecOps Final | 🤖 Antigravity |

**Backend real Sprint 7 = 2 tareas nuevas:**
1. **TSK-35b**: API Analytics Charts (3 endpoints de gráficos)
2. **TSK-39**: QR Generator (generar QR por mesa o batch)

---

## TSK-35b: API Analytics Charts

### Esquema de Datos

No se modifica el schema. Usa aggregations sobre modelos existentes:
- [Customer](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/schemas/crm.schema.ts#81-82) → new customers por mes, rating trend
- `WhatsAppMessage` → messages por status

### Contrato API (JSON Contract)

#### GET `/api/analytics/charts/new-customers`

**Auth:** JWT + ADMIN

**Response 200:**
```json
{
  "data": [
    { "month": "2025-09", "count": 12 },
    { "month": "2025-10", "count": 28 },
    { "month": "2025-11", "count": 35 },
    { "month": "2025-12", "count": 18 },
    { "month": "2026-01", "count": 42 },
    { "month": "2026-02", "count": 31 }
  ]
}
```

---

#### GET `/api/analytics/charts/messages-by-status`

**Response 200:**
```json
{
  "data": [
    { "status": "SENT", "count": 120 },
    { "status": "DELIVERED", "count": 105 },
    { "status": "READ", "count": 72 },
    { "status": "FAILED", "count": 8 }
  ]
}
```

---

#### GET `/api/analytics/charts/rating-distribution`

**Response 200:**
```json
{
  "data": [
    { "rating": 1, "count": 3 },
    { "rating": 2, "count": 5 },
    { "rating": 3, "count": 15 },
    { "rating": 4, "count": 42 },
    { "rating": 5, "count": 89 }
  ]
}
```

---

#### GET `/api/analytics/charts/visits-trend`

**Query:** `?months=6` (default 6, max 12)

**Response 200:**
```json
{
  "data": [
    { "month": "2025-09", "visits": 45 },
    { "month": "2025-10", "visits": 72 },
    { "month": "2026-02", "visits": 110 }
  ]
}
```

**Response 400:**
```json
{ "error": "Validation error", "details": [{ "path": "months", "message": "Max 12 meses" }] }
```

### Lógica de Negocio

#### [NEW] `modules/analytics/analytics.service.ts`

```typescript
import { prisma } from '../../lib/prisma.js';

interface ChartPoint { month: string; count: number; }
interface StatusPoint { status: string; count: number; }
interface RatingPoint { rating: number; count: number; }

export class AnalyticsService {

  async getNewCustomersByMonth(months = 6): Promise<ChartPoint[]> {
    const since = new Date();
    since.setMonth(since.getMonth() - months);

    const results = await prisma.$queryRaw<ChartPoint[]>`
      SELECT TO_CHAR(created_at, 'YYYY-MM') AS month,
             COUNT(*)::int AS count
      FROM customers
      WHERE created_at >= ${since}
      GROUP BY month
      ORDER BY month ASC
    `;
    return results;
  }

  async getMessagesByStatus(): Promise<StatusPoint[]> {
    const results = await prisma.whatsAppMessage.groupBy({
      by: ['status'],
      _count: { status: true },
      orderBy: { _count: { status: 'desc' } },
    });
    return results.map(r => ({ status: r.status, count: r._count.status }));
  }

  async getRatingDistribution(): Promise<RatingPoint[]> {
    const results = await prisma.customer.groupBy({
      by: ['rating'],
      _count: { rating: true },
      where: { rating: { not: null } },
      orderBy: { rating: 'asc' },
    });
    return results.map(r => ({
      rating: r.rating!,
      count: r._count.rating,
    }));
  }

  async getVisitsTrend(months = 6): Promise<ChartPoint[]> {
    const since = new Date();
    since.setMonth(since.getMonth() - months);

    return prisma.$queryRaw<ChartPoint[]>`
      SELECT TO_CHAR(created_at, 'YYYY-MM') AS month,
             SUM(total_visits)::int AS count
      FROM customers
      WHERE last_visit_at >= ${since}
      GROUP BY month
      ORDER BY month ASC
    `;
  }
}

export const analyticsService = new AnalyticsService();
```

#### [NEW] `modules/analytics/analytics.controller.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { analyticsService } from './analytics.service.js';

export class AnalyticsController {
  async getNewCustomers(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const months = parseInt((_req.query.months as string) ?? '6', 10);
      const data = await analyticsService.getNewCustomersByMonth(Math.min(months, 12));
      res.json({ data });
    } catch (error) { next(error); }
  }

  async getMessagesByStatus(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await analyticsService.getMessagesByStatus();
      res.json({ data });
    } catch (error) { next(error); }
  }

  async getRatingDistribution(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await analyticsService.getRatingDistribution();
      res.json({ data });
    } catch (error) { next(error); }
  }

  async getVisitsTrend(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const months = parseInt((_req.query.months as string) ?? '6', 10);
      const data = await analyticsService.getVisitsTrend(Math.min(months, 12));
      res.json({ data });
    } catch (error) { next(error); }
  }
}

export const analyticsController = new AnalyticsController();
```

#### [NEW] `modules/analytics/analytics.routes.ts`

```typescript
import { Router } from 'express';
import { analyticsController } from './analytics.controller.js';
import { authenticate, requireAdmin } from '../../middleware/auth.middleware.js';

const router = Router();

router.get('/charts/new-customers', authenticate, requireAdmin, analyticsController.getNewCustomers);
router.get('/charts/messages-by-status', authenticate, requireAdmin, analyticsController.getMessagesByStatus);
router.get('/charts/rating-distribution', authenticate, requireAdmin, analyticsController.getRatingDistribution);
router.get('/charts/visits-trend', authenticate, requireAdmin, analyticsController.getVisitsTrend);

export default router;
```

#### [MODIFY] [server.ts](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/server.ts) — registrar analytics

```diff
+import analyticsRoutes from './modules/analytics/analytics.routes.js';

 app.use('/api/crm', crmRoutes);
+app.use('/api/analytics', analyticsRoutes);
```

---

## TSK-39: Generador de Códigos QR

### Esquema de Datos

No se modifica. Usa [Table](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/app/src/types/table.types.ts#24-35) (name, zone) existente.

### Contrato API

#### GET `/api/crm/qr/:tableName`

**Auth:** JWT + ADMIN

**Response 200:** PNG binario (image/png)

```
Content-Type: image/png
Content-Disposition: inline; filename="qr-P1.png"
[binary PNG data]
```

**Response 404:**
```json
{ "error": "Mesa no encontrada" }
```

---

#### GET `/api/crm/qr/batch`

**Auth:** JWT + ADMIN

**Response 200:** JSON con QRs en base64

```json
{
  "data": [
    { "tableName": "P1", "qrBase64": "data:image/png;base64,iVBOR..." },
    { "tableName": "P2", "qrBase64": "data:image/png;base64,..." }
  ]
}
```

### Lógica de Negocio

#### [NEW] `modules/crm/qr.service.ts`

```typescript
import QRCode from 'qrcode';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';

const BASE_URL = process.env.FRONTEND_URL ?? 'https://pachanga.com';
const QR_SIZE = 500;

interface QRResult { tableName: string; qrBase64: string; }

export class QrService {
  async generateForTable(tableName: string): Promise<Buffer> {
    const table = await prisma.table.findFirst({ where: { name: tableName } });
    if (!table) throw new AppError('Mesa no encontrada', 404);

    const url = `${BASE_URL}/feedback?qr=${tableName}`;
    return QRCode.toBuffer(url, {
      width: QR_SIZE,
      margin: 2,
      color: { dark: '#1a1a2e', light: '#ffffff' },
      errorCorrectionLevel: 'H',
    });
  }

  async generateBatch(): Promise<QRResult[]> {
    const tables = await prisma.table.findMany({
      orderBy: { name: 'asc' },
      select: { name: true },
    });

    const results: QRResult[] = [];
    for (const table of tables) {
      const url = `${BASE_URL}/feedback?qr=${table.name}`;
      const dataUrl = await QRCode.toDataURL(url, {
        width: QR_SIZE,
        margin: 2,
        color: { dark: '#1a1a2e', light: '#ffffff' },
        errorCorrectionLevel: 'H',
      });
      results.push({ tableName: table.name, qrBase64: dataUrl });
    }
    return results;
  }
}

export const qrService = new QrService();
```

#### [MODIFY] [modules/crm/crm.controller.ts](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/modules/crm/crm.controller.ts) — agregar endpoints QR

```typescript
async generateQR(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const buffer = await qrService.generateForTable(req.params.tableName);
    res.set('Content-Type', 'image/png');
    res.set('Content-Disposition', `inline; filename="qr-${req.params.tableName}.png"`);
    res.send(buffer);
  } catch (error) { next(error); }
}

async generateQRBatch(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await qrService.generateBatch();
    res.json({ data });
  } catch (error) { next(error); }
}
```

#### [MODIFY] [modules/crm/crm.routes.ts](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/modules/crm/crm.routes.ts) — agregar rutas QR

```typescript
router.get('/qr/batch', authenticate, requireAdmin, crmController.generateQRBatch);
router.get('/qr/:tableName', authenticate, requireAdmin, crmController.generateQR);
```

> [!IMPORTANT]
> La ruta `/qr/batch` DEBE estar antes de `/qr/:tableName` para evitar que Express interprete "batch" como un `tableName`.

---

## Dependencias nuevas

```bash
npm install qrcode
npm install -D @types/qrcode
```

---

## Archivos Resumen

| Acción | Archivo | TSK |
|---|---|:---:|
| **NEW** | `modules/analytics/analytics.service.ts` | 35b |
| **NEW** | `modules/analytics/analytics.controller.ts` | 35b |
| **NEW** | `modules/analytics/analytics.routes.ts` | 35b |
| **NEW** | `modules/crm/qr.service.ts` | 39 |
| **MODIFY** | [modules/crm/crm.controller.ts](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/modules/crm/crm.controller.ts) (+2 endpoints QR) | 39 |
| **MODIFY** | [modules/crm/crm.routes.ts](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/modules/crm/crm.routes.ts) (+2 rutas QR) | 39 |
| **MODIFY** | [server.ts](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/server.ts) (+analytics routes) | 35b |
| **INSTALL** | `qrcode` + `@types/qrcode` | 39 |

## Verificación

```bash
npx tsc --noEmit        # Cero errores
npm run dev              # Server starts OK
# Luego TSK-40: auditoría final
```

## Orden de Ejecución

| Paso | TSK | Descripción | Est. |
|:---:|:---:|---|:---:|
| 1 | **35b** | Analytics module (service + controller + routes) | 0.5d |
| 2 | **39** | QR Generator (instalar qrcode, service, endpoints) | 0.5d |
| 3 | **38** | Dashboard CRM Frontend (🎨 Kimi) | 2d |
| 4 | **40** | Auditoría DevSecOps Final | 0.5d |
