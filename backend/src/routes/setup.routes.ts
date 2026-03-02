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
  // PRIMER PISO - MAPEO EXACTO (0-100%)
  // ═══════════════════════════════════════════════════════════

  // ─── BARRA COCTÉLES (Izquierda Superior) ───
  // Forman una línea vertical pegada a la izquierda
  { name: 'A', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 4, posY: 18 },
  { name: 'B', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 4, posY: 22 },
  { name: 'C', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 4, posY: 26 },
  { name: 'D', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 4, posY: 30 },
  { name: 'E', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 4, posY: 34 },
  { name: 'F', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 4, posY: 38 },
  { name: 'G', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 4, posY: 42 },
  { name: 'H', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 4, posY: 46 },
  // I y J hacen la curva ("L") hacia adentro
  { name: 'I', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 6, posY: 50 },
  { name: 'J', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 9, posY: 51 },

  // ─── COLUMNA LATERAL IZQUIERDA (V1-V6) ───
  // Siguen la línea de la barra, en la parte inferior izquierda
  { name: 'V1', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 5, posY: 58 },
  { name: 'V2', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 5, posY: 65 },
  { name: 'V3', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 5, posY: 72 },
  { name: 'V4', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 5, posY: 79 },
  { name: 'V5', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 5, posY: 86 },
  { name: 'V6', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 5, posY: 93 },

  // ─── BLOQUE MESAS GRANDES IZQUIERDA (P1-P5) ───
  // Columna sólida al lado de la barra
  { name: 'P1', capacity: 10, zone: TableZone.VIP, floor: 1, posX: 20, posY: 25 },
  { name: 'P2', capacity: 10, zone: TableZone.VIP, floor: 1, posX: 20, posY: 40 },
  { name: 'P3', capacity: 10, zone: TableZone.VIP, floor: 1, posX: 20, posY: 55 },
  { name: 'P4', capacity: 10, zone: TableZone.VIP, floor: 1, posX: 20, posY: 70 },
  { name: 'P5', capacity: 10, zone: TableZone.VIP, floor: 1, posX: 20, posY: 85 },

  // ─── TARIMA (Espacio Vacío - Referencia Visual) ───
  // Ocupa aprox posX: 35-70, posY: 0-30. No es una mesa.

  // ─── BLOQUE MESAS GRANDES DERECHA (P6, P7-P9) ───
  // P6 está aislada arriba a la derecha (junto a tarima)
  { name: 'P6', capacity: 10, zone: TableZone.VIP, floor: 1, posX: 85, posY: 18 },
  
  // P7-P9 alineadas abajo a la derecha
  { name: 'P7', capacity: 10, zone: TableZone.VIP, floor: 1, posX: 85, posY: 55 }, // Alineada con P3
  { name: 'P8', capacity: 10, zone: TableZone.VIP, floor: 1, posX: 85, posY: 70 }, // Alineada con P4
  { name: 'P9', capacity: 10, zone: TableZone.VIP, floor: 1, posX: 85, posY: 85 }, // Alineada con P5

  // ─── GRID CENTRAL (V7 - V19) ───
  // Ubicadas en el centro, ENTRE las columnas de mesas P
  // Fila 1 (V7-V9)
  { name: 'V7', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 40, posY: 48 },
  { name: 'V8', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 52, posY: 48 },
  { name: 'V9', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 64, posY: 48 },

  // Fila 2 (V11-V13)
  { name: 'V11', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 40, posY: 60 },
  { name: 'V12', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 52, posY: 60 },
  { name: 'V13', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 64, posY: 60 },

  // Fila 3 (V14-V16)
  { name: 'V14', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 40, posY: 72 },
  { name: 'V15', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 52, posY: 72 },
  { name: 'V16', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 64, posY: 72 },

  // Fila 4 (V17-V19)
  { name: 'V17', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 40, posY: 84 },
  { name: 'V18', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 52, posY: 84 },
  { name: 'V19', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 64, posY: 84 },

  // ─── ZONA CURVA DERECHA (K, L, M, N) ───
  // Hacen un arco convexo rodeando el espacio entre P6 y P7
  { name: 'K', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 93, posY: 28 },
  { name: 'L', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 95, posY: 34 },
  { name: 'M', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 95, posY: 40 },
  { name: 'N', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 92, posY: 46 },

  // ─── BARRA PRINCIPAL (Footer) ───
  // Distribuidas horizontalmente en la parte inferior
  { name: 'O', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 20, posY: 96 }, // Debajo P5
  { name: 'P', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 30, posY: 96 },
  { name: 'Q', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 40, posY: 96 }, // Debajo V17
  { name: 'R', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 50, posY: 96 }, // Debajo V18
  { name: 'S', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 60, posY: 96 }, // Debajo V18/19
  { name: 'T', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 70, posY: 96 }, // Debajo V19
  { name: 'U', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 80, posY: 96 },
  { name: 'V', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 90, posY: 96 },  // Debajo P9
  
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

  // P10-P14: Columna vertical interna (P10 a altura de V23)
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

  // Bloque Inferior: P18-P21 columna interna (con hueco después de P17)
  // P18 comienza más abajo, alineada con P12 del lado opuesto
  { name: 'P18', capacity: 10, zone: TableZone.VIP, floor: 2, posX: 74, posY: 60 },
  { name: 'P19', capacity: 10, zone: TableZone.VIP, floor: 2, posX: 74, posY: 75 },
  { name: 'P20', capacity: 10, zone: TableZone.VIP, floor: 2, posX: 74, posY: 90 },
  { name: 'P21', capacity: 10, zone: TableZone.VIP, floor: 2, posX: 74, posY: 105 },

  // ─── Zona H: Puente Inferior ───
  // W, X, Y, Z: Sillas conectando la base de la U
  { name: 'W', capacity: 2, zone: TableZone.BARRA, floor: 2, posX: 36, posY: 105 },
  { name: 'X', capacity: 2, zone: TableZone.BARRA, floor: 2, posX: 48, posY: 105 },
  { name: 'Y', capacity: 2, zone: TableZone.BARRA, floor: 2, posX: 60, posY: 105 },
  { name: 'Z', capacity: 2, zone: TableZone.BARRA, floor: 2, posX: 68, posY: 105 },
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

