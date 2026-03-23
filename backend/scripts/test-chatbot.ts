/**
 * Test script para probar el chatbot localmente con OpenAI.
 * Simula el flujo completo: mensaje entrante → IA → respuesta.
 *
 * Uso: npx tsx scripts/test-chatbot.ts "¿A qué hora abren los viernes?"
 */
import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function testChatbot(userMessage: string): Promise<void> {
    console.log('\n🤖 ═══════════════════════════════════════════');
    console.log('   TEST CHATBOT PACHANGA — OpenAI');
    console.log('═══════════════════════════════════════════════\n');

    // 1. Verificar API Key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        console.error('❌ OPENAI_API_KEY no está en .env');
        process.exit(1);
    }
    console.log('✅ OPENAI_API_KEY configurada');

    // 2. Verificar conexión BD
    try {
        await prisma.$queryRaw`SELECT 1`;
        console.log('✅ Conexión a BD OK');
    } catch (error) {
        console.error('❌ No se pudo conectar a la BD:', (error as Error).message);
        process.exit(1);
    }

    // 3. Cargar Knowledge Base
    const knowledge = await prisma.chatbotKnowledge.findMany({
        where: { isActive: true },
        orderBy: [{ category: 'asc' }, { key: 'asc' }],
    });
    console.log(`✅ Knowledge Base cargada: ${knowledge.length} entradas`);

    // Formatear KB para el prompt
    const grouped = new Map<string, Array<{ key: string; value: string }>>();
    for (const entry of knowledge) {
        const list = grouped.get(entry.category) ?? [];
        list.push({ key: entry.key, value: entry.value });
        grouped.set(entry.category, list);
    }
    let kbText = '';
    for (const [category, items] of grouped) {
        kbText += `### ${category.toUpperCase()}\n`;
        for (const item of items) {
            kbText += `- **${item.key}:** ${item.value}\n`;
        }
        kbText += '\n';
    }

    // 4. Llamar a OpenAI
    console.log(`\n📩 Mensaje del cliente: "${userMessage}"\n`);
    console.log('⏳ Enviando a OpenAI...\n');

    const SYSTEM_INSTRUCTION = `Eres el asistente virtual de PACHANGA Y POCHOLA, un bar/discoteca en Colombia.

## TU PERSONALIDAD:
- Eres amigable, informal y energético (tuteo colombiano).
- Usas emojis con moderación (máx 3 por mensaje).
- Tu tono es de fiesta y rumba, pero profesional.
- Respondes en ESPAÑOL siempre.
- Tus respuestas son CORTAS y directas (máximo 3 párrafos).

## REGLAS ESTRICTAS:
1. SOLO responde sobre temas del bar: horarios, precios, reservas, ubicación, eventos, menú, cumpleaños.
2. NUNCA inventes información. Si no tienes el dato en la base de conocimiento, di que no lo sabes.
3. NUNCA compartas datos internos del negocio (costos, salarios, datos de otros clientes).
4. Si el cliente se queja o tiene un problema, muestra empatía y ofrece escalar al equipo.
5. Para reservas, recoge los datos y ofrece el link de reserva.

## FORMATO DE RESPUESTA:
Responde SIEMPRE en formato JSON con esta estructura exacta:
{
  "reply": "Tu respuesta al cliente aquí",
  "intent": "UNA de estas intenciones: GREETING, HOURS, LOCATION, PRICES, RESERVATION, EVENTS, MENU, BIRTHDAY, COMPLAINTS, UNKNOWN",
  "confidence": 0.95
}

El campo "confidence" debe ser un número entre 0 y 1.

## BASE DE CONOCIMIENTO DEL BAR:
${kbText}`;

    const openai = new OpenAI({ apiKey });
    const model = process.env.CHATBOT_MODEL || 'gpt-4o-mini';

    const startTime = Date.now();
    const completion = await openai.chat.completions.create({
        model,
        messages: [
            { role: 'system', content: SYSTEM_INSTRUCTION },
            { role: 'user', content: userMessage },
        ],
        max_tokens: 500,
        temperature: 0.7,
        response_format: { type: 'json_object' },
    });
    const elapsed = Date.now() - startTime;

    const responseText = completion.choices[0]?.message?.content ?? '';

    // 5. Mostrar resultado
    try {
        const parsed = JSON.parse(responseText);
        console.log('═══════════════════════════════════════════════');
        console.log('📤 RESPUESTA DEL BOT:');
        console.log('═══════════════════════════════════════════════');
        console.log(`\n💬 ${parsed.reply}\n`);
        console.log(`🎯 Intención: ${parsed.intent}`);
        console.log(`📊 Confianza: ${(parsed.confidence * 100).toFixed(0)}%`);
        console.log(`⏱️  Tiempo: ${elapsed}ms`);
        console.log(`🧠 Modelo: ${model}`);
        console.log(`💰 Tokens: ${completion.usage?.total_tokens ?? 'N/A'}`);
        console.log(`\n✅ ¡El chatbot funciona correctamente!`);

        if (parsed.confidence < 0.7) {
            console.log('⚠️  Confianza baja — esta pregunta se escalaría a un humano.');
        }
    } catch {
        console.log('⚠️  Respuesta raw (no JSON):', responseText);
    }
}

// ─── Main ───────────────────────────────────────────────────
const message = process.argv[2] || 'Hola, ¿a qué hora abren los viernes?';

testChatbot(message)
    .catch((err) => {
        console.error('❌ Error:', err.message);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
