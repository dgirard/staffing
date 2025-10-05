import { Context, Next } from 'hono';
import type { Role } from '../types';
import type { HonoEnv } from '../types/hono';

/**
 * Middleware RBAC - Vérifie que l'utilisateur a un des rôles autorisés
 * Doit être utilisé APRÈS jwtMiddleware
 */
export function requireRole(...allowedRoles: Role[]) {
  return async (c: Context<HonoEnv>, next: Next): Promise<Response | void> => {
    const payload = c.get('jwtPayload');

    if (!payload) {
      return c.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'JWT payload manquant. jwtMiddleware doit être appelé avant requireRole.',
        },
        401
      );
    }

    if (!allowedRoles.includes(payload.role)) {
      return c.json(
        {
          success: false,
          error: 'Forbidden',
          message: `Accès refusé. Rôles autorisés: ${allowedRoles.join(', ')}. Votre rôle: ${payload.role}`,
        },
        403
      );
    }

    await next();
  };
}

// Raccourcis pour rôles courants

/**
 * Require administrator OR directeur
 */
export const requireAdmin = requireRole('administrator', 'directeur');

/**
 * Require directeur only (accès CJR)
 */
export const requireDirecteur = requireRole('directeur');

/**
 * Require project_owner OR administrator OR directeur
 */
export const requireOwner = requireRole('project_owner', 'administrator', 'directeur');

/**
 * Require any authenticated user
 */
export const requireAuth = requireRole('consultant', 'project_owner', 'administrator', 'directeur');
