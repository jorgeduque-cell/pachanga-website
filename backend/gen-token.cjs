require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

async function main() {
  const prisma = new PrismaClient();
  const customer = await prisma.customer.findFirst({ select: { id: true, name: true } });
  if (!customer) { console.log('No hay clientes'); process.exit(0); }

  const token = jwt.sign(
    { customerId: customer.id, purpose: 'survey' },
    process.env.JWT_SECRET,
    { expiresIn: '1h', issuer: 'pachanga-survey' }
  );

  console.log('Cliente:', customer.name);
  console.log('https://pachanga-website.vercel.app/encuesta?token=' + token);
  await prisma.$disconnect();
}
main();
