import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { AuthService } from '../services/auth.service';
import { LoginSchema, RegisterSchema } from '../schemas/auth.schema';
import type { AuthResponse } from '../types';
import type { HonoEnv } from '../types/hono';
import { createUser, getUserByEmail, getUserById } from '../db/queries';

const auth = new Hono<HonoEnv>();
const authService = new AuthService();

/**
 * POST /auth/register
 * Créer un nouveau compte utilisateur
 */
auth.post('/register', zValidator('json', RegisterSchema), async (c) => {
  const { email, password, nom, prenom, role } = c.req.valid('json');

  // Check if user already exists
  const existingUser = await getUserByEmail(c.env.DB, email);
  if (existingUser) {
    return c.json(
      {
        success: false,
        error: 'Conflict',
        message: 'Un utilisateur avec cet email existe déjà',
      },
      409
    );
  }

  // Hash password
  const password_hash = await authService.hashPassword(password);

  // Create user
  const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  await createUser(c.env.DB, {
    id: userId,
    email,
    password_hash,
    nom,
    prenom,
    role,
  });

  // Generate token
  const token = authService.generateToken(userId, role, c.env.JWT_SECRET);

  // Response
  const response: AuthResponse = {
    token,
    user: {
      id: userId,
      email,
      nom,
      prenom,
      role,
    },
  };

  return c.json(
    {
      success: true,
      data: response,
      message: 'Compte créé avec succès',
    },
    201
  );
});

/**
 * POST /auth/login
 * Authentifier un utilisateur
 */
auth.post('/login', zValidator('json', LoginSchema), async (c) => {
  const { email, password } = c.req.valid('json');

  // Find user
  const user = await getUserByEmail(c.env.DB, email);

  if (!user) {
    return c.json(
      {
        success: false,
        error: 'Unauthorized',
        message: 'Email ou mot de passe incorrect',
      },
      401
    );
  }

  // Verify password
  const isValid = await authService.verifyPassword(password, user.password_hash);

  if (!isValid) {
    return c.json(
      {
        success: false,
        error: 'Unauthorized',
        message: 'Email ou mot de passe incorrect',
      },
      401
    );
  }

  // Generate token
  const token = authService.generateToken(user.id, user.role, c.env.JWT_SECRET);

  // Response
  const response: AuthResponse = {
    token,
    user: {
      id: user.id,
      email: user.email,
      nom: user.nom,
      prenom: user.prenom,
      role: user.role,
    },
  };

  return c.json({
    success: true,
    data: response,
    message: 'Connexion réussie',
  });
});

/**
 * GET /auth/me
 * Récupérer les informations de l'utilisateur connecté
 * (Protected route - exemple d'utilisation du middleware JWT)
 */
auth.get('/me', async (c) => {
  const payload = c.get('jwtPayload');

  if (!payload) {
    return c.json(
      {
        success: false,
        error: 'Unauthorized',
        message: 'Non authentifié',
      },
      401
    );
  }

  // Find user by ID
  const user = await getUserById(c.env.DB, payload.userId);

  if (!user) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Utilisateur non trouvé',
      },
      404
    );
  }

  return c.json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      nom: user.nom,
      prenom: user.prenom,
      role: user.role,
    },
  });
});

export default auth;
