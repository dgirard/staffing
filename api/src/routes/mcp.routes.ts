import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { HonoEnv } from '../types/hono';
import { requireAuth } from '../middlewares/rbac.middleware';
import { MCPService } from '../services/mcp.service';

const mcp = new Hono<HonoEnv>();
const service = new MCPService();

/**
 * Validation schemas
 */
const CallToolSchema = z.object({
  name: z.string().min(1, 'Tool name is required'),
  arguments: z.record(z.any()).optional().default({}),
});

/**
 * GET /mcp/tools
 * List available MCP tools
 */
mcp.get('/tools', requireAuth, async (c) => {
  try {
    const tools = service.listTools();

    return c.json({
      tools,
    });
  } catch (error) {
    return c.json(
      {
        error: 'Internal Server Error',
        message: 'Erreur lors de la récupération des tools',
      },
      500
    );
  }
});

/**
 * POST /mcp/call
 * Call an MCP tool
 */
mcp.post('/call', requireAuth, zValidator('json', CallToolSchema), async (c) => {
  const { name, arguments: params } = c.req.valid('json');
  const payload = c.get('jwtPayload');

  try {
    const result = await service.callTool(
      c.env.DB,
      name,
      params,
      {
        userId: payload.userId,
        role: payload.role,
      }
    );

    return c.json({
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    });
  } catch (error) {
    if (error instanceof Error) {
      // Map specific errors
      if (error.message.includes('directeur') || error.message.includes('ne pouvez')) {
        return c.json(
          {
            error: 'Forbidden',
            message: error.message,
          },
          403
        );
      }

      if (error.message.includes('non trouvé')) {
        return c.json(
          {
            error: 'Not Found',
            message: error.message,
          },
          404
        );
      }

      if (error.message.includes('Unknown tool')) {
        return c.json(
          {
            error: 'Bad Request',
            message: error.message,
          },
          400
        );
      }

      return c.json(
        {
          error: 'Bad Request',
          message: error.message,
        },
        400
      );
    }

    return c.json(
      {
        error: 'Internal Server Error',
        message: 'Erreur lors de l\'exécution du tool',
      },
      500
    );
  }
});

/**
 * GET /mcp/tools/:toolName
 * Get tool schema
 */
mcp.get('/tools/:toolName', requireAuth, async (c) => {
  const toolName = c.req.param('toolName');

  try {
    const tools = service.listTools();
    const tool = tools.find((t) => t.name === toolName);

    if (!tool) {
      return c.json(
        {
          error: 'Not Found',
          message: `Tool "${toolName}" not found`,
        },
        404
      );
    }

    return c.json(tool);
  } catch (error) {
    return c.json(
      {
        error: 'Internal Server Error',
        message: 'Erreur lors de la récupération du tool',
      },
      500
    );
  }
});

/**
 * POST /mcp/tools/list
 * Alternative endpoint for listing tools (MCP protocol compatibility)
 */
mcp.post('/tools/list', requireAuth, async (c) => {
  try {
    const tools = service.listTools();

    return c.json({
      tools,
    });
  } catch (error) {
    return c.json(
      {
        error: 'Internal Server Error',
        message: 'Erreur lors de la récupération des tools',
      },
      500
    );
  }
});

export default mcp;
