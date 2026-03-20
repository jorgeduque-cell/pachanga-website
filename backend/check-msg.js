// Run from backend dir: node check-msg.js
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.whatsAppMessage.findMany({ orderBy: { createdAt: 'desc' }, take: 3, include: { customer: { select: { name: true, phone: true } } } })
  .then(msgs => {
    msgs.forEach(m => console.log(`${m.templateName} | status: ${m.status} | error: ${m.errorCode || 'NONE'} | waId: ${m.waMessageId || 'NULL'} | phone: ${m.customer.phone}`));
    return p.$disconnect();
  })
  .catch(e => { console.error(e); p.$disconnect(); });
