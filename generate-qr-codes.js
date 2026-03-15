const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://pachanga-website.vercel.app/qr';
const OUTPUT_DIR = path.join(__dirname, 'qr-codes');

// All 83 tables from seed.ts
const TABLES = [
  // Floor 1 - Barra Coctéles
  'A','B','C','D','E','F','G','H','I','J',
  // Floor 1 - V1-V6
  'V1','V2','V3','V4','V5','V6',
  // Floor 1 - Premium P1-P5
  'P1','P2','P3','P4','P5',
  // Floor 1 - V7-V9
  'V7','V8','V9',
  // Floor 1 - V11-V19
  'V11','V12','V13','V14','V15','V16','V17','V18','V19',
  // Floor 1 - Premium P6-P9
  'P6','P7','P8','P9',
  // Floor 1 - Laterales K-N
  'K','L','M','N',
  // Floor 1 - Barra Principal
  'O','Q','R','S','T','U','Ñ','W',
  // Floor 2 - V20-V30
  'V20','V21','V22','V23','V24','V25','V26','V27','V28','V29','V30',
  // Floor 2 - R1-R2
  'R1','R2',
  // Floor 2 - Premium P10-P14
  'P10','P11','P12','P13','P14',
  // Floor 2 - Premium P15-P21
  'P15','P16','P17','P18','P19','P20','P21',
  // Floor 2 - V31-V35
  'V31','V32','V33','V34','V35',
  // Floor 2 - Barra
  'X','Y','Z',
];

async function generateAllQRCodes() {
  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log(`🏗️  Generando ${TABLES.length} códigos QR en ${OUTPUT_DIR}...\n`);

  for (const table of TABLES) {
    const url = `${BASE_URL}?table=${encodeURIComponent(table)}`;
    const filename = `QR_Mesa_${table}.png`;
    const filepath = path.join(OUTPUT_DIR, filename);

    await QRCode.toFile(filepath, url, {
      type: 'png',
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'H', // High error correction for durability
    });

    console.log(`  ✅ ${filename} → ${url}`);
  }

  console.log(`\n🎉 ¡Listo! ${TABLES.length} QR generados en: ${OUTPUT_DIR}`);
  console.log(`\n💡 Cada QR apunta a: ${BASE_URL}?table=MESA_NAME`);
}

generateAllQRCodes().catch(console.error);
