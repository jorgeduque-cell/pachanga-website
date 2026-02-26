# 🚀 Guía de Despliegue - Pachanga

Esta guía te ayudará a desplegar el proyecto en **Vercel** (Frontend) y **Render** (Backend).

---

## 📋 Requisitos Previos

- [ ] Cuenta en [GitHub](https://github.com)
- [ ] Cuenta en [Vercel](https://vercel.com)
- [ ] Cuenta en [Render](https://render.com)
- [ ] Base de datos PostgreSQL (puedes usar la gratuita de Render o Neon)

---

## 🗂️ Estructura del Proyecto

```
Proyecto Pachanga/
├── app/                    # Frontend (React + Vite)
│   ├── dist/              # Build output
│   ├── src/
│   └── vercel.json        # Configuración Vercel ✅
├── backend/               # Backend (Express + Prisma)
│   ├── src/
│   ├── prisma/
│   └── render.yaml        # Configuración Render ✅
└── DEPLOY.md             # Esta guía ✅
```

---

## 🎯 Paso 1: Desplegar el Backend en Render

### 1.1 Crear Base de Datos PostgreSQL

1. Ve a [Render Dashboard](https://dashboard.render.com)
2. Click **New** → **PostgreSQL**
3. Configura:
   - **Name**: `pachanga-db`
   - **Region**: La más cercana a tus usuarios
   - **Plan**: **Free**
4. Click **Create Database**
5. **Copia la URL de conexión** (Internal Database URL) - la necesitarás después
postgresql://pachanga_db_user:dlqIwvSnY7J84edsv35kCclwzlNOEnWj@dpg-d6g8kgdm5p6s739mf92g-a/pachanga_db
### 1.2 Crear Web Service para el Backend

1. En Render Dashboard, click **New** → **Web Service**
2. Conecta tu repositorio de GitHub
3. Configura:
   - **Name**: `pachanga-api`
   - **Region**: Igual que la base de datos
   - **Branch**: `main` (o tu rama principal)
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: 
     ```bash
     npm install && npm run build && npx prisma generate && npx prisma migrate deploy
     ```
   - **Start Command**: `npm start`
   - **Plan**: **Free**

4. Agrega las **Variables de Entorno**:

   | Variable | Valor | Descripción |
   |----------|-------|-------------|
   | `DATABASE_URL` | `postgresql://...` | URL de tu PostgreSQL en Render |
   | `JWT_SECRET` | Generar string largo | Mínimo 64 caracteres, muy seguro |
   | `PORT` | `10000` | Puerto que usa Render |
   | `NODE_ENV` | `production` | Entorno de producción |
   | `FRONTEND_URL` | `https://pachanga-frontend.vercel.app` | URL de tu frontend (actualizar después) |
   | `CORS_ORIGIN` | `https://pachanga-frontend.vercel.app` | Mismo que arriba |

5. **Opcional - WhatsApp**: Si usarás WhatsApp Business API:
   - `WHATSAPP_TOKEN`
   - `WHATSAPP_PHONE_ID`
   - `WHATSAPP_DRY_RUN=false`

6. Click **Create Web Service**

7. **Espera a que termine el deploy** y anota la URL (ej: `https://pachanga-api.onrender.com`)

> ⚠️ **Nota**: El servicio gratuito se "duerme" después de 15 min de inactividad. La primera solicitud después de eso tardará ~30s en responder.

---

## 🎯 Paso 2: Desplegar el Frontend en Vercel

### 2.1 Importar Proyecto

1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New** → **Project**
3. Importa tu repositorio de GitHub

### 2.2 Configurar Proyecto

1. **Framework Preset**: Selecciona **Vite**
2. **Root Directory**: `app`
3. **Build Command**: `npm run build`
4. **Output Directory**: `dist`

### 2.3 Variables de Entorno

Agrega esta variable:

| Variable | Valor |
|----------|-------|
| `VITE_API_URL` | `https://pachanga-api.onrender.com/api` (tu URL de Render) |

### 2.4 Deploy

Click **Deploy** y espera a que termine.

> 🎉 **¡Listo!** Tu frontend estará en una URL como `https://pachanga-frontend.vercel.app`

---

## 🔗 Paso 3: Conectar Frontend ↔ Backend

### 3.1 Actualizar CORS en Render

1. Ve a tu servicio en Render Dashboard
2. Click **Environment**
3. Actualiza `FRONTEND_URL` y `CORS_ORIGIN` con tu URL real de Vercel
4. Click **Save Changes** (esto redeployará automáticamente)

### 3.2 Verificar Conexión

Visita tu frontend y prueba:
- Login
- Ver mesas disponibles
- Crear una reserva

---

## 🧪 Comandos de Verificación

### Backend (local)
```bash
cd backend
npm run dev
```

### Frontend (local)
```bash
cd app
npm run dev
```

### Build de producción (local)
```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd app
npm run build
npm run preview
```

---

## ⚠️ Consideraciones Importantes

### Limitaciones del Plan Gratuito de Render

| Aspecto | Limitación |
|---------|------------|
| **Sleep** | Se duerme después de 15 min de inactividad |
| **CPU/RAM** | Limitado (suficiente para pruebas) |
| **Transferencia** | 100 GB/mes |
| **Base de datos** | Se pausa después de 30 días sin actividad |

### Recomendaciones

1. **Monitoreo**: Usa [UptimeRobot](https://uptimerobot.com) gratuito para hacer ping cada 5 min y mantener el servicio despierto
2. **Base de datos**: Realiza backups periódicos exportando desde Render
3. **Logs**: Revisa los logs en Render Dashboard si hay problemas

---

## 🐛 Solución de Problemas

### Error: "CORS policy"
Verifica que `CORS_ORIGIN` en Render tenga exactamente la URL de tu frontend en Vercel (incluyendo `https://`)

### Error: "Cannot connect to database"
Verifica que `DATABASE_URL` esté correctamente configurada y que la base de datos esté activa

### Error: "Module not found" en Render
Asegúrate de que el `postinstall` script esté en el package.json y que prisma generate se ejecute

### Frontend no carga rutas
Verifica que `vercel.json` tenga la configuración de rewrites correcta

---

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs en Render Dashboard (para backend)
2. Revisa los logs en Vercel Dashboard → Deployments (para frontend)
3. Verifica las variables de entorno
4. Prueba localmente primero

---

## 🎉 ¡Felicitaciones!

Tu aplicación Pachanga ahora está en producción con:
- ✅ Frontend en Vercel (rápido, CDN global)
- ✅ Backend en Render (soporta Socket.IO y cron jobs)
- ✅ Base de datos PostgreSQL persistente

**URLs de producción:**
- Frontend: `https://[tu-proyecto].vercel.app`
- Backend API: `https://[tu-api].onrender.com/api`
