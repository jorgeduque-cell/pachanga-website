require('dotenv').config();
const https = require('https');
const fs = require('fs');
const jwt = require('jsonwebtoken');

const PHONE = '573124183002';
const TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const VIDEO_MEDIA_ID = '1448053986860172';
const CUSTOMER_ID = '5919f0d7-2966-4a3a-a318-bae2b7e2adf1';

// Generate survey token
const surveyToken = jwt.sign(
  { customerId: CUSTOMER_ID, purpose: 'survey' },
  process.env.JWT_SECRET,
  { expiresIn: '7d', issuer: 'pachanga-survey' }
);

console.log('Survey URL: https://pachanga-website.vercel.app/encuesta?token=' + surveyToken);

const body = JSON.stringify({
  messaging_product: 'whatsapp',
  to: PHONE,
  type: 'template',
  template: {
    name: 'encuesta_pachanga',
    language: { code: 'es_CO' },
    components: [
      { type: 'header', parameters: [{ type: 'video', video: { id: VIDEO_MEDIA_ID } }] },
      { type: 'body', parameters: [{ type: 'text', text: 'Jorge' }] },
      { type: 'button', sub_type: 'url', index: 0, parameters: [{ type: 'text', text: surveyToken }] }
    ]
  }
});

console.log('Sending to +' + PHONE + '...');

const options = {
  hostname: 'graph.facebook.com',
  path: '/v21.0/' + PHONE_ID + '/messages',
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + TOKEN,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body)
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const result = 'Status: ' + res.statusCode + '\nResponse: ' + data;
    fs.writeFileSync('send-output.txt', result);
    console.log(result);
    process.exit(0);
  });
});

req.on('error', (e) => {
  const result = 'ERROR: ' + e.message;
  fs.writeFileSync('send-output.txt', result);
  console.log(result);
  process.exit(1);
});

req.setTimeout(15000, () => {
  fs.writeFileSync('send-output.txt', 'TIMEOUT after 15s');
  console.log('TIMEOUT');
  req.destroy();
  process.exit(1);
});

req.write(body);
req.end();