// Endpoint para arreglar las mesas de la barra (reposicionar nada más)
router.get('/fix-bar-tables', async (_req: Request, res: Response) => {
  try {
    console.log('🔧 Arreglando mesas de la barra...\n');

    // 2. Actualizar posiciones de todas las mesas de la barra
    const barTables = [
      { name: 'O', posX: 20, posY: 96 },
      { name: 'P', posX: 30, posY: 96 },
      { name: 'Q', posX: 40, posY: 96 },
      { name: 'R', posX: 50, posY: 96 },
      { name: 'S', posX: 60, posY: 96 },
      { name: 'T', posX: 70, posY: 96 },
      { name: 'U', posX: 80, posY: 96 },
      { name: 'V', posX: 90, posY: 96 },
    ];

    let updatedCount = 0;
    for (const table of barTables) {
      const result = await prisma.table.updateMany({
        where: { name: table.name, floor: 1 },
        data: { posX: table.posX, posY: table.posY }
      });
      updatedCount += result.count;
      console.log(`✅ ${table.name}: posición actualizada (${table.posX}%, ${table.posY}%)`);
    }

    // 3. Verificar resultado
    const barraTables = await prisma.table.findMany({
      where: { floor: 1, zone: TableZone.BARRA },
      orderBy: { posX: 'asc' }
    });

    res.json({
      status: 'success',
      message: 'Mesas de la barra reposicionadas',
      details: {
        repositioned: updatedCount,
        currentBarTables: barraTables.map(t => ({
          name: t.name,
          posX: t.posX,
          posY: t.posY
        }))
      }
    });
    return;

  } catch (error: any) {
    console.error('❌ Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error al arreglar mesas de la barra',
      details: error.message
    });
    return;
  }
});

