import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { HonoEnv } from '../types/hono';
import { requireAuth, requireOwner } from '../middlewares/rbac.middleware';
import { TimesheetsService } from '../services/timesheets.service';

const timesheets = new Hono<HonoEnv>();
const service = new TimesheetsService();

/**
 * Validation schemas
 */
const CreateTimesheetSchema = z.object({
  consultant_id: z.string(),
  intervention_id: z.string(),
  date: z.string(), // ISO date string
  temps_saisi: z.union([z.literal(0.5), z.literal(1.0)]),
  periode: z.enum(['matin', 'apres-midi', 'journee']),
  commentaire: z.string().optional().nullable(),
});

const UpdateTimesheetSchema = z.object({
  date: z.string().optional(),
  temps_saisi: z.union([z.literal(0.5), z.literal(1.0)]).optional(),
  periode: z.enum(['matin', 'apres-midi', 'journee']).optional(),
  commentaire: z.string().optional().nullable(),
});

/**
 * POST /timesheets
 * Créer une saisie de temps (consultant ou admin)
 */
timesheets.post('/', requireAuth, zValidator('json', CreateTimesheetSchema), async (c) => {
  const data = c.req.valid('json');
  const payload = c.get('jwtPayload');

  // Consultant can only create for themselves
  if (payload.role === 'consultant') {
    const consultant = await c.env.DB.prepare('SELECT id FROM consultants WHERE user_id = ?')
      .bind(payload.userId)
      .first<{ id: string }>();

    if (!consultant || consultant.id !== data.consultant_id) {
      return c.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'Vous ne pouvez créer des saisies que pour vous-même',
        },
        403
      );
    }
  }

  try {
    const timesheetId = await service.create(c.env.DB, data);

    return c.json(
      {
        success: true,
        data: { timesheet_id: timesheetId },
        message: 'Saisie créée avec succès',
      },
      201
    );
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
        message: 'Erreur lors de la création de la saisie',
      },
      500
    );
  }
});

/**
 * GET /timesheets/:id
 * Récupérer une saisie par ID
 */
timesheets.get('/:id', requireAuth, async (c) => {
  const timesheetId = c.req.param('id');
  const payload = c.get('jwtPayload');

  const timesheet = await service.getById(c.env.DB, timesheetId);

  if (!timesheet) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Saisie non trouvée',
      },
      404
    );
  }

  // Consultant can only see their own timesheets
  if (payload.role === 'consultant') {
    const consultant = await c.env.DB.prepare('SELECT id FROM consultants WHERE user_id = ?')
      .bind(payload.userId)
      .first<{ id: string }>();

    if (!consultant || consultant.id !== timesheet.consultant_id) {
      return c.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'Vous ne pouvez voir que vos propres saisies',
        },
        403
      );
    }
  }

  return c.json({
    success: true,
    data: timesheet,
  });
});

/**
 * GET /timesheets/my
 * Récupérer mes saisies (consultant)
 */
timesheets.get('/my', requireAuth, async (c) => {
  const payload = c.get('jwtPayload');
  const month = c.req.query('month'); // Format: YYYY-MM

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

  const timesheets = await service.getByConsultant(c.env.DB, consultant.id, month);

  return c.json({
    success: true,
    data: timesheets,
  });
});

/**
 * GET /timesheets/consultant/:consultantId
 * Récupérer les saisies d'un consultant (admin/po/directeur)
 */
timesheets.get('/consultant/:consultantId', requireOwner, async (c) => {
  const consultantId = c.req.param('consultantId');
  const month = c.req.query('month');

  const timesheets = await service.getByConsultant(c.env.DB, consultantId, month);

  return c.json({
    success: true,
    data: timesheets,
  });
});

/**
 * GET /timesheets/project/:projectId
 * Récupérer les saisies d'un projet (admin/po/directeur)
 */
timesheets.get('/project/:projectId', requireOwner, async (c) => {
  const projectId = c.req.param('projectId');
  const month = c.req.query('month');

  const timesheets = await service.getByProject(c.env.DB, projectId, month);

  return c.json({
    success: true,
    data: timesheets,
  });
});

/**
 * PATCH /timesheets/:id
 * Modifier une saisie (draft uniquement)
 */
