#!/usr/bin/env tsx
/**
 * Fix Bar Tables Script
 * 
 * This script updates the bar tables to fix the P and V naming conflict
 * and repositions them above the bar label.
 * 
 * Run with: npx tsx scripts/fix-bar-tables.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Fixing bar tables...\n');

  // 1. Rename conflicting tables P and V (if they exist)
  console.log('1. Renaming conflicting tables P → Ñ and V → W...');
  
  const renameP = await prisma.table.updateMany({
    where: { name: 'P', zone: 'BARRA', floor: 1 },
    data: { name: 'Ñ' }
  });
  console.log(`   Renamed P to Ñ: ${renameP.count} table(s)`);

  const renameV = await prisma.table.updateMany({
    where: { name: 'V', zone: 'BARRA', floor: 1 },
    data: { name: 'W' }
  });
  console.log(`   Renamed V to W: ${renameV.count} table(s)`);

  // 2. Update positions of all Barra Principal tables
  console.log('\n2. Updating bar table positions...');
  
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

  for (const table of barTables) {
    const updated = await prisma.table.updateMany({
      where: { name: table.name, floor: 1 },
      data: { posX: table.posX, posY: table.posY }
    });
    console.log(`   ${table.name}: posX=${table.posX}%, posY=${table.posY}% (${updated.count} updated)`);
  }

  // 3. Verify changes
  console.log('\n3. Current bar tables (Floor 1):');
  const barraTables = await prisma.table.findMany({
    where: { floor: 1, zone: 'BARRA' },
    orderBy: { posX: 'asc' }
  });
  
  for (const t of barraTables) {
    console.log(`   ${t.name}: (${t.posX}%, ${t.posY}%)`);
  }

  console.log('\n✅ Bar tables fixed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
