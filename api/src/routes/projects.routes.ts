import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { HonoEnv } from '../types/hono';
import { requireOwner, requireDirecteur, requireAuth } from '../middlewares/rbac.middleware';
import { ProjectsService } from '../services/projects.service';

const projects = new Hono<HonoEnv>();
const service = new ProjectsService();

/**
 * Validation schemas
 */
const CreateProjectSchema = z.object({
  nom: z.string().min(3, 'Le nom doit contenir au moins 3 caractères'),
  client: z.string().min(2, 'Le nom du client doit contenir au moins 2 caractères'),
  type: z.enum(['regie', 'forfait', 'centre_de_service']),
  date_debut: z.string(), // ISO date string
  date_fin: z.string().optional().nullable(),
  cjn: z.number().positive('Le CJN doit être positif'),
  cjr: z.number().positive('Le CJR doit être positif').optional().nullable(),
  owner_id: z.string(),
});

const UpdateStatusSchema = z.object({
  statut: z.enum(['actif', 'termine', 'annule']),
});

/**
 * GET /projects
 * Liste tous les projets actifs
 */
projects.get('/', requireAuth, async (c) => {
  const payload = c.get('jwtPayload');
  const list = await service.listActive(c.env.DB, payload.role);

  return c.json({
    success: true,
    data: list,
  });
});

/**
 * POST /projects
 * Créer un nouveau projet (owner, admin, directeur)
 */
projects.post('/', requireOwner, zValidator('json', CreateProjectSchema), async (c) => {
  const data = c.req.valid('json');
  const payload = c.get('jwtPayload');

  // Validate ownership: project_owner can only create projects for themselves
  if (payload.role === 'project_owner' && data.owner_id !== payload.userId) {
    return c.json(
      {
        success: false,
        error: 'Forbidden',
        message: 'Vous ne pouvez créer des projets que pour vous-même',
      },
      403
    );
  }

  const projectId = await service.create(c.env.DB, data);

  return c.json(
    {
      success: true,
      data: { project_id: projectId },
      message: 'Projet créé avec succès',
    },
    201
  );
});

/**
 * GET /projects/my
 * Récupérer les projets dont je suis owner
 */
projects.get('/my', requireOwner, async (c) => {
  const payload = c.get('jwtPayload');
  const list = await service.listByOwner(c.env.DB, payload.userId, payload.role);

  return c.json({
    success: true,
    data: list,
  });
});

/**
 * GET /projects/:id
 * Récupérer un projet par ID (CJR filtré selon rôle)
 */
projects.get('/:id', requireAuth, async (c) => {
  const projectId = c.req.param('id');
  const payload = c.get('jwtPayload');

  const project = await service.getById(c.env.DB, projectId, payload.role);

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

  return c.json({
    success: true,
    data: project,
  });
});

/**
 * GET /projects/:id/interventions
 * Récupérer les consultants assignés au projet
 */
projects.get('/:id/interventions', requireAuth, async (c) => {
  const projectId = c.req.param('id');
  const interventions = await service.getInterventions(c.env.DB, projectId);

  return c.json({
    success: true,
    data: interventions,
  });
});

/**
 * GET /projects/:id/margins
 * Récupérer les marges du projet (directeur uniquement)
 */
projects.get('/:id/margins', requireDirecteur, async (c) => {
  const projectId = c.req.param('id');
  const margins = await service.getMargins(c.env.DB, projectId);

  if (!margins) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Projet non trouvé',
      },
      404
    );
  }

  return c.json({
    success: true,
    data: margins,
  });
});

/**
 * GET /projects/margins/all
 * Récupérer toutes les marges (directeur uniquement)
 */
projects.get('/margins/all', requireDirecteur, async (c) => {
  const result = await service.getAllMargins(c.env.DB);

  return c.json({
    success: true,
    data: result.results || [],
  });
});

/**
 * PATCH /projects/:id/status
 * Mettre à jour le statut d'un projet (owner ou admin/directeur)
 */
projects.patch('/:id/status', requireOwner, zValidator('json', UpdateStatusSchema), async (c) => {
  const projectId = c.req.param('id');
  const { statut } = c.req.valid('json');
  const payload = c.get('jwtPayload');

  // Check ownership if user is project_owner
  if (payload.role === 'project_owner') {
    const isOwner = await service.isOwner(c.env.DB, projectId, payload.userId);
    if (!isOwner) {
      return c.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'Vous ne pouvez modifier que vos propres projets',
        },
        403
      );
    }
  }

  await service.updateStatus(c.env.DB, projectId, statut);

  return c.json({
    success: true,
    message: `Projet marqué comme ${statut}`,
  });
});

export default projects;