timesheets.patch('/:id', requireAuth, zValidator('json', UpdateTimesheetSchema), async (c) => {
  const timesheetId = c.req.param('id');
  const data = c.req.valid('json');
  const payload = c.get('jwtPayload');

  // Get timesheet
  const timesheet = await service.getById(c.env.DB, timesheetId);

  if (!timesheet) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Saisie non trouvée',
      },
      404
    );
  }

  // Consultant can only modify their own timesheets
  if (payload.role === 'consultant') {
    const consultant = await c.env.DB.prepare('SELECT id FROM consultants WHERE user_id = ?')
      .bind(payload.userId)
      .first<{ id: string }>();

    if (!consultant || consultant.id !== timesheet.consultant_id) {
      return c.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'Vous ne pouvez modifier que vos propres saisies',
        },
        403
      );
    }
  }

  try {
    await service.update(c.env.DB, timesheetId, data);

    return c.json({
      success: true,
      message: 'Saisie modifiée avec succès',
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('statut')) {
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
        message: 'Erreur lors de la modification',
      },
      500
    );
  }
});

/**
 * POST /timesheets/:id/submit
 * Soumettre une saisie pour validation (draft → submitted)
 */
timesheets.post('/:id/submit', requireAuth, async (c) => {
  const timesheetId = c.req.param('id');
  const payload = c.get('jwtPayload');

  // Get timesheet
  const timesheet = await service.getById(c.env.DB, timesheetId);

  if (!timesheet) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Saisie non trouvée',
      },
      404
    );
  }

  // Consultant can only submit their own timesheets
  if (payload.role === 'consultant') {
    const consultant = await c.env.DB.prepare('SELECT id FROM consultants WHERE user_id = ?')
      .bind(payload.userId)
      .first<{ id: string }>();

    if (!consultant || consultant.id !== timesheet.consultant_id) {
      return c.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'Vous ne pouvez soumettre que vos propres saisies',
        },
        403
      );
    }
  }

  try {
    await service.submit(c.env.DB, timesheetId);

    return c.json({
      success: true,
      message: 'Saisie soumise pour validation',
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
        message: 'Erreur lors de la soumission',
      },
      500
    );
  }
});

/**
 * DELETE /timesheets/:id
 * Supprimer une saisie (draft uniquement)
 */
timesheets.delete('/:id', requireAuth, async (c) => {
  const timesheetId = c.req.param('id');
  const payload = c.get('jwtPayload');

  // Get timesheet
  const timesheet = await service.getById(c.env.DB, timesheetId);

  if (!timesheet) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Saisie non trouvée',
      },
      404
    );
  }

  // Consultant can only delete their own timesheets
  if (payload.role === 'consultant') {
    const consultant = await c.env.DB.prepare('SELECT id FROM consultants WHERE user_id = ?')
      .bind(payload.userId)
      .first<{ id: string }>();

    if (!consultant || consultant.id !== timesheet.consultant_id) {
      return c.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'Vous ne pouvez supprimer que vos propres saisies',
        },
        403
      );
    }
  }

  try {
    await service.delete(c.env.DB, timesheetId);

    return c.json({
      success: true,
      message: 'Saisie supprimée avec succès',
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('statut')) {
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
 * GET /timesheets/consultant/:consultantId/summary/:month
 * Récupérer le résumé mensuel d'un consultant
 */
timesheets.get('/consultant/:consultantId/summary/:month', requireAuth, async (c) => {
  const consultantId = c.req.param('consultantId');
  const month = c.req.param('month'); // Format: YYYY-MM
  const payload = c.get('jwtPayload');

  // Consultant can only see their own summary
  if (payload.role === 'consultant') {
    const consultant = await c.env.DB.prepare('SELECT id FROM consultants WHERE user_id = ?')
      .bind(payload.userId)
      .first<{ id: string }>();

    if (!consultant || consultant.id !== consultantId) {
      return c.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'Vous ne pouvez voir que votre propre résumé',
        },
        403
      );
    }
  }

  const summary = await service.getMonthlySummary(c.env.DB, consultantId, month);

  return c.json({
    success: true,
    data: summary,
  });
});

/**
 * GET /timesheets/consultant/:consultantId/day/:date
 * Récupérer les saisies d'un consultant pour une date donnée
 */
timesheets.get('/consultant/:consultantId/day/:date', requireAuth, async (c) => {
  const consultantId = c.req.param('consultantId');
  const date = c.req.param('date'); // Format: YYYY-MM-DD
  const payload = c.get('jwtPayload');

  // Consultant can only see their own entries
  if (payload.role === 'consultant') {
    const consultant = await c.env.DB.prepare('SELECT id FROM consultants WHERE user_id = ?')
      .bind(payload.userId)
      .first<{ id: string }>();

    if (!consultant || consultant.id !== consultantId) {
      return c.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'Vous ne pouvez voir que vos propres saisies',
        },
        403
      );
    }
  }

  const entries = await service.getDailyEntries(c.env.DB, consultantId, date);

  // Calculate total for the day
  const total = entries.reduce((sum: number, e: any) => sum + e.temps_saisi, 0);

  return c.json({
    success: true,
    data: {
      date,
      entries,
      total_jours: total,
      remaining: 1.0 - total,
    },
  });
});

export default timesheets;
