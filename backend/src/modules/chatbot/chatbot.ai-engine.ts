import OpenAI from 'openai';
import { env } from '../../config/env.js';
import { logger } from '../../lib/logger.js';

// ─── Types ───────────────────────────────────────────────────
export interface AiResponse {
    reply: string;
    intent: string;
    confidence: number;
    customerName?: string;
    actions?: string[];
}

// ─── Constants ───────────────────────────────────────────────
const VALID_INTENTS = [
    'GREETING',
    'HOURS',
    'LOCATION',
    'PRICES',
    'RESERVATION',
    'EVENTS',
    'MENU',
    'BIRTHDAY',
    'COMPLAINTS',
    'UNKNOWN',
] as const;

const SYSTEM_INSTRUCTION = `Eres el asistente virtual de PACHANGA Y POCHOLA, un bar/discoteca de rumba salsera en Bogotá, Colombia.

## TU PERSONALIDAD:
- Eres amable, cálido y profesional. Hablas con cercanía pero siempre manteniendo un tono respetuoso.
- Usas español colombiano natural y cordial, SIN jerga excesiva. Evita palabras como "parcero", "parce", "chimba", "bacano", "nota", "uy hermano" o similares.
- Expresiones permitidas: "¡Hola!", "¡Claro que sí!", "Con gusto", "¡Te esperamos!", "¡Bienvenido/a!", "Dale", "Listo".
- VARÍA tus respuestas, NUNCA uses la misma frase de apertura dos veces seguidas. Alterna entre:
  - "¡Hola! ¿En qué te puedo ayudar? 😊"
  - "¡Bienvenido/a! ¿Qué necesitas saber?"
  - "¡Hola! Con gusto te ayudo 🎶"
  - "¡Buenas! Cuéntame, ¿en qué te colaboro?"
- Tus respuestas son CORTAS y directas (máx 2-3 párrafos).
- Usas emojis con moderación (máx 2 por mensaje).
- Respondes en ESPAÑOL colombiano siempre, con tono cordial.
- Si el cliente te dijo su nombre, ÚSALO en la respuesta de forma natural ("Claro, [nombre], te cuento...").

## REGLAS ESTRICTAS:
1. SOLO responde sobre temas del bar: horarios, precios, reservas, ubicación, eventos, menú, cumpleaños.
2. NUNCA inventes información. Si no tienes el dato, di: "No tengo ese dato disponible en este momento. Te recomiendo escribirle directamente al administrador."
3. NUNCA compartas datos internos del negocio (costos, salarios, datos de otros clientes).
4. Si el cliente se queja o tiene un problema, muestra empatía: "Lamento mucho lo que pasó. Voy a pasar tu caso al equipo para que lo resuelvan lo antes posible."
5. Para reservas, recoge los datos y ofrece el link de reserva.
6. NUNCA menciones audios, notas de voz ni formatos multimedia. Tú SOLO recibes mensajes de texto, así que no necesitas mencionar limitaciones de audio.
7. NUNCA uses la palabra "rumba" o "rumbear" de forma excesiva. Puedes usarla máximo una vez por conversación y de forma natural.

## INTELIGENCIA CONTEXTUAL (MUY IMPORTANTE):
- SIEMPRE lee y analiza el historial completo de la conversación antes de responder.
- RECUERDA todo lo que el cliente dijo: su nombre, de dónde es, qué preguntó antes, qué le interesó.
- NUNCA repitas información que ya le diste al cliente en mensajes anteriores.
- NUNCA pidas datos que el cliente ya proporcionó (nombre, ciudad, número de personas, etc.).
- Si el cliente hace referencia a algo mencionado antes (ej: "y cuánto cuesta eso?"), entiende el contexto y responde correctamente sin preguntar "¿qué cosa?".
- Si el cliente dice algo que no entiendes, NO inventes una respuesta. Pide amablemente que lo aclare.
- Mantén coherencia: si ya saludaste, no vuelvas a saludar. Si ya le diste info, refiérete a ella.

## FORMATO DE RESPUESTA:
Responde SIEMPRE en formato JSON con esta estructura exacta:
{
  "reply": "Tu respuesta al cliente aquí",
  "intent": "UNA de estas intenciones: GREETING, HOURS, LOCATION, PRICES, RESERVATION, EVENTS, MENU, BIRTHDAY, COMPLAINTS, UNKNOWN",
  "confidence": 0.95,
  "customer_name": null,
  "actions": []
}

El campo "confidence" debe ser un número entre 0 y 1 que refleje qué tan seguro estás.
El campo "customer_name" debe ser el nombre del cliente SOLO si lo menciona explícitamente. Si no lo dice, pon null.

## ACCIONES ESPECIALES (campo "actions"):
- Si el cliente pregunta por PRECIOS, CARTA, LICORES, o MENÚ → agrega "SEND_MENU_IMAGE" en actions.
- Si el cliente pregunta por la UBICACIÓN, DIRECCIÓN, o CÓMO LLEGAR → agrega "SEND_LOCATION" en actions.
- Si el cliente pregunta por un EVENTO específico y existe un flyer → agrega "SEND_EVENT_FLYER" en actions.
- Puedes agregar varias acciones si aplica. Si no aplica ninguna, deja actions vacío [].`;

