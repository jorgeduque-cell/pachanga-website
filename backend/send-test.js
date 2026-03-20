// Sube la imagen a Meta y envía el template con el media ID
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_ID = '1050662141458800';
const IMAGE_PATH = path.join(__dirname, '..', 'app', 'public', 'welcome-header.jpg');

// Check if file exists, try alternatives
let imagePath = IMAGE_PATH;
if (!fs.existsSync(imagePath)) {
  const alt = path.join(__dirname, '..', 'app', 'public', 'logo completo.jpg');
  if (fs.existsSync(alt)) imagePath = alt;
  else {
    const alt2 = path.join(__dirname, '..', 'app', 'public', 'logo-completo.jpg');
    if (fs.existsSync(alt2)) imagePath = alt2;
    else { console.error('No se encontró la imagen!'); process.exit(1); }
  }
}
console.log('Usando imagen:', imagePath);

// Step 1: Upload media to Meta
function uploadMedia(filePath) {
  return new Promise((resolve, reject) => {
    const fileData = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);
    const boundary = '----FormBoundary' + Math.random().toString(36).slice(2);

    const parts = [];
    // messaging_product field
    parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="messaging_product"\r\n\r\nwhatsapp\r\n`);
    // type field
    parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="type"\r\n\r\nimage/jpeg\r\n`);
    // file field
    parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: image/jpeg\r\n\r\n`);
    const ending = `\r\n--${boundary}--\r\n`;

    const bodyParts = [Buffer.from(parts.join('')), fileData, Buffer.from(ending)];
    const body = Buffer.concat(bodyParts);

    const req = https.request({
      hostname: 'graph.facebook.com',
      path: `/v21.0/${PHONE_ID}/media`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length,
      },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// Step 2: Send template with media ID
function sendMsg(to, mediaId) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      messaging_product: 'whatsapp',
      to: to,
      type: 'template',
      template: {
        name: 'pachanga_bienvenida',
        language: { code: 'es_CO' },
        components: [
          {
            type: 'header',
            parameters: [{ type: 'image', image: { id: mediaId } }],
          },
          {
            type: 'body',
            parameters: [{ type: 'text', parameter_name: 'customer_name', text: 'Jorge' }],
          },
        ],
      },
    });
    const req = https.request({
      hostname: 'graph.facebook.com',
      path: `/v21.0/${PHONE_ID}/messages`,
      method: 'POST',
      headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  // 1. Upload
  console.log('=== Subiendo imagen a Meta... ===\n');
  const upload = await uploadMedia(imagePath);
  console.log('Upload result:', JSON.stringify(upload, null, 2));

  if (!upload.id) {
    console.log('\n❌ Error al subir la imagen');
    return;
  }

  const mediaId = upload.id;
  console.log(`\n✅ Imagen subida! Media ID: ${mediaId}`);
  console.log('\nGuarda este ID para usarlo en el código.\n');

  // 2. Send to test number
  console.log('=== Enviando mensaje con la imagen subida... ===\n');
  const result = await sendMsg('573102438839', mediaId);
  console.log(JSON.stringify(result, null, 2));

  if (result.messages) {
    console.log('\n✅ ¡MENSAJE ENVIADO CON TU IMAGEN!');
    console.log(`\nMedia ID permanente: ${mediaId}`);
    console.log('Copia este ID para configurarlo en el código.');
  } else {
    console.log('\n❌', result.error?.error_data?.details || result.error?.message);
  }
}

main().catch(console.error);
