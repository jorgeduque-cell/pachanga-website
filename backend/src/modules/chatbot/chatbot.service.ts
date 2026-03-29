import { prisma } from '../../lib/prisma.js';
import { env } from '../../config/env.js';
import { logger } from '../../lib/logger.js';
import { chatbotAiEngine } from './chatbot.ai-engine.js';
import { chatbotKnowledgeService } from './chatbot.knowledge.js';
import { chatbotConversationService } from './chatbot.conversation.js';
import { purchaseFlowService } from './chatbot.purchase-flow.js';
import { chatbotVisionService } from './chatbot.vision.js';
import { chatbotPaymentService } from './chatbot.payment.js';
import { whatsappService } from '../whatsapp/whatsapp.service.js';
import { uploadPaymentReceipt } from '../../lib/storage.js';

// ─── Rate Limit Map ─────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const MAX_MESSAGES_PER_HOUR = 20;
const MAX_RATE_LIMIT_ENTRIES = 10_000;

const VENUE_LOCATION = {
    latitude: 4.6565,
    longitude: -74.0596,
    name: 'Pachanga y Pochola',
    address: 'Calle 73 #14-53, Bogotá',
} as const;

// ─── Service ────────────────────────────────────────────────
export class ChatbotService {

    /**
     * Main entry point — called from WhatsApp webhook controller.
     * Orchestrates the full flow: customer lookup → conversation → AI → respond.
     */
    async processIncomingMessage(
        phone: string,
        text: string,
        profileName?: string,
    ): Promise<void> {
        // Guard: chatbot must be enabled
        if (env.CHATBOT_ENABLED !== 'true') {
            logger.debug({ phone }, '[Chatbot] Disabled — skipping');
            return;
        }

        // Guard: must have API key
        if (!env.OPENAI_API_KEY) {
            logger.warn('[Chatbot] OPENAI_API_KEY not set — skipping');
            return;
        }

        // Guard: rate limit
        if (this.isRateLimited(phone)) {
            logger.warn({ phone }, '[Chatbot] Rate limited — skipping');
            return;
        }

        try {
            // 1. Find or create customer
            const customer = await this.getOrCreateCustomer(phone, profileName);

            // 2. Get or create active conversation
            const conversation = await chatbotConversationService.getOrCreateConversation(customer.id);

            // 3. Save the incoming message
            await chatbotConversationService.saveMessage({
                conversationId: conversation.id,
                role: 'CUSTOMER',
                content: text,
            });

            // 4. Skip if conversation is escalated (human is handling it)
            if (conversation.status === 'ESCALATED') {
                logger.info({ phone, conversationId: conversation.id }, '[Chatbot] Conversation escalated — skipping AI');
                return;
            }

            // 5. CHECK FOR ACTIVE PURCHASE FLOW (before AI)
            const flowState = await purchaseFlowService.getFlowState(conversation.id);
            if (flowState) {
                const flowResponse = await this.handlePurchaseFlowStep(
                    conversation.id, customer.id, flowState.state, text,
                );
                if (flowResponse) {
                    await chatbotConversationService.saveMessage({
                        conversationId: conversation.id,
                        role: 'BOT',
                        content: flowResponse,
                        intent: 'PURCHASE',
                        confidence: 1.0,
                    });
                    await whatsappService.sendFreeformMessage(phone, flowResponse);
                    return;
                }
            }

            // 6. Build AI context
            const [knowledgeContext, conversationHistory] = await Promise.all([
                chatbotKnowledgeService.buildSystemPromptContext(),
                chatbotConversationService.getConversationContext(conversation.id),
            ]);

            // 7. Generate AI response
            const aiResponse = await chatbotAiEngine.generateResponse(
                knowledgeContext,
                conversationHistory,
                text,
            );

            logger.info({
                phone,
                intent: aiResponse.intent,
                confidence: aiResponse.confidence,
            }, '[Chatbot] AI response generated');

            // 8. Check confidence threshold
            if (aiResponse.confidence < env.CHATBOT_CONFIDENCE_THRESHOLD || aiResponse.intent === 'COMPLAINTS') {
                await this.handleEscalation(conversation.id, phone, aiResponse);
                return;
            }

            // 9. CHECK IF AI DETECTED PURCHASE INTENT → start flow
            if (aiResponse.actions?.includes('START_PURCHASE_FLOW')) {
                const purchaseResponse = await purchaseFlowService.startPurchaseFlow(conversation.id);
                await chatbotConversationService.saveMessage({
                    conversationId: conversation.id,
                    role: 'BOT',
                    content: purchaseResponse,
                    intent: 'PURCHASE',
                    confidence: aiResponse.confidence,
                });
                await whatsappService.sendFreeformMessage(phone, purchaseResponse);
                return;
            }

            await chatbotConversationService.saveMessage({
                conversationId: conversation.id,
                role: 'BOT',
                content: aiResponse.reply,
                intent: aiResponse.intent,
                confidence: aiResponse.confidence,
            });

            // 10. Check if AI detected a customer name
            if (aiResponse.customerName && customer.name.startsWith('Cliente WhatsApp')) {
                await this.updateCustomerName(customer.id, aiResponse.customerName);
            }

            // 11. Send response via WhatsApp
            await whatsappService.sendFreeformMessage(phone, aiResponse.reply);

            // 12. Execute AI-triggered actions (non-blocking)
            if (aiResponse.actions?.length) {
                this.executeActions(phone, aiResponse.actions).catch((err) => {
                    logger.error({ err, phone }, '[Chatbot] Action execution failed');
                });
            }

        } catch (error) {
            logger.error({ err: error, phone }, '[Chatbot] Failed to process message');
        }
    }

