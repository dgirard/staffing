import { Hono } from 'hono';
import type { HonoEnv } from '../types/hono';
import { requireAdmin, requireAuth } from '../middlewares/rbac.middleware';
import { ConsultantsService } from '../services/consultants.service';

const consultants = new Hono<HonoEnv>();
const service = new ConsultantsService();

/**
 * GET /consultants
 * Liste tous les consultants (admin + directeur)
 */
consultants.get('/', requireAdmin, async (c) => {
  const list = await service.list(c.env.DB);

  return c.json({
    success: true,
    data: list,
  });
});

/**
 * GET /consultants/me
 * Récupérer les informations du consultant connecté
 */
consultants.get('/me', requireAuth, async (c) => {
  const payload = c.get('jwtPayload');

  // Only consultants can access this
  if (payload.role !== 'consultant') {
    return c.json(
      {
        success: false,
        error: 'Forbidden',
        message: 'Cette route est réservée aux consultants',
      },
      403
    );
  }

  const consultant = await service.getByUserId(c.env.DB, payload.userId);

  if (!consultant) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Profil consultant non trouvé',
      },
      404
    );
  }

  return c.json({
    success: true,
    data: consultant,
  });
});

/**
 * GET /consultants/:id/utilization
 * Récupérer le taux d'utilisation d'un consultant
 */
consultants.get('/:id/utilization', requireAuth, async (c) => {
  const consultantId = c.req.param('id');
  const payload = c.get('jwtPayload');

  // Consultant can only see their own utilization
  if (payload.role === 'consultant') {
    const consultant = await service.getByUserId(c.env.DB, payload.userId);
    if (!consultant || consultant.id !== consultantId) {
      return c.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'Vous ne pouvez voir que votre propre utilisation',
        },
        403
      );
    }
  }

  const utilization = await service.getUtilization(c.env.DB, consultantId);

  if (!utilization) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Consultant non trouvé',
      },
      404
    );
  }

  return c.json({
    success: true,
    data: utilization,
  });
});

/**
 * GET /consultants/utilizations
 * Récupérer tous les taux d'utilisation (admin/directeur)
 */
consultants.get('/utilizations/all', requireAdmin, async (c) => {
  const result = await service.getAllUtilizations(c.env.DB);

  return c.json({
    success: true,
    data: result.results || [],
  });
});

/**
 * PATCH /consultants/:id/disponibilite
 * Toggle la disponibilité d'un consultant (admin/directeur)
 */
consultants.patch('/:id/disponibilite', requireAdmin, async (c) => {
  const consultantId = c.req.param('id');

  try {
    const newDisponible = await service.toggleDisponibilite(c.env.DB, consultantId);

    return c.json({
      success: true,
      data: {
        consultant_id: consultantId,
        disponible: newDisponible,
      },
      message: `Consultant marqué comme ${newDisponible ? 'disponible' : 'non disponible'}`,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Consultant non trouvé') {
      return c.json(
        {
          success: false,
          error: 'Not Found',
          message: 'Consultant non trouvé',
        },
        404
      );
    }

    return c.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'Erreur lors de la mise à jour',
      },
      500
    );
  }
});

export default consultants;
