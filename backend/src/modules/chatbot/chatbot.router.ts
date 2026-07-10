import OpenAI from 'openai';
import { env } from '../../config/env.js';
import { logger } from '../../lib/logger.js';
import { tokenEconomy } from './chatbot.token-economy.js';

/**
 * ═══════════════════════════════════════════════════════════════════════
 *  PILAR 1 — ENRUTAMIENTO DE MODELOS  (clasificar barato, responder caro)
 * ───────────────────────────────────────────────────────────────────────
 *  Antes de gastar el modelo respondedor + toda la base de conocimiento +
 *  historial, un modelo ULTRA-económico (flash-lite) hace triage en UNA
 *  llamada diminuta con salida JSON estricta:
 *
 *    · GREETING / SMALLTALK / THANKS / BYE → se responde con plantilla,
 *      el respondedor NUNCA se invoca  (deflexión = máximo ahorro).
 *    · OFF_TOPIC / SPAM                    → respuesta canned de redirección.
 *    · SUBSTANTIVE                         → escala al respondedor con el
 *      presupuesto de memoria calculado por TokenEconomy.
 *
 *  El costo del triage (~40-80 tokens salida) es despreciable frente a
 *  inyectar la KB completa en cada "hola/gracias". Se puede apagar con
 *  TOKENECON_ROUTER_ENABLED=false.
 * ═══════════════════════════════════════════════════════════════════════
 */

export type TriageDecision = 'ANSWER' | 'DISMISS' | 'ESCALATE';

export interface TriageResult {
    decision: TriageDecision;
    /** Categoría cruda del router (para métricas). */
    category: string;
    /** Respuesta lista para enviar cuando decision !== 'ESCALATE'. */
    reply?: string;
    usage: { promptTokens: number; completionTokens: number };
    costUsd: number;
}

// Prompt de sistema ESTÁTICO → prefijo estable = elegible para prompt caching.
const ROUTER_SYSTEM = `Eres un clasificador de mensajes para el chatbot de un bar/discoteca en Bogotá.
Clasifica el ÚLTIMO mensaje del cliente en UNA categoría y responde SOLO JSON:
{"category":"GREETING|SMALLTALK|THANKS|BYE|OFF_TOPIC|SPAM|SUBSTANTIVE"}

Reglas:
- GREETING: saludos sin pregunta ("hola", "buenas", "qué más").
- SMALLTALK: charla trivial sin intención de negocio ("cómo estás", "jaja").
- THANKS: agradecimientos ("gracias", "listo", "vale").
- BYE: despedidas ("chao", "hasta luego").
- OFF_TOPIC: temas ajenos al bar (política, otros negocios, pedir plata).
- SPAM: publicidad, links sospechosos, insultos, texto sin sentido.
- SUBSTANTIVE: CUALQUIER consulta real del negocio (horarios, precios, reservas,
  ubicación, eventos, menú, cumpleaños, comprar boletas, quejas). Ante la duda,
  usa SUBSTANTIVE: es preferible escalar de más que dejar sin responder.
No expliques. Solo el JSON.`;

// Plantillas deterministas (0 tokens de IA) para lo que el router deflecta.
const TEMPLATES: Record<string, string[]> = {
    GREETING: [
        '¡Hola! 😊 ¿En qué te puedo ayudar? Puedo contarte de horarios, eventos, reservas o la carta.',
        '¡Buenas! 🎶 Cuéntame, ¿qué necesitas saber?',
        '¡Bienvenido/a! ¿Qué información buscas hoy?',
    ],
    SMALLTALK: [
        '¡Todo bien por acá! 😊 ¿En qué te colaboro? Puedo ayudarte con eventos, reservas o la carta.',
    ],
    THANKS: [
        '¡Con gusto! 🙌 Si necesitas algo más, aquí estoy.',
        '¡A la orden! Cuando quieras te ayudo con reservas o eventos. 🎶',
    ],
    BYE: [
        '¡Hasta pronto! 👋 Te esperamos en Pachanga y Pochola.',
    ],
    OFF_TOPIC: [
        'Por aquí solo te ayudo con temas del bar: horarios, eventos, reservas, ubicación y carta. ¿Te muestro algo de eso? 😊',
    ],
    SPAM: [
        'Solo puedo ayudarte con información del bar (horarios, eventos, reservas, carta). ¿Qué te gustaría saber? 😊',
    ],
};

