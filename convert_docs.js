const fs = require('fs');
const path = require('path');

const baseDir = 'c:\\Users\\LENOVO CORP\\Proyecto Pachanga';
const outputDir = path.join(baseDir, 'Documentacion proyecto PyP');

const filesToConvert = [
  { src: 'ERS_Sistema_Reservas_Pachanga.md.resolved', name: '01_ERS_Sistema_Reservas_Pachanga' },
  { src: 'ERS_crm_fidelizacion.md.resolved', name: '02_ERS_CRM_Fidelizacion' },
  { src: 'implementation_plan Sprint1.md', name: '03_Implementation_Plan_Sprint1' },
  { src: 'implementation_plansprint2.md', name: '04_Implementation_Plan_Sprint2' },
  { src: 'implementation_plansprint3.md', name: '05_Implementation_Plan_Sprint3' },
  { src: 'implementationsprint6.md', name: '06_Implementation_Sprint6' },
  { src: 'implementation_sprint7.md', name: '07_Implementation_Sprint7' },
  { src: 'implementation_plan whastapp', name: '08_Implementation_Plan_WhatsApp' },
  { src: 'implementation_plan.md.resolved', name: '09_Implementation_Plan_General' },
  { src: 'audit_report.md', name: '10_Audit_Report' },
  { src: 'Reporte Post implemetacion de encuestas whatsapp', name: '11_Reporte_Encuestas_WhatsApp' },
  { src: 'Material audiovisual\\code_review_report.md', name: '12_Code_Review_Report' },
  { src: 'sprint_backlog.md.resolved', name: '13_Sprint_Backlog' },
  { src: 'Sprint1co.md', name: '14_Sprint1_Correcciones' },
  { src: 'Correciones.md', name: '15_Correcciones' },
  { src: 'CORRECCIONES_RESERVAS.md', name: '16_Correcciones_Reservas' },
  { src: 'DEPLOY.md', name: '17_Guia_Despliegue' },
  { src: 'proyecto_pachangaExplain', name: '18_Arquitectura_Proyecto' },
  { src: 'ultima version.md', name: '19_Ultima_Version' },
];

function mdToHtml(md) {
  let html = md;
  // Code blocks first (preserve content)
  const codeBlocks = [];
  html = html.replace(/```([\w]*)\r?\n([\s\S]*?)```/g, (m, lang, code) => {
    codeBlocks.push(`<pre><code class="lang-${lang || 'text'}">${code.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</code></pre>`);
    return `%%CODEBLOCK_${codeBlocks.length - 1}%%`;
  });
  // Tables
  html = html.replace(/((?:\|.+\|\r?\n)+)/g, (tableBlock) => {
    const rows = tableBlock.trim().split(/\r?\n/);
    if (rows.length < 2) return tableBlock;
    let table = '<table>';
    rows.forEach((row, i) => {
      if (row.match(/^\|[\s-:|]+\|$/)) return; // skip separator
      const cells = row.split('|').filter((c, idx, arr) => idx > 0 && idx < arr.length - 1);
      const tag = i === 0 ? 'th' : 'td';
      const rowTag = i === 0 ? 'thead' : '';
      if (i === 0) table += '<thead>';
      if (i === 2 || (i === 1 && !rows[1].match(/^\|[\s-:|]+\|$/))) { if(table.includes('<thead>') && !table.includes('</thead>')) table += '</thead>'; table += '<tbody>'; }
      table += '<tr>' + cells.map(c => `<${tag}>${c.trim()}</${tag}>`).join('') + '</tr>';
    });
    if (table.includes('<tbody>')) table += '</tbody>';
    table += '</table>';
    return table;
  });
  // Headers
  html = html.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>');
  html = html.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>');
  html = html.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');
  // Bold/italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  // Horizontal rules
  html = html.replace(/^---+\s*$/gm, '<hr>');
  // Blockquotes / alerts
  html = html.replace(/^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*$/gm, '<div class="alert alert-$1">');
  html = html.replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>');
  // Lists
  html = html.replace(/^\s*[-*]\s+(.+)$/gm, '<li>$1</li>');
  html = html.replace(/^\s*\d+\.\s+(.+)$/gm, '<li>$1</li>');
  html = html.replace(/((?:<li>.*<\/li>\s*)+)/g, '<ul>$1</ul>');
  // Paragraphs
  const lines = html.split('\n');
  const result = [];
  for (const line of lines) {
    const t = line.trim();
    if (t === '') { result.push(''); continue; }
    if (t.startsWith('<') || t.startsWith('%%CODEBLOCK')) { result.push(line); continue; }
    result.push(`<p>${line}</p>`);
  }
  html = result.join('\n');
  // Restore code blocks
  codeBlocks.forEach((block, i) => {
    html = html.replace(`%%CODEBLOCK_${i}%%`, block);
  });
  return html;
}

