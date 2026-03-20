# 🛡️ SECURITY & QUALITY AUDIT REPORT

**Project:** Pachanga Backend  
**Date:** 2026-03-15  
**Auditor:** Antigravity Core Engine (DevSecOps)  
**Scope:** Full backend codebase — 40+ source files across 7 modules, 5 middleware, 3 services, 5 schemas, 4 cron jobs, config & libs.

---

**VERDICT:** ❌ **REJECTED**

> [!CAUTION]
> 3 CRITICAL findings found. The codebase has strong foundations (Zod validation, Prisma ORM, token rotation, HMAC webhook verification, rate limiting) but carries specific technical debt that must be remediated before any production audit is considered passed.

---

## SUMMARY OF FINDINGS

| # | Severity | File | Category | Description |
|:--|:---------|:-----|:---------|:------------|
| 1 | 🔴 CRITICAL | [.env](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/.env) | Security | Production Supabase DB password & JWT secret stored in plaintext `.env` file on disk. |
| 2 | 🔴 CRITICAL | [env.ts:16](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/config/env.ts#L16) | Security | `WHATSAPP_VERIFY_TOKEN` has a hardcoded default value `'pachanga_webhook_2026'`. |
| 3 | 🔴 CRITICAL | [survey-sender.ts:68](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/lib/cron/survey-sender.ts#L68) | Security | JWT survey token stored as `metadata` in the `interactions` table — leaks replay-capable tokens to anyone with DB read access. |
| 4 | 🟠 HIGH | [table.routes.ts:10-13](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/modules/tables/table.routes.ts#L10-L13) | Auth | `GET /api/tables`, `/map`, `/available`, `/:id` are publicly accessible without authentication — leaks business layout data. |
| 5 | 🟡 WARNING | [reservation.service.ts:215-216](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/modules/reservations/reservation.service.ts#L215-L216) | Architecture | Hardcoded timezone offset `UTC_OFFSET_BOGOTA_MS = -5 * 60 * 60 * 1000` — doesn't handle Colombia DST edge cases and is a magic number duplicated in `reservation-cleanup.ts:33`. |
| 6 | 🟡 WARNING | [reservation.service.ts:54-58](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/modules/reservations/reservation.service.ts#L54-L58) | DRY | Phone normalization with silent catch is duplicated in `reservation.service.ts:54-58` and `crm.service.ts:73-79`. |
| 7 | 🟡 WARNING | [crm.controller.ts:77](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/modules/crm/crm.controller.ts#L77) | Validation | `updateConfig` handler destructures `req.body` directly instead of using `validatedBody<UpdateConfigInput>()` — bypasses type-safe extraction despite Zod middleware being present on the route. |
| 8 | 🟡 WARNING | [crm.schema.ts:69](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/schemas/crm.schema.ts#L69) | Data Integrity | `MessageFiltersSchema` is missing `SURVEY` in the `type` enum — admin cannot filter survey messages in the messages list. |
| 9 | 🟡 WARNING | [prisma.ts:18-23](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/lib/prisma.ts#L18-L23) | Architecture | Uses `console.log` / `console.error` instead of the structured `logger` for DB connection events — breaks structured logging in production. |
| 10 | 🟡 WARNING | [error.middleware.ts:63](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/middleware/error.middleware.ts#L63) | Architecture | Uses `console.error` instead of `logger.error` for unhandled errors — orphan logs in production won't appear in Pino output. |
| 11 | 🟡 WARNING | [reservation.service.ts:63-69](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/modules/reservations/reservation.service.ts#L63-L69) | Architecture | `ZONE_LABELS` map is defined inline inside the `create()` method — recreated on every request. Should be a module-level constant. |
| 12 | 🟡 WARNING | [whatsapp.controller.ts:36](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/modules/whatsapp/whatsapp.controller.ts#L36) | Validation | `handleEvent` has no Zod validation on the parsed webhook body — trusts Meta's payload structure blindly after HMAC verification. |
| 13 | 🔵 INFO | [analytics.service.ts:13,50](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/modules/analytics/analytics.service.ts#L13) | Performance | Uses `$queryRaw` for analytics queries. While parameterized (safe), these could be pure Prisma ORM calls using `groupBy` + date filters, improving type safety. |
| 14 | 🔵 INFO | [birthday-engine.ts:84](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/lib/cron/birthday-engine.ts#L84-L94) | Performance | `$queryRaw` with `NOT IN (subquery)` for eligible birthdays — anti-pattern for large datasets. Should use `NOT EXISTS` or a Prisma `none` relation filter. |
| 15 | 🔵 INFO | [birthday-engine.ts:55-63](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/lib/cron/birthday-engine.ts#L55-L63) | Performance | Sequential `for...of` loop for sending birthday messages — no concurrency control. Use `Promise.allSettled` with batching for better throughput. |
| 16 | 🔵 INFO | [crm.service.ts:162-168](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/modules/crm/crm.service.ts#L162-L168) | DRY | `getTodayBirthdays()` raw SQL query duplicates the same logic in `birthday-engine.ts:84-94`. Should be a single shared method. |
| 17 | 🔵 INFO | [qr.service.ts:35](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/modules/crm/qr.service.ts#L35) | Performance | `generateBatch()` uses sequential `for...of` loop for QR generation — blocking. Could use `Promise.all` for parallel generation. |
| 18 | 🔵 INFO | [server.ts:61](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/server.ts#L61) | Architecture | Health check hardcodes `version: '1.0.1'` — should read from `package.json` to stay in sync. |
| 19 | 🔵 INFO | [reservation.service.ts:304-308](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/modules/reservations/reservation.service.ts#L304-L308) | Data Integrity | `buildUpdatePayload` uses truthy checks (`if (data.customerName)`) which skips falsy values like `partySize: 0`. Should use `!== undefined`. |

---

## DETAILED ANALYSIS

### 🔴 CRITICAL — Immediate Action Required

#### 1. Production Credentials in `.env`

The file `backend/.env` contains the **real Supabase password** `YIFeHh1PlwG6xzVH` and a 512-char JWT secret. While `.gitignore` correctly excludes `.env`, the risk is:
- Any developer machine compromise leaks full DB access
- The password is shared between the connection pooler AND direct URL

**Remediation:** Rotate the Supabase password and JWT secret immediately. Use a secrets manager (e.g., Supabase Dashboard → Connection Pooling → New Password). Ensure `.env` was never committed in Git history via `git log --all --full-history -- backend/.env`.

#### 2. Hardcoded WhatsApp Verify Token Default

```typescript
// env.ts:16
WHATSAPP_VERIFY_TOKEN: z.string().optional().default('pachanga_webhook_2026'),
```

If `WHATSAPP_VERIFY_TOKEN` is omitted from production env, anyone who guesses this static string can subscribe to the webhook.

**Remediation:** Remove the default. Make it required in production or at least generate a random default and log it.

#### 3. JWT Token Stored in Interaction Metadata

```typescript
// survey-sender.ts:68
metadata: { surveyToken },  // ← JWT token persisted in DB
```

This survey JWT is a full bearer token. Anyone with read access to the `interactions` table can extract it and submit fake surveys.

**Remediation:** Store only a hash or omit the token entirely from metadata. The token is already encoded in the WhatsApp message.

---

### 🟠 HIGH — Should Fix Before Next Release

#### 4. Public Table Routes Leak Business Data

```typescript
// table.routes.ts:10-13
router.get('/', tableController.getAll);               // ← No auth
router.get('/map', ..., tableController.getMap);        // ← No auth
router.get('/available', ..., tableController.getAvailable); // ← No auth
router.get('/:id', ..., tableController.getById);       // ← No auth
```

These expose the full venue layout (names, zones, capacity, positions) to any unauthenticated request. While needed for the public reservation flow, consider:
- Limiting public data to only `id`, `name`, `zone`, `capacity`, and `isAvailable` (no `posX/posY`).
- Or requiring auth for `/map` + `/:id` and keeping only `/available` public with reduced fields.

---

### 🟡 WARNING — Technical Debt

#### 5. Duplicated Hardcoded Timezone Offset

The `-5` UTC offset for Bogotá is duplicated as a magic number in two files. Colombia could theoretically adjust timezones, and this constant has no single source of truth.

**Remediation:** Extract to a shared constant:
```typescript
// lib/timezone.ts
export const BOGOTA_UTC_OFFSET_HOURS = -5;
```

#### 6. Duplicated Phone Normalization with Silent Catch

Both `reservation.service.ts` and `crm.service.ts` contain an identical pattern:
```typescript
try {
    normalizedPhone = normalizePhone(data.customerPhone);
} catch {
    normalizedPhone = data.customerPhone.replace(/[\s-()]/g, '');
}
```

**Remediation:** Create a single `normalizePhoneSafe()` function in `phone-utils.ts`.

#### 7. `updateConfig` Bypasses Type-Safe Extraction

Despite having `validateBody(UpdateConfigSchema)` on the route, the controller directly destructures `req.body`:
```typescript
const { key, value } = req.body;  // ← Should use validatedBody<UpdateConfigInput>(req)
```

#### 8. Missing `SURVEY` in MessageFilters Enum

```typescript
type: z.enum(['WELCOME', 'BIRTHDAY', 'PROMO', 'REACTIVATION']).optional(),
// Missing: 'SURVEY'
```

The `MessageType` Prisma enum includes `SURVEY` but the filter schema doesn't — admin can't filter survey messages.

#### 9-10. `console.log` / `console.error` Instead of `logger`

- `prisma.ts:19` uses `console.log('[Prisma] Connected...')`
- `prisma.ts:21` uses `console.error('[Prisma] Connection error...')`
- `error.middleware.ts:63` uses `console.error('Error no manejado:', err)`

These bypass Pino, resulting in unstructured logs in production deployments.

#### 11. Inline `ZONE_LABELS` Constant

The `ZONE_LABELS` map inside `create()` is recreated on every reservation creation. Move to module scope.

#### 12. No Webhook Body Validation

After HMAC verification, the webhook body is parsed with `JSON.parse()` and processed without any schema validation. A malformed webhook (or Meta API version change) could cause unhandled exceptions.

---

### 🔵 INFO — Improvement Opportunities

| # | Description |
|:--|:------------|
| 13 | Replace `$queryRaw` in analytics with Prisma ORM `groupBy()` + `Prisma.raw` date functions for type safety |
| 14 | Replace `NOT IN (subquery)` with `NOT EXISTS` or Prisma relation `none` filter in birthday engine |
| 15 | Add concurrent batching to birthday/survey cron loops (`Promise.allSettled` with batch size) |
| 16 | Consolidate `getTodayBirthdays()` raw SQL (duplicated in `crm.service.ts` and `birthday-engine.ts`) |
| 17 | Parallelize QR batch generation with `Promise.all` instead of sequential loop |
| 18 | Read `version` from `package.json` in health check instead of hardcoding `'1.0.1'` |
| 19 | Use `!== undefined` instead of truthy checks in `buildUpdatePayload` to handle `0` and `''` values |

---

## ✅ WHAT'S WORKING WELL

These components demonstrate solid engineering practices. **Do not touch them:**

| Area | Assessment |
|:-----|:-----------|
| **Zod Validation** | Every public endpoint has strict input validation with clear Spanish error messages |
| **Prisma ORM** | No raw SQL injection risks — all `$queryRaw` use tagged template parameterization |
| **Token Management** | Access + refresh token rotation with blacklist, JTI tracking, and cleanup cron |
| **HMAC Webhook Verification** | Constant-time signature comparison via `crypto.timingSafeEqual` |
| **Rate Limiting** | 4 rate limiters (global, auth, reservation, QR capture) with appropriate thresholds |
| **Error Handling** | Centralized `AppError` class, Prisma error mapping, async handler wrapper |
| **CORS Config** | Environment-split origins, no wildcards in production |
| **Graceful Shutdown** | Signal handlers disconnect Prisma and stop cron jobs cleanly |
| **Password Security** | bcrypt with 12 salt rounds, strong password policy in registration schema |
| **Database Schema** | Proper indexes on hot columns, field-level `@map` for clean SQL column names |
| **Module Architecture** | Clean Controller → Service → Prisma layering with single responsibility |

---

## REMEDIATION PRIORITY

```mermaid
gantt
    title Remediation Timeline
    dateFormat  YYYY-MM-DD
    section CRITICAL
    Rotate DB password & JWT secret     :crit, c1, 2026-03-16, 1d
    Remove WHATSAPP_VERIFY_TOKEN default :crit, c2, 2026-03-16, 1d
    Remove JWT from survey interaction metadata :crit, c3, 2026-03-16, 1d
    section HIGH
    Restrict public table endpoints      :h1, after c3, 1d
    section WARNING
    Fix console.log → logger             :w1, after h1, 1d
    Extract timezone constant            :w2, after h1, 1d
    DRY phone normalization              :w3, after h1, 1d
    Fix MessageFilters enum              :w4, after h1, 1d
    Other warnings                       :w5, after w4, 2d
    section INFO
    Analytics $queryRaw → ORM            :i1, after w5, 2d
    Cron concurrency improvements        :i2, after w5, 2d
```
