import { Hono } from 'hono';
import type { HonoEnv } from '../types/hono';
import { requireDirecteur, requireAuth } from '../middlewares/rbac.middleware';
import { AuditService } from '../services/audit.service';

const audit = new Hono<HonoEnv>();
const service = new AuditService();

/**
 * GET /audit/me
 * Get current user's audit logs
 */
audit.get('/me', requireAuth, async (c) => {
  const payload = c.get('jwtPayload');
  const limit = parseInt(c.req.query('limit') || '100');

  try {
    const logs = await service.getByUser(c.env.DB, payload.userId, limit);

    return c.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'Erreur lors de la récupération des logs audit',
      },
      500
    );
  }
});

/**
 * GET /audit/all
 * Get all audit logs (directeur only)
 */
audit.get('/all', requireDirecteur, async (c) => {
  const limit = parseInt(c.req.query('limit') || '100');

  try {
    const logs = await service.getAll(c.env.DB, limit);

    return c.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'Erreur lors de la récupération des logs audit',
      },
      500
    );
  }
});

/**
 * GET /audit/user/:userId
 * Get audit logs for specific user (directeur only)
 */
audit.get('/user/:userId', requireDirecteur, async (c) => {
  const userId = c.req.param('userId');
  const limit = parseInt(c.req.query('limit') || '100');

  try {
    const logs = await service.getByUser(c.env.DB, userId, limit);

    return c.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'Erreur lors de la récupération des logs audit',
      },
      500
    );
  }
});

/**
 * GET /audit/resource/:resourceType/:resourceId
 * Get audit logs for specific resource (directeur only)
 */
audit.get('/resource/:resourceType/:resourceId', requireDirecteur, async (c) => {
  const resourceType = c.req.param('resourceType');
  const resourceId = c.req.param('resourceId');
  const limit = parseInt(c.req.query('limit') || '100');

  try {
    const logs = await service.getByResource(c.env.DB, resourceType, resourceId, limit);

    return c.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'Erreur lors de la récupération des logs audit',
      },
      500
    );
  }
});

/**
 * GET /audit/stats
 * Get audit statistics (directeur only)
 */
audit.get('/stats', requireDirecteur, async (c) => {
  const startDate = c.req.query('start_date');
  const endDate = c.req.query('end_date');

  try {
    const stats = await service.getStats(c.env.DB, startDate, endDate);

    return c.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'Erreur lors de la récupération des statistiques audit',
      },
      500
    );
  }
});

export default audit;
