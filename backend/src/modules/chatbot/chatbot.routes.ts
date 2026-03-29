import { Router } from 'express';
import { chatbotController } from './chatbot.controller.js';
import { authenticate, requireAdmin } from '../../middleware/auth.middleware.js';
import { validateQuery, validateParams, validateBody } from '../../middleware/validate.middleware.js';
import {
    conversationListSchema,
    conversationIdParamSchema,
    paymentListQuerySchema,
    paymentIdParamSchema,
    paymentConfirmSchema,
    paymentRejectSchema,
} from './chatbot.schemas.js';

const router = Router();

// All routes require admin authentication
router.use(authenticate, requireAdmin);

// ─── Conversations ──────────────────────────────────────────
router.get('/conversations', validateQuery(conversationListSchema), chatbotController.listConversations.bind(chatbotController));
router.get('/conversations/:id', validateParams(conversationIdParamSchema), chatbotController.getConversation.bind(chatbotController));
router.post('/conversations/:id/reply', validateParams(conversationIdParamSchema), chatbotController.replyToConversation.bind(chatbotController));
router.patch('/conversations/:id/resolve', validateParams(conversationIdParamSchema), chatbotController.resolveConversation.bind(chatbotController));

// ─── Payments ───────────────────────────────────────────────
router.get('/payments', validateQuery(paymentListQuerySchema), chatbotController.listPayments.bind(chatbotController));
router.get('/payments/:id', validateParams(paymentIdParamSchema), chatbotController.getPaymentDetail.bind(chatbotController));
router.patch('/payments/:id/confirm', validateParams(paymentIdParamSchema), validateBody(paymentConfirmSchema), chatbotController.confirmPayment.bind(chatbotController));
router.patch('/payments/:id/reject', validateParams(paymentIdParamSchema), validateBody(paymentRejectSchema), chatbotController.rejectPayment.bind(chatbotController));

// ─── Knowledge Base ─────────────────────────────────────────
router.get('/knowledge', chatbotController.listKnowledge.bind(chatbotController));
router.post('/knowledge', chatbotController.createKnowledge.bind(chatbotController));
router.patch('/knowledge/:id', chatbotController.updateKnowledge.bind(chatbotController));
router.delete('/knowledge/:id', chatbotController.deleteKnowledge.bind(chatbotController));

// ─── Stats ──────────────────────────────────────────────────
router.get('/stats', chatbotController.getStats.bind(chatbotController));

export default router;
