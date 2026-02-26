# 🛡️ Auditoría DevSecOps Final — Backend Pachanga

**Auditor:** THE GUARDIAN | **Fecha:** 2026-02-25 | **Alcance:** `backend/` (15 archivos)

---

## VEREDICTO: [APROBADO CON OBSERVACIONES]

**Todas las correcciones originales (8/8) + las 4 correcciones adicionales fueron aplicadas.** Además se implementó sistema completo de refresh tokens con blacklist (ALTO-3). Se detectaron **2 hallazgos nuevos MEDIO** en el código nuevo.

---

## ✅ Correcciones Originales (Correciones.md)

| # | Hallazgo | ¿Aplicada? | Evidencia |
|---|----------|:---:|-----------|
| CRÍTICO-1 | Escalación de privilegios | ✅ | [auth.schema.ts](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/schemas/auth.schema.ts) L35-43: sin `role`, password reforzado. [auth.service.ts](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/modules/auth/auth.service.ts) L55: `role: 'STAFF'` fijo |
| CRÍTICO-2 | JWT Secret débil | ✅ | [.env](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/.env) L6: 256+ chars. [env.ts](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/config/env.ts) L8: `.min(64)` |
| CRÍTICO-3 | Credenciales hardcodeadas | ✅ | `createInitialAdmin()` eliminado. [seed.ts](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/prisma/seed.ts) L7-10: `process.env` sin fallbacks |
| ALTO-1 | CORS abierto | ✅ | [server.ts](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/server.ts) L13-28: `ALLOWED_ORIGINS` por entorno |
| ALTO-2 | Sin Rate Limiting | ✅ | [rate-limit.middleware.ts](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/middleware/rate-limit.middleware.ts) + aplicado en rutas |
| ALTO-3 | JWT sin revocación | ✅ | **NUEVO:** [token.service.ts](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/services/token.service.ts) con blacklist + refresh token rotation |
| MEDIO-1 | Body sin límite | ✅ | [server.ts](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/server.ts) L29-30: `{ limit: '10kb' }` |
| MEDIO-2 | 404 expone rutas | ✅ | [error.middleware.ts](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/middleware/error.middleware.ts) L79: `'Recurso no encontrado'` |

## ✅ Correcciones Adicionales (Re-Auditoría)

| # | Hallazgo | ¿Aplicada? | Evidencia |
|---|----------|:---:|-----------|
| MEDIO-3 | Fallbacks en seed.ts | ✅ | [seed.ts](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/prisma/seed.ts) L7-10: sin fallbacks + validación L12-15 |
| MEDIO-4 | Falta .gitignore | ✅ | [backend/.gitignore](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/.gitignore) creado con [.env](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/.env), `node_modules/`, `dist/` |
| MEDIO-5 | express-rate-limit no en package.json | ✅ | [package.json](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/package.json) L32: `"express-rate-limit": "^7.5.0"` |
| MEDIO-6 | authenticate traga errores | ✅ | [auth.middleware.ts](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/middleware/auth.middleware.ts) L79: `next(error)` |

---

## 🆕 HALLAZGOS NUEVOS

### 🟡 MEDIO-7: Ruta `/refresh` Sin Rate Limiting (Brute Force de Refresh Tokens)

**Archivo:** [auth.routes.ts L17](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/modules/auth/auth.routes.ts#L17)

```typescript
router.post('/refresh', validateBody(RefreshTokenRequestSchema), authController.refresh);
// ↑ Sin authLimiter — vulnerable a brute force de refresh tokens
```

Un atacante puede intentar replayar refresh tokens robados a velocidad ilimitada. Esta ruta debería tener `authLimiter` al igual que `/login` y `/register`.

---

### 🟡 MEDIO-8: [cleanupExpiredTokens()](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/services/token.service.ts#140-153) No Se Ejecuta — Tablas Crecen Indefinidamente

**Archivo:** [token.service.ts L140-152](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/services/token.service.ts#L140-L152)

El método [cleanupExpiredTokens()](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/services/token.service.ts#140-153) existe pero **nunca se invoca**. Las tablas `refresh_tokens` y `token_blacklist` crecerán indefinidamente, degradando rendimiento en producción.

---

## CÓDIGO DE REMEDIACIÓN

### Fix MEDIO-7: Rate limit en `/refresh`

```diff
  // auth.routes.ts
- router.post('/refresh', validateBody(RefreshTokenRequestSchema), authController.refresh);
+ router.post('/refresh', authLimiter, validateBody(RefreshTokenRequestSchema), authController.refresh);
```

---

### Fix MEDIO-8: Programar limpieza de tokens expirados

```diff
  // server.ts — agregar después de startServer()
+ // Cleanup de tokens expirados cada hora
+ import { tokenService } from './services/token.service.js';
+
+ setInterval(async () => {
+   try {
+     await tokenService.cleanupExpiredTokens();
+     console.log('🧹 Tokens expirados limpiados');
+   } catch (error) {
+     console.error('❌ Error limpiando tokens:', error);
+   }
+ }, 60 * 60 * 1000); // Cada hora
```

---

## RESUMEN FINAL

| Categoría | Estado |
|---|---|
| **OWASP Top 10** | ✅ Todos los CRÍTICOS remediados |
| **Autenticación** | ✅ Access + Refresh tokens con rotation + blacklist |
| **CORS** | ✅ Restrictivo por entorno |
| **Rate Limiting** | ⚠️ Falta en `/refresh` |
| **Validación** | ✅ Zod en todos los endpoints |
| **SOLID** | ✅ Service/Controller/Routes separados |
| **Rendimiento** | ⚠️ Cleanup de tokens no programado |

> [!IMPORTANT]
> Backend **APROBADO** con 2 observaciones MEDIO no bloqueantes. Comparado con la auditoría original (3 CRÍTICOS + 3 ALTOS), la postura de seguridad mejoró drásticamente.
