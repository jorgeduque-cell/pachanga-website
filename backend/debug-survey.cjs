require('dotenv').config();
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

async function main() {
  const p = new PrismaClient();
  
  // Get a customer
  const customer = await p.customer.findFirst({ select: { id: true, name: true } });
  if (!customer) { fs.writeFileSync('debug-output.txt', 'No customers found'); return; }
  
  // Generate token
  const token = jwt.sign(
    { customerId: customer.id, purpose: 'survey' },
    process.env.JWT_SECRET,
    { expiresIn: '1h', issuer: 'pachanga-survey' }
  );
  
  // Check existing surveys
  const surveys = await p.$queryRawUnsafe('SELECT id, comments, music_rating FROM satisfaction_surveys ORDER BY created_at DESC LIMIT 5');
  
  // Test submit via HTTP to Render
  const response = await fetch('https://pachanga-api.onrender.com/api/surveys/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token,
      musicRating: 3,
      serviceRating: 3,
      ambienceRating: 3,
      hygieneRating: 3,
      comments: 'TEST COMMENT FROM SCRIPT'
    })
  });
  
  const responseData = await response.text();
  
  // Check survey after submit
  const surveysAfter = await p.$queryRawUnsafe('SELECT id, comments, music_rating FROM satisfaction_surveys ORDER BY created_at DESC LIMIT 5');
  
  const output = {
    customer: customer.name,
    apiStatus: response.status,
    apiResponse: responseData,
    surveysBefore: surveys,
    surveysAfter: surveysAfter
  };
  
  fs.writeFileSync('debug-output.txt', JSON.stringify(output, null, 2));
  await p.$disconnect();
}

main().catch(e => {
  fs.writeFileSync('debug-output.txt', 'ERROR: ' + e.message + '\n' + e.stack);
  process.exit(1);
});
