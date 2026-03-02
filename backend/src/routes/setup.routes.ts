import { Router, Request, Response } from 'express';
import { PrismaClient, UserRole, TableZone } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const router = Router();
const prisma = new PrismaClient();

// ═══════════════════════════════════════════════════════════
// PRIMER PISO - Coordenadas corregidas según el mapa
// ═══════════════════════════════════════════════════════════

const tablesData = [
  // ─── BARRA COCTÉLES (A-J) - Columna izquierda arriba ───
  // Posición más al borde izquierdo (X:5) para alinearse con el borde de la imagen
  { name: 'A', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 5, posY: 5 },
  { name: 'B', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 5, posY: 10 },
  { name: 'C', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 5, posY: 15 },
  { name: 'D', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 5, posY: 20 },
  { name: 'E', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 5, posY: 25 },
  { name: 'F', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 5, posY: 30 },
  { name: 'G', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 5, posY: 35 },
  { name: 'H', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 5, posY: 40 },
  { name: 'I', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 5, posY: 45 },
  { name: 'J', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 5, posY: 50 },

  // ─── V1-V6 - Columna izquierda abajo (misma X que barra cocteles) ───
  { name: 'V1', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 5, posY: 58 },
  { name: 'V2', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 5, posY: 65 },
  { name: 'V3', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 5, posY: 72 },
  { name: 'V4', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 5, posY: 79 },
  { name: 'V5', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 5, posY: 86 },
  { name: 'V6', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 5, posY: 93 },

  // ─── P1-P5 - Columna CENTRO (ligeramente más izquierda para centrar mejor) ───
  { name: 'P1', capacity: 10, zone: TableZone.VIP, floor: 1, posX: 25, posY: 15 },
  { name: 'P2', capacity: 10, zone: TableZone.VIP, floor: 1, posX: 25, posY: 30 },
  { name: 'P3', capacity: 10, zone: TableZone.VIP, floor: 1, posX: 25, posY: 45 },
  { name: 'P4', capacity: 10, zone: TableZone.VIP, floor: 1, posX: 25, posY: 60 },
  { name: 'P5', capacity: 10, zone: TableZone.VIP, floor: 1, posX: 25, posY: 75 },

  // ─── V7-V9 - Al lado derecho de P3 (misma altura que P3: Y:45) ───
  { name: 'V7', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 45, posY: 45 },
  { name: 'V8', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 55, posY: 45 },
  { name: 'V9', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 65, posY: 45 },

  // ─── V11-V13 - Al lado derecho de P4 (misma altura que P4: Y:60) ───
  { name: 'V11', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 45, posY: 60 },
  { name: 'V12', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 55, posY: 60 },
  { name: 'V13', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 65, posY: 60 },

  // ─── V14-V16 - Entre P4 (Y:60) y P5 (Y:75) ───
  { name: 'V14', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 45, posY: 68 },
  { name: 'V15', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 55, posY: 68 },
  { name: 'V16', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 65, posY: 68 },

  // ─── V17-V19 - Al lado derecho de P5 (misma altura que P5: Y:75) ───
  { name: 'V17', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 45, posY: 75 },
  { name: 'V18', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 55, posY: 75 },
  { name: 'V19', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 65, posY: 75 },

  // ─── P6 - Arriba derecha junto a tarima (más a la derecha) ───
  { name: 'P6', capacity: 10, zone: TableZone.VIP, floor: 1, posX: 85, posY: 10 },

  // ─── K, L, M, N - Columna extrema derecha, entre P6 y P7 ───
  { name: 'K', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 92, posY: 17 },
  { name: 'L', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 92, posY: 24 },
  { name: 'M', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 92, posY: 31 },
  { name: 'N', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 92, posY: 38 },

  // ─── P7, P8, P9 - Columna derecha debajo de K,L,M,N (alineadas con las filas V) ───
  { name: 'P7', capacity: 10, zone: TableZone.VIP, floor: 1, posX: 85, posY: 45 },
  { name: 'P8', capacity: 10, zone: TableZone.VIP, floor: 1, posX: 85, posY: 60 },
  { name: 'P9', capacity: 10, zone: TableZone.VIP, floor: 1, posX: 85, posY: 75 },

  // ─── BARRA PRINCIPAL (O, Ñ[ex-P], Q, R, S, T, U, W[ex-V]) - Fila horizontal abajo ───
  { name: 'O', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 15, posY: 95 },
  { name: 'Ñ', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 26, posY: 95 },
  { name: 'Q', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 37, posY: 95 },
  { name: 'R', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 48, posY: 95 },
  { name: 'S', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 59, posY: 95 },
  { name: 'T', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 70, posY: 95 },
  { name: 'U', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 81, posY: 95 },
  { name: 'W', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 92, posY: 95 },

  // ═══════════════════════════════════════════════════════════
  // SEGUNDO PISO - Layout exacto según imagen (Forma de U/Herradura)
  // ═══════════════════════════════════════════════════════════

  // ─── Zona F: Ala Izquierda (Balcón Largo) ───
  // Carril externo (pared): V20-V30 columna vertical
  { name: 'V20', capacity: 4, zone: TableZone.SALON, floor: 2, posX: 6, posY: 8 },
  { name: 'V21', capacity: 4, zone: TableZone.SALON, floor: 2, posX: 6, posY: 18 },
  { name: 'V22', capacity: 4, zone: TableZone.SALON, floor: 2, posX: 6, posY: 28 },
  { name: 'V23', capacity: 4, zone: TableZone.SALON, floor: 2, posX: 6, posY: 38 },
  { name: 'V24', capacity: 4, zone: TableZone.SALON, floor: 2, posX: 6, posY: 48 },
  { name: 'V25', capacity: 4, zone: TableZone.SALON, floor: 2, posX: 6, posY: 58 },
  { name: 'V26', capacity: 4, zone: TableZone.SALON, floor: 2, posX: 6, posY: 68 },
  { name: 'V27', capacity: 4, zone: TableZone.SALON, floor: 2, posX: 6, posY: 78 },
  { name: 'V28', capacity: 4, zone: TableZone.SALON, floor: 2, posX: 6, posY: 88 },
  { name: 'V29', capacity: 4, zone: TableZone.SALON, floor: 2, posX: 6, posY: 95 },
  { name: 'V30', capacity: 4, zone: TableZone.SALON, floor: 2, posX: 6, posY: 105 },

  // Carril interno (baranda): R1, R2 arriba
  { name: 'R1', capacity: 4, zone: TableZone.SALON, floor: 2, posX: 18, posY: 15 },
  { name: 'R2', capacity: 4, zone: TableZone.SALON, floor: 2, posX: 18, posY: 28 },

  // P10-P14: Columna vertical interna
  { name: 'P10', capacity: 10, zone: TableZone.VIP, floor: 2, posX: 28, posY: 35 },
  { name: 'P11', capacity: 10, zone: TableZone.VIP, floor: 2, posX: 28, posY: 50 },
  { name: 'P12', capacity: 10, zone: TableZone.VIP, floor: 2, posX: 28, posY: 65 },
  { name: 'P13', capacity: 10, zone: TableZone.VIP, floor: 2, posX: 28, posY: 80 },
  { name: 'P14', capacity: 10, zone: TableZone.VIP, floor: 2, posX: 28, posY: 95 },

  // ─── Zona G: Ala Derecha (Balcón Cortado) ───
  // Bloque Superior: P15-P17 columna interna
  { name: 'P15', capacity: 10, zone: TableZone.VIP, floor: 2, posX: 74, posY: 15 },
  { name: 'P16', capacity: 10, zone: TableZone.VIP, floor: 2, posX: 74, posY: 30 },
  { name: 'P17', capacity: 10, zone: TableZone.VIP, floor: 2, posX: 74, posY: 45 },

  // V31-V35: Columna externa derecha
  { name: 'V31', capacity: 4, zone: TableZone.SALON, floor: 2, posX: 92, posY: 10 },
  { name: 'V32', capacity: 4, zone: TableZone.SALON, floor: 2, posX: 92, posY: 22 },
  { name: 'V33', capacity: 4, zone: TableZone.SALON, floor: 2, posX: 92, posY: 36 },
  { name: 'V34', capacity: 4, zone: TableZone.SALON, floor: 2, posX: 92, posY: 50 },
  { name: 'V35', capacity: 4, zone: TableZone.SALON, floor: 2, posX: 92, posY: 64 },

  // Bloque Inferior: P18-P21 columna interna
  { name: 'P18', capacity: 10, zone: TableZone.VIP, floor: 2, posX: 74, posY: 60 },
  { name: 'P19', capacity: 10, zone: TableZone.VIP, floor: 2, posX: 74, posY: 75 },
  { name: 'P20', capacity: 10, zone: TableZone.VIP, floor: 2, posX: 74, posY: 90 },
  { name: 'P21', capacity: 10, zone: TableZone.VIP, floor: 2, posX: 74, posY: 105 },

  // ─── Zona H: Puente Inferior ───
  { name: 'W', capacity: 2, zone: TableZone.BARRA, floor: 2, posX: 36, posY: 105 },
  { name: 'X', capacity: 2, zone: TableZone.BARRA, floor: 2, posX: 48, posY: 105 },
  { name: 'Y', capacity: 2, zone: TableZone.BARRA, floor: 2, posX: 60, posY: 105 },
  { name: 'Z', capacity: 2, zone: TableZone.BARRA, floor: 2, posX: 68, posY: 105 },
];

