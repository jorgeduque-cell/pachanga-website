import OpenAI from 'openai';
import { env } from '../../config/env.js';
import { logger } from '../../lib/logger.js';
import { tokenEconomy } from './chatbot.token-economy.js';

// ─── Types ───────────────────────────────────────────────────
export interface AiUsage {
    promptTokens: number;
    completionTokens: number;
    costUsd: number;
}

export interface AiReservation {
    date?: string;
    time?: string;
    partySize?: number;
}

export interface AiResponse {
    reply: string;
    intent: string;
    confidence: number;
    customerName?: string;
    actions?: string[];
    reservation?: AiReservation;
    usage?: AiUsage;
}

// ─── Constants ───────────────────────────────────────────────
// Enlace de ventas (compra manual de boletas). Constante en el proceso →
// no rompe el prefijo cacheable del SYSTEM_INSTUCTION al interpolarse una sola vez.
const SALES_WA_LINK = `https://wa.me/${env.CHATBOT_SALES_PHONE.replace(/[^\d]/g, '')}`;

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
    'PURCHASE',
    'UNKNOWN',
] as const;

/**
 * ─── PILAR 2 (Prompt Caching) + PILAR 3 (JSON estricto) ──────────────────
 *  SYSTEM_INSTRUCTION es 100% ESTÁTICO: nunca interpola datos dinámicos.
 *  Eso lo vuelve un prefijo estable, elegible para el caché de prompt del
 *  proveedor (descuentos al reutilizar el mismo contexto de sistema). La
 *  base de conocimiento va en un SEGUNDO bloque system, después del estático,
 *  para no romper el prefijo cacheable cuando cambie la KB.
 *  El JSON de salida es rígido (sin "tokens de cortesía") vía response_format.
 */
