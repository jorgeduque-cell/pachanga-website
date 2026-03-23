require('dotenv').config();
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

async function main() {
  const p = new PrismaClient();
  const result = await p.$queryRawUnsafe('SELECT id, comments, music_rating, created_at FROM satisfaction_surveys ORDER BY created_at DESC LIMIT 5');
  fs.writeFileSync('db-output.json', JSON.stringify(result, null, 2));
  console.log('Written to db-output.json');
  await p.$disconnect();
}
main().catch(e => { fs.writeFileSync('db-output.json', 'ERROR: ' + e.message); process.exit(1); });
