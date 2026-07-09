import { env } from '../../config/env.js';

/**
 * ═══════════════════════════════════════════════════════════════════════
 *  SISTEMA INTERNO DE ECONOMÍA DE TOKENS  (Optimización por Cálculo)
 * ───────────────────────────────────────────────────────────────────────
 *  Decide, con cálculo diferencial en vez de "a ojo", cuánta MEMORIA
 *  (tokens de historial) darle al agente para que sea rentable.
 *
 *  Función de costo total por request:
 *
 *        CT(x) = c·x + k/x
 *
 *          x  = tokens de contexto/memoria que recibe el agente
 *          c  = costo marginal por token de ENTRADA        (USD / token)
 *          k  = costo esperado del error, que DECRECE con más memoria
 *               k = p_ref · x_ref · C_error
 *                 p_ref   = tasa de error observada con x_ref tokens (0..1)
 *                 x_ref   = tamaño de contexto donde se midió p_ref
 *                 C_error = costo en USD de corregir UN error (tiempo analista)
 *
 *  Derivando e igualando a cero:
 *
 *        CT'(x) = c − k/x²  = 0     ⟹     x* = √(k / c)
 *
 *  (2ª derivada 2k/x³ > 0  ⟹  x* es un MÍNIMO de costo)
 *
 *  x* es la "dosis exacta" de memoria rentable. Se recorta a
 *  [X_MIN, X_MAX]: con tokens de entrada ultra-baratos (Gemini Flash)
 *  el óptimo teórico puede dispararse por encima de lo útil
 *  (rendimientos decrecientes + ventana del modelo), y con un modelo
 *  caro de escalamiento x* se contrae solo. El recorte "protege el margen".
 * ═══════════════════════════════════════════════════════════════════════
 */

export interface TokenBudgetInputs {
    /** c — precio de ENTRADA del modelo respondedor (USD por 1M tokens). */
    costPerMTokUsd: number;
    /** p_ref — tasa de error observada en x_ref (0..1). */
    errorRate: number;
    /** x_ref — tamaño de contexto (tokens) donde se midió p_ref. */
    refContextTokens: number;
    /** C_error — costo en USD de corregir un error de la IA (analista). */
    errorCostUsd: number;
    /** Piso: nunca menos memoria que esto (siempre necesitas los últimos turnos). */
    minTokens: number;
    /** Techo práctico: ventana del modelo / tope de presupuesto. */
    maxTokens: number;
}

export interface TokenBudget {
    /** x* teórico = √(k/c), SIN recortar. */
    optimalTokens: number;
    /** x* recortado a [min, max] — ESTE es el presupuesto que se usa. */
    budgetTokens: number;
    /** k = p_ref · x_ref · C_error (costo esperado del error). */
    k: number;
    /** c convertido a USD por token. */
    costPerToken: number;
    /** Si el óptimo tocó un límite. */
    clamped: 'min' | 'max' | 'none';
}

/** Heurística de tokens por mensaje de WhatsApp (es_CO, mensajes cortos). */
const AVG_TOKENS_PER_MESSAGE = 60;

export class TokenEconomy {

    /**
     * Núcleo del sistema: calcula x* = √(k/c) y lo recorta a [min, max].
     * Determinista y sin dependencias — es la "calculadora" del runtime,
     * el gemelo exacto de CalculadoraTokens.jsx.
     */
    computeBudget(inputs: TokenBudgetInputs): TokenBudget {
        const costPerToken = inputs.costPerMTokUsd / 1_000_000;
        const k = inputs.errorRate * inputs.refContextTokens * inputs.errorCostUsd;

        // Si c=0 (modelo gratis) o k=0 (sin riesgo), el óptimo colapsa al techo.
        const optimalTokens = costPerToken > 0 && k > 0
            ? Math.sqrt(k / costPerToken)
            : inputs.maxTokens;

        let budgetTokens = Math.round(optimalTokens);
        let clamped: TokenBudget['clamped'] = 'none';

        if (budgetTokens < inputs.minTokens) {
            budgetTokens = inputs.minTokens;
            clamped = 'min';
        } else if (budgetTokens > inputs.maxTokens) {
            budgetTokens = inputs.maxTokens;
            clamped = 'max';
        }

        return { optimalTokens, budgetTokens, k, costPerToken, clamped };
    }

    /**
     * Presupuesto vigente según la configuración de entorno.
     * `costOverride` permite recalcular para el modelo de escalamiento (c mayor).
     */
    currentBudget(costOverride?: number): TokenBudget {
        return this.computeBudget({
            costPerMTokUsd: costOverride ?? env.TOKENECON_RESPONDER_COST_PER_MTOK,
            errorRate: env.TOKENECON_ERROR_RATE,
            refContextTokens: env.TOKENECON_REF_CONTEXT_TOKENS,
            errorCostUsd: env.TOKENECON_ERROR_COST_USD,
            minTokens: env.TOKENECON_MIN_TOKENS,
            maxTokens: env.TOKENECON_MAX_TOKENS,
        });
    }

    /**
     * Convierte un presupuesto de tokens al `take` de mensajes (para la query
     * de historial). Mínimo 2 turnos para no perder el contexto inmediato.
     */
    tokensToMessages(tokens: number, avgTokensPerMessage = AVG_TOKENS_PER_MESSAGE): number {
        return Math.max(2, Math.round(tokens / avgTokensPerMessage));
    }

    /** Estimador barato de tokens sin tokenizer (~4 chars/token). */
    estimateTokens(text: string): number {
        return Math.ceil(text.length / 4);
    }

    /**
     * Costo en USD de una llamada, dado el uso reportado por la API.
     * Cobra entrada y salida por separado (la salida suele ser 3-8× más cara).
     */
    costUsd(usage: { promptTokens: number; completionTokens: number }, prices: {
        inPerMTok: number;
        outPerMTok: number;
    }): number {
        return (usage.promptTokens * prices.inPerMTok
            + usage.completionTokens * prices.outPerMTok) / 1_000_000;
    }
}

export const tokenEconomy = new TokenEconomy();
