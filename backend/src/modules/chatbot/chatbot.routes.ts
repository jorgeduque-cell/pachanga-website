import { Router } from 'express';
import { chatbotController } from './chatbot.controller.js';
import { authenticate, requireAdmin } from '../../middleware/auth.middleware.js';

const router = Router();

// All routes require admin authentication
router.use(authenticate, requireAdmin);

// ─── Conversations ──────────────────────────────────────────
router.get('/conversations', chatbotController.listConversations.bind(chatbotController));
router.get('/conversations/:id', chatbotController.getConversation.bind(chatbotController));
router.post('/conversations/:id/reply', chatbotController.replyToConversation.bind(chatbotController));
router.patch('/conversations/:id/resolve', chatbotController.resolveConversation.bind(chatbotController));

// ─── Knowledge Base ─────────────────────────────────────────
router.get('/knowledge', chatbotController.listKnowledge.bind(chatbotController));
router.post('/knowledge', chatbotController.createKnowledge.bind(chatbotController));
router.patch('/knowledge/:id', chatbotController.updateKnowledge.bind(chatbotController));
router.delete('/knowledge/:id', chatbotController.deleteKnowledge.bind(chatbotController));

// ─── Stats ──────────────────────────────────────────────────
router.get('/stats', chatbotController.getStats.bind(chatbotController));

export default router;
