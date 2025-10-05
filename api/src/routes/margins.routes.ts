import { Hono } from 'hono';
import type { HonoEnv } from '../types/hono';
import { requireDirecteur, requireOwner } from '../middlewares/rbac.middleware';
import { MarginsService } from '../services/margins.service';

const margins = new Hono<HonoEnv>();
const service = new MarginsService();

/**
 * GET /margins
 * Get all project margins with optional CJR access
 * Query params: real=true for CJR (directeur only)
 */
margins.get('/', requireOwner, async (c) => {
  const payload = c.get('jwtPayload');
  const useRealCost = c.req.query('real') === 'true';

  try {
    const data = await service.getAllMargins(
      c.env.DB,
      payload.userId,
      payload.role,
      useRealCost,
      {
        ip: c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip') || 'unknown',
        user_agent: c.req.header('user-agent') || 'unknown',
      }
    );

    return c.json({
      success: true,
      data,
      warning: useRealCost ? 'CJR access logged for audit' : undefined,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('directeur')) {
        return c.json(
          {
            success: false,
            error: 'Forbidden',
            message: error.message,
          },
          403
        );
      }

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
        message: 'Erreur lors de la récupération des marges',
      },
      500
    );
  }
});

/**
 * GET /margins/project/:projectId
 * Get specific project margins with optional CJR access
 * Query params: real=true for CJR (directeur only)
 */
margins.get('/project/:projectId', requireOwner, async (c) => {
  const projectId = c.req.param('projectId');
  const payload = c.get('jwtPayload');
  const useRealCost = c.req.query('real') === 'true';

  try {
    const data = await service.getProjectMargins(
      c.env.DB,
      projectId,
      payload.userId,
      payload.role,
      useRealCost,
      {
        ip: c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip') || 'unknown',
        user_agent: c.req.header('user-agent') || 'unknown',
      }
    );

    return c.json({
      success: true,
      data,
      warning: useRealCost ? 'CJR access logged for audit' : undefined,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('directeur')) {
        return c.json(
          {
            success: false,
            error: 'Forbidden',
            message: error.message,
          },
          403
        );
      }

      if (error.message.includes('non trouvé')) {
        return c.json(
          {
            success: false,
            error: 'Not Found',
            message: error.message,
          },
          404
        );
      }

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
        message: 'Erreur lors de la récupération des marges du projet',
      },
      500
    );
  }
});

/**
 * GET /margins/compare
 * Compare CJN vs CJR margins (directeur only)
 * Query params: project_id (optional) to filter specific project
 */
margins.get('/compare', requireDirecteur, async (c) => {
  const payload = c.get('jwtPayload');
  const projectId = c.req.query('project_id');

  try {
    const data = await service.compareMargins(
      c.env.DB,
      payload.userId,
      payload.role,
      projectId,
      {
        ip: c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip') || 'unknown',
        user_agent: c.req.header('user-agent') || 'unknown',
      }
    );

    return c.json({
      success: true,
      data,
      warning: 'CJR comparison access logged for audit',
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
        message: 'Erreur lors de la comparaison des marges',
      },
      500
    );
  }
});

/**
 * GET /margins/consultant/:consultantId/cjr
 * Get consultant interventions with CJR (directeur only)
 */
margins.get('/consultant/:consultantId/cjr', requireDirecteur, async (c) => {
  const consultantId = c.req.param('consultantId');
  const payload = c.get('jwtPayload');

  try {
    const data = await service.getConsultantCJR(
      c.env.DB,
      consultantId,
      payload.userId,
      payload.role,
      {
        ip: c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip') || 'unknown',
        user_agent: c.req.header('user-agent') || 'unknown',
      }
    );

    return c.json({
      success: true,
      data,
      warning: 'Consultant CJR access logged for audit',
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
        message: 'Erreur lors de la récupération du CJR consultant',
      },
      500
    );
  }
});

export default margins;