    /**
     * Processes an incoming image from WhatsApp.
     * Downloads media → uploads to storage → analyzes with GPT Vision → notifies admin.
     */
    async processIncomingImage(
        phone: string,
        mediaId: string,
        profileName?: string,
    ): Promise<void> {
        try {
            const customer = await this.getOrCreateCustomer(phone, profileName);
            const conversation = await chatbotConversationService.getOrCreateConversation(customer.id);

            // Check if there's an active payment flow awaiting receipt
            const flowState = await purchaseFlowService.getFlowState(conversation.id);
            if (!flowState || flowState.state !== 'AWAITING_PAYMENT') {
                await whatsappService.sendFreeformMessage(
                    phone,
                    '¡Hola! Por el momento solo puedo leer mensajes de texto. ¿Podrías escribirme tu consulta? Con gusto te ayudo 😊',
                );
                return;
            }

            // Acknowledge receipt
            await whatsappService.sendFreeformMessage(phone, '📸 ¡Recibí tu comprobante! Lo estoy analizando... ⏳');

            // Download media from WhatsApp
            const { buffer, mimeType } = await whatsappService.downloadMedia(mediaId);

            // Upload to Supabase Storage
            const extension = mimeType.split('/')[1] ?? 'jpg';
            const receiptUrl = await uploadPaymentReceipt(
                buffer,
                `receipt-${flowState.reference}.${extension}`,
                mimeType,
            );

            // Analyze with GPT-4o Vision
            const visionResult = await chatbotVisionService.analyzeReceiptFromBuffer(buffer, mimeType);

            logger.info({
                phone,
                reference: flowState.reference,
                isReceipt: visionResult.isPaymentReceipt,
                detectedAmount: visionResult.amount,
                bank: visionResult.bank,
            }, '[Chatbot] Vision analysis complete');

            // Update PaymentVerification with receipt data
            if (flowState.paymentVerificationId) {
                await chatbotPaymentService.attachReceipt(
                    flowState.paymentVerificationId,
                    receiptUrl ?? '',
                    {
                        isPaymentReceipt: visionResult.isPaymentReceipt,
                        amount: visionResult.amount,
                        bank: visionResult.bank,
                        date: visionResult.date,
                        reference: visionResult.reference,
                        confidence: visionResult.confidence,
                    },
                    visionResult.amount,
                );
            }

            // Mark flow as VERIFYING
            await purchaseFlowService.markReceiptReceived(conversation.id);

            // Build response message
            let responseMessage: string;
            if (visionResult.isPaymentReceipt) {
                const amountInfo = visionResult.amount
                    ? `\n💰 Monto detectado: *$${visionResult.amount.toLocaleString('es-CO')}*`
                    : '';
                const bankInfo = visionResult.bank ? `\n🏦 Banco: *${visionResult.bank}*` : '';

                responseMessage = `✅ *¡Comprobante recibido!*${amountInfo}${bankInfo}\n\n🔖 Referencia: *${flowState.reference}*\n\n📋 Tu pago está siendo verificado por nuestro equipo. Te enviaremos la confirmación por este mismo chat. ¡Gracias! 🙏`;
            } else {
                responseMessage = '🤔 La imagen que enviaste no parece ser un comprobante de pago. Por favor envía una foto clara del comprobante de la transferencia o pago.';
            }

            await chatbotConversationService.saveMessage({
                conversationId: conversation.id,
                role: 'BOT',
                content: responseMessage,
                intent: 'PURCHASE',
                confidence: 1.0,
            });
            await whatsappService.sendFreeformMessage(phone, responseMessage);

            // Notify admin about new payment to verify
            if (visionResult.isPaymentReceipt) {
                const adminPhone = env.CHATBOT_ADMIN_PHONE;
                const adminAlert = `💳 *NUEVO PAGO POR VERIFICAR*\n\n` +
                    `📱 Cliente: ${phone}\n` +
                    `🔖 Ref: ${flowState.reference}\n` +
                    `💰 Esperado: $${flowState.totalAmount?.toLocaleString('es-CO')}\n` +
                    `💰 Detectado: ${visionResult.amount ? `$${visionResult.amount.toLocaleString('es-CO')}` : 'No detectado'}\n` +
                    `🏦 Banco: ${visionResult.bank ?? 'No detectado'}\n\n` +
                    `📋 Revisa en el panel:\npachanga-website.vercel.app/admin/chatbot`;

                whatsappService.sendFreeformMessage(adminPhone, adminAlert).catch((err) => {
                    logger.error({ err }, '[Chatbot] Failed to send admin payment alert');
                });
            }

        } catch (error) {
            logger.error({ err: error, phone }, '[Chatbot] Failed to process image');
            await whatsappService.sendFreeformMessage(
                phone,
                '⚠️ Hubo un problema procesando tu imagen. Por favor intenta de nuevo.',
            ).catch(() => {});
        }
    }