// Endpoint para arreglar el piso 2: distribución EXACTA como la imagen
router.get('/fix-floor2', async (_req: Request, res: Response) => {
  try {
    console.log('🔧 Arreglando piso 2 (distribución exacta)...\n');

    // 1. Eliminar barra del piso 2 (mesas W, X, Y, Z del piso 2)
    const deletedBar = await prisma.table.deleteMany({
      where: { 
        name: { in: ['W', 'X', 'Y', 'Z'] },
        floor: 2 
      }
    });
    console.log(`✅ Barra eliminada del piso 2: ${deletedBar.count} mesas`);

    // 2. Reposicionar TODO el piso 2 según especificación exacta
    
    // Mesas V20-V30 (Ala izquierda)
    const vLeftTables = [
      { name: 'V20', posX: 6, posY: 8 },
      { name: 'V21', posX: 6, posY: 18 },
      { name: 'V22', posX: 6, posY: 28 },
      { name: 'V23', posX: 6, posY: 38 },
      { name: 'V24', posX: 6, posY: 48 },
      { name: 'V25', posX: 6, posY: 58 },
      { name: 'V26', posX: 6, posY: 68 },
      { name: 'V27', posX: 6, posY: 78 },
      { name: 'V28', posX: 6, posY: 88 },
      { name: 'V29', posX: 6, posY: 95 },
      { name: 'V30', posX: 6, posY: 105 },
    ];

    // R1, R2
    const rTables = [
      { name: 'R1', posX: 18, posY: 15 },
      { name: 'R2', posX: 18, posY: 28 },
    ];

    // P10-P14 (Ala izquierda interna)
    const pLeftTables = [
      { name: 'P10', posX: 28, posY: 35 },
      { name: 'P11', posX: 28, posY: 50 },
      { name: 'P12', posX: 28, posY: 65 },
      { name: 'P13', posX: 28, posY: 80 },
      { name: 'P14', posX: 28, posY: 95 },
    ];

    // P15-P17 (Bloque superior derecho)
    const pRightTopTables = [
      { name: 'P15', posX: 74, posY: 15 },
      { name: 'P16', posX: 74, posY: 30 },
      { name: 'P17', posX: 74, posY: 45 },
    ];

    // V31-V35 (Ala derecha externa)
    const vRightTables = [
      { name: 'V31', posX: 92, posY: 10 },
      { name: 'V32', posX: 92, posY: 22 },
      { name: 'V33', posX: 92, posY: 36 },
      { name: 'V34', posX: 92, posY: 50 },
      { name: 'V35', posX: 92, posY: 64 },
    ];

    // P18-P21 (Bloque inferior derecho)
    const pRightBottomTables = [
      { name: 'P18', posX: 74, posY: 60 },
      { name: 'P19', posX: 74, posY: 75 },
      { name: 'P20', posX: 74, posY: 90 },
      { name: 'P21', posX: 74, posY: 105 },
    ];

    // W, X, Y, Z (Puente inferior)
    const bridgeTables = [
      { name: 'W', posX: 36, posY: 105 },
      { name: 'X', posX: 48, posY: 105 },
      { name: 'Y', posX: 60, posY: 105 },
      { name: 'Z', posX: 68, posY: 105 },
    ];

    const allFloor2Tables = [
      ...vLeftTables, ...rTables, ...pLeftTables,
      ...pRightTopTables, ...vRightTables, ...pRightBottomTables, ...bridgeTables
    ];

    let updatedCount = 0;
    for (const table of allFloor2Tables) {
      const result = await prisma.table.updateMany({
        where: { name: table.name, floor: 2 },
        data: { posX: table.posX, posY: table.posY }
      });
      updatedCount += result.count;
      console.log(`✅ ${table.name}: posición actualizada (${table.posX}%, ${table.posY}%)`);
    }

    // 3. Verificar resultado
    const floor2Tables = await prisma.table.findMany({
      where: { floor: 2 },
      orderBy: [{ zone: 'asc' }, { name: 'asc' }]
    });

    res.json({
      status: 'success',
      message: 'Piso 2 arreglado',
      details: {
        barTablesDeleted: deletedBar.count,
        pTablesRepositioned: updatedCount,
        currentFloor2Tables: floor2Tables.map(t => ({
          name: t.name,
          zone: t.zone,
          posX: t.posX,
          posY: t.posY
        }))
      }
    });
    return;

  } catch (error: any) {
    console.error('❌ Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error al arreglar piso 2',
      details: error.message
    });
    return;
  }
});

