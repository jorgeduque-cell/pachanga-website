import axios from 'axios';
import { Customer, Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { env } from '../../config/env.js';
import { getTemplateConfig, type TemplateConfig } from './whatsapp.templates.js';
import { logger } from '../../lib/logger.js';

// ─── Types ───────────────────────────────────────────────────
export interface ButtonParam {
    type: 'url';
    index: number;
    text: string;   // dynamic suffix for the URL
}

export interface HeaderMedia {
    type: 'image' | 'video';
    url?: string;
    mediaId?: string;
}

// ─── Constants ───────────────────────────────────────────────
const GRAPH_API_URL = 'https://graph.facebook.com';

// Media IDs for template headers (uploaded to Meta's servers)
const WELCOME_IMAGE_MEDIA_ID = '1221474213303119';
// Survey video on Supabase Storage (permanent — never expires)
const SURVEY_VIDEO_URL = 'https://egvgxitnbjhjflqivobm.supabase.co/storage/v1/object/public/media/whatsapp/encuesta-pachanga.mp4';


// ─── Service ─────────────────────────────────────────────────
export class WhatsAppService {
    private get token(): string {
        return env.WHATSAPP_TOKEN;
    }

    private get phoneNumberId(): string {
        return env.WHATSAPP_PHONE_ID;
    }

    private get apiVersion(): string {
        return env.WHATSAPP_API_VERSION;
    }

    private get isDryRun(): boolean {
        return env.WHATSAPP_DRY_RUN === 'true';
    }

    /**
     * Sends a welcome message to a new customer.
     */
    async sendWelcome(customer: Customer): Promise<string> {
        return this.sendTemplate(
            customer.phone,
            'pachanga_bienvenida',
            [customer.name],
            customer.id,
            undefined,
            { type: 'image', mediaId: WELCOME_IMAGE_MEDIA_ID },
        );
    }

    /**
     * Sends a birthday message to a customer.
     * Body {{customer_name}} = customer name, Button {{1}} = ref param.
     */
    async sendBirthday(customer: Customer): Promise<string> {
        return this.sendTemplate(
            customer.phone,
            'cumpleanos_pachanga',
            [customer.name],
            customer.id,
            [{ type: 'url', index: 0, text: 'birthday' }],
        );
    }

    /**
     * Sends a satisfaction survey link to a customer.
     * Body {{customer_name}} = customer name, Button {{1}} = JWT token.
     */
    async sendSurvey(customer: Pick<Customer, 'id' | 'name' | 'phone'>, surveyToken: string): Promise<string> {
        return this.sendTemplate(
            customer.phone,
            'encuesta_pachanga',
            [customer.name],
            customer.id,
            [{ type: 'url', index: 0, text: surveyToken }],
            { type: 'video', url: SURVEY_VIDEO_URL },
        );
    }

    /**
     * Generic template sender. Supports dry-run mode.
     * Returns the created WhatsAppMessage ID.
     */
    async sendTemplate(
        phone: string,
        templateName: string,
        variables: string[],
        customerId: string,
        buttonParams?: ButtonParam[],
        headerMedia?: HeaderMedia,
    ): Promise<string> {
        const templateConfig = getTemplateConfig(templateName);
        const message = await this.createQueuedMessage(customerId, templateConfig, templateName);

        if (this.isDryRun) {
            return this.handleDryRun(message.id, phone, templateName, variables, buttonParams);
        }

        return this.sendViaCloudApi(message.id, phone, templateConfig, variables, buttonParams, headerMedia);
    }

    // ─── Private Helpers ─────────────────────────────────────────

    private async createQueuedMessage(
        customerId: string,
        config: TemplateConfig,
        templateName: string,
    ) {
        return prisma.whatsAppMessage.create({
            data: {
                customerId,
                type: config.type,
                templateName,
                status: 'QUEUED',
            },
        });
    }

    private async handleDryRun(
        messageId: string,
        phone: string,
        templateName: string,
        variables: string[],
        buttonParams?: ButtonParam[],
    ): Promise<string> {
        logger.info({ phone, templateName, variables, buttonParams }, '[DRY-RUN] WhatsApp message simulated');

        await prisma.whatsAppMessage.update({
            where: { id: messageId },
            data: { status: 'SENT', sentAt: new Date() },
        });

        return messageId;
    }

    private async sendViaCloudApi(
        messageId: string,
        phone: string,
        config: TemplateConfig,
        variables: string[],
        buttonParams?: ButtonParam[],
        headerMedia?: HeaderMedia,
    ): Promise<string> {
        try {
            const components = this.buildTemplateComponents(config, variables, buttonParams, headerMedia);

            const response = await axios.post(
                `${GRAPH_API_URL}/${this.apiVersion}/${this.phoneNumberId}/messages`,
                {
                    messaging_product: 'whatsapp',
                    to: phone,
                    type: 'template',
                    template: {
                        name: config.name,
                        language: { code: config.language },
                        components,
                    },
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.token}`,
                        'Content-Type': 'application/json',
                    },
                    timeout: 10000,
                },
            );

            const waMessageId = response.data?.messages?.[0]?.id ?? null;

            await prisma.whatsAppMessage.update({
                where: { id: messageId },
                data: {
                    status: 'SENT',
                    sentAt: new Date(),
                    waMessageId,
                },
            });

            logger.info({ phone, templateName: config.name, waMessageId }, '[WhatsApp] Message sent');
            return messageId;
        } catch (error) {
            const errorCode = axios.isAxiosError(error)
                ? String(error.response?.data?.error?.code ?? error.response?.status ?? 'UNKNOWN')
                : 'INTERNAL';

            const errorDetails = axios.isAxiosError(error)
                ? error.response?.data?.error?.error_data?.details ?? error.response?.data?.error?.message
                : (error instanceof Error ? error.message : 'Unknown error');

            await prisma.whatsAppMessage.update({
                where: { id: messageId },
                data: { status: 'FAILED', errorCode },
            });

            logger.error({ phone, errorCode, errorDetails }, '[WhatsApp] Send failed');
            return messageId;
        }
    }

    /**
     * Builds the `components` array for the WhatsApp Cloud API template payload.
     * Supports:
     * - Named body parameters (Meta's new format)
     * - Header media (image/video)
     * - CTA URL buttons with dynamic suffixes
     */
    private buildTemplateComponents(
        config: TemplateConfig,
        variables: string[],
        buttonParams?: ButtonParam[],
        headerMedia?: HeaderMedia,
    ): Record<string, unknown>[] {
        const components: Record<string, unknown>[] = [];

        // Header media (image or video)
        if (headerMedia) {
            const mediaParam: Record<string, unknown> = { type: headerMedia.type };
            // Support both Media ID (preferred) and URL fallback
            if (headerMedia.mediaId) {
                mediaParam[headerMedia.type] = { id: headerMedia.mediaId };
            } else if (headerMedia.url) {
                mediaParam[headerMedia.type] = { link: headerMedia.url };
            }
            components.push({
                type: 'header',
                parameters: [mediaParam],
            });
        }

        // Body parameters with named params (Meta's new format)
        if (variables.length > 0 && config.bodyParamNames.length > 0) {
            components.push({
                type: 'body',
                parameters: variables.map((value, index) => ({
                    type: 'text',
                    parameter_name: config.bodyParamNames[index] ?? `param_${index}`,
                    text: value,
                })),
            });
        }

        // Button parameters (dynamic URL suffixes)
        if (buttonParams && buttonParams.length > 0) {
            for (const btn of buttonParams) {
                components.push({
                    type: 'button',
                    sub_type: btn.type,
                    index: String(btn.index),
                    parameters: [{ type: 'text', text: btn.text }],
                });
            }
        }

        return components;
    }

    /**
     * Sends a free-text message (not a template) via WhatsApp Cloud API.
     * Used by the chatbot for AI-generated responses within the 24h session window.
     */
    async sendFreeformMessage(phone: string, text: string): Promise<string | null> {
        if (this.isDryRun) {
            logger.info({ phone, text: text.slice(0, 80) }, '[DRY-RUN] Freeform WhatsApp message simulated');
            return null;
        }

        try {
            const response = await axios.post(
                `${GRAPH_API_URL}/${this.apiVersion}/${this.phoneNumberId}/messages`,
                {
                    messaging_product: 'whatsapp',
                    recipient_type: 'individual',
                    to: phone.replace('+', ''),
                    type: 'text',
                    text: { body: text },
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.token}`,
                        'Content-Type': 'application/json',
                    },
                    timeout: 10000,
                },
            );

            const waMessageId = response.data?.messages?.[0]?.id ?? null;
            logger.info({ phone, waMessageId }, '[WhatsApp] Freeform message sent');
            return waMessageId;
        } catch (error) {
            const errorDetails = axios.isAxiosError(error)
                ? error.response?.data?.error?.message ?? error.message
                : (error instanceof Error ? error.message : 'Unknown error');

            logger.error({ phone, errorDetails }, '[WhatsApp] Freeform send failed');
            return null;
        }
    }

    /**
     * Sends an image message via WhatsApp Cloud API.
     * Used by the chatbot to share the menu card.
     */
    async sendImageMessage(phone: string, imageUrl: string, caption?: string): Promise<string | null> {
        if (this.isDryRun) {
            logger.info({ phone, imageUrl }, '[DRY-RUN] Image message simulated');
            return null;
        }

        try {
            const response = await axios.post(
                `${GRAPH_API_URL}/${this.apiVersion}/${this.phoneNumberId}/messages`,
                {
                    messaging_product: 'whatsapp',
                    recipient_type: 'individual',
                    to: phone.replace('+', ''),
                    type: 'image',
                    image: { link: imageUrl, caption: caption || '' },
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.token}`,
                        'Content-Type': 'application/json',
                    },
                    timeout: 15000,
                },
            );

            const waMessageId = response.data?.messages?.[0]?.id ?? null;
            logger.info({ phone, waMessageId }, '[WhatsApp] Image message sent');
            return waMessageId;
        } catch (error) {
            const errorDetails = axios.isAxiosError(error)
                ? error.response?.data?.error?.message ?? error.message
                : (error instanceof Error ? error.message : 'Unknown error');

            logger.error({ phone, errorDetails }, '[WhatsApp] Image send failed');
            return null;
        }
    }

    /**
     * Sends a location message via WhatsApp Cloud API.
     */
    async sendLocationMessage(phone: string, latitude: number, longitude: number, name: string, address: string): Promise<string | null> {
        if (this.isDryRun) {
            logger.info({ phone, name }, '[DRY-RUN] Location message simulated');
            return null;
        }

        try {
            const response = await axios.post(
                `${GRAPH_API_URL}/${this.apiVersion}/${this.phoneNumberId}/messages`,
                {
                    messaging_product: 'whatsapp',
                    recipient_type: 'individual',
                    to: phone.replace('+', ''),
                    type: 'location',
                    location: { latitude, longitude, name, address },
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.token}`,
                        'Content-Type': 'application/json',
                    },
                    timeout: 10000,
                },
            );

            const waMessageId = response.data?.messages?.[0]?.id ?? null;
            logger.info({ phone, waMessageId }, '[WhatsApp] Location message sent');
            return waMessageId;
        } catch (error) {
            const errorDetails = axios.isAxiosError(error)
                ? error.response?.data?.error?.message ?? error.message
                : (error instanceof Error ? error.message : 'Unknown error');

            logger.error({ phone, errorDetails }, '[WhatsApp] Location send failed');
            return null;
        }
    }

    /**
     * Updates message status from a webhook event.
     */
    async updateMessageStatus(
        waMessageId: string,
        status: 'delivered' | 'read' | 'failed',
    ): Promise<void> {
        const message = await prisma.whatsAppMessage.findFirst({
            where: { waMessageId },
        });

        if (!message) return;

        const updateData: Prisma.WhatsAppMessageUpdateInput = {};

        switch (status) {
            case 'delivered':
                updateData.status = 'DELIVERED';
                updateData.deliveredAt = new Date();
                break;
            case 'read':
                updateData.status = 'READ';
                updateData.readAt = new Date();
                break;
            case 'failed':
                updateData.status = 'FAILED';
                break;
        }

        await prisma.whatsAppMessage.update({
            where: { id: message.id },
            data: updateData,
        });
    }
}

export const whatsappService = new WhatsAppService();
