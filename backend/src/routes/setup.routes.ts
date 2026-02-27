import { Router, Request, Response } from 'express';
import { PrismaClient, UserRole, TableZone } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const router = Router();
const prisma = new PrismaClient();

// Datos de mesas basados en el mapa real del local
const tablesData = [
  // ═══════════════════════════════════════════════════════════
  // PRIMER PISO - Distribución exacta según mapa real
  // ═══════════════════════════════════════════════════════════
  
  // Estructura del mapa:
  // - BARRA COCTÉLES vertical izquierda (A-J juntas arriba, I,J más abajo)
  // - V1-V6 vertical izquierda abajo
  // - P1-P5 columna izquierda-centro (juntas verticalmente)
  // - V7-V9 encima de la tarima (fila horizontal arriba)
  // - V11-V13, V14-V16, V17-V19 filas horizontales en el centro
  // - P7,P8,P9 columna derecha (juntas verticalmente)  
  // - K,L,M,N vertical derecha arriba (entre P6 y P7-P9)
  // - BARRA PRINCIPAL (O-V) abajo horizontal
  // - P6 arriba a la derecha (cerca de la tarima)
  
  // ─── BARRA COCTÉLES (A-J) - Vertical izquierda, juntas ───
  { name: 'A', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 8, posY: 12 },
  { name: 'B', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 8, posY: 20 },
  { name: 'C', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 8, posY: 28 },
  { name: 'D', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 8, posY: 36 },
  { name: 'E', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 8, posY: 44 },
  { name: 'F', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 8, posY: 52 },
  { name: 'G', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 8, posY: 60 },
  { name: 'H', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 8, posY: 68 },
  { name: 'I', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 12, posY: 76 },
  { name: 'J', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 12, posY: 84 },
  
  // ─── V1-V6 - Vertical izquierda abajo ───
  { name: 'V1', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 18, posY: 70 },
  { name: 'V2', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 18, posY: 80 },
  { name: 'V3', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 18, posY: 90 },
  { name: 'V4', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 18, posY: 100 },
  { name: 'V5', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 18, posY: 110 },
  { name: 'V6', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 18, posY: 120 },
  
  // ─── P1-P5 - Columna izquierda del centro, juntas ───
  { name: 'P1', capacity: 10, zone: TableZone.VIP, floor: 1, posX: 35, posY: 25 },
  { name: 'P2', capacity: 10, zone: TableZone.VIP, floor: 1, posX: 35, posY: 40 },
  { name: 'P3', capacity: 10, zone: TableZone.VIP, floor: 1, posX: 35, posY: 55 },
  { name: 'P4', capacity: 10, zone: TableZone.VIP, floor: 1, posX: 35, posY: 70 },
  { name: 'P5', capacity: 10, zone: TableZone.VIP, floor: 1, posX: 35, posY: 85 },
  
  // ─── V7-V9 - Encima de la tarima (fila horizontal arriba) ───
  { name: 'V7', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 50, posY: 12 },
  { name: 'V8', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 58, posY: 12 },
  { name: 'V9', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 66, posY: 12 },
  
  // ─── V11-V13 - Primera fila central (debajo de V7-V9) ───
  { name: 'V11', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 50, posY: 32 },
  { name: 'V12', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 58, posY: 32 },
  { name: 'V13', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 66, posY: 32 },
  
  // ─── V14-V16 - Segunda fila central ───
  { name: 'V14', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 50, posY: 48 },
  { name: 'V15', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 58, posY: 48 },
  { name: 'V16', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 66, posY: 48 },
  
  // ─── V17-V19 - Tercera fila central ───
  { name: 'V17', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 50, posY: 64 },
  { name: 'V18', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 58, posY: 64 },
  { name: 'V19', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 66, posY: 64 },
  
  // ─── P6 - Arriba a la derecha (cerca de la tarima) ───
  { name: 'P6', capacity: 10, zone: TableZone.VIP, floor: 1, posX: 85, posY: 12 },
  
  // ─── K, L, M, N - Vertical derecha arriba (entre P6 y P7-P9) ───
  { name: 'K', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 92, posY: 25 },
  { name: 'L', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 92, posY: 35 },
  { name: 'M', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 92, posY: 45 },
  { name: 'N', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 92, posY: 55 },
  
  // ─── P7, P8, P9 - Columna derecha, juntas verticalmente ───
  { name: 'P7', capacity: 10, zone: TableZone.VIP, floor: 1, posX: 85, posY: 40 },
  { name: 'P8', capacity: 10, zone: TableZone.VIP, floor: 1, posX: 85, posY: 55 },
  { name: 'P9', capacity: 10, zone: TableZone.VIP, floor: 1, posX: 85, posY: 70 },
  
  // ─── BARRA PRINCIPAL (O-V) - Abajo horizontal ───
  { name: 'O', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 28, posY: 105 },
  { name: 'P', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 36, posY: 105 },
  { name: 'Q', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 44, posY: 105 },
  { name: 'R', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 52, posY: 105 },
  { name: 'S', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 60, posY: 105 },
  { name: 'T', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 68, posY: 105 },
  { name: 'U', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 76, posY: 105 },
  { name: 'V', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 84, posY: 105 },
  // SEGUNDO PISO
  // Mesas V20-V30
  { name: 'V20', capacity: 4, zone: TableZone.SALON, floor: 2, posX: 6, posY: 8 },
  { name: 'V21', capacity: 4, zone: TableZone.SALON, floor: 2, posX: 6, posY: 20 },
  { name: 'V22', capacity: 4, zone: TableZone.SALON, floor: 2, posX: 6, posY: 32 },
  { name: 'V23', capacity: 4, zone: TableZone.SALON, floor: 2, posX: 6, posY: 44 },
  { name: 'V24', capacity: 4, zone: TableZone.SALON, floor: 2, posX: 6, posY: 56 },
  { name: 'V25', capacity: 4, zone: TableZone.SALON, floor: 2, posX: 6, posY: 68 },
  { name: 'V26', capacity: 4, zone: TableZone.SALON, floor: 2, posX: 6, posY: 80 },
  { name: 'V27', capacity: 4, zone: TableZone.SALON, floor: 2, posX: 14, posY: 85 },
  { name: 'V28', capacity: 4, zone: TableZone.SALON, floor: 2, posX: 14, posY: 95 },
  { name: 'V29', capacity: 4, zone: TableZone.SALON, floor: 2, posX: 6, posY: 95 },
  { name: 'V30', capacity: 4, zone: TableZone.SALON, floor: 2, posX: 6, posY: 105 },
  // Mesas R1-R2
  { name: 'R1', capacity: 4, zone: TableZone.SALON, floor: 2, posX: 22, posY: 15 },
  { name: 'R2', capacity: 4, zone: TableZone.SALON, floor: 2, posX: 22, posY: 30 },
  // Mesas Premium P10-P14
  { name: 'P10', capacity: 10, zone: TableZone.VIP, floor: 2, posX: 36, posY: 28 },
  { name: 'P11', capacity: 10, zone: TableZone.VIP, floor: 2, posX: 36, posY: 45 },
  { name: 'P12', capacity: 10, zone: TableZone.VIP, floor: 2, posX: 36, posY: 62 },
  { name: 'P13', capacity: 10, zone: TableZone.VIP, floor: 2, posX: 36, posY: 79 },
  { name: 'P14', capacity: 10, zone: TableZone.VIP, floor: 2, posX: 36, posY: 96 },
  // Mesas Premium P15-P17
  { name: 'P15', capacity: 10, zone: TableZone.VIP, floor: 2, posX: 74, posY: 18 },
  { name: 'P16', capacity: 10, zone: TableZone.VIP, floor: 2, posX: 74, posY: 40 },
  { name: 'P17', capacity: 10, zone: TableZone.VIP, floor: 2, posX: 74, posY: 62 },
  // Mesas Premium P18-P21
  { name: 'P18', capacity: 10, zone: TableZone.VIP, floor: 2, posX: 74, posY: 80 },
  { name: 'P19', capacity: 10, zone: TableZone.VIP, floor: 2, posX: 74, posY: 95 },
  { name: 'P20', capacity: 10, zone: TableZone.VIP, floor: 2, posX: 74, posY: 110 },
  { name: 'P21', capacity: 10, zone: TableZone.VIP, floor: 2, posX: 74, posY: 125 },
  // Mesas V31-V35
  { name: 'V31', capacity: 4, zone: TableZone.SALON, floor: 2, posX: 90, posY: 12 },
  { name: 'V32', capacity: 4, zone: TableZone.SALON, floor: 2, posX: 90, posY: 26 },
  { name: 'V33', capacity: 4, zone: TableZone.SALON, floor: 2, posX: 90, posY: 42 },
  { name: 'V34', capacity: 4, zone: TableZone.SALON, floor: 2, posX: 90, posY: 58 },
  { name: 'V35', capacity: 4, zone: TableZone.SALON, floor: 2, posX: 90, posY: 74 },
  // Barra abajo W-Z
  { name: 'W', capacity: 2, zone: TableZone.BARRA, floor: 2, posX: 36, posY: 115 },
  { name: 'X', capacity: 2, zone: TableZone.BARRA, floor: 2, posX: 48, posY: 115 },
  { name: 'Y', capacity: 2, zone: TableZone.BARRA, floor: 2, posX: 60, posY: 115 },
  { name: 'Z', capacity: 2, zone: TableZone.BARRA, floor: 2, posX: 72, posY: 115 },
];