// Endpoint para resetear el PISO 1 según especificación exacta
router.get('/reset-floor1', async (_req: Request, res: Response) => {
  try {
    console.log('🔧 Reseteando Piso 1 según especificación exacta...\n');

    // Definición exacta de todas las mesas del piso 1 (MAPEO EXACTO)
    const floor1Tables = [
      // BARRA COCTÉLES (A-J)
      { name: 'A', posX: 4, posY: 18, zone: TableZone.BARRA, capacity: 2 },
      { name: 'B', posX: 4, posY: 22, zone: TableZone.BARRA, capacity: 2 },
      { name: 'C', posX: 4, posY: 26, zone: TableZone.BARRA, capacity: 2 },
      { name: 'D', posX: 4, posY: 30, zone: TableZone.BARRA, capacity: 2 },
      { name: 'E', posX: 4, posY: 34, zone: TableZone.BARRA, capacity: 2 },
      { name: 'F', posX: 4, posY: 38, zone: TableZone.BARRA, capacity: 2 },
      { name: 'G', posX: 4, posY: 42, zone: TableZone.BARRA, capacity: 2 },
      { name: 'H', posX: 4, posY: 46, zone: TableZone.BARRA, capacity: 2 },
      { name: 'I', posX: 6, posY: 50, zone: TableZone.BARRA, capacity: 2 },
      { name: 'J', posX: 9, posY: 51, zone: TableZone.BARRA, capacity: 2 },
      // V1-V6
      { name: 'V1', posX: 5, posY: 58, zone: TableZone.SALON, capacity: 4 },
      { name: 'V2', posX: 5, posY: 65, zone: TableZone.SALON, capacity: 4 },
      { name: 'V3', posX: 5, posY: 72, zone: TableZone.SALON, capacity: 4 },
      { name: 'V4', posX: 5, posY: 79, zone: TableZone.SALON, capacity: 4 },
      { name: 'V5', posX: 5, posY: 86, zone: TableZone.SALON, capacity: 4 },
      { name: 'V6', posX: 5, posY: 93, zone: TableZone.SALON, capacity: 4 },
      // P1-P5
      { name: 'P1', posX: 20, posY: 25, zone: TableZone.VIP, capacity: 10 },
      { name: 'P2', posX: 20, posY: 40, zone: TableZone.VIP, capacity: 10 },
      { name: 'P3', posX: 20, posY: 55, zone: TableZone.VIP, capacity: 10 },
      { name: 'P4', posX: 20, posY: 70, zone: TableZone.VIP, capacity: 10 },
      { name: 'P5', posX: 20, posY: 85, zone: TableZone.VIP, capacity: 10 },
      // Grid Central V7-V19
      { name: 'V7', posX: 40, posY: 48, zone: TableZone.SALON, capacity: 4 },
      { name: 'V8', posX: 52, posY: 48, zone: TableZone.SALON, capacity: 4 },
      { name: 'V9', posX: 64, posY: 48, zone: TableZone.SALON, capacity: 4 },
      { name: 'V11', posX: 40, posY: 60, zone: TableZone.SALON, capacity: 4 },
      { name: 'V12', posX: 52, posY: 60, zone: TableZone.SALON, capacity: 4 },
      { name: 'V13', posX: 64, posY: 60, zone: TableZone.SALON, capacity: 4 },
      { name: 'V14', posX: 40, posY: 72, zone: TableZone.SALON, capacity: 4 },
      { name: 'V15', posX: 52, posY: 72, zone: TableZone.SALON, capacity: 4 },
      { name: 'V16', posX: 64, posY: 72, zone: TableZone.SALON, capacity: 4 },
      { name: 'V17', posX: 40, posY: 84, zone: TableZone.SALON, capacity: 4 },
      { name: 'V18', posX: 52, posY: 84, zone: TableZone.SALON, capacity: 4 },
      { name: 'V19', posX: 64, posY: 84, zone: TableZone.SALON, capacity: 4 },
      // VIP Derecha
      { name: 'P6', posX: 85, posY: 18, zone: TableZone.VIP, capacity: 10 },
      { name: 'K', posX: 93, posY: 28, zone: TableZone.BARRA, capacity: 2 },
      { name: 'L', posX: 95, posY: 34, zone: TableZone.BARRA, capacity: 2 },
      { name: 'M', posX: 95, posY: 40, zone: TableZone.BARRA, capacity: 2 },
      { name: 'N', posX: 92, posY: 46, zone: TableZone.BARRA, capacity: 2 },
      { name: 'P7', posX: 85, posY: 55, zone: TableZone.VIP, capacity: 10 },
      { name: 'P8', posX: 85, posY: 70, zone: TableZone.VIP, capacity: 10 },
      { name: 'P9', posX: 85, posY: 85, zone: TableZone.VIP, capacity: 10 },
      // Barra Principal (O, P, Q, R, S, T, U, V)
      { name: 'O', posX: 20, posY: 96, zone: TableZone.BARRA, capacity: 2 },
      { name: 'P', posX: 30, posY: 96, zone: TableZone.BARRA, capacity: 2 },
      { name: 'Q', posX: 40, posY: 96, zone: TableZone.BARRA, capacity: 2 },
      { name: 'R', posX: 50, posY: 96, zone: TableZone.BARRA, capacity: 2 },
      { name: 'S', posX: 60, posY: 96, zone: TableZone.BARRA, capacity: 2 },
      { name: 'T', posX: 70, posY: 96, zone: TableZone.BARRA, capacity: 2 },
      { name: 'U', posX: 80, posY: 96, zone: TableZone.BARRA, capacity: 2 },
      { name: 'V', posX: 90, posY: 96, zone: TableZone.BARRA, capacity: 2 },
    ];

    let updatedCount = 0;
    for (const table of floor1Tables) {
      const result = await prisma.table.updateMany({
        where: { name: table.name, floor: 1 },
        data: { 
          posX: table.posX, 
          posY: table.posY,
          zone: table.zone,
          capacity: table.capacity
        }
      });
      if (result.count === 0) {
        // Si no existe, crearla
        await prisma.table.create({
          data: {
            name: table.name,
            floor: 1,
            posX: table.posX,
            posY: table.posY,
            zone: table.zone,
            capacity: table.capacity,
            isActive: true,
          }
        });
        console.log(`✅ ${table.name}: creada (${table.posX}%, ${table.posY}%)`);
      } else {
        console.log(`✅ ${table.name}: actualizada (${table.posX}%, ${table.posY}%)`);
      }
      updatedCount++;
    }

    res.json({
      status: 'success',
      message: 'Piso 1 reseteado según especificación exacta',
      details: {
        tablesUpdated: updatedCount
      }
    });
    return;

  } catch (error: any) {
    console.error('❌ Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error al resetear piso 1',
      details: error.message
    });
    return;
  }
});

export default router;
