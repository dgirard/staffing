import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { HonoEnv } from '../types/hono';
import { requireOwner, requireAuth } from '../middlewares/rbac.middleware';
import { ValidationsService } from '../services/validations.service';

const validations = new Hono<HonoEnv>();
const service = new ValidationsService();

/**
 * Validation schemas
 */
const ValidateTimesheetSchema = z.object({
  timesheet_id: z.string(),
  statut: z.enum(['validated', 'rejected']),
  commentaire: z.string().optional().nullable(),
});

const BulkValidateSchema = z.object({
  timesheet_ids: z.array(z.string()).min(1, 'Au moins un timesheet requis'),
  statut: z.enum(['validated', 'rejected']),
  commentaire: z.string().optional().nullable(),
});

/**
 * POST /validations
 * Valider ou rejeter un timesheet (owner/admin/directeur)
 */
validations.post('/', requireOwner, zValidator('json', ValidateTimesheetSchema), async (c) => {
  const data = c.req.valid('json');
  const payload = c.get('jwtPayload');

  try {
    const validationId = await service.validate(
      c.env.DB,
      {
        timesheet_id: data.timesheet_id,
        validator_id: payload.userId,
        statut: data.statut,
        commentaire: data.commentaire,
      },
      payload.role
    );

    return c.json(
      {
        success: true,
        data: { validation_id: validationId },
        message: `Timesheet ${data.statut === 'validated' ? 'validé' : 'rejeté'} avec succès`,
      },
      201
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Vous ne pouvez')) {
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

      if (error.message.includes('statut') || error.message.includes('commentaire')) {
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
        message: 'Erreur lors de la validation',
      },
      500
    );
  }
});

/**
 * POST /validations/bulk
 * Valider ou rejeter plusieurs timesheets (owner/admin/directeur)
 */
validations.post('/bulk', requireOwner, zValidator('json', BulkValidateSchema), async (c) => {
  const data = c.req.valid('json');
  const payload = c.get('jwtPayload');

  try {
    const result = await service.validateBulk(c.env.DB, data, payload.userId, payload.role);

    return c.json({
      success: true,
      data: {
        succeeded: result.succeeded,
        failed: result.failed,
        total: data.timesheet_ids.length,
        success_count: result.succeeded.length,
        failure_count: result.failed.length,
      },
      message: `${result.succeeded.length}/${data.timesheet_ids.length} timesheets ${
        data.statut === 'validated' ? 'validés' : 'rejetés'
      }`,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'Erreur lors de la validation en masse',
      },
      500
    );
  }
});

/**
 * GET /validations/:id
 * Récupérer une validation par ID
 */
validations.get('/:id', requireAuth, async (c) => {
  const validationId = c.req.param('id');

  const validation = await service.getById(c.env.DB, validationId);

  if (!validation) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Validation non trouvée',
      },
      404
    );
  }

  return c.json({
    success: true,
    data: validation,
  });
});

/**
 * GET /validations/timesheet/:timesheetId
 * Récupérer l'historique de validation d'un timesheet
 */
validations.get('/timesheet/:timesheetId', requireAuth, async (c) => {
  const timesheetId = c.req.param('timesheetId');

  const history = await service.getValidationHistory(c.env.DB, timesheetId);

  return c.json({
    success: true,
    data: history,
  });
});

/**
 * GET /validations/pending
 * Récupérer les timesheets en attente de validation
 */
validations.get('/pending', requireOwner, async (c) => {
  const payload = c.get('jwtPayload');

  const pending = await service.getPendingTimesheets(c.env.DB, payload.userId, payload.role);

  return c.json({
    success: true,
    data: pending,
  });
});

/**
 * POST /validations/timesheet/:timesheetId/resubmit
 * Re-soumettre un timesheet rejeté (consultant)
 */
validations.post('/timesheet/:timesheetId/resubmit', requireAuth, async (c) => {
  const timesheetId = c.req.param('timesheetId');
  const payload = c.get('jwtPayload');

  // Only consultants can resubmit
  if (payload.role !== 'consultant') {
    return c.json(
      {
        success: false,
        error: 'Forbidden',
        message: 'Seuls les consultants peuvent re-soumettre leurs timesheets',
      },
      403
    );
  }

  // Get consultant ID
  const consultant = await c.env.DB.prepare('SELECT id FROM consultants WHERE user_id = ?')
    .bind(payload.userId)
    .first<{ id: string }>();

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

  try {
    await service.resubmit(c.env.DB, timesheetId, consultant.id);

    return c.json({
      success: true,
      message: 'Timesheet re-soumis pour validation',
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

      if (error.message.includes('Vous ne pouvez') || error.message.includes('statut')) {
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
        message: 'Erreur lors de la re-soumission',
      },
      500
    );
  }
});

/**
 * GET /validations/project/:projectId/stats
 * Récupérer les statistiques de validation d'un projet
 */
validations.get('/project/:projectId/stats', requireOwner, async (c) => {
  const projectId = c.req.param('projectId');
  const month = c.req.query('month'); // Format: YYYY-MM
  const payload = c.get('jwtPayload');

  // Check project ownership for project_owner
  if (payload.role === 'project_owner') {
    const project = await c.env.DB.prepare('SELECT owner_id FROM projects WHERE id = ?')
      .bind(projectId)
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
          message: 'Vous ne pouvez voir que les statistiques de vos propres projets',
        },
        403
      );
    }
  }

  const stats = await service.getProjectStats(c.env.DB, projectId, month);

  return c.json({
    success: true,
    data: stats,
  });
});

/**
 * GET /validations/consultant/:consultantId/stats
 * Récupérer les statistiques de validation d'un consultant
 */
validations.get('/consultant/:consultantId/stats', requireAuth, async (c) => {
  const consultantId = c.req.param('consultantId');
  const month = c.req.query('month'); // Format: YYYY-MM
  const payload = c.get('jwtPayload');

  // Consultant can only see their own stats
  if (payload.role === 'consultant') {
    const consultant = await c.env.DB.prepare('SELECT id FROM consultants WHERE user_id = ?')
      .bind(payload.userId)
      .first<{ id: string }>();

    if (!consultant || consultant.id !== consultantId) {
      return c.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'Vous ne pouvez voir que vos propres statistiques',
        },
        403
      );
    }
  }

  const stats = await service.getConsultantStats(c.env.DB, consultantId, month);

  return c.json({
    success: true,
    data: stats,
  });
});

export default validations;