// Endpoint para inicializar la base de datos y crear admin
router.get('/init-db', async (_req: Request, res: Response) => {
  try {
    console.log('🔄 Sincronizando base de datos...');
    
    try {
      await execAsync('npx prisma db push --accept-data-loss', {
        cwd: process.cwd(),
        env: { ...process.env, NODE_ENV: 'production' }
      });
      console.log('✅ Base de datos sincronizada');
    } catch (dbError: any) {
      console.log('⚠️ Error en db push:', dbError.message);
    }

    const existingAdmin = await prisma.user.findFirst({
      where: { role: UserRole.ADMIN }
    });

    if (existingAdmin) {
      res.json({ 
        status: 'success',
        message: 'Base de datos inicializada',
        admin: { exists: true, email: existingAdmin.email }
      });
      return;
    }

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@pachanga.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
    const passwordHash = await bcrypt.hash(adminPassword, 12);

    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Dueño Pachanga',
        passwordHash,
        role: UserRole.ADMIN,
      },
    });

    const staffEmail = process.env.STAFF_EMAIL || 'staff@pachanga.com';
    const staffPassword = process.env.STAFF_PASSWORD || 'Staff123!';
    const staffHash = await bcrypt.hash(staffPassword, 12);
    
    const staff = await prisma.user.create({
      data: {
        email: staffEmail,
        name: 'Staff Pachanga',
        passwordHash: staffHash,
        role: UserRole.STAFF,
      },
    });

    res.json({
      status: 'success',
      message: 'Base de datos inicializada y usuarios creados',
      admin: { exists: true, email: admin.email, password: adminPassword },
      staff: { exists: true, email: staff.email, password: staffPassword }
    });
    return;

  } catch (error: any) {
    console.error('❌ Error:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Error al inicializar base de datos',
      details: error.message
    });
    return;
  }
});

// Endpoint para crear/actualizar mesas
router.get('/init-tables', async (_req: Request, res: Response) => {
  try {
    console.log('🔄 Creando mesas...');
    
    let count = 0;
    
    for (const tableData of tablesData) {
      await prisma.table.upsert({
        where: { name: tableData.name },
        update: {
          capacity: tableData.capacity,
          zone: tableData.zone,
          floor: tableData.floor,
          posX: tableData.posX,
          posY: tableData.posY,
        },
        create: tableData,
      });
      count++;
    }
    
    res.json({
      status: 'success',
      message: 'Mesas creadas/actualizadas',
      total: tablesData.length,
      count
    });
    return;
    
  } catch (error: any) {
    console.error('❌ Error:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Error al crear mesas',
      details: error.message
    });
    return;
  }
});

export default router;
