import OpenAI from 'openai';
import { env } from '../../config/env.js';
import { logger } from '../../lib/logger.js';

// ─── Types ───────────────────────────────────────────────────
export interface AiResponse {
    reply: string;
    intent: string;
    confidence: number;
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

El campo "confidence" debe ser un número entre 0 y 1 que refleje qué tan seguro estás de haber entendido correctamente la pregunta y de tener la información para responderla.`;

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

            return { reply, intent, confidence };
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
