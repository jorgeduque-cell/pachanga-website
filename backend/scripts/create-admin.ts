#!/usr/bin/env node
/**
 * Script para crear/verificar usuario admin en producción
 * Ejecutar: npx tsx scripts/create-admin.ts
 */

import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@pachanga.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
  
  console.log('🔍 Verificando usuario admin...');
  console.log('   Email:', adminEmail);
  
  // Buscar usuario existente
  const existingUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });
  
  if (existingUser) {
    console.log('✅ Usuario admin ya existe:', existingUser.email);
    console.log('   Role:', existingUser.role);
    console.log('   Name:', existingUser.name);
    
    // Actualizar contraseña por si acaso
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await prisma.user.update({
      where: { email: adminEmail },
      data: { passwordHash },
    });
    console.log('🔑 Contraseña actualizada');
  } else {
    console.log('⚠️ Usuario admin NO existe. Creando...');
    
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Dueño Pachanga',
        passwordHash,
        role: UserRole.ADMIN,
      },
    });
    
    console.log('✅ Usuario admin creado exitosamente:');
    console.log('   ID:', admin.id);
    console.log('   Email:', admin.email);
    console.log('   Role:', admin.role);
  }
  
  // Crear usuario staff también
  const staffEmail = process.env.STAFF_EMAIL || 'staff@pachanga.com';
  const staffPassword = process.env.STAFF_PASSWORD || 'Staff123!';
  
  const existingStaff = await prisma.user.findUnique({
    where: { email: staffEmail },
  });
  
  if (!existingStaff) {
    const staffHash = await bcrypt.hash(staffPassword, 12);
    const staff = await prisma.user.create({
      data: {
        email: staffEmail,
        name: 'Staff Pachanga',
        passwordHash: staffHash,
        role: UserRole.STAFF,
      },
    });
    console.log('✅ Usuario staff creado:', staff.email);
  } else {
    console.log('✅ Usuario staff ya existe:', existingStaff.email);
  }
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
