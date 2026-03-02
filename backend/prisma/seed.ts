import { PrismaClient, UserRole, TableZone, ReservationStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Leer credenciales de variables de entorno (nunca hardcodeadas)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const STAFF_EMAIL = process.env.STAFF_EMAIL;
const STAFF_PASSWORD = process.env.STAFF_PASSWORD;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !STAFF_EMAIL || !STAFF_PASSWORD) {
  console.error('❌ Faltan variables de entorno: ADMIN_EMAIL, ADMIN_PASSWORD, STAFF_EMAIL, STAFF_PASSWORD');
  process.exit(1);
}

interface TableSeed {
  name: string;
  capacity: number;
  zone: TableZone;
  floor: number;
  posX: number;
  posY: number;
}

async function main() {
  console.log('🌱 Iniciando seed...');

  // Crear usuario admin
  const adminPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);
  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
    create: {
      email: ADMIN_EMAIL,
      name: 'Dueño Pachanga',
      passwordHash: adminPassword,
      role: UserRole.ADMIN,
    },
  });
  console.log('✅ Usuario admin creado:', admin.email);

  // Crear usuario staff de prueba
  const staffPassword = await bcrypt.hash(STAFF_PASSWORD, 12);
  const staff = await prisma.user.upsert({
    where: { email: STAFF_EMAIL },
    update: {},
    create: {
      email: STAFF_EMAIL,
      name: 'Staff Pachanga',
      passwordHash: staffPassword,
      role: UserRole.STAFF,
    },
  });
  console.log('✅ Usuario staff creado:', staff.email);

  // ═══════════════════════════════════════════════════════════════
  // MESAS REALES DEL LOCAL — Basado en mapa_mesas_recortado.jpg
  // Coordenadas ajustadas para coincidir EXACTAMENTE con el mapa
  // El contenedor es de 100% x 600px
  // ═══════════════════════════════════════════════════════════════

  const tablesData: TableSeed[] = [
    // ═══════════════════════════════════════════════════════════
    // PRIMER PISO - Distribución exacta según mapa
    // ═══════════════════════════════════════════════════════════

    // ─── BARRA COCTÉLES (A-J) - Vertical izquierda, más separadas ───
    { name: 'A', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 6, posY: 8 },
    { name: 'B', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 6, posY: 18 },
    { name: 'C', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 6, posY: 28 },
    { name: 'D', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 6, posY: 38 },
    { name: 'E', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 6, posY: 48 },
    { name: 'F', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 6, posY: 58 },
    { name: 'G', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 6, posY: 68 },
    { name: 'H', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 6, posY: 78 },
    { name: 'I', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 10, posY: 85 },
    { name: 'J', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 10, posY: 93 },

    // ─── MESAS V1-V6 (Lado izquierdo vertical, separadas de la barra) ───
    { name: 'V1', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 16, posY: 25 },
    { name: 'V2', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 16, posY: 40 },
    { name: 'V3', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 16, posY: 55 },
    { name: 'V4', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 16, posY: 70 },
    { name: 'V5', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 16, posY: 85 },
    { name: 'V6', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 16, posY: 98 },

    // ─── MESAS PREMIUM P1-P5 (Columna izquierda del centro, más separadas) ───
    { name: 'P1', capacity: 10, zone: TableZone.SALON, floor: 1, posX: 30, posY: 12 },
    { name: 'P2', capacity: 10, zone: TableZone.SALON, floor: 1, posX: 30, posY: 32 },
    { name: 'P3', capacity: 10, zone: TableZone.SALON, floor: 1, posX: 30, posY: 52 },
    { name: 'P4', capacity: 10, zone: TableZone.SALON, floor: 1, posX: 30, posY: 72 },
    { name: 'P5', capacity: 10, zone: TableZone.SALON, floor: 1, posX: 30, posY: 92 },

    // ─── MESAS V7-V9 (Fila superior centro) ───
    { name: 'V7', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 46, posY: 20 },
    { name: 'V8', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 55, posY: 20 },
    { name: 'V9', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 64, posY: 20 },

    // ─── MESAS CENTRALES V11-V19 (3 filas de 3, bien distribuidas) ───
    // Primera fila
    { name: 'V11', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 46, posY: 38 },
    { name: 'V12', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 55, posY: 38 },
    { name: 'V13', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 64, posY: 38 },
    // Segunda fila
    { name: 'V14', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 46, posY: 55 },
    { name: 'V15', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 55, posY: 55 },
    { name: 'V16', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 64, posY: 55 },
    // Tercera fila
    { name: 'V17', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 46, posY: 72 },
    { name: 'V18', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 55, posY: 72 },
    { name: 'V19', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 64, posY: 72 },

    // ─── MESAS PREMIUM P6-P9 (Columna derecha, distribuidas verticalmente) ───
    { name: 'P6', capacity: 10, zone: TableZone.SALON, floor: 1, posX: 78, posY: 12 },
    { name: 'P7', capacity: 10, zone: TableZone.SALON, floor: 1, posX: 78, posY: 35 },
    { name: 'P8', capacity: 10, zone: TableZone.SALON, floor: 1, posX: 78, posY: 58 },
    { name: 'P9', capacity: 10, zone: TableZone.SALON, floor: 1, posX: 78, posY: 81 },

    // ─── LATERALES DERECHA K-N (distribuidas verticalmente) ───
    { name: 'K', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 90, posY: 20 },
    { name: 'L', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 90, posY: 38 },
    { name: 'M', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 90, posY: 56 },
    { name: 'N', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 90, posY: 74 },

    // ─── BARRA PRINCIPAL (O, Q-U, Ñ, W) - Abajo horizontal, bien distribuidas
    // Nota: P y V fueron renombradas a Ñ y W para evitar conflicto con mesas P premium y V visitante
    { name: 'O', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 16, posY: 96 },
    { name: 'Q', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 28, posY: 96 },
    { name: 'R', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 40, posY: 96 },
    { name: 'S', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 52, posY: 96 },
    { name: 'T', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 64, posY: 96 },
    { name: 'U', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 76, posY: 96 },
    { name: 'Ñ', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 88, posY: 96 },
    { name: 'W', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 96, posY: 96 },

    // ═══════════════════════════════════════════════════════════
    // SEGUNDO PISO - Distribución exacta según mapa
    // ═══════════════════════════════════════════════════════════

    // ─── MESAS V20-V30 (Lado izquierdo vertical, distribuidas) ───
    { name: 'V20', capacity: 4, zone: TableZone.SALON, floor: 2, posX: 6, posY: 8 },
    { name: 'V21', capacity: 4, zone: TableZone.SALON, floor: 2, posX: 6, posY: 20 },
    { name: 'V22', capacity: 4, zone: TableZone.SALON, floor: 2, posX: 6, posY: 32 },
    { name: 'V23', capacity: 4, zone: TableZone.SALON, floor: 2, posX: 6, posY: 44 },
    { name: 'V24', capacity: 4, zone: TableZone.SALON, floor: 2, posX: 6, posY: 56 },
    { name: 'V25', capacity: 4, zone: TableZone.SALON, floor: 2, posX: 6, posY: 68 },
    { name: 'V26', capacity: 4, zone: TableZone.SALON, floor: 2, posX: 6, posY: 80 },
    { name: 'V27', capacity: 4, zone: TableZone.SALON, floor: 2, posX: 14, posY: 85 },
    // V28-V30 más a la derecha abajo
    { name: 'V28', capacity: 4, zone: TableZone.SALON, floor: 2, posX: 14, posY: 95 },
    { name: 'V29', capacity: 4, zone: TableZone.SALON, floor: 2, posX: 6, posY: 95 },
    { name: 'V30', capacity: 4, zone: TableZone.SALON, floor: 2, posX: 6, posY: 105 },

    // ─── MESAS R1-R2 (Arriba izquierda de tarima) ───
    { name: 'R1', capacity: 4, zone: TableZone.SALON, floor: 2, posX: 22, posY: 15 },
    { name: 'R2', capacity: 4, zone: TableZone.SALON, floor: 2, posX: 22, posY: 30 },

    // ─── MESAS PREMIUM P10-P14 (Columna izquierda debajo de R1-R2) ───
    { name: 'P10', capacity: 10, zone: TableZone.SALON, floor: 2, posX: 36, posY: 28 },
    { name: 'P11', capacity: 10, zone: TableZone.SALON, floor: 2, posX: 36, posY: 45 },
    { name: 'P12', capacity: 10, zone: TableZone.SALON, floor: 2, posX: 36, posY: 62 },
    { name: 'P13', capacity: 10, zone: TableZone.SALON, floor: 2, posX: 36, posY: 79 },
    { name: 'P14', capacity: 10, zone: TableZone.SALON, floor: 2, posX: 36, posY: 96 },

    // ─── MESAS PREMIUM P15-P17 (Columna derecha arriba) ───
    { name: 'P15', capacity: 10, zone: TableZone.SALON, floor: 2, posX: 74, posY: 18 },
    { name: 'P16', capacity: 10, zone: TableZone.SALON, floor: 2, posX: 74, posY: 40 },
    { name: 'P17', capacity: 10, zone: TableZone.SALON, floor: 2, posX: 74, posY: 62 },

    // ─── MESAS PREMIUM P18-P21 (Columna derecha abajo) ───
    { name: 'P18', capacity: 10, zone: TableZone.SALON, floor: 2, posX: 74, posY: 80 },
    { name: 'P19', capacity: 10, zone: TableZone.SALON, floor: 2, posX: 74, posY: 95 },
    { name: 'P20', capacity: 10, zone: TableZone.SALON, floor: 2, posX: 74, posY: 110 },
    { name: 'P21', capacity: 10, zone: TableZone.SALON, floor: 2, posX: 74, posY: 125 },

    // ─── MESAS V31-V35 (Lado derecho vertical) ───
    { name: 'V31', capacity: 4, zone: TableZone.SALON, floor: 2, posX: 90, posY: 12 },
    { name: 'V32', capacity: 4, zone: TableZone.SALON, floor: 2, posX: 90, posY: 26 },
    { name: 'V33', capacity: 4, zone: TableZone.SALON, floor: 2, posX: 90, posY: 42 },
    { name: 'V34', capacity: 4, zone: TableZone.SALON, floor: 2, posX: 90, posY: 58 },
    { name: 'V35', capacity: 4, zone: TableZone.SALON, floor: 2, posX: 90, posY: 74 },

    // ─── BARRA ABAJO (W-Z) - Horizontal ───
    { name: 'W', capacity: 2, zone: TableZone.BARRA, floor: 2, posX: 36, posY: 115 },
    { name: 'X', capacity: 2, zone: TableZone.BARRA, floor: 2, posX: 48, posY: 115 },
    { name: 'Y', capacity: 2, zone: TableZone.BARRA, floor: 2, posX: 60, posY: 115 },
    { name: 'Z', capacity: 2, zone: TableZone.BARRA, floor: 2, posX: 72, posY: 115 },
  ];

  console.log(`📋 Creando ${tablesData.length} mesas con posicionamiento visual exacto...`);

  const tables = [];
  for (const tableData of tablesData) {
    const table = await prisma.table.upsert({
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
    tables.push(table);
  }
  console.log(`✅ ${tables.length} mesas creadas/actualizadas`);

  // Crear reservas de ejemplo
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const reservationsData = [
    {
      customerName: 'Juan Pérez',
      customerPhone: '555-0101',
      reservationDate: today,
      reservationTime: '20:00',
      partySize: 8,
      message: 'Celebración de cumpleaños',
      status: ReservationStatus.CONFIRMED,
      tableId: tables.find(t => t.name === 'P1')!.id,
    },
    {
      customerName: 'María García',
      customerPhone: '555-0102',
      reservationDate: today,
      reservationTime: '21:00',
      partySize: 2,
      status: ReservationStatus.PENDING,
      tableId: tables.find(t => t.name === 'A')!.id,
    },
    {
      customerName: 'Carlos López',
      customerPhone: '555-0103',
      reservationDate: tomorrow,
      reservationTime: '19:30',
      partySize: 4,
      message: 'Cena de negocios',
      status: ReservationStatus.CONFIRMED,
      tableId: tables.find(t => t.name === 'V7')!.id,
    },
    {
      customerName: 'Ana Martínez',
      customerPhone: '555-0104',
      reservationDate: tomorrow,
      reservationTime: '20:30',
      partySize: 4,
      status: ReservationStatus.PENDING,
      tableId: tables.find(t => t.name === 'R1')!.id,
    },
    {
      customerName: 'Pedro Sánchez',
      customerPhone: '555-0105',
      reservationDate: today,
      reservationTime: '22:00',
      partySize: 10,
      message: 'Despedida de soltero',
      status: ReservationStatus.COMPLETED,
      tableId: tables.find(t => t.name === 'P10')!.id,
    },
  ];

  for (const reservationData of reservationsData) {
    const existing = await prisma.reservation.findFirst({
      where: {
        customerPhone: reservationData.customerPhone,
        reservationDate: reservationData.reservationDate,
        reservationTime: reservationData.reservationTime,
      },
    });

    if (!existing) {
      const reservation = await prisma.reservation.create({
        data: reservationData,
      });
      console.log('✅ Reserva creada:', reservation.customerName, '-', reservation.reservationDate.toDateString());
    }
  }

  // ─── CRM Config Defaults ───────────────────────────────────
  const crmConfigDefaults = [
    { key: 'birthday_min_group', value: '4' },
    { key: 'welcome_incentive', value: 'Shot de cortesía' },
    { key: 'birthday_cron_enabled', value: 'true' },
  ];

  for (const config of crmConfigDefaults) {
    await prisma.crmConfig.upsert({
      where: { key: config.key },
      update: {},
      create: config,
    });
    console.log('⚙️ CRM Config:', config.key, '=', config.value);
  }

  console.log('🎉 Seed completado exitosamente!');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
