import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { HonoEnv } from '../types/hono';
import { requireOwner, requireAuth } from '../middlewares/rbac.middleware';
import { InterventionsService } from '../services/interventions.service';

const interventions = new Hono<HonoEnv>();
const service = new InterventionsService();

/**
 * Validation schemas
 */
const CreateInterventionSchema = z.object({
  consultant_id: z.string(),
  project_id: z.string(),
  date_debut: z.string(), // ISO date string
  date_fin: z.string().optional().nullable(),
  tj_facture: z.number().positive('Le TJ facturé doit être positif'),
  pourcentage_allocation: z
    .number()
    .min(0, 'L\'allocation doit être >= 0')
    .max(100, 'L\'allocation doit être <= 100'),
});

const UpdateAllocationSchema = z.object({
  pourcentage_allocation: z
    .number()
    .min(0, 'L\'allocation doit être >= 0')
    .max(100, 'L\'allocation doit être <= 100'),
});

/**
 * POST /interventions
 * Créer une nouvelle allocation consultant->projet (owner/admin/directeur)
 */
interventions.post('/', requireOwner, zValidator('json', CreateInterventionSchema), async (c) => {
  const data = c.req.valid('json');
  const payload = c.get('jwtPayload');

  // Verify project ownership for project_owner role
  if (payload.role === 'project_owner') {
    const project = await c.env.DB.prepare('SELECT owner_id FROM projects WHERE id = ?')
      .bind(data.project_id)
      .first<{ owner_id: string }>();

    if (!project) {
      return c.json(
        {
          success: false,
          error: 'Not Found',
          message: 'Projet non trouvé',
        },
        404
      );
    }

    if (project.owner_id !== payload.userId) {
      return c.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'Vous ne pouvez créer des interventions que sur vos propres projets',
        },
        403
      );
    }
  }

  try {
    const interventionId = await service.create(c.env.DB, data);

    return c.json(
      {
        success: true,
        data: { intervention_id: interventionId },
        message: 'Intervention créée avec succès',
      },
      201
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Conflit')) {
        return c.json(
          {
            success: false,
            error: 'Conflict',
            message: error.message,
          },
          409
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
        message: 'Erreur lors de la création de l\'intervention',
      },
      500
    );
  }
});

/**
 * GET /interventions/:id
 * Récupérer une intervention par ID
 */
interventions.get('/:id', requireAuth, async (c) => {
  const interventionId = c.req.param('id');
  const intervention = await service.getById(c.env.DB, interventionId);

  if (!intervention) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Intervention non trouvée',
      },
      404
    );
  }

  return c.json({
    success: true,
    data: intervention,
  });
});

/**
 * GET /interventions/consultant/:consultantId
 * Récupérer toutes les interventions d'un consultant
 */
interventions.get('/consultant/:consultantId', requireAuth, async (c) => {
  const consultantId = c.req.param('consultantId');
  const activeOnly = c.req.query('active') === 'true';
  const payload = c.get('jwtPayload');

  // Consultant can only see their own interventions
  if (payload.role === 'consultant') {
    const consultant = await c.env.DB.prepare('SELECT id FROM consultants WHERE user_id = ?')
      .bind(payload.userId)
      .first<{ id: string }>();

    if (!consultant || consultant.id !== consultantId) {
      return c.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'Vous ne pouvez voir que vos propres interventions',
        },
        403
      );
    }
  }

  const interventions = await service.getByConsultant(c.env.DB, consultantId, activeOnly);

  return c.json({
    success: true,
    data: interventions,
  });
});

/**
 * GET /interventions/project/:projectId
 * Récupérer toutes les interventions d'un projet
 */
interventions.get('/project/:projectId', requireAuth, async (c) => {
  const projectId = c.req.param('projectId');
  const interventions = await service.getByProject(c.env.DB, projectId);

  return c.json({
    success: true,
    data: interventions,
  });
});

/**
 * PATCH /interventions/:id/allocation
 * Modifier le pourcentage d'allocation (owner/admin/directeur)
 */