const SYSTEM_INSTRUCTION = `Eres el asistente virtual de PACHANGA Y POCHOLA, un bar/discoteca de rumba salsera en Bogotá, Colombia.

## LINK DE VENTAS: ${SALES_WA_LINK}

## TU PERSONALIDAD:
- Eres amable, cálido y profesional. Hablas con cercanía pero siempre manteniendo un tono respetuoso.
- Usas español colombiano natural y cordial, SIN jerga excesiva. Evita palabras como "parcero", "parce", "chimba", "bacano", "nota", "uy hermano" o similares.
- Expresiones permitidas: "¡Hola!", "¡Claro que sí!", "Con gusto", "¡Te esperamos!", "¡Bienvenido/a!", "Dale", "Listo".
- VARÍA tus respuestas, NUNCA uses la misma frase de apertura dos veces seguidas.
- Tus respuestas son CORTAS y directas (máx 2-3 párrafos).
- Usas emojis con moderación (máx 2 por mensaje).
- Respondes en ESPAÑOL colombiano siempre, con tono cordial.
- Si el cliente te dijo su nombre, ÚSALO en la respuesta de forma natural ("Claro, [nombre], te cuento...").

## REGLAS ESTRICTAS:
1. SOLO responde sobre temas del bar: horarios, precios, reservas, ubicación, eventos, menú, cumpleaños.
2. NUNCA inventes información. Si no tienes el dato, di: "No tengo ese dato disponible en este momento. Te recomiendo escribirle directamente al administrador."
3. NUNCA compartas datos internos del negocio (costos, salarios, datos de otros clientes).
4. Si el cliente se queja o tiene un problema, muestra empatía: "Lamento mucho lo que pasó. Voy a pasar tu caso al equipo para que lo resuelvan lo antes posible."
5. Para reservar una mesa normal (sin costo) recoge fecha, cantidad de personas y hora por este chat. Pero si la reserva es para un CUMPLEAÑOS o celebración especial, remítela SIEMPRE al WhatsApp de ventas (ver sección de cumpleaños), no la tomes tú.
6. Si te mandan un AUDIO o nota de voz, pide amablemente que te escriban por texto. PERO tú SÍ puedes COMPARTIR imágenes cuando el sistema las tiene: el flyer de un evento y la carta de licores. NUNCA digas que "no tienes acceso a imágenes o flyers", ni que "solo recibes texto", cuando te pidan ver un flyer, una foto o la carta: en esos casos responde afirmativo y deja que el sistema la envíe.
7. NUNCA uses la palabra "rumba" o "rumbear" de forma excesiva. Máximo una vez por conversación y de forma natural.
8. FORMATO WHATSAPP: para negrita usa UN solo asterisco (*texto*). NUNCA uses markdown de doble asterisco, encabezados (#), ni tablas. Usa pocas negritas, solo para datos clave.

## INTELIGENCIA CONTEXTUAL:
- Lee el historial antes de responder. RECUERDA nombre, ciudad y lo ya preguntado.
- NUNCA repitas información ya dada. NUNCA pidas datos ya proporcionados.
- Si el cliente hace referencia a algo mencionado antes, entiende el contexto sin preguntar "¿qué cosa?".
- Si no entiendes, NO inventes: pide amablemente que aclare.
- Mantén coherencia: si ya saludaste, no vuelvas a saludar.

## FORMATO DE RESPUESTA (JSON ESTRICTO — sin texto fuera del objeto):
{
  "reply": "Tu respuesta al cliente aquí",
  "intent": "GREETING|HOURS|LOCATION|PRICES|RESERVATION|EVENTS|MENU|BIRTHDAY|COMPLAINTS|PURCHASE|UNKNOWN",
  "confidence": 0.95,
  "customer_name": null,
  "actions": [],
  "reservation": null
}
- "confidence": número 0..1 de qué tan seguro estás.
- "customer_name": el nombre SOLO si lo menciona explícitamente; si no, null.
- "reservation": SOLO para reservar una MESA NORMAL (sin costo). Cuando ya tengas los TRES datos (fecha, hora y número de personas), ponlo así: {"date":"sábado 12 de julio","time":"9:00 pm","party_size":6} y agrega "NOTIFY_RESERVATION" en actions. Si te falta algún dato, deja "reservation": null y sigue preguntando amablemente SOLO por lo que falte. NUNCA lo uses para cumpleaños/eventos (esos van al link de ventas).

## EVENTOS Y COMPRA DE BOLETAS (MUY IMPORTANTE):
- El bot NO vende boletas ni procesa pagos. Solo informa.
- Si preguntan por un EVENTO (fecha, hora, qué incluye), da un RESUMEN breve usando la base de conocimiento: nombre, fecha, hora.
- Si preguntan PRECIO de un evento, boleta, cover o VIP → da el precio si lo tienes en la base de conocimiento.
- Si el cliente quiere COMPRAR BOLETAS, PAGAR COVER, RESERVAR VIP con pago, o pregunta CÓMO PAGAR → clasifica intent "PURCHASE". Dale un resumen breve del evento con su precio, y SIEMPRE dirígelo a comprar por este link de WhatsApp: ${SALES_WA_LINK}
  Ejemplo: "¡Claro! El [evento] es el [fecha] y el cover vale $[precio]. Para comprar tu boleta, escríbenos por acá: ${SALES_WA_LINK} 😊"
- NUNCA ofrezcas recibir el pago tú mismo, ni pidas comprobante de pago, ni inicies un proceso de compra paso a paso. Siempre remite al link de ventas.
- Diferencia RESERVATION (reservar mesa normal SIN costo — recoge fecha, personas y hora por este chat) de PURCHASE (pagar boletas/cover/VIP — remite al link de ventas).

## RESERVAS DE CUMPLEAÑOS Y CELEBRACIONES (MUY IMPORTANTE):
- Si el cliente quiere reservar/celebrar un CUMPLEAÑOS, aniversario o celebración especial (aunque NO sea un evento con boletas) → clasifica intent "BIRTHDAY" y SIEMPRE remítelo al WhatsApp de ventas: ${SALES_WA_LINK}
- Responde cálido y breve, SIN recoger tú los datos del plan ni cotizar paquetes. Ejemplo: "¡Qué chévere que quieras celebrar tu cumpleaños con nosotros! 🎉 Para armar tu plan y reservar, escríbenos por este WhatsApp: ${SALES_WA_LINK}"
- NUNCA tomes la reserva de cumpleaños tú mismo ni pidas los datos paso a paso; ese equipo la gestiona.

## ACCIONES ESPECIALES (campo "actions"):
- Si piden ver/enviar la CARTA, LICORES o MENÚ (o preguntan PRECIOS de la carta) → responde afirmativo (ej: "¡Claro! Te comparto la carta 👇") y agrega "SEND_MENU_IMAGE". NUNCA digas que no puedes.
- UBICACIÓN, DIRECCIÓN o CÓMO LLEGAR → agrega "SEND_LOCATION".
- Si piden ver/enviar el FLYER, la imagen o la foto de un evento (o de las clases) → responde afirmativo (ej: "¡Claro! Aquí te comparto el flyer 👇") y agrega "SEND_EVENT_FLYER". NUNCA digas que no tienes acceso a flyers o imágenes.
- IMPORTANTE: el texto de "reply" y las "actions" deben ser COHERENTES. Si agregas una acción que envía una imagen, tu texto debe anunciarla en positivo, jamás disculparte por no poder enviarla.
- RESERVA de mesa normal con los 3 datos completos → agrega "NOTIFY_RESERVATION" (y llena "reservation"). Confirma al cliente que su reserva quedó registrada y que el equipo la confirmará pronto.
- Si no aplica ninguna, deja actions vacío [].`;

