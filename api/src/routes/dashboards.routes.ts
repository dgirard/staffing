import { Hono } from 'hono';
import type { HonoEnv } from '../types/hono';
import { requireAuth, requireOwner, requireDirecteur } from '../middlewares/rbac.middleware';
import { DashboardsService } from '../services/dashboards.service';

const dashboards = new Hono<HonoEnv>();
const service = new DashboardsService();

/**
 * GET /dashboards/me
 * Get current user's dashboard stats (role-based)
 */
dashboards.get('/me', requireAuth, async (c) => {
  const payload = c.get('jwtPayload');

  try {
    let data;

    switch (payload.role) {
      case 'consultant':
        data = await service.getConsultantStats(c.env.DB, payload.userId);
        break;

      case 'project_owner':
        data = await service.getProjectOwnerStats(c.env.DB, payload.userId);
        break;

      case 'administrator':
        data = await service.getAdminStats(c.env.DB);
        break;

      case 'directeur':
        data = await service.getDirecteurStats(c.env.DB);
        break;

      default:
        return c.json(
          {
            success: false,
            error: 'Bad Request',
            message: 'Rôle non reconnu',
          },
          400
        );
    }

    return c.json({
      success: true,
      data,
      role: payload.role,
    });
  } catch (error) {
    if (error instanceof Error) {
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
        message: 'Erreur lors de la récupération du dashboard',
      },
      500
    );
  }
});

/**
 * GET /dashboards/consultant/:userId
 * Get consultant dashboard for specific user (admin/directeur only)
 */
dashboards.get('/consultant/:userId', requireOwner, async (c) => {
  const userId = c.req.param('userId');

  try {
    const data = await service.getConsultantStats(c.env.DB, userId);

    return c.json({
      success: true,
      data,
    });
  } catch (error) {
    if (error instanceof Error) {
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
        message: 'Erreur lors de la récupération des statistiques consultant',
      },
      500
    );
  }
});

/**
 * GET /dashboards/owner/:userId
 * Get project owner dashboard for specific user (admin/directeur only)
 */
dashboards.get('/owner/:userId', requireOwner, async (c) => {
  const userId = c.req.param('userId');

  try {
    const data = await service.getProjectOwnerStats(c.env.DB, userId);

    return c.json({
      success: true,
      data,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'Erreur lors de la récupération des statistiques project owner',
      },
      500
    );
  }
});

/**
 * GET /dashboards/admin
 * Get administrator dashboard (admin/directeur only)
 */
dashboards.get('/admin', requireOwner, async (c) => {
  try {
    const data = await service.getAdminStats(c.env.DB);

    return c.json({
      success: true,
      data,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'Erreur lors de la récupération des statistiques admin',
      },
      500
    );
  }
});

/**
 * GET /dashboards/directeur
 * Get directeur dashboard with CJR margins (directeur only)
 */
dashboards.get('/directeur', requireDirecteur, async (c) => {
  try {
    const data = await service.getDirecteurStats(c.env.DB);

    return c.json({
      success: true,
      data,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'Erreur lors de la récupération des statistiques directeur',
      },
      500
    );
  }
});

/**
 * GET /dashboards/capacity
 * Get global capacity overview (admin/directeur only)
 */
dashboards.get('/capacity', requireOwner, async (c) => {
  try {
    const data = await service.getAdminStats(c.env.DB);

    // Return only capacity-related data
    return c.json({
      success: true,
      data: {
        total_consultants: data.total_consultants,
        taux_moyen: data.taux_moyen,
        nb_projets: data.nb_projets,
        consultants: data.consultants,
        conflits: data.conflits,
      },
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'Erreur lors de la récupération de la capacité',
      },
      500
    );
  }
});

export default dashboards;
