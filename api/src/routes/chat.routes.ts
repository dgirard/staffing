import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { HonoEnv } from '../types/hono';
import { requireAuth } from '../middlewares/rbac.middleware';
import { ChatService } from '../services/chat.service';

const chat = new Hono<HonoEnv>();
const service = new ChatService();

/**
 * Validation schemas
 */
const ChatMessageSchema = z.object({
  message: z.string().min(1, 'Le message ne peut pas être vide').max(1000),
  conversation_id: z.string().optional(),
});

/**
 * POST /chat
 * Send a message to the AI assistant
 */
chat.post('/', requireAuth, zValidator('json', ChatMessageSchema), async (c) => {
  const { message, conversation_id } = c.req.valid('json');
  const payload = c.get('jwtPayload');

  try {
    const result = await service.handleMessage(
      c.env.DB,
      payload.userId,
      payload.role,
      message,
      conversation_id,
      c.env.GEMINI_API_KEY
    );

    return c.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof Error) {
      return c.json(
        {
          success: false,
          error: 'Bad Request',
          message: error.message,
        },
        400
      );
    }

    return c.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'Erreur lors du traitement du message',
      },
      500
    );
  }
});

/**
 * GET /chat/conversations
 * Get user's conversation list
 */
chat.get('/conversations', requireAuth, async (c) => {
  const payload = c.get('jwtPayload');

  try {
    const conversations = await service.getUserConversations(c.env.DB, payload.userId);

    return c.json({
      success: true,
      data: conversations,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'Erreur lors de la récupération des conversations',
      },
      500
    );
  }
});

/**
 * GET /chat/conversations/:conversationId
 * Get conversation history
 */
chat.get('/conversations/:conversationId', requireAuth, async (c) => {
  const conversationId = c.req.param('conversationId');
  const payload = c.get('jwtPayload');

  try {
    // Verify conversation ownership
    const conversation = await c.env.DB.prepare(
      'SELECT user_id FROM chat_conversations WHERE id = ?'
    )
      .bind(conversationId)
      .first<{ user_id: string }>();

    if (!conversation) {
      return c.json(
        {
          success: false,
          error: 'Not Found',
          message: 'Conversation non trouvée',
        },
        404
      );
    }

    // Check ownership (or admin/directeur can see all)
    if (
      conversation.user_id !== payload.userId &&
      payload.role !== 'administrator' &&
      payload.role !== 'directeur'
    ) {
      return c.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'Vous ne pouvez voir que vos propres conversations',
        },
        403
      );
    }

    const history = await service.getHistory(c.env.DB, conversationId);

    return c.json({
      success: true,
      data: history,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'Erreur lors de la récupération de l\'historique',
      },
      500
    );
  }
});

/**
 * GET /chat/intents/test
 * Test intent detection (debug endpoint)
 */
chat.get('/intents/test', requireAuth, async (c) => {
  const message = c.req.query('message');

  if (!message) {
    return c.json(
      {
        success: false,
        error: 'Bad Request',
        message: 'Le paramètre "message" est requis',
      },
      400
    );
  }

  try {
    const intent = service.detectIntent(message);

    return c.json({
      success: true,
      data: {
        message,
        intent,
      },
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'Erreur lors de la détection d\'intention',
      },
      500
    );
  }
});

export default chat;
