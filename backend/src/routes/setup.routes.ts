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
  // Contenedor: 750px de alto, coordenadas 0-100
  // Estructura visual exacta del mapa:
  
  // Columna izquierda (X=8):
  // - A-J (Y=5 a Y=50): Barra Cocteles
  // - V1-V6 (Y=58 a Y=90): Debajo de la barra
  
  // Centro (X=28):
  // - P1-P5 (Y=15 a Y=75): Columna vertical en el centro
  
  // Centro-derecha (X=48, 58, 68):
  // - V7-V9 al lado de P3
  // - V11-V13 al lado de P4  
  // - V14-V16 entre P4 y P5
  // - V17-V19 al lado de P5
  
  // Derecha (X=82):
  // - P6 (Y=10): Arriba junto a tarima
  // - P7 (Y=35), P8 (Y=50), P9 (Y=65): Columna vertical
  
  // Extrema derecha (X=92):
  // - K, L, M, N (Y=15 a Y=35): Entre P6 y P7
  
  // Abajo (Y=85):
  // - O-V: Barra principal
  
  // ─── BARRA COCTÉLES (A-J) - Columna izquierda arriba ───
  { name: 'A', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 8, posY: 5 },
  { name: 'B', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 8, posY: 10 },
  { name: 'C', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 8, posY: 15 },
  { name: 'D', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 8, posY: 20 },
  { name: 'E', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 8, posY: 25 },
  { name: 'F', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 8, posY: 30 },
  { name: 'G', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 8, posY: 35 },
  { name: 'H', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 8, posY: 40 },
  { name: 'I', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 8, posY: 45 },
  { name: 'J', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 8, posY: 50 },
  
  // ─── V1-V6 - Columna izquierda abajo ───
  { name: 'V1', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 8, posY: 58 },
  { name: 'V2', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 8, posY: 65 },
  { name: 'V3', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 8, posY: 72 },
  { name: 'V4', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 8, posY: 79 },
  { name: 'V5', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 8, posY: 86 },
  { name: 'V6', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 8, posY: 93 },
  
  // ─── P1-P5 - Columna CENTRO ───
  { name: 'P1', capacity: 10, zone: TableZone.VIP, floor: 1, posX: 28, posY: 15 },
  { name: 'P2', capacity: 10, zone: TableZone.VIP, floor: 1, posX: 28, posY: 30 },
  { name: 'P3', capacity: 10, zone: TableZone.VIP, floor: 1, posX: 28, posY: 45 },
  { name: 'P4', capacity: 10, zone: TableZone.VIP, floor: 1, posX: 28, posY: 60 },
  { name: 'P5', capacity: 10, zone: TableZone.VIP, floor: 1, posX: 28, posY: 75 },
  
  // ─── V7-V9 - Al lado derecho de P3 ───
  { name: 'V7', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 48, posY: 43 },
  { name: 'V8', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 58, posY: 43 },
  { name: 'V9', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 68, posY: 43 },
  
  // ─── V11-V13 - Al lado derecho de P4 ───
  { name: 'V11', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 48, posY: 58 },
  { name: 'V12', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 58, posY: 58 },
  { name: 'V13', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 68, posY: 58 },
  
  // ─── V14-V16 - Entre P4 y P5 ───
  { name: 'V14', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 48, posY: 68 },
  { name: 'V15', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 58, posY: 68 },
  { name: 'V16', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 68, posY: 68 },
  
  // ─── V17-V19 - Al lado derecho de P5 ───
  { name: 'V17', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 48, posY: 78 },
  { name: 'V18', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 58, posY: 78 },
  { name: 'V19', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 68, posY: 78 },
  
  // ─── P6 - Arriba derecha junto a tarima ───
  { name: 'P6', capacity: 10, zone: TableZone.VIP, floor: 1, posX: 82, posY: 10 },
  
  // ─── K, L, M, N - Columna extrema derecha, entre P6 y P7 ───
  { name: 'K', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 92, posY: 16 },
  { name: 'L', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 92, posY: 22 },
  { name: 'M', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 92, posY: 28 },
  { name: 'N', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 92, posY: 34 },
  
  // ─── P7, P8, P9 - Columna derecha debajo de K,L,M,N ───
  { name: 'P7', capacity: 10, zone: TableZone.VIP, floor: 1, posX: 82, posY: 40 },
  { name: 'P8', capacity: 10, zone: TableZone.VIP, floor: 1, posX: 82, posY: 55 },
  { name: 'P9', capacity: 10, zone: TableZone.VIP, floor: 1, posX: 82, posY: 70 },
  
  // ─── BARRA PRINCIPAL (O, Q-U, Ñ, W) - Fila horizontal abajo ───
  // Nota: P y V fueron renombradas a Ñ y W para evitar conflicto con mesas P premium y V visitante
  { name: 'O', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 16, posY: 96 },
  { name: 'Q', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 28, posY: 96 },
  { name: 'R', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 40, posY: 96 },
  { name: 'S', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 52, posY: 96 },
  { name: 'T', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 64, posY: 96 },
  { name: 'U', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 76, posY: 96 },
  { name: 'Ñ', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 88, posY: 96 },
  { name: 'W', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 96, posY: 96 },
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
  // ═══ Mesas Premium P10-P21 (DISTRIBUCIÓN EXACTA COMO LA IMAGEN) ═══
  // Columna izquierda (debajo de R2)
  { name: 'P10', capacity: 10, zone: TableZone.VIP, floor: 2, posX: 36, posY: 35 },
  { name: 'P11', capacity: 10, zone: TableZone.VIP, floor: 2, posX: 36, posY: 50 },
  { name: 'P12', capacity: 10, zone: TableZone.VIP, floor: 2, posX: 36, posY: 65 },
  { name: 'P13', capacity: 10, zone: TableZone.VIP, floor: 2, posX: 36, posY: 80 },
  { name: 'P14', capacity: 10, zone: TableZone.VIP, floor: 2, posX: 36, posY: 95 },
  // Columna derecha (junto a tarima)
  { name: 'P15', capacity: 10, zone: TableZone.VIP, floor: 2, posX: 74, posY: 20 },
  { name: 'P16', capacity: 10, zone: TableZone.VIP, floor: 2, posX: 74, posY: 35 },
  { name: 'P17', capacity: 10, zone: TableZone.VIP, floor: 2, posX: 74, posY: 50 },
  // Columna derecha-abajo (debajo de P17)
  { name: 'P18', capacity: 10, zone: TableZone.VIP, floor: 2, posX: 74, posY: 65 },
  { name: 'P19', capacity: 10, zone: TableZone.VIP, floor: 2, posX: 74, posY: 80 },
  { name: 'P20', capacity: 10, zone: TableZone.VIP, floor: 2, posX: 74, posY: 95 },
  { name: 'P21', capacity: 10, zone: TableZone.VIP, floor: 2, posX: 74, posY: 110 },
  // Mesas V31-V35
  { name: 'V31', capacity: 4, zone: TableZone.SALON, floor: 2, posX: 90, posY: 12 },
  { name: 'V32', capacity: 4, zone: TableZone.SALON, floor: 2, posX: 90, posY: 26 },
  { name: 'V33', capacity: 4, zone: TableZone.SALON, floor: 2, posX: 90, posY: 42 },
  { name: 'V34', capacity: 4, zone: TableZone.SALON, floor: 2, posX: 90, posY: 58 },
  { name: 'V35', capacity: 4, zone: TableZone.SALON, floor: 2, posX: 90, posY: 74 },
  // Nota: Barra principal eliminada del piso 2 (W-Z removidas)
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