    /**
     * Sends a manual reply from admin to a conversation.
     */
    async sendAdminReply(conversationId: string, message: string): Promise<void> {
        const conversation = await prisma.chatConversation.findUnique({
            where: { id: conversationId },
            include: { customer: { select: { phone: true } } },
        });

        if (!conversation) {
            throw new Error('Conversación no encontrada');
        }

        await chatbotConversationService.saveMessage({
            conversationId,
            role: 'ADMIN',
            content: message,
        });

        await whatsappService.sendFreeformMessage(conversation.customer.phone, message);
        logger.info({ conversationId }, '[Chatbot] Admin reply sent');
    }

    // ─── Private Helpers ────────────────────────────────────

    private async handlePurchaseFlowStep(
        conversationId: string,
        customerId: string,
        state: string,
        userMessage: string,
    ): Promise<string | null> {
        const msg = userMessage.toLowerCase();
        const cancelKeywords = ['cancelar', 'salir', 'no quiero', 'volver'];
        if (cancelKeywords.some(kw => msg.includes(kw))) {
            await purchaseFlowService.resetFlow(conversationId);
            return '✅ Compra cancelada. Si necesitas algo más, ¡con gusto te ayudo! 😊';
        }

        // Allow restarting a new purchase from AWAITING_PAYMENT or VERIFYING_PAYMENT
        const restartKeywords = ['comprar', 'nueva compra', 'otra compra', 'iniciar', 'empezar', 'quiero comprar'];
        if ((state === 'AWAITING_PAYMENT' || state === 'VERIFYING_PAYMENT') &&
            restartKeywords.some(kw => msg.includes(kw))) {
            await purchaseFlowService.resetFlow(conversationId);
            return purchaseFlowService.startPurchaseFlow(conversationId);
        }

        switch (state) {
            case 'COLLECTING_EVENT':
                return purchaseFlowService.handleEventSelection(conversationId, userMessage);
            case 'COLLECTING_QUANTITY':
                return purchaseFlowService.handleQuantitySelection(conversationId, customerId, userMessage);
            case 'AWAITING_PAYMENT':
                return '📸 Estoy esperando tu comprobante de pago. Por favor envía la *foto del comprobante* de transferencia.\n\n💡 Si necesitas ver los datos bancarios de nuevo, escribe *"datos de pago"*.\n\n🔄 Si deseas *cancelar* esta compra y hacer una nueva, escribe *"cancelar"*.';
            case 'VERIFYING_PAYMENT':
                return '⏳ Tu pago está siendo verificado por nuestro equipo. Te avisaremos por este mismo chat cuando esté confirmado. ¡Gracias por tu paciencia! 🙏';
            default:
                return null;
        }
    }

    private async getOrCreateCustomer(phone: string, profileName?: string) {
        const normalizedPhone = phone.startsWith('+') ? phone : `+${phone}`;

        let customer = await prisma.customer.findUnique({
            where: { phone: normalizedPhone },
        });

        if (!customer) {
            customer = await prisma.customer.create({
                data: {
                    name: profileName || 'Cliente WhatsApp',
                    phone: normalizedPhone,
                    source: 'WHATSAPP_CHAT',
                },
            });
            logger.info({ phone: normalizedPhone, name: profileName }, '[Chatbot] New customer created from chat');
        } else if (profileName && customer.name === 'Cliente WhatsApp') {
            customer = await prisma.customer.update({
                where: { id: customer.id },
                data: { name: profileName },
            });
            logger.info({ phone: normalizedPhone, name: profileName }, '[Chatbot] Customer name updated from WA profile');
        }

        return customer;
    }