function wrapInDoc(title, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>${title} - Proyecto Pachanga</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter','Segoe UI',Arial,sans-serif;line-height:1.7;color:#1a1a2e;padding:40px 50px;background:#fff;font-size:11pt}
h1{font-size:20pt;color:#0f0f23;border-bottom:3px solid #6c63ff;padding-bottom:8px;margin:25px 0 12px 0;font-weight:700}
h2{font-size:15pt;color:#16213e;border-bottom:1.5px solid #e0e0e0;padding-bottom:5px;margin:22px 0 10px 0;font-weight:600}
h3{font-size:12pt;color:#1a1a2e;margin:18px 0 8px 0;font-weight:600}
h4,h5,h6{font-size:11pt;color:#333;margin:12px 0 6px 0;font-weight:600}
p{margin:6px 0}
ul,ol{margin:6px 0 6px 22px}
li{margin:3px 0}
code{background:#f4f3ff;color:#6c63ff;padding:1px 5px;border-radius:3px;font-size:9.5pt;font-family:'Consolas','Courier New',monospace}
pre{background:#1a1a2e;color:#e0e0e0;padding:14px 18px;border-radius:8px;overflow-x:auto;margin:10px 0;font-size:9pt}
pre code{background:none;color:inherit;padding:0}
hr{border:none;border-top:1px solid #e0e0e0;margin:18px 0}
a{color:#6c63ff;text-decoration:none}
table{width:100%;border-collapse:collapse;margin:10px 0;font-size:10pt}
th,td{border:1px solid #ddd;padding:7px 10px;text-align:left}
th{background:#f4f3ff;font-weight:600}
tr:nth-child(even){background:#fafafa}
strong{font-weight:600}
blockquote{border-left:3px solid #6c63ff;padding:5px 15px;margin:10px 0;background:#f9f8ff;color:#333}
.alert{border-left:4px solid #6c63ff;padding:8px 15px;margin:10px 0;border-radius:0 6px 6px 0;background:#f0f0ff}
.header-banner{background:linear-gradient(135deg,#6c63ff 0%,#3f3d99 100%);color:#fff;padding:18px 28px;border-radius:10px;margin-bottom:25px;text-align:center}
.header-banner h1{color:#fff;border:none;margin:0;padding:0;font-size:18pt}
.header-banner p{color:rgba(255,255,255,.8);font-size:9pt;margin-top:4px}
.footer{text-align:center;margin-top:30px;padding-top:15px;border-top:1px solid #e0e0e0;color:#999;font-size:8pt}
@media print{body{padding:15px 25px}.header-banner{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style>
</head>
<body>
<div class="header-banner"><h1>${title}</h1><p>Proyecto Pachanga &amp; Pochola &bull; Documentaci&oacute;n T&eacute;cnica</p></div>
${bodyHtml}
<div class="footer">Generado autom&aacute;ticamente &bull; Proyecto Pachanga &bull; Marzo 2026</div>
</body>
</html>`;
}

// Ensure output dir exists
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

let ok = 0, fail = 0;
for (const file of filesToConvert) {
  const inputPath = path.join(baseDir, file.src);
  if (!fs.existsSync(inputPath)) {
    console.log('[SKIP] ' + file.src);
    fail++;
    continue;
  }
  try {
    const md = fs.readFileSync(inputPath, 'utf-8');
    const bodyHtml = mdToHtml(md);
    const title = file.name.replace(/^\d+_/, '').replace(/_/g, ' ');
    const fullHtml = wrapInDoc(title, bodyHtml);
    const outPath = path.join(outputDir, file.name + '.html');
    fs.writeFileSync(outPath, fullHtml, 'utf-8');
    console.log('[OK] ' + file.name + '.html');
    ok++;
  } catch (e) {
    console.log('[ERROR] ' + file.src + ': ' + e.message);
    fail++;
  }
}
console.log('\\nDone: ' + ok + ' OK, ' + fail + ' FAIL');