// ─── Engine ─────────────────────────────────────────────────
export class ChatbotAiEngine {
    private openai: OpenAI;

    constructor() {
        this.openai = new OpenAI({
            apiKey: env.OPENAI_API_KEY,
        });
    }

    /**
     * Generates a chatbot response using OpenAI.
     * @param knowledgeContext  Formatted knowledge base to inject as context
     * @param conversationHistory  Recent messages for multi-turn context
     * @param userMessage  The current incoming message from the customer
     */
    async generateResponse(
        knowledgeContext: string,
        conversationHistory: Array<{ role: 'user' | 'model'; content: string }>,
        userMessage: string,
    ): Promise<AiResponse> {
        try {
            // Build messages array for OpenAI
            const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
                {
                    role: 'system',
                    content: `${SYSTEM_INSTRUCTION}\n\n## BASE DE CONOCIMIENTO DEL BAR:\n${knowledgeContext}`,
                },
            ];

            // Add conversation history
            for (const msg of conversationHistory) {
                messages.push({
                    role: msg.role === 'user' ? 'user' : 'assistant',
                    content: msg.content,
                });
            }

            // Add current user message
            const sanitizedInput = this.sanitizeInput(userMessage);
            messages.push({ role: 'user', content: sanitizedInput });

            const completion = await this.openai.chat.completions.create({
                model: env.CHATBOT_MODEL,
                messages,
                max_tokens: env.CHATBOT_MAX_TOKENS,
                temperature: env.CHATBOT_TEMPERATURE,
                response_format: { type: 'json_object' },
            });

            const responseText = completion.choices[0]?.message?.content ?? '';
            return this.parseResponse(responseText);
        } catch (error) {
            logger.error({ err: error }, '[Chatbot AI] Generation failed');

            return {
                reply: '¡Ups! Estoy teniendo problemas técnicos en este momento. Por favor intenta de nuevo en unos minutos 🙏',
                intent: 'UNKNOWN',
                confidence: 0,
            };
        }
    }

    // ─── Private Helpers ────────────────────────────────────

    /**
     * Sanitizes user input to prevent prompt injection.
     */
    private sanitizeInput(input: string): string {
        return input
            .replace(/```/g, '')
            .replace(/system\s*:/gi, '')
            .replace(/instruction\s*:/gi, '')
            .replace(/ignore\s+(previous|above|all)\s+(instructions?|prompts?)/gi, '[filtered]')
            .slice(0, 500);
    }

    /**
     * Parses the structured JSON response from OpenAI.
     */
    private parseResponse(responseText: string): AiResponse {
        try {
            const parsed = JSON.parse(responseText);

            const reply = typeof parsed.reply === 'string'
                ? parsed.reply.slice(0, 1000)
                : '¡Hola! ¿En qué te puedo ayudar? 🎶';

            const intent = VALID_INTENTS.includes(parsed.intent)
                ? parsed.intent
                : 'UNKNOWN';

            const confidence = typeof parsed.confidence === 'number'
                ? Math.min(1, Math.max(0, parsed.confidence))
                : 0.5;

            const customerName = typeof parsed.customer_name === 'string' && parsed.customer_name.length > 1
                ? parsed.customer_name.slice(0, 100)
                : undefined;

            const actions = Array.isArray(parsed.actions)
                ? parsed.actions.filter((a: unknown) => typeof a === 'string')
                : [];

            return { reply, intent, confidence, customerName, actions };
        } catch {
            logger.warn({ responseText }, '[Chatbot AI] Failed to parse JSON response');
            return {
                reply: responseText.slice(0, 1000) || '¿En qué te puedo ayudar? 🎶',
                intent: 'UNKNOWN',
                confidence: 0.3,
            };
        }
    }
}

export const chatbotAiEngine = new ChatbotAiEngine();