    private async updateCustomerName(customerId: string, name: string): Promise<void> {
        await prisma.customer.update({
            where: { id: customerId },
            data: { name },
        });
        logger.info({ customerId, name }, '[Chatbot] Customer name updated from AI detection');
    }

    private async executeActions(phone: string, actions: string[]): Promise<void> {
        for (const action of actions) {
            switch (action) {
                case 'SEND_MENU_IMAGE':
                    await whatsappService.sendImageMessage(
                        phone,
                        `${env.FRONTEND_URL}/carta-licores.jpg`,
                        '🍸 Carta de Licores — Pachanga y Pochola',
                    );
                    break;

                case 'SEND_LOCATION':
                    await whatsappService.sendLocationMessage(
                        phone,
                        VENUE_LOCATION.latitude,
                        VENUE_LOCATION.longitude,
                        VENUE_LOCATION.name,
                        VENUE_LOCATION.address,
                    );
                    break;

                case 'SEND_EVENT_FLYER': {
                    const events = await prisma.event.findMany({
                        where: {
                            isActive: true,
                            status: 'ACTIVE',
                            flyerUrl: { not: null },
                            eventDate: { gte: new Date() },
                        },
                        orderBy: { eventDate: 'asc' },
                        take: 1,
                    });
                    if (events[0]?.flyerUrl) {
                        await whatsappService.sendImageMessage(
                            phone,
                            events[0].flyerUrl,
                            `🎉 ${events[0].name}`,
                        );
                    }
                    break;
                }

                case 'START_PURCHASE_FLOW':
                    break; // Already handled in processIncomingMessage

                default:
                    logger.warn({ action }, '[Chatbot] Unknown action');
            }
        }
    }

    private async handleEscalation(
        conversationId: string,
        phone: string,
        aiResponse: { reply: string; intent: string; confidence: number },
    ): Promise<void> {
        const escalationMessage = aiResponse.intent === 'COMPLAINTS'
            ? 'Entiendo tu situación y lamento mucho lo que pasó 😔 Voy a pasar tu mensaje a nuestro equipo para que te puedan ayudar directamente. Te responderán pronto 🙏'
            : 'Esa es una buena pregunta 🤔 Voy a pasar tu mensaje a nuestro equipo para darte la mejor respuesta. Te responderán pronto 🙏';

        await chatbotConversationService.saveMessage({
            conversationId,
            role: 'BOT',
            content: escalationMessage,
            intent: aiResponse.intent,
            confidence: aiResponse.confidence,
        });

        await chatbotConversationService.escalateConversation(conversationId);
        await whatsappService.sendFreeformMessage(phone, escalationMessage);

        const adminPhone = env.CHATBOT_ADMIN_PHONE;
        const adminAlert = `⚠️ *ESCALADA — Chatbot IA*\n\n📱 Cliente: ${phone}\n🏷️ Tema: ${aiResponse.intent}\n📊 Confianza IA: ${(aiResponse.confidence * 100).toFixed(0)}%\n\n💬 Revisa en el panel:\npachanga-website.vercel.app/admin/chatbot`;

        whatsappService.sendFreeformMessage(adminPhone, adminAlert).catch((err) => {
            logger.error({ err }, '[Chatbot] Failed to send admin escalation alert');
        });

        logger.warn({
            phone,
            intent: aiResponse.intent,
            confidence: aiResponse.confidence,
            conversationId,
        }, '[Chatbot] Conversation escalated');
    }

    private isRateLimited(phone: string): boolean {
        const now = Date.now();

        if (rateLimitMap.size > MAX_RATE_LIMIT_ENTRIES) {
            for (const [key, entry] of rateLimitMap) {
                if (now > entry.resetAt) rateLimitMap.delete(key);
            }
        }

        const entry = rateLimitMap.get(phone);

        if (!entry || now > entry.resetAt) {
            rateLimitMap.set(phone, { count: 1, resetAt: now + 60 * 60 * 1000 });
            return false;
        }

        entry.count++;

        if (entry.count > MAX_MESSAGES_PER_HOUR) {
            return true;
        }

        return false;
    }
}

export const chatbotService = new ChatbotService();