const DEFLECT_MAP: Record<string, TriageDecision> = {
    GREETING: 'ANSWER',
    SMALLTALK: 'ANSWER',
    THANKS: 'ANSWER',
    BYE: 'ANSWER',
    OFF_TOPIC: 'DISMISS',
    SPAM: 'DISMISS',
    SUBSTANTIVE: 'ESCALATE',
};

function pick(list: string[]): string {
    return list[Math.floor(Math.random() * list.length)];
}

// Todas las plantillas canned, para poder EXCLUIRLAS del historial que se le
// pasa al respondedor: si quedan en contexto, el modelo tiende a repetirlas
// como loro ante mensajes cortos ("dejame ver el flyer" → rechazo genérico).
const ALL_TEMPLATES = new Set(Object.values(TEMPLATES).flat());

/** ¿Este contenido es (o copia) una plantilla canned del router? */
export function isCannedReply(content: string): boolean {
    return ALL_TEMPLATES.has(content)
        || content.startsWith('Por aquí solo te ayudo con temas del bar')
        || content.startsWith('Solo puedo ayudarte con información del bar');
}

export class ChatbotRouter {
    private client: OpenAI;

    constructor() {
        this.client = new OpenAI({
            apiKey: env.OPENROUTER_API_KEY,
            baseURL: env.OPENROUTER_BASE_URL,
            defaultHeaders: {
                'HTTP-Referer': env.FRONTEND_URL,
                'X-Title': 'Pachanga Chatbot Router',
            },
        });
    }

    /**
     * Triage barato. Nunca lanza: ante error, escala (fail-safe) para no
     * dejar a un cliente real sin respuesta por una caída del clasificador.
     */
    async triage(userMessage: string): Promise<TriageResult> {
        if (env.TOKENECON_ROUTER_ENABLED !== 'true') {
            return this.escalateFallback('router_disabled');
        }

        try {
            const completion = await this.client.chat.completions.create({
                model: env.CHATBOT_ROUTER_MODEL,
                messages: [
                    { role: 'system', content: ROUTER_SYSTEM },
                    { role: 'user', content: userMessage.slice(0, 300) },
                ],
                max_tokens: 20,          // salida diminuta: solo {"category":"..."}
                temperature: 0,          // clasificación determinista
                response_format: { type: 'json_object' },
            });

            const raw = completion.choices[0]?.message?.content ?? '{}';
            const category = String(JSON.parse(raw).category ?? 'SUBSTANTIVE').toUpperCase();
            const decision = DEFLECT_MAP[category] ?? 'ESCALATE';

            const usage = {
                promptTokens: completion.usage?.prompt_tokens ?? 0,
                completionTokens: completion.usage?.completion_tokens ?? 0,
            };
            const costUsd = tokenEconomy.costUsd(usage, {
                inPerMTok: env.TOKENECON_ROUTER_COST_PER_MTOK,
                outPerMTok: env.TOKENECON_ROUTER_OUT_COST_PER_MTOK,
            });

            const reply = decision === 'ESCALATE'
                ? undefined
                : pick(TEMPLATES[category] ?? TEMPLATES.GREETING);

            logger.info({ category, decision, costUsd }, '[Chatbot Router] triage');
            return { decision, category, reply, usage, costUsd };
        } catch (error) {
            logger.error({ err: error }, '[Chatbot Router] triage failed — escalating');
            return this.escalateFallback('router_error');
        }
    }

    private escalateFallback(category: string): TriageResult {
        return {
            decision: 'ESCALATE',
            category,
            usage: { promptTokens: 0, completionTokens: 0 },
            costUsd: 0,
        };
    }
}

export const chatbotRouter = new ChatbotRouter();
