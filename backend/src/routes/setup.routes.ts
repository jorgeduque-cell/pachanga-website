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
  // PRIMER PISO - Distribución EXACTA según mapa real
  // ═══════════════════════════════════════════════════════════
  // 
  // Estructura visual del mapa:
  // Columna izquierda: Barra Cocteles (A-J arriba) + V1-V6 (abajo)
  // Columna P1-P5: En el CENTRO, juntas verticalmente
  // A la derecha de P3: V7, V8, V9 (fila horizontal)
  // A la derecha de P4: V11, V12, V13 (fila horizontal)  
  // Debajo de esas: V14, V15, V16 (fila horizontal)
  // A la derecha de P5: V17, V18, V19 (fila horizontal)
  // P6: Arriba derecha, al lado de la tarima
  // K, L, M, N: En fila vertical entre P6 y P7, CERCA pero no superpuestas
  // P7, P8, P9: Columna derecha, juntas verticalmente
  // O-V: Barra Principal abajo, visible
  
  // ─── BARRA COCTÉLES (A-J) - Vertical izquierda ───
  { name: 'A', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 5, posY: 5 },
  { name: 'B', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 5, posY: 13 },
  { name: 'C', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 5, posY: 21 },
  { name: 'D', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 5, posY: 29 },
  { name: 'E', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 5, posY: 37 },
  { name: 'F', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 5, posY: 45 },
  { name: 'G', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 5, posY: 53 },
  { name: 'H', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 5, posY: 61 },
  { name: 'I', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 5, posY: 69 },
  { name: 'J', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 5, posY: 77 },
  
  // ─── V1-V6 - Debajo de J ───
  { name: 'V1', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 5, posY: 88 },
  { name: 'V2', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 5, posY: 97 },
  { name: 'V3', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 5, posY: 106 },
  { name: 'V4', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 5, posY: 115 },
  { name: 'V5', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 5, posY: 124 },
  { name: 'V6', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 5, posY: 133 },
  
  // ─── P1-P5 - Columna CENTRO, más al centro ───
  { name: 'P1', capacity: 10, zone: TableZone.VIP, floor: 1, posX: 28, posY: 18 },
  { name: 'P2', capacity: 10, zone: TableZone.VIP, floor: 1, posX: 28, posY: 33 },
  { name: 'P3', capacity: 10, zone: TableZone.VIP, floor: 1, posX: 28, posY: 48 },
  { name: 'P4', capacity: 10, zone: TableZone.VIP, floor: 1, posX: 28, posY: 63 },
  { name: 'P5', capacity: 10, zone: TableZone.VIP, floor: 1, posX: 28, posY: 78 },
  
  // ─── V7-V9 - A la derecha de P3 ───
  { name: 'V7', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 48, posY: 45 },
  { name: 'V8', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 58, posY: 45 },
  { name: 'V9', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 68, posY: 45 },
  
  // ─── V11-V13 - A la derecha de P4 ───
  { name: 'V11', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 48, posY: 60 },
  { name: 'V12', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 58, posY: 60 },
  { name: 'V13', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 68, posY: 60 },
  
  // ─── V14-V16 - Debajo de V11-V13 ───
  { name: 'V14', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 48, posY: 72 },
  { name: 'V15', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 58, posY: 72 },
  { name: 'V16', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 68, posY: 72 },
  
  // ─── V17-V19 - A la derecha de P5 ───
  { name: 'V17', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 48, posY: 81 },
  { name: 'V18', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 58, posY: 81 },
  { name: 'V19', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 68, posY: 81 },
  
  // ─── P6 - Arriba derecha, al lado de la tarima ───
  { name: 'P6', capacity: 10, zone: TableZone.VIP, floor: 1, posX: 85, posY: 12 },
  
  // ─── K, L, M, N - Entre P6 y P7, en fila vertical CERCA ───
  // P6 está en Y=12, P7 está en Y=30, así que K,L,M,N van entre 18 y 26
  { name: 'K', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 92, posY: 16 },
  { name: 'L', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 92, posY: 21 },
  { name: 'M', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 92, posY: 26 },
  { name: 'N', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 92, posY: 31 },
  
  // ─── P7, P8, P9 - Columna derecha ───
  { name: 'P7', capacity: 10, zone: TableZone.VIP, floor: 1, posX: 85, posY: 38 },
  { name: 'P8', capacity: 10, zone: TableZone.VIP, floor: 1, posX: 85, posY: 53 },
  { name: 'P9', capacity: 10, zone: TableZone.VIP, floor: 1, posX: 85, posY: 68 },
  
  // ─── BARRA PRINCIPAL (O-V) - Más arriba para ser visible ───
  { name: 'O', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 25, posY: 95 },
  { name: 'P', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 33, posY: 95 },
  { name: 'Q', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 41, posY: 95 },
  { name: 'R', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 49, posY: 95 },
  { name: 'S', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 57, posY: 95 },
  { name: 'T', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 65, posY: 95 },
  { name: 'U', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 73, posY: 95 },
  { name: 'V', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 81, posY: 95 },
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
