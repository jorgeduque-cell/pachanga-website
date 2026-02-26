import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const validTableNames = [
  // Piso 1
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
  'V1', 'V2', 'V3', 'V4', 'V5', 'V6',
  'P1', 'P2', 'P3', 'P4', 'P5',
  'V7', 'V8', 'V9',
  'V11', 'V12', 'V13', 'V14', 'V15', 'V16', 'V17', 'V18', 'V19',
  'P6', 'P7', 'P8', 'P9',
  'K', 'L', 'M', 'N',
  'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V',
  // Piso 2
  'V20', 'V21', 'V22', 'V23', 'V24', 'V25', 'V26', 'V27', 'V28', 'V29', 'V30',
  'R1', 'R2',
  'P10', 'P11', 'P12', 'P13', 'P14',
  'P15', 'P16', 'P17',
  'P18', 'P19', 'P20', 'P21',
  'V31', 'V32', 'V33', 'V34', 'V35',
  'W', 'X', 'Y', 'Z'
];

async function main() {
  console.log('🧹 Limpiando mesas inválidas...');
  
  // Delete tables not in the valid list
  const result = await prisma.table.deleteMany({
    where: {
      name: {
        notIn: validTableNames
      }
    }
  });
  
  console.log(`✅ Eliminadas ${result.count} mesas inválidas`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
