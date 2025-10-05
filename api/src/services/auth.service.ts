import bcrypt from 'bcryptjs';
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
   * Génère un token JWT valide 24h (Web Crypto API compatible)
   */
  async generateToken(userId: string, role: Role, secret: string): Promise<string> {
    const header = {
      alg: 'HS256',
      typ: 'JWT',
    };

    const now = Math.floor(Date.now() / 1000);
    const payload: JWTPayload & { exp: number; iat: number } = {
      userId,
      role,
      exp: now + 24 * 60 * 60, // 24 hours
      iat: now,
    };

    const encodedHeader = this.base64urlEncode(JSON.stringify(header));
    const encodedPayload = this.base64urlEncode(JSON.stringify(payload));
    const data = `${encodedHeader}.${encodedPayload}`;

    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(data);

    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', key, messageData);
    const encodedSignature = this.base64urlEncode(signature);

    return `${data}.${encodedSignature}`;
  }

  /**
   * Vérifie et décode un token JWT
   * @throws Error si token invalide ou expiré
   */
  async verifyToken(token: string, secret: string): Promise<JWTPayload> {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Token invalide');
    }

    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const data = `${encodedHeader}.${encodedPayload}`;

    // Verify signature
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(data);

    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signatureData = this.base64urlDecode(encodedSignature);
    const isValid = await crypto.subtle.verify('HMAC', key, signatureData, messageData);

    if (!isValid) {
      throw new Error('Token invalide');
    }

    // Decode payload
    const payloadJson = this.base64urlDecodeToString(encodedPayload);
    const payload = JSON.parse(payloadJson) as JWTPayload & { exp?: number; iat?: number };

    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('Token expiré');
    }

    return {
      userId: payload.userId,
      role: payload.role,
    };
  }

  /**
   * Base64url encode (RFC 4648)
   */
  private base64urlEncode(data: string | ArrayBuffer): string {
    let base64: string;
    if (typeof data === 'string') {
      base64 = btoa(data);
    } else {
      const bytes = new Uint8Array(data);
      const binString = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join('');
      base64 = btoa(binString);
    }
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  /**
   * Base64url decode to ArrayBuffer
   */
  private base64urlDecode(data: string): ArrayBuffer {
    let base64 = data.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const binString = atob(base64);
    const bytes = Uint8Array.from(binString, (m) => m.codePointAt(0)!);
    return bytes.buffer;
  }

  /**
   * Base64url decode to string
   */
  private base64urlDecodeToString(data: string): string {
    let base64 = data.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    return atob(base64);
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
