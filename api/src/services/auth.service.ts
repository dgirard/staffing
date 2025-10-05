import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { JWTPayload, Role } from '../types';

export class AuthService {
  /**
   * Hash un mot de passe avec bcrypt (cost factor 10)
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  /**
   * Vérifie un mot de passe contre un hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Génère un token JWT valide 24h
   */
  generateToken(userId: string, role: Role, secret: string): string {
    const payload: JWTPayload = {
      userId,
      role,
    };

    return jwt.sign(payload, secret, {
      expiresIn: '24h',
      algorithm: 'HS256',
    });
  }

  /**
   * Vérifie et décode un token JWT
   * @throws Error si token invalide ou expiré
   */
  verifyToken(token: string, secret: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, secret, {
        algorithms: ['HS256'],
      }) as JWTPayload;

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token expiré');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Token invalide');
      }
      throw error;
    }
  }

  /**
   * Extrait le token du header Authorization
   */
  extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7); // Remove "Bearer "
  }
}
