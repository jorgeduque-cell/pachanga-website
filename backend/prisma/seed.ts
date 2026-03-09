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
    // PRIMER PISO (Planta Baja)
    // ═══════════════════════════════════════════════════════════

    // ─── ZONA IZQUIERDA: Barra Coctéles (A-H vertical, A=tarima, H=fondo) ───
    { name: 'A', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 6, posY: 14 },
    { name: 'B', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 6, posY: 24 },
    { name: 'C', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 6, posY: 33 },
    { name: 'D', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 6, posY: 42 },
    { name: 'E', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 6, posY: 51 },
    { name: 'F', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 6, posY: 60 },
    { name: 'G', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 6, posY: 69 },
    { name: 'H', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 6, posY: 78 },
    // I-J: fila horizontal al final de barra (J=pared, I=pasillo)
    { name: 'I', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 13, posY: 86 },
    { name: 'J', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 6, posY: 86 },

    // ─── V1-V6: Pared izquierda, paralelas a P3-P5 (V1=frente, V6=esquina inf-izq) ───
    { name: 'V1', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 15, posY: 42 },
    { name: 'V2', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 15, posY: 50 },
    { name: 'V3', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 15, posY: 58 },
    { name: 'V4', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 15, posY: 66 },
    { name: 'V5', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 15, posY: 74 },
    { name: 'V6', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 15, posY: 82 },

    // ─── Palcos P1-P5: Columna paralela a barra, separada por pasillo A-H ───
    { name: 'P1', capacity: 10, zone: TableZone.SALON, floor: 1, posX: 27, posY: 14 },
    { name: 'P2', capacity: 10, zone: TableZone.SALON, floor: 1, posX: 27, posY: 28 },
    { name: 'P3', capacity: 10, zone: TableZone.SALON, floor: 1, posX: 27, posY: 42 },
    { name: 'P4', capacity: 10, zone: TableZone.SALON, floor: 1, posX: 27, posY: 58 },
    { name: 'P5', capacity: 10, zone: TableZone.SALON, floor: 1, posX: 27, posY: 74 },

    // ─── ZONA CENTRAL (Pista): 4 filas de 3 ───
    { name: 'V7', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 40, posY: 22 },
    { name: 'V8', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 48, posY: 22 },
    { name: 'V9', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 56, posY: 22 },
    { name: 'V11', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 40, posY: 36 },
    { name: 'V12', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 48, posY: 36 },
    { name: 'V13', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 56, posY: 36 },
    { name: 'V14', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 40, posY: 50 },
    { name: 'V15', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 48, posY: 50 },
    { name: 'V16', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 56, posY: 50 },
    { name: 'V17', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 40, posY: 64 },
    { name: 'V18', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 48, posY: 64 },
    { name: 'V19', capacity: 4, zone: TableZone.SALON, floor: 1, posX: 56, posY: 64 },

    // ─── ZONA DERECHA SUPERIOR: P6 VIP + curva diagonal K-L-M-N ───
    { name: 'P6', capacity: 10, zone: TableZone.SALON, floor: 1, posX: 78, posY: 12 },
    { name: 'K', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 84, posY: 24 },
    { name: 'L', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 82, posY: 36 },
    { name: 'M', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 78, posY: 48 },
    { name: 'N', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 72, posY: 58 },

    // ─── ZONA DERECHA INFERIOR: Palcos P7-P9 (mitad del salón hacia fondo) ───
    { name: 'P7', capacity: 10, zone: TableZone.SALON, floor: 1, posX: 68, posY: 26 },
    { name: 'P8', capacity: 10, zone: TableZone.SALON, floor: 1, posX: 68, posY: 42 },
    { name: 'P9', capacity: 10, zone: TableZone.SALON, floor: 1, posX: 68, posY: 62 },

    // ─── BARRA PRINCIPAL: fila horizontal al fondo (O=izq, Ñ=der) ───
    { name: 'O', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 24, posY: 86 },
    { name: 'Q', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 34, posY: 86 },
    { name: 'R', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 42, posY: 86 },
    { name: 'S', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 50, posY: 86 },
    { name: 'T', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 58, posY: 86 },
    { name: 'U', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 66, posY: 86 },
    { name: 'Ñ', capacity: 2, zone: TableZone.BARRA, floor: 1, posX: 74, posY: 86 },

    // ═══════════════════════════════════════════════════════════
    // SEGUNDO PISO (Balcón / Mezzanine) - Forma de U invertida
    // ═══════════════════════════════════════════════════════════

    // ─── ALA IZQUIERDA: V20-V30 pegadas a pared izquierda ───
    { name: 'V20', capacity: 4, zone: TableZone.SALON, floor: 2, posX: 6, posY: 10 },
    { name: 'V21', capacity: 4, zone: TableZone.SALON, floor: 2, posX: 6, posY: 17 },
    { name: 'V22', capacity: 4, zone: TableZone.SALON, floor: 2, posX: 6, posY: 24 },
    { name: 'V23', capacity: 4, zone: TableZone.SALON, floor: 2, posX: 6, posY: 31 },
    { name: 'V24', capacity: 4, zone: TableZone.SALON, floor: 2, posX: 6, posY: 38 },
    { name: 'V25', capacity: 4, zone: TableZone.SALON, floor: 2, posX: 6, posY: 45 },
    { name: 'V26', capacity: 4, zone: TableZone.SALON, floor: 2, posX: 6, posY: 52 },
    { name: 'V27', capacity: 4, zone: TableZone.SALON, floor: 2, posX: 6, posY: 59 },
    { name: 'V28', capacity: 4, zone: TableZone.SALON, floor: 2, posX: 6, posY: 66 },
    { name: 'V29', capacity: 4, zone: TableZone.SALON, floor: 2, posX: 6, posY: 73 },
    { name: 'V30', capacity: 4, zone: TableZone.SALON, floor: 2, posX: 6, posY: 80 },

    // ─── R1-R2: Codo superior izquierdo (entre tarima y palcos) ───
    { name: 'R1', capacity: 4, zone: TableZone.SALON, floor: 2, posX: 18, posY: 14 },
    { name: 'R2', capacity: 4, zone: TableZone.SALON, floor: 2, posX: 18, posY: 22 },

    // ─── P10-P14: Columna interior izquierda (borde interno) ───
    { name: 'P10', capacity: 10, zone: TableZone.SALON, floor: 2, posX: 24, posY: 22 },
    { name: 'P11', capacity: 10, zone: TableZone.SALON, floor: 2, posX: 24, posY: 38 },
    { name: 'P12', capacity: 10, zone: TableZone.SALON, floor: 2, posX: 24, posY: 54 },
    { name: 'P13', capacity: 10, zone: TableZone.SALON, floor: 2, posX: 24, posY: 68 },
    { name: 'P14', capacity: 10, zone: TableZone.SALON, floor: 2, posX: 24, posY: 78 },

    // ─── ALA DERECHA SUPERIOR: P15-P17 + V31-V35 ───
    { name: 'P15', capacity: 10, zone: TableZone.SALON, floor: 2, posX: 72, posY: 12 },
    { name: 'P16', capacity: 10, zone: TableZone.SALON, floor: 2, posX: 72, posY: 28 },
    { name: 'P17', capacity: 10, zone: TableZone.SALON, floor: 2, posX: 72, posY: 44 },
    { name: 'V31', capacity: 4, zone: TableZone.SALON, floor: 2, posX: 88, posY: 12 },
    { name: 'V32', capacity: 4, zone: TableZone.SALON, floor: 2, posX: 88, posY: 20 },
    { name: 'V33', capacity: 4, zone: TableZone.SALON, floor: 2, posX: 88, posY: 28 },
    { name: 'V34', capacity: 4, zone: TableZone.SALON, floor: 2, posX: 88, posY: 36 },
    { name: 'V35', capacity: 4, zone: TableZone.SALON, floor: 2, posX: 88, posY: 44 },

    // ─── ALA DERECHA INFERIOR: P18-P21 extensión ───
    { name: 'P18', capacity: 10, zone: TableZone.SALON, floor: 2, posX: 72, posY: 54 },
    { name: 'P19', capacity: 10, zone: TableZone.SALON, floor: 2, posX: 72, posY: 62 },
    { name: 'P20', capacity: 10, zone: TableZone.SALON, floor: 2, posX: 72, posY: 70 },
    { name: 'P21', capacity: 10, zone: TableZone.SALON, floor: 2, posX: 72, posY: 78 },

    // ─── BORDE INFERIOR: W,X,Y,Z conectando alas izq y der ───
    { name: 'W', capacity: 2, zone: TableZone.BARRA, floor: 2, posX: 24, posY: 87 },
    { name: 'X', capacity: 2, zone: TableZone.BARRA, floor: 2, posX: 40, posY: 87 },
    { name: 'Y', capacity: 2, zone: TableZone.BARRA, floor: 2, posX: 56, posY: 87 },
    { name: 'Z', capacity: 2, zone: TableZone.BARRA, floor: 2, posX: 72, posY: 87 },
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
