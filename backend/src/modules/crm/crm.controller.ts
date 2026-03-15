import { Request, Response } from 'express';
import { crmService } from './crm.service.js';
import { qrService } from './qr.service.js';
import { whatsappService } from '../whatsapp/whatsapp.service.js';
import { asyncHandler } from '../../middleware/async-handler.js';
import { validatedQuery, validatedBody } from '../../middleware/validate.middleware.js';
import type { CustomerFilters, MessageFilters, SendMessageInput } from '../../schemas/crm.schema.js';
import { env } from '../../config/env.js';
import { logger } from '../../lib/logger.js';


export class CrmController {
    capture = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const { customer, isNew } = await crmService.capture(req.body);

        // Fire-and-forget: send welcome WhatsApp (non-blocking)
        if (isNew) {
            whatsappService.sendWelcome(customer).catch((err) => {
                logger.warn({ err, customerId: customer.id }, 'WhatsApp welcome message failed (non-blocking)');
            });
        }

        res.status(201).json({
            success: true,
            message: isNew
                ? '¡Gracias por tu visita! Tu regalo te espera.'
                : '¡Qué gusto verte de nuevo!',
        });
    });

    getAll = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const filters = validatedQuery<CustomerFilters>(req);
        const result = await crmService.findAll(filters);
        res.json(result);
    });

    getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const customer = await crmService.findById(req.params.id);
        res.json({ data: customer });
    });

    update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const customer = await crmService.update(req.params.id, req.body);
        res.json({ data: customer });
    });

    getMessages = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const filters = validatedQuery<MessageFilters>(req);
        const result = await crmService.getMessages(filters);
        res.json(result);
    });

    sendMessage = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const { customerId, templateName } = validatedBody<SendMessageInput>(req);
        const customer = await crmService.findById(customerId);

        const variables: string[] = [customer.name];
        if (templateName === 'cumpleanos_pachanga') {
            variables.push(`${env.FRONTEND_URL}/reservas`);
        }

        const messageId = await whatsappService.sendTemplate(
            customer.phone,
            templateName,
            variables,
            customerId,
        );
        res.json({ success: true, messageId });
    });

    getConfig = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
        const config = await crmService.getConfig();
        res.json({ data: config });
    });

    updateConfig = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const { key, value } = req.body;
        await crmService.updateConfig(key, value);
        res.json({ success: true });
    });

    getStats = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
        const stats = await crmService.getStats();
        res.json({ data: stats });
    });

    getTodayBirthdays = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
        const birthdays = await crmService.getTodayBirthdays();
        res.json({ data: birthdays });
    });

    generateQR = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const buffer = await qrService.generateForTable(req.params.tableName);
        res.set('Content-Type', 'image/png');
        res.set('Content-Disposition', `inline; filename="qr-${req.params.tableName}.png"`);
        res.send(buffer);
    });

    generateQRBatch = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
        const qrBatch = await qrService.generateBatch();
        res.json({ data: qrBatch });
    });
}

export const crmController = new CrmController();
