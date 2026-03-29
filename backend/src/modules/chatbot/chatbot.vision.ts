import OpenAI from 'openai';
import { env } from '../../config/env.js';
import { logger } from '../../lib/logger.js';

// ─── Types ───────────────────────────────────────────────────
export interface VisionAnalysisResult {
    isPaymentReceipt: boolean;
    amount: number | null;
    date: string | null;
    reference: string | null;
    bank: string | null;
    confidence: number;
    rawAnalysis: string;
}

// ─── Constants ───────────────────────────────────────────────
const VISION_MODEL = 'gpt-4o-mini';
const VISION_MAX_TOKENS = 500;

const VISION_PROMPT = `Analiza esta imagen y determina si es un comprobante de pago o transferencia bancaria.

IMPORTANTE: Responde SIEMPRE en formato JSON con esta estructura exacta:
{
  "is_payment_receipt": true/false,
  "amount": 150000,
  "date": "2026-03-28",
  "reference": "PACH-280326-4G",
  "bank": "Nequi",
  "confidence": 0.95
}

REGLAS:
1. Si NO es un comprobante de pago (es una foto personal, meme, documento no financiero), responde: {"is_payment_receipt": false, "amount": null, "date": null, "reference": null, "bank": null, "confidence": 0.95}
2. El "amount" debe ser el monto de la transacción en pesos colombianos (número sin formato).
3. El "date" debe estar en formato YYYY-MM-DD si es legible.
4. El "reference" es cualquier referencia que aparezca en el comprobante (busca especialmente referencias con formato PACH-XXXXXX).
5. El "bank" puede ser: Nequi, Bancolombia, Daviplata, PSE, Efecty, u otro banco colombiano.
6. El "confidence" indica qué tan seguro estás de que es un comprobante válido (0 a 1).
7. Si algún campo no es legible, pon null.`;

// ─── Service ────────────────────────────────────────────────
export class ChatbotVisionService {
    private openai: OpenAI;

    constructor() {
        this.openai = new OpenAI({
            apiKey: env.OPENAI_API_KEY,
        });
    }

    /**
     * Analyzes a payment receipt image using GPT-4o Vision.
     * Accepts either a public URL or a base64-encoded image.
     */
    async analyzePaymentReceipt(imageSource: string): Promise<VisionAnalysisResult> {
        try {
            // Determine if it's a URL or base64
            const imageContent = imageSource.startsWith('data:')
                ? { type: 'image_url' as const, image_url: { url: imageSource } }
                : { type: 'image_url' as const, image_url: { url: imageSource } };

            const completion = await this.openai.chat.completions.create({
                model: VISION_MODEL,
                messages: [
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: VISION_PROMPT },
                            imageContent,
                        ],
                    },
                ],
                max_tokens: VISION_MAX_TOKENS,
                temperature: 0.1, // Low temperature for factual analysis
            });

            const responseText = completion.choices[0]?.message?.content ?? '';
            return this.parseVisionResponse(responseText);
        } catch (error) {
            logger.error({ err: error }, '[Vision] GPT-4o analysis failed');

            return {
                isPaymentReceipt: false,
                amount: null,
                date: null,
                reference: null,
                bank: null,
                confidence: 0,
                rawAnalysis: error instanceof Error ? error.message : 'Analysis failed',
            };
        }
    }

    /**
     * Analyzes a receipt from a raw buffer (converts to base64 first).
     */
    async analyzeReceiptFromBuffer(buffer: Buffer, mimeType: string): Promise<VisionAnalysisResult> {
        const base64 = buffer.toString('base64');
        const dataUrl = `data:${mimeType};base64,${base64}`;
        return this.analyzePaymentReceipt(dataUrl);
    }

    // ─── Private ────────────────────────────────────────────

    private parseVisionResponse(responseText: string): VisionAnalysisResult {
        try {
            // Extract JSON from response (may be wrapped in markdown code blocks)
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error('No JSON found in response');

            const parsed = JSON.parse(jsonMatch[0]);

            return {
                isPaymentReceipt: Boolean(parsed.is_payment_receipt),
                amount: typeof parsed.amount === 'number' ? parsed.amount : null,
                date: typeof parsed.date === 'string' ? parsed.date : null,
                reference: typeof parsed.reference === 'string' ? parsed.reference : null,
                bank: typeof parsed.bank === 'string' ? parsed.bank : null,
                confidence: typeof parsed.confidence === 'number'
                    ? Math.min(1, Math.max(0, parsed.confidence))
                    : 0.5,
                rawAnalysis: responseText,
            };
        } catch {
            logger.warn({ responseText }, '[Vision] Failed to parse GPT response');
            return {
                isPaymentReceipt: false,
                amount: null,
                date: null,
                reference: null,
                bank: null,
                confidence: 0,
                rawAnalysis: responseText,
            };
        }
    }
}

export const chatbotVisionService = new ChatbotVisionService();