// Endpoint para arreglar las mesas de la barra (renombrar P→Ñ, V→W y reposicionar)
router.get('/fix-bar-tables', async (_req: Request, res: Response) => {
  try {
    console.log('🔧 Arreglando mesas de la barra...\n');

    // 1. Manejar conflicto: Si Ñ ya existe, borrar la P. Si no, renombrar P→Ñ
    let pToN = 0;
    const existingN = await prisma.table.findUnique({ where: { name: 'Ñ' } });
    if (existingN) {
      // Ñ ya existe, borrar P si existe
      const deletedP = await prisma.table.deleteMany({
        where: { name: 'P', zone: TableZone.BARRA, floor: 1 }
      });
      pToN = deletedP.count;
      console.log(`✅ Ñ ya existe, P eliminada: ${deletedP.count}`);
    } else {
      // Renombrar P→Ñ
      const renamedP = await prisma.table.updateMany({
        where: { name: 'P', zone: TableZone.BARRA, floor: 1 },
        data: { name: 'Ñ' }
      });
      pToN = renamedP.count;
      console.log(`✅ Renombradas P → Ñ: ${renamedP.count}`);
    }

    // 2. Manejar conflicto: Si W ya existe, borrar la V. Si no, renombrar V→W
    let vToW = 0;
    const existingW = await prisma.table.findUnique({ where: { name: 'W' } });
    if (existingW) {
      // W ya existe, borrar V si existe
      const deletedV = await prisma.table.deleteMany({
        where: { name: 'V', zone: TableZone.BARRA, floor: 1 }
      });
      vToW = deletedV.count;
      console.log(`✅ W ya existe, V eliminada: ${deletedV.count}`);
    } else {
      // Renombrar V→W
      const renamedV = await prisma.table.updateMany({
        where: { name: 'V', zone: TableZone.BARRA, floor: 1 },
        data: { name: 'W' }
      });
      vToW = renamedV.count;
      console.log(`✅ Renombradas V → W: ${renamedV.count}`);
    }

    // 2. Actualizar posiciones de todas las mesas de la barra
    const barTables = [
      { name: 'O', posX: 16, posY: 96 },
      { name: 'Q', posX: 28, posY: 96 },
      { name: 'R', posX: 40, posY: 96 },
      { name: 'S', posX: 52, posY: 96 },
      { name: 'T', posX: 64, posY: 96 },
      { name: 'U', posX: 76, posY: 96 },
      { name: 'Ñ', posX: 88, posY: 96 },
      { name: 'W', posX: 96, posY: 96 },
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
      message: 'Mesas de la barra arregladas',
      details: {
        renamedPtoN: pToN,
        renamedVtoW: vToW,
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

    // 2. Reposicionar mesas P10-P21 EXACTAMENTE como en la imagen
    // Columna izquierda: P10-P14, Columna derecha: P15-P21
    const pTables = [
      // Columna izquierda (debajo de R2)
      { name: 'P10', posX: 36, posY: 35 },
      { name: 'P11', posX: 36, posY: 50 },
      { name: 'P12', posX: 36, posY: 65 },
      { name: 'P13', posX: 36, posY: 80 },
      { name: 'P14', posX: 36, posY: 95 },
      // Columna derecha (junto a tarima)
      { name: 'P15', posX: 74, posY: 20 },
      { name: 'P16', posX: 74, posY: 35 },
      { name: 'P17', posX: 74, posY: 50 },
      // Columna derecha-abajo (debajo de P17)
      { name: 'P18', posX: 74, posY: 65 },
      { name: 'P19', posX: 74, posY: 80 },
      { name: 'P20', posX: 74, posY: 95 },
      { name: 'P21', posX: 74, posY: 110 },
    ];

    let updatedCount = 0;
    for (const table of pTables) {
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

export default router;
