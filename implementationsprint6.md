# Sprint 6 — Automatización y Captura

## Análisis Breve

Sprint 5 entregó los cimientos: schema CRM, servicio CRM (capture, linkToReservation), servicio WhatsApp (dry-run). **TSK-31 (endpoint capture) ya fue implementado** dentro del Sprint 5 — el controller, routes y service ya existen en `/api/crm/capture`.

Sprint 6 tiene **2 tareas backend** y **1 frontend** (Kimi):

| TSK | Título | Asignación | Depende de |
|:---:|---|:---:|---|
| ~~31~~ | ~~Endpoint Capture QR~~ | ~~🤖~~ | ✅ Ya hecho en S5 |
| **32** | Formulario QR Mobile | 🎨 Kimi | TSK-31 ✅ |
| **33** | Birthday Engine (Cron) | 🤖 Antigravity | TSK-29 ✅ |
| **34** | Webhook WhatsApp | 🤖 Antigravity | TSK-29 ✅ |

> [!IMPORTANT]
> No se requieren cambios al schema Prisma. Sprint 6 es **puro código de negocio** sobre la infraestructura ya existente.

---

## TSK-33: Birthday Engine (Cron Job)

### Esquema de Datos

No se modifica el schema. Usa los modelos existentes: [Customer](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/schemas/crm.schema.ts#81-82) (birthDate, optIn, isActive), `WhatsAppMessage` (type, sentAt), [Interaction](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/modules/crm/crm.service.ts#230-239).

**Query de idempotencia** — evitar duplicados:

```sql
-- Cumpleañeros de hoy que NO recibieron mensaje BIRTHDAY hoy
SELECT c.* FROM customers c
WHERE EXTRACT(MONTH FROM c.birth_date) = $1
  AND EXTRACT(DAY FROM c.birth_date) = $2
  AND c.opt_in = true AND c.is_active = true
  AND c.id NOT IN (
    SELECT wm.customer_id FROM whatsapp_messages wm
    WHERE wm.type = 'BIRTHDAY'
      AND wm.sent_at::date = CURRENT_DATE
  )
```

### Contrato API

> No expone endpoints. Es un job interno.

**Log output:**
```json
{
  "event": "birthday_cron_run",
  "timestamp": "2026-02-26T16:00:00.000Z",
  "result": {
    "found": 3,
    "sent": 3,
    "skipped": 0,
    "failed": 0
  }
}
```

### Lógica de Negocio

#### [NEW] `lib/cron/birthday-engine.ts`

```typescript
import cron from 'node-cron';
import { prisma } from '../prisma.js';
import { whatsappService } from '../../modules/whatsapp/whatsapp.service.js';
import { Customer } from '@prisma/client';

const BIRTHDAY_CRON_SCHEDULE = '0 11 * * *'; // 11:00 AM diario
const TIMEZONE = 'America/Bogota';

interface BirthdayRunResult {
  found: number;
  sent: number;
  skipped: number;
  failed: number;
}

export class BirthdayEngine {
  private task: cron.ScheduledTask | null = null;

  start(): void {
    if (this.task) return;

    this.task = cron.schedule(BIRTHDAY_CRON_SCHEDULE, () => {
      this.run().catch((error: unknown) => {
        console.error('❌ Birthday cron error:', error);
      });
    }, { timezone: TIMEZONE });

    console.log('🎂 Birthday engine started (11:00 AM America/Bogota)');
  }

  stop(): void {
    this.task?.stop();
    this.task = null;
  }

  async run(): Promise<BirthdayRunResult> {
    const result: BirthdayRunResult = { found: 0, sent: 0, skipped: 0, failed: 0 };

    const isEnabled = await this.isCronEnabled();
    if (!isEnabled) {
      console.log('🎂 Birthday cron disabled via config');
      return result;
    }

    const customers = await this.findEligibleBirthdays();
    result.found = customers.length;

    if (customers.length === 0) {
      console.log('🎂 No birthdays today');
      return result;
    }

    for (const customer of customers) {
      try {
        await whatsappService.sendBirthday(customer);
        await this.createBirthdayInteraction(customer.id);
        result.sent++;
      } catch {
        result.failed++;
      }
    }

    console.log(`🎂 Birthday run: found=${result.found} sent=${result.sent} failed=${result.failed}`);
    return result;
  }

  // — Private —

  private async isCronEnabled(): Promise<boolean> {
    const config = await prisma.crmConfig.findUnique({
      where: { key: 'birthday_cron_enabled' },
    });
    return config?.value !== 'false';
  }

  private async findEligibleBirthdays(): Promise<Customer[]> {
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();
    const todayStr = today.toISOString().split('T')[0];

    return prisma.$queryRaw<Customer[]>`
      SELECT c.* FROM customers c
      WHERE EXTRACT(MONTH FROM c.birth_date) = ${month}
        AND EXTRACT(DAY FROM c.birth_date) = ${day}
        AND c.opt_in = true AND c.is_active = true
        AND c.id NOT IN (
          SELECT wm.customer_id FROM whatsapp_messages wm
          WHERE wm.type = 'BIRTHDAY'
            AND wm.sent_at::date = ${todayStr}::date
        )
    `;
  }

  private async createBirthdayInteraction(customerId: string): Promise<void> {
    await prisma.interaction.create({
      data: {
        customerId,
        type: 'birthday_greeting',
        metadata: JSON.parse(JSON.stringify({ year: new Date().getFullYear() })),
      },
    });
  }
}

export const birthdayEngine = new BirthdayEngine();
```

#### [NEW] `lib/cron/index.ts`

```typescript
import { birthdayEngine } from './birthday-engine.js';

export function startCronJobs(): void {
  birthdayEngine.start();
  console.log('⏰ All cron jobs initialized');
}

export function stopCronJobs(): void {
  birthdayEngine.stop();
}
```

#### [MODIFY] [server.ts](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/server.ts) — agregar `startCronJobs()` en el listener

```diff
+import { startCronJobs } from './lib/cron/index.js';

 httpServer.listen(env.PORT, () => {
   console.log(`🚀 Server running on port ${env.PORT}`);
+  startCronJobs();
 });
```

---

## TSK-34: Webhook WhatsApp

### Esquema de Datos

No se modifica. Usa `WhatsAppMessage` (waMessageId, status, deliveredAt, readAt) e [Interaction](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/modules/crm/crm.service.ts#230-239).

### Contrato API

#### GET `/api/whatsapp/webhook` — Verificación Meta

**Request (query params):**
```
?hub.mode=subscribe
&hub.verify_token=pachanga_webhook_2026
&hub.challenge=1234567890
```

**Response 200:**
```
1234567890
```

**Response 403:**
```json
{ "error": "Forbidden" }
```

---

#### POST `/api/whatsapp/webhook` — Evento entrante

**Headers requeridos:**
```
x-hub-signature-256: sha256=abc123...
Content-Type: application/json
```

**Request body (status update):**
```json
{
  "entry": [{
    "changes": [{
      "value": {
        "statuses": [{
          "id": "wamid.xxx",
          "status": "delivered",
          "timestamp": "1740000000"
        }]
      }
    }]
  }]
}
```

**Request body (customer reply):**
```json
{
  "entry": [{
    "changes": [{
      "value": {
        "messages": [{
          "from": "573219992719",
          "type": "text",
          "text": { "body": "Quiero reservar" },
          "timestamp": "1740000000"
        }]
      }
    }]
  }]
}
```

**Response 200:**
```
OK
```

### Lógica de Negocio

#### [NEW] `lib/webhook-signature.ts`

```typescript
import crypto from 'crypto';
import { env } from '../config/env.js';

export function verifyWebhookSignature(
  rawBody: Buffer,
  signature: string,
): boolean {
  const appSecret = env.WHATSAPP_TOKEN;
  if (!appSecret || !signature) return false;

  const expectedSig = crypto
    .createHmac('sha256', appSecret)
    .update(rawBody)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(`sha256=${expectedSig}`),
    Buffer.from(signature),
  );
}
```

#### [NEW] `modules/whatsapp/whatsapp.controller.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { env } from '../../config/env.js';
import { whatsappService } from './whatsapp.service.js';
import { crmService } from '../crm/crm.service.js';
import { verifyWebhookSignature } from '../../lib/webhook-signature.js';

export class WhatsAppController {
  verify(req: Request, res: Response): void {
    const mode = req.query['hub.mode'] as string;
    const token = req.query['hub.verify_token'] as string;
    const challenge = req.query['hub.challenge'] as string;

    if (mode === 'subscribe' && token === env.WHATSAPP_VERIFY_TOKEN) {
      res.status(200).send(challenge);
    } else {
      res.status(403).json({ error: 'Forbidden' });
    }
  }

  async handleEvent(req: Request, res: Response, _next: NextFunction): Promise<void> {
    // Always reply 200 immediately (Meta requirement)
    res.status(200).send('OK');

    try {
      const entries = req.body?.entry ?? [];
      for (const entry of entries) {
        for (const change of entry.changes ?? []) {
          const value = change.value;
          await this.processStatuses(value?.statuses);
          await this.processMessages(value?.messages);
        }
      }
    } catch (error: unknown) {
      console.error('❌ Webhook processing error:', error);
    }
  }

  // — Private —

  private async processStatuses(statuses?: WebhookStatus[]): Promise<void> {
    if (!statuses) return;
    for (const s of statuses) {
      await whatsappService.updateMessageStatus(
        s.id,
        s.status as 'delivered' | 'read' | 'failed',
      );
    }
  }

  private async processMessages(messages?: WebhookMessage[]): Promise<void> {
    if (!messages) return;
    for (const msg of messages) {
      // Log customer reply as interaction (no auto-reply)
      const customer = await prisma.customer.findUnique({
        where: { phone: `+${msg.from}` },
      });
      if (customer) {
        await crmService['createInteraction'](customer.id, 'customer_reply', {
          text: msg.text?.body ?? '',
          type: msg.type,
        });
      }
    }
  }
}

// Types
interface WebhookStatus { id: string; status: string; timestamp: string; }
interface WebhookMessage { from: string; type: string; text?: { body: string }; timestamp: string; }

export const whatsappController = new WhatsAppController();
```

#### [NEW] `modules/whatsapp/whatsapp.routes.ts`

```typescript
import { Router, raw } from 'express';
import { whatsappController } from './whatsapp.controller.js';
import { verifyWebhookSignature } from '../../lib/webhook-signature.js';
import { Request, Response, NextFunction } from 'express';

const router = Router();

// Meta verification
router.get('/webhook', whatsappController.verify.bind(whatsappController));

// Webhook events — raw body for HMAC + verify signature
router.post(
  '/webhook',
  raw({ type: 'application/json' }),
  (req: Request, res: Response, next: NextFunction): void => {
    const signature = req.headers['x-hub-signature-256'] as string;

    if (!verifyWebhookSignature(req.body as Buffer, signature)) {
      res.status(401).json({ error: 'Invalid signature' });
      return;
    }

    // Parse raw body to JSON
    req.body = JSON.parse((req.body as Buffer).toString());
    next();
  },
  whatsappController.handleEvent.bind(whatsappController),
);

export default router;
```

#### [MODIFY] [server.ts](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/server.ts) — registrar webhook routes

```diff
+import whatsappRoutes from './modules/whatsapp/whatsapp.routes.js';

 app.use('/api/crm', crmRoutes);
+app.use('/api/whatsapp', whatsappRoutes);
```

> [!WARNING]
> La ruta webhook POST usa `raw()` middleware en vez de `express.json()` porque necesita el body crudo para verificar la firma HMAC SHA256. El `express.json()` global de [server.ts](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/server.ts) se aplica antes, así que la ruta webhook necesita registrarse **antes** del `express.json()` global, O usar un middleware propio.

---

## Verificación

### Automated
```bash
npx tsc --noEmit                 # Cero errores
npm run dev                      # Server starts + cron logs
```

### Manual
1. Birthday Engine: verificar log `🎂 Birthday engine started` en console
2. Webhook GET: `curl "localhost:3001/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=pachanga_webhook_2026&hub.challenge=test123"` → `test123`
3. Dry-run birthday: llamar `birthdayEngine.run()` manualmente

---

## Orden de Ejecución

| Paso | TSK | Descripción | Est. |
|:---:|:---:|---|:---:|
| 1 | **33** | Instalar `node-cron`, crear birthday-engine, registrar en server | 0.5d |
| 2 | **34** | Crear webhook controller/routes, webhook-signature, registrar | 0.5d |
| 3 | **32** | Formulario QR Mobile (🎨 Kimi) | 1.5d |