interventions.patch(
  '/:id/allocation',
  requireOwner,
  zValidator('json', UpdateAllocationSchema),
  async (c) => {
    const interventionId = c.req.param('id');
    const { pourcentage_allocation } = c.req.valid('json');
    const payload = c.get('jwtPayload');

    // Verify project ownership for project_owner role
    if (payload.role === 'project_owner') {
      const intervention = await c.env.DB.prepare(
        'SELECT project_id FROM interventions WHERE id = ?'
      )
        .bind(interventionId)
        .first<{ project_id: string }>();

      if (!intervention) {
        return c.json(
          {
            success: false,
            error: 'Not Found',
            message: 'Intervention non trouvée',
          },
          404
        );
      }

      const project = await c.env.DB.prepare('SELECT owner_id FROM projects WHERE id = ?')
        .bind(intervention.project_id)
        .first<{ owner_id: string }>();

      if (!project || project.owner_id !== payload.userId) {
        return c.json(
          {
            success: false,
            error: 'Forbidden',
            message: 'Vous ne pouvez modifier que les interventions de vos propres projets',
          },
          403
        );
      }
    }

    try {
      await service.updateAllocation(c.env.DB, interventionId, pourcentage_allocation);

      return c.json({
        success: true,
        message: 'Allocation mise à jour avec succès',
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Conflit')) {
          return c.json(
            {
              success: false,
              error: 'Conflict',
              message: error.message,
            },
            409
          );
        }

        if (error.message.includes('non trouvée')) {
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
          message: 'Erreur lors de la mise à jour',
        },
        500
      );
    }
  }
);

/**
 * POST /interventions/:id/end
 * Terminer une intervention (set date_fin to today)
 */
interventions.post('/:id/end', requireOwner, async (c) => {
  const interventionId = c.req.param('id');
  const payload = c.get('jwtPayload');

  // Verify project ownership for project_owner role
  if (payload.role === 'project_owner') {
    const intervention = await c.env.DB.prepare('SELECT project_id FROM interventions WHERE id = ?')
      .bind(interventionId)
      .first<{ project_id: string }>();

    if (!intervention) {
      return c.json(
        {
          success: false,
          error: 'Not Found',
          message: 'Intervention non trouvée',
        },
        404
      );
    }

    const project = await c.env.DB.prepare('SELECT owner_id FROM projects WHERE id = ?')
      .bind(intervention.project_id)
      .first<{ owner_id: string }>();

    if (!project || project.owner_id !== payload.userId) {
      return c.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'Vous ne pouvez terminer que les interventions de vos propres projets',
        },
        403
      );
    }
  }

  try {
    await service.end(c.env.DB, interventionId);

    return c.json({
      success: true,
      message: 'Intervention terminée avec succès',
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('non trouvée')) {
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
        message: 'Erreur lors de la fin de l\'intervention',
      },
      500
    );
  }
});

/**
 * DELETE /interventions/:id
 * Supprimer une intervention (hard delete, si aucun timesheet)
 */
interventions.delete('/:id', requireOwner, async (c) => {
  const interventionId = c.req.param('id');
  const payload = c.get('jwtPayload');

  // Verify project ownership for project_owner role
  if (payload.role === 'project_owner') {
    const intervention = await c.env.DB.prepare('SELECT project_id FROM interventions WHERE id = ?')
      .bind(interventionId)
      .first<{ project_id: string }>();

    if (!intervention) {
      return c.json(
        {
          success: false,
          error: 'Not Found',
          message: 'Intervention non trouvée',
        },
        404
      );
    }

    const project = await c.env.DB.prepare('SELECT owner_id FROM projects WHERE id = ?')
      .bind(intervention.project_id)
      .first<{ owner_id: string }>();

    if (!project || project.owner_id !== payload.userId) {
      return c.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'Vous ne pouvez supprimer que les interventions de vos propres projets',
        },
        403
      );
    }
  }

  try {
    await service.delete(c.env.DB, interventionId);

    return c.json({
      success: true,
      message: 'Intervention supprimée avec succès',
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('timesheet')) {
        return c.json(
          {
            success: false,
            error: 'Conflict',
            message: error.message,
          },
          409
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
        message: 'Erreur lors de la suppression',
      },
      500
    );
  }
});

/**
 * GET /interventions/consultant/:consultantId/current-allocation
 * Récupérer l'allocation actuelle d'un consultant (%)
 */
interventions.get('/consultant/:consultantId/current-allocation', requireAuth, async (c) => {
  const consultantId = c.req.param('consultantId');
  const payload = c.get('jwtPayload');

  // Consultant can only see their own allocation
  if (payload.role === 'consultant') {
    const consultant = await c.env.DB.prepare('SELECT id FROM consultants WHERE user_id = ?')
      .bind(payload.userId)
      .first<{ id: string }>();

    if (!consultant || consultant.id !== consultantId) {
      return c.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'Vous ne pouvez voir que votre propre allocation',
        },
        403
      );
    }
  }

  const currentAllocation = await service.getCurrentAllocation(c.env.DB, consultantId);

  return c.json({
    success: true,
    data: {
      consultant_id: consultantId,
      current_allocation: currentAllocation,
      available_allocation: 100 - currentAllocation,
    },
  });
});

export default interventions;
