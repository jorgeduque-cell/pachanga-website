import { prisma } from '../../lib/prisma.js';
import { env } from '../../config/env.js';
import { logger } from '../../lib/logger.js';
import { chatbotAiEngine } from './chatbot.ai-engine.js';
import { chatbotKnowledgeService } from './chatbot.knowledge.js';
import { chatbotConversationService } from './chatbot.conversation.js';
import { whatsappService } from '../whatsapp/whatsapp.service.js';

// ─── Rate Limit Map ─────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const MAX_MESSAGES_PER_HOUR = 20;

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

            // 5. Build AI context
            const [knowledgeContext, conversationHistory] = await Promise.all([
                chatbotKnowledgeService.buildSystemPromptContext(),
                chatbotConversationService.getConversationContext(conversation.id),
            ]);

            // 6. Generate AI response
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

            // 7. Check confidence threshold
            if (aiResponse.confidence < env.CHATBOT_CONFIDENCE_THRESHOLD || aiResponse.intent === 'COMPLAINTS') {
                await this.handleEscalation(conversation.id, phone, aiResponse);
                return;
            }

            await chatbotConversationService.saveMessage({
                conversationId: conversation.id,
                role: 'BOT',
                content: aiResponse.reply,
                intent: aiResponse.intent,
                confidence: aiResponse.confidence,
            });

            // 9. Check if AI detected a customer name
            if (aiResponse.customerName && customer.name.startsWith('Cliente WhatsApp')) {
                await this.updateCustomerName(customer.id, aiResponse.customerName);
            }

            // 10. Send response via WhatsApp
            await whatsappService.sendFreeformMessage(phone, aiResponse.reply);

            // 11. Execute AI-triggered actions (non-blocking)
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

        // Save admin message
        await chatbotConversationService.saveMessage({
            conversationId,
            role: 'ADMIN',
            content: message,
        });

        // Send via WhatsApp
        await whatsappService.sendFreeformMessage(conversation.customer.phone, message);

        // If was escalated, keep as escalated until explicitly resolved
        logger.info({ conversationId }, '[Chatbot] Admin reply sent');
    }

    // ─── Private Helpers ────────────────────────────────────

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
            // Update name from WhatsApp profile if still generic
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
                    // Find next event with a flyer
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

        // Save the escalation message
        await chatbotConversationService.saveMessage({
            conversationId,
            role: 'BOT',
            content: escalationMessage,
            intent: aiResponse.intent,
            confidence: aiResponse.confidence,
        });

        // Escalate the conversation
        await chatbotConversationService.escalateConversation(conversationId);

        // Send escalation message to client
        await whatsappService.sendFreeformMessage(phone, escalationMessage);

        // 🔔 Notify admin via WhatsApp
        const adminPhone = env.CHATBOT_ADMIN_PHONE || '+573124183002';
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
