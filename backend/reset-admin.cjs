require('dotenv').config();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const SECRET = process.env.JWT_SECRET;

if (!SECRET) {
  console.log('ERROR: JWT_SECRET no encontrado en .env');
  process.exit(1);
}

async function main() {
  // 1. Reset admin password
  const newPassword = 'Pachanga2024!';
  const hash = await bcrypt.hash(newPassword, 12);
  const user = await prisma.user.updateMany({
    where: { email: 'admin@pachanga.com' },
    data: { passwordHash: hash },
  });
  if (user.count === 0) {
    console.log('No se encontro admin@pachanga.com');
  } else {
    console.log('Password actualizado: ' + newPassword);
  }

  // 2. Generate survey token
  const customer = await prisma.customer.findFirst({
    where: { isActive: true },
    select: { id: true, name: true },
  });

  if (customer) {
    const token = jwt.sign(
      { customerId: customer.id, purpose: 'survey' },
      SECRET,
      { expiresIn: '7d', issuer: 'pachanga-survey' }
    );
    console.log('Cliente: ' + customer.name);
    console.log('Survey URL: http://localhost:5173/encuesta?token=' + token);
  } else {
    console.log('No hay clientes activos para generar token');
  }

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