// Endpoint para inicializar la base de datos y crear admin
router.get('/init-db', async (_req: Request, res: Response) => {
  try {
    // Ejecutar db push para crear todas las tablas
    console.log('🔄 Sincronizando base de datos...');
    
    try {
      await execAsync('npx prisma db push --accept-data-loss', {
        cwd: process.cwd(),
        env: { ...process.env, NODE_ENV: 'production' }
      });
      console.log('✅ Base de datos sincronizada');
    } catch (dbError: any) {
      console.log('⚠️ Error en db push:', dbError.message);
      // Continuar de todos modos, puede que las tablas ya existan
    }

    // Verificar si ya existe un admin
    const existingAdmin = await prisma.user.findFirst({
      where: { role: UserRole.ADMIN }
    });

    if (existingAdmin) {
      return res.json({ 
        status: 'success',
        message: 'Base de datos inicializada',
        admin: {
          exists: true,
          email: existingAdmin.email
        }
      });
    }

    // Crear usuario admin
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

    // Crear usuario staff también
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
      admin: {
        exists: true,
        email: admin.email,
        password: adminPassword
      },
      staff: {
        exists: true,
        email: staff.email,
        password: staffPassword
      }
    });
    return;

  } catch (error: any) {
    console.error('❌ Error:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Error al inicializar base de datos',
      details: error.message,
      code: error.code 
    });
    return;
  }
});

// Endpoint para crear mesas
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