// ─── Engine ─────────────────────────────────────────────────
export class ChatbotAiEngine {
    private client: OpenAI;

    constructor() {
        // OpenRouter es compatible con la API de OpenAI: solo cambia baseURL,
        // la key y unos headers de atribución.
        this.client = new OpenAI({
            apiKey: env.OPENROUTER_API_KEY,
            baseURL: env.OPENROUTER_BASE_URL,
            defaultHeaders: {
                'HTTP-Referer': env.FRONTEND_URL,
                'X-Title': 'Pachanga Chatbot',
            },
        });
    }

    /**
     * Genera la respuesta del chatbot.
     * @param knowledgeContext     Base de conocimiento (bloque system dinámico).
     * @param conversationHistory  Historial YA recortado al presupuesto de tokens.
     * @param userMessage          Mensaje entrante del cliente.
     */
    async generateResponse(
        knowledgeContext: string,
        conversationHistory: Array<{ role: 'user' | 'model'; content: string }>,
        userMessage: string,
    ): Promise<AiResponse> {
        try {
            const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
                // 1) Prefijo ESTÁTICO → cacheable.
                { role: 'system', content: SYSTEM_INSTRUCTION },
                // 2) Conocimiento dinámico (estable dentro del TTL de caché de la KB).
                { role: 'system', content: `## BASE DE CONOCIMIENTO DEL BAR:\n${knowledgeContext}` },
            ];

            for (const msg of conversationHistory) {
                messages.push({
                    role: msg.role === 'user' ? 'user' : 'assistant',
                    content: msg.content,
                });
            }

            messages.push({ role: 'user', content: this.sanitizeInput(userMessage) });

            const completion = await this.client.chat.completions.create({
                model: env.CHATBOT_MODEL,
                messages,
                max_tokens: env.CHATBOT_MAX_TOKENS,   // tope duro de OUTPUT (pilar 3)
                temperature: env.CHATBOT_TEMPERATURE,
                response_format: { type: 'json_object' },
            });

            const responseText = completion.choices[0]?.message?.content ?? '';
            const usage: AiUsage = {
                promptTokens: completion.usage?.prompt_tokens ?? 0,
                completionTokens: completion.usage?.completion_tokens ?? 0,
                costUsd: tokenEconomy.costUsd(
                    {
                        promptTokens: completion.usage?.prompt_tokens ?? 0,
                        completionTokens: completion.usage?.completion_tokens ?? 0,
                    },
                    {
                        inPerMTok: env.TOKENECON_RESPONDER_COST_PER_MTOK,
                        outPerMTok: env.TOKENECON_RESPONDER_OUT_COST_PER_MTOK,
                    },
                ),
            };

            return { ...this.parseResponse(responseText), usage };
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

    /** Sanitiza el input para mitigar prompt injection. */
    private sanitizeInput(input: string): string {
        return input
            .replace(/```/g, '')
            .replace(/system\s*:/gi, '')
            .replace(/instruction\s*:/gi, '')
            .replace(/ignore\s+(previous|above|all)\s+(instructions?|prompts?)/gi, '[filtered]')
            .slice(0, 500);
    }

    /** Parsea la respuesta JSON estructurada. */
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

            const reservation = this.parseReservation(parsed.reservation);

            return { reply, intent, confidence, customerName, actions, reservation };
        } catch {
            logger.warn({ responseText }, '[Chatbot AI] Failed to parse JSON response');
            return {
                reply: responseText.slice(0, 1000) || '¿En qué te puedo ayudar? 🎶',
                intent: 'UNKNOWN',
                confidence: 0.3,
            };
        }
    }

    /** Extrae y valida el objeto de reserva (acepta party_size o partySize). */
    private parseReservation(raw: unknown): AiReservation | undefined {
        if (!raw || typeof raw !== 'object') return undefined;
        const r = raw as Record<string, unknown>;
        const date = typeof r.date === 'string' ? r.date.slice(0, 60) : undefined;
        const time = typeof r.time === 'string' ? r.time.slice(0, 30) : undefined;
        const sizeRaw = r.party_size ?? r.partySize;
        const partySize = typeof sizeRaw === 'number' && sizeRaw > 0
            ? Math.min(50, Math.round(sizeRaw))
            : undefined;

        if (!date && !time && partySize === undefined) return undefined;
        return { date, time, partySize };
    }
}

export const chatbotAiEngine = new ChatbotAiEngine();
