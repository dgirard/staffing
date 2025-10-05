import { Context, Next } from 'hono';
import { AuthService } from '../services/auth.service';
import type { HonoEnv } from '../types/hono';

const authService = new AuthService();

/**
 * Middleware JWT - Vérifie et décode le token JWT
 * Attache le payload à c.set('jwtPayload')
 */
export async function jwtMiddleware(c: Context<HonoEnv>, next: Next): Promise<Response | void> {
  const authHeader = c.req.header('Authorization');

  // Extract token
  const token = authService.extractTokenFromHeader(authHeader);

  if (!token) {
    return c.json(
      {
        success: false,
        error: 'Unauthorized',
        message: 'Token manquant. Format attendu: Authorization: Bearer <token>',
      },
      401
    );
  }

  try {
    // Verify token
    const payload = await authService.verifyToken(token, c.env.JWT_SECRET);

    // Attach payload to context
    c.set('jwtPayload', payload);

    await next();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Token invalide';

    return c.json(
      {
        success: false,
        error: 'Unauthorized',
        message,
      },
      401
    );
  }
}
