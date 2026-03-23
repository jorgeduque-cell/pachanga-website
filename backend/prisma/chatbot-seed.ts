import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seeds the ChatbotKnowledge table with initial business data for Pachanga.
 * Run with: npx tsx prisma/chatbot-seed.ts
 */
async function seedChatbotKnowledge(): Promise<void> {
    console.log('🤖 Seeding chatbot knowledge base...');

    const entries = [
        // ─── Horarios ───────────────────────────────────────
        { category: 'horarios', key: 'lunes_a_miercoles', value: 'Cerrado' },
        { category: 'horarios', key: 'jueves', value: 'Abierto de 8:00 PM a 2:00 AM' },
        { category: 'horarios', key: 'viernes', value: 'Abierto de 8:00 PM a 3:00 AM' },
        { category: 'horarios', key: 'sabado', value: 'Abierto de 8:00 PM a 3:00 AM' },
        { category: 'horarios', key: 'domingo', value: 'Cerrado (excepto eventos especiales)' },

        // ─── Ubicación ──────────────────────────────────────
        { category: 'ubicacion', key: 'direccion', value: 'Pachanga y Pochola - Bucaramanga, Colombia' },
        { category: 'ubicacion', key: 'google_maps', value: 'https://maps.google.com/?q=Pachanga+y+Pochola+Bucaramanga' },
        { category: 'ubicacion', key: 'referencia', value: 'Pregunta al llegar por la dirección exacta' },

        // ─── Precios ────────────────────────────────────────
        { category: 'precios', key: 'cover_general', value: 'El cover varía según el evento. Consulta nuestras redes sociales para información actualizada.' },
        { category: 'precios', key: 'reservas', value: 'Las reservas son gratuitas. Solo se cobra el consumo mínimo según la zona.' },
        { category: 'precios', key: 'botellas', value: 'Tenemos variedad de licores nacionales e importados. Consulta el menú en el local.' },

        // ─── Reservas ───────────────────────────────────────
        { category: 'reservas', key: 'como_reservar', value: 'Puedes reservar a través de nuestra página web: https://pachanga-website.vercel.app' },
        { category: 'reservas', key: 'capacidad_minima', value: 'Se recomienda un mínimo de 4 personas por reserva.' },
        { category: 'reservas', key: 'zonas', value: 'Tenemos zonas: Salón, Terraza, VIP, Barra y Pista. Cada zona tiene diferente capacidad.' },
        { category: 'reservas', key: 'politica_cancelacion', value: 'Puedes cancelar tu reserva hasta 2 horas antes sin penalización.' },

        // ─── Cumpleaños ─────────────────────────────────────
        { category: 'cumpleanos', key: 'promo_cumpleanos', value: '¡En tu cumpleaños te regalamos una BOTELLA si vienes con 4 o más amigos! Solo aplica el día de tu cumpleaños.' },
        { category: 'cumpleanos', key: 'como_aplicar', value: 'Reserva mencionando que es tu cumpleaños y presenta tu cédula al llegar.' },

        // ─── General ────────────────────────────────────────
        { category: 'general', key: 'edad_minima', value: 'Mayores de 18 años con cédula.' },
        { category: 'general', key: 'dress_code', value: 'Casual elegante. No se permite ingreso con chanclas, bermudas o camisilla.' },
        { category: 'general', key: 'musica', value: 'Música variada: reggaetón, electrónica, crossover, vallenato y más. DJ en vivo los viernes y sábados.' },
        { category: 'general', key: 'parqueadero', value: 'No contamos con parqueadero propio, pero hay parqueaderos cercanos.' },
        { category: 'general', key: 'contacto_redes', value: 'Síguenos en Instagram: @pachangaypochola para eventos, promos y más.' },

        // ─── Eventos ────────────────────────────────────────
        { category: 'eventos', key: 'frecuencia', value: 'Tenemos eventos especiales cada viernes y sábado con DJs invitados.' },
        { category: 'eventos', key: 'donde_ver', value: 'Revisa nuestras redes sociales (@pachangaypochola en Instagram) para ver los próximos eventos.' },
    ];

    for (const entry of entries) {
        await prisma.chatbotKnowledge.upsert({
            where: {
                category_key: {
                    category: entry.category,
                    key: entry.key,
                },
            },
            update: { value: entry.value },
            create: entry,
        });
    }

    console.log(`✅ ${entries.length} knowledge entries seeded successfully.`);
}

seedChatbotKnowledge()
    .catch((error) => {
        console.error('❌ Seed failed:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
