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

// ─── Constants ───────────────────────────────────────────────
const GRAPH_API_URL = 'https://graph.facebook.com';


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
            'bienvenida_pachanga',
            [customer.name],
            customer.id,
        );
    }

    /**
     * Sends a birthday message to a customer.
     * Body {{1}} = customer name, Button {{1}} = ref param (Meta appends to base URL).
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
     * Body {{1}} = customer name, Button {{1}} = JWT token (Meta appends to base URL).
     */
    async sendSurvey(customer: Pick<Customer, 'id' | 'name' | 'phone'>, surveyToken: string): Promise<string> {
        return this.sendTemplate(
            customer.phone,
            'encuesta_pachanga',
            [customer.name],
            customer.id,
            [{ type: 'url', index: 0, text: surveyToken }],
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
    ): Promise<string> {
        const templateConfig = getTemplateConfig(templateName);
        const message = await this.createQueuedMessage(customerId, templateConfig, templateName);

        if (this.isDryRun) {
            return this.handleDryRun(message.id, phone, templateName, variables, buttonParams);
        }

        return this.sendViaCloudApi(message.id, phone, templateConfig, variables, buttonParams);
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
    ): Promise<string> {
        try {
            const response = await axios.post(
                `${GRAPH_API_URL}/${this.apiVersion}/${this.phoneNumberId}/messages`,
                {
                    messaging_product: 'whatsapp',
                    to: phone,
                    type: 'template',
                    template: {
                        name: config.name,
                        language: { code: config.language },
                        components: this.buildTemplateComponents(variables, buttonParams),
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

            return messageId;
        } catch (error) {
            const errorCode = axios.isAxiosError(error)
                ? String(error.response?.status ?? 'UNKNOWN')
                : 'INTERNAL';

            await prisma.whatsAppMessage.update({
                where: { id: messageId },
                data: { status: 'FAILED', errorCode },
            });

            logger.error({ phone, errorCode }, '[WhatsApp] Send failed');
            return messageId;
        }
    }

    /**
     * Builds the `components` array for the WhatsApp Cloud API template payload.
     * Supports body text parameters and optional CTA URL buttons.
     */
    private buildTemplateComponents(
        variables: string[],
        buttonParams?: ButtonParam[],
    ): Record<string, unknown>[] {
        const components: Record<string, unknown>[] = [];

        if (variables.length > 0) {
            components.push({
                type: 'body',
                parameters: variables.map((v) => ({ type: 'text', text: v })),
            });
        }

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
