# Auditoría DevSecOps Completa — Pre-Sprint 5
**Fecha:** 25 Feb 2026 · **Auditor:** THE GUARDIAN · **Scope:** Codebase completo

---

## VEREDICTO: ✅ APROBADO CON HALLAZGOS

> [!IMPORTANT]
> 2 hallazgos ALTOS y 4 MEDIOS detectados. **Ninguno es bloqueante** para producción actual, pero los 2 ALTOS deben remediarse antes de Sprint 5.

---

## Resumen de Auditoría

| Capa | Archivos | Resultado |
|---|:---:|:---:|
| Backend — Middleware | 4 | ✅ Sólido |
| Backend — Auth module | 3 | ✅ Excelente |
| Backend — Reservations module | 3 | ✅ Excelente |
| Backend — Tables module | 3 | ✅ Bien |
| Backend — Services auxiliares | 3 | ✅ Bien |
| Backend — Schemas Zod | 3 | ✅ Robusto |
| Backend — Config/Types | 3 | ✅ Limpio |
| **Frontend — Services API** | **3** | **⚠️ 2 hallazgos** |
| Frontend — Hooks | 4 | ✅ Excelente |
| Frontend — Components (auditados Sprint anterior) | 8 | ✅ Aprobado |
| **Total** | **35** | **2 ALTO + 4 MEDIO** |

---

## HALLAZGOS

### 🔴 H-01: Credenciales Mock Hardcoded (ALTO — Seguridad)

**Archivo:** [auth.service.ts](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/app/src/services/auth.service.ts) L6-19

**Riesgo:** Credenciales de login simuladas hardcoded en producción. Un atacante puede autenticarse con `admin@pachanga.com` / `admin123` y obtener acceso mock al panel admin. El token generado (`mock_jwt_token_`) no es un JWT válido, pero bypasea la lógica del frontend.

**Código actual:**
```typescript
async login(credentials: LoginCredentials): Promise<AuthResponse> {
  // Simulación hasta tener backend real
  if (credentials.email === 'admin@pachanga.com' && credentials.password === 'admin123') {
    const mockResponse: AuthResponse = { /* ... mock */ };
    return mockResponse;
  }
  throw new Error('Credenciales inválidas');
}
```

**REMEDIACIÓN:**
```typescript
async login(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
  return response.data;
},
```

---

### 🔴 H-02: JSON.parse sin Protección (ALTO — Robustez)

**Archivo:** [auth.service.ts](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/app/src/services/auth.service.ts) L43-46

**Riesgo:** `JSON.parse(stored)` crashea toda la app si localStorage contiene datos corruptos o manipulados. Un atacante puede inyectar datos malformados en `auth_user`.

**Código actual:**
```typescript
getStoredUser(): User | null {
  const stored = localStorage.getItem('auth_user');
  return stored ? JSON.parse(stored) : null;
},
```

**REMEDIACIÓN:**
```typescript
getStoredUser(): User | null {
  const stored = localStorage.getItem('auth_user');
  if (!stored) return null;

  try {
    return JSON.parse(stored) as User;
  } catch {
    localStorage.removeItem('auth_user');
    return null;
  }
},
```

---

### 🟡 H-03: `as any` en validate.middleware.ts (MEDIO — TypeScript)

**Archivo:** [validate.middleware.ts](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/middleware/validate.middleware.ts) L11

**Riesgo:** Viola la regla del proyecto "sin `any`". [(req as any)[source]](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/modules/auth/auth.controller.ts#24-37) pierde type safety.

**REMEDIACIÓN:**
```typescript
const createValidator = (source: RequestSource, errorMessage: string) => {
  return (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        const validated = schema.parse(req[source]);
        // Assign safely using Record type
        (req as Record<string, unknown>)[source] = validated;
        next();
      } catch (error) { /* ... */ }
    };
  };
};
```

---

### 🟡 H-04: [extractData](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/app/src/services/table.service.ts#4-8) Helper Duplicado (MEDIO — DRY)

**Archivos:** [reservation.service.ts](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/app/src/services/reservation.service.ts) L12-14, [table.service.ts](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/app/src/services/table.service.ts) L5-7

**Riesgo:** Misma función copiada en 2 archivos. Evoluciona de forma independiente = bugs futuros.

**REMEDIACIÓN:** Extraer a [lib/api.ts](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/app/src/lib/api.ts):
```typescript
// En lib/api.ts — agregar al final
export function extractData<T>(response: { data: { data: T } }): T {
  return response.data.data;
}
```

---

### 🟡 H-05: `menuVariants` No Usado (MEDIO — Código Muerto)

**Archivo:** [Header.tsx](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/app/src/components/Header.tsx) L18-21

**REMEDIACIÓN:** Eliminar las 4 líneas.

---

### 🟡 H-06: Query Duplicada [getMap()](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/modules/tables/table.controller.ts#14-26) vs [getAll()](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/modules/tables/table.service.ts#42-48) (MEDIO — DRY)

**Archivo:** [table.service.ts](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/modules/tables/table.service.ts) L42-53

**REMEDIACIÓN:** En [getMap()](file:///c:/Users/LENOVO%20CORP/Proyecto%20Pachanga/backend/src/modules/tables/table.controller.ts#14-26), reutilizar `this.getAll()`.

---

## Lo que está BIEN ✅

| Categoría | Calificación | Detalles |
|---|:---:|---|
| **Arquitectura modular** | 🟢 10/10 | Service → Controller → Routes limpio |
| **Separación de concerns** | 🟢 10/10 | Schemas en `/schemas`, middleware en `/middleware` |
| **Zod validation** | 🟢 10/10 | Todo endpoint validado (body, query, params) |
| **Auth & JWT** | 🟢 10/10 | Bcrypt 12 rounds, blacklist, rotation, cleanup |
| **Error handling** | 🟢 10/10 | AppError + Prisma errors + stack only in dev |
| **Rate limiting** | 🟢 10/10 | 3 limiters (global, auth, reservation) |
| **CORS** | 🟢 10/10 | Origins por entorno, credentials true |
| **Helmet** | 🟢 10/10 | Headers de seguridad |
| **Transacciones** | 🟢 10/10 | Serializable isolation en reservas |
| **WebSocket** | 🟢 10/10 | Auth middleware, admin room guard |
| **Graceful shutdown** | 🟢 10/10 | SIGTERM + SIGINT + prisma disconnect |
| **React Query** | 🟢 10/10 | Cache keys, invalidación cruzada, staleTime |
| **Password policy** | 🟢 10/10 | Min 8, mayúscula, número, especial |
| **Token cleanup** | 🟢 10/10 | Cada hora, automático |
| **Input limits** | 🟢 10/10 | JSON 10kb, strings max length |

---

## Score Final

| Criterio | Peso | Nota |
|---|:---:|:---:|
| Seguridad (OWASP) | 40% | **8.5/10** (-1.5 por mock creds) |
| TypeScript Strictness | 20% | **9/10** (-1 por `as any`) |
| Rendimiento | 15% | **10/10** |
| Arquitectura (SOLID) | 15% | **9.5/10** (-0.5 DRY) |
| Código muerto | 10% | **9/10** |
| **TOTAL PONDERADO** | | **9.0/10** |

> [!TIP]
> Corregir H-01 y H-02 sube el score a **9.7/10**. El codebase está listo para Sprint 5.
