-- ═════════════════════════════════════════════════════════════
-- PACHANGA Y POCHOLA — Knowledge Base Update
-- Run this in Supabase SQL Editor
-- ═════════════════════════════════════════════════════════════

-- 1. Clear existing entries
DELETE FROM chatbot_knowledge;

-- 2. HORARIOS
INSERT INTO chatbot_knowledge (id, category, key, value, is_active, updated_at)
VALUES (
  gen_random_uuid(), 'HOURS', 'horarios_apertura',
  'Pachanga y Pochola abre de JUEVES a VIERNES de 6:00 PM a 3:00 AM. ¡Dos noches de pura rumba!',
  true, NOW()
);

-- 3. UBICACIÓN
INSERT INTO chatbot_knowledge (id, category, key, value, is_active, updated_at)
VALUES (
  gen_random_uuid(), 'LOCATION', 'direccion',
  'Estamos ubicados en la Calle 73 #14-53, Bogotá. Puedes encontrarnos fácilmente en Google Maps: https://maps.google.com/?q=Calle+73+%2314-53+Bogota',
  true, NOW()
);

-- 4. WHISKY
INSERT INTO chatbot_knowledge (id, category, key, value, is_active, updated_at)
VALUES (
  gen_random_uuid(), 'MENU', 'whisky',
  'WHISKY BLENDED SCOTCH:
• Whisky Buchanans 18 Years — $620.000
• Old Parr 18 Years — $620.000
• Buchanans Master — $380.000
• Whisky Buchanans Two Souls — $380.000
• Buchanans 12 Años Botella — $300.000
• Buchanans 12 Media — $180.000
• Old Parr 12 Botella — $320.000
• Old Parr 12 Media — $200.000
• JW Double Black — $360.000
• JW Sello Negro — $320.000
• JW Sello Rojo — $220.000
MALTS:
• Glenlivet Founders — $380.000
• Monkey Shoulder — $320.000',
  true, NOW()
);

-- 5. TEQUILA
INSERT INTO chatbot_knowledge (id, category, key, value, is_active, updated_at)
VALUES (
  gen_random_uuid(), 'MENU', 'tequila',
  'TEQUILA:
• Don Julio 70 — $750.000
• Tequila Maestro Dobel — $560.000
• Reserva Don Julio Reposado — $500.000
• Tequila Jimador Reposado — $240.000',
  true, NOW()
);

-- 6. VODKA & GIN
INSERT INTO chatbot_knowledge (id, category, key, value, is_active, updated_at)
VALUES (
  gen_random_uuid(), 'MENU', 'vodka_gin',
  'VODKA & GIN:
• Smirnoff Tradicional — $260.000
• Vodka Absolut — $250.000
• Gordons Dry Gin — $220.000
• Smirnoff Tamarindo — $200.000',
  true, NOW()
);

-- 7. RON
INSERT INTO chatbot_knowledge (id, category, key, value, is_active, updated_at)
VALUES (
  gen_random_uuid(), 'MENU', 'ron',
  'RON:
• Caldas 8 Años Botella — $220.000
• Caldas 8 Años Media — $120.000
• Caldas 3 Años Botella — $180.000
• Caldas Esencial Botella — $160.000',
  true, NOW()
);

-- 8. AGUARDIENTE
INSERT INTO chatbot_knowledge (id, category, key, value, is_active, updated_at)
VALUES (
  gen_random_uuid(), 'MENU', 'aguardiente',
  'AGUARDIENTE:
• Amarillo de Manzanares — $180.000
• Antioqueño Azul — $160.000
• Antioqueño Verde — $160.000',
  true, NOW()
);

-- 9. VICHE
INSERT INTO chatbot_knowledge (id, category, key, value, is_active, updated_at)
VALUES (
  gen_random_uuid(), 'MENU', 'viche',
  'VICHE:
• Botella — $150.000
• Media — $80.000',
  true, NOW()
);

-- 10. SOFT DRINKS
INSERT INTO chatbot_knowledge (id, category, key, value, is_active, updated_at)
VALUES (
  gen_random_uuid(), 'MENU', 'bebidas',
  'BEBIDAS / SOFT DRINKS:
• Erdinger Weissbier 500ml — $30.000
• Peroni / Corona — $18.000
• Smirnoff Ice — $15.000
• Electrolit — $25.000
• Red Bull — $20.000
• Gatorade — $12.000
• Agua Cristal — $8.000
• Soda / Ginger Ale — $8.000
• Coca Cola 400ml — $8.000',
  true, NOW()
);

-- 11. RESERVAS / VENUE
INSERT INTO chatbot_knowledge (id, category, key, value, is_active, updated_at)
VALUES (
  gen_random_uuid(), 'RESERVATION', 'info_venue',
  'Pachanga y Pochola cuenta con 2 pisos, capacidad para poco más de 400 personas, el mejor sonido de la zona y música con enfoque salsero. Para reservar, puedes hacerlo a través de nuestra página web o directamente en este chat. ¡Te esperamos!',
  true, NOW()
);

-- 12. CUMPLEAÑOS
INSERT INTO chatbot_knowledge (id, category, key, value, is_active, updated_at)
VALUES (
  gen_random_uuid(), 'BIRTHDAY', 'celebracion_cumple',
  '¡En Pachanga y Pochola celebramos tu cumpleaños a lo grande! 🎂 Compartimos una TORTA DE CUMPLEAÑOS GRATIS a la medianoche para el cumpleañero. Solo necesitas reservar y decirnos que es tu cumple.',
  true, NOW()
);

-- 13. SOBRE NOSOTROS
INSERT INTO chatbot_knowledge (id, category, key, value, is_active, updated_at)
VALUES (
  gen_random_uuid(), 'EVENTS', 'sobre_nosotros',
  'Pachanga y Pochola es el mejor bar/discoteca de rumba salsera en Bogotá. Ubicados en la Calle 73 #14-53, contamos con 2 pisos, capacidad para 400+ personas, y el mejor sonido. Abrimos jueves y viernes de 6PM a 3AM.',
  true, NOW()
);
