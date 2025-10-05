# CHANTIER 01 : Authentification JWT + RBAC

> **Durée estimée** : 2 jours
> **Dépendances** : CHANTIER_00 (Setup infrastructure)
> **Chantier suivant** : CHANTIER_02_database.md

---

## 📋 1. Contexte et objectifs

### Objectifs

✅ Implémenter authentification JWT sécurisée
✅ Créer middleware RBAC pour 4 rôles
✅ Endpoints login/register
✅ Protection routes API
✅ Tests complets (90% coverage)

### Rôles à gérer

1. **consultant** - Accès basique (ses données)
2. **project_owner** - Validation timesheets + projets
3. **administrator** - Accès global (sauf CJR)
4. **directeur** - Accès complet avec CJR

---

## 🔗 2. Dépendances

- ✅ CHANTIER_00 complété (Workers + D1 + Secrets)
- ✅ JWT_SECRET configuré dans Cloudflare Secrets
- ✅ Table `users` créée au chantier suivant (on prépare le code)

---

## ✅ 3. Tâches détaillées

### Tâche 1 : Installer dépendances

```bash
cd api

npm install jsonwebtoken bcryptjs
npm install -D @types/jsonwebtoken @types/bcryptjs
npm install zod  # Validation schémas
```

### Tâche 2 : Créer service d'authentification

**Fichier** : `api/src/services/auth.service.ts`

```typescript
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['consultant', 'project_owner', 'administrator', 'directeur'])
});

export class AuthService {
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  generateToken(userId: string, role: string, secret: string): string {
    return jwt.sign(
      { userId, role },
      secret,
      { expiresIn: '24h' }
    );
  }

  verifyToken(token: string, secret: string): any {
    return jwt.verify(token, secret);
  }
}
```

### Tâche 3 : Middleware JWT

**Fichier** : `api/src/middleware/jwt.middleware.ts`

```typescript
import { Context, Next } from 'hono';

export async function jwtMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const token = authHeader.substring(7);

  try {
    const payload = jwt.verify(token, c.env.JWT_SECRET);
    c.set('jwtPayload', payload);
    await next();
  } catch (error) {
    return c.json({ error: 'Invalid token' }, 401);
  }
}
```

### Tâche 4 : Middleware RBAC

**Fichier** : `api/src/middleware/rbac.middleware.ts`

```typescript
import { Context, Next } from 'hono';

export function requireRole(...allowedRoles: string[]) {
  return async (c: Context, next: Next) => {
    const payload = c.get('jwtPayload');

    if (!payload || !allowedRoles.includes(payload.role)) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    await next();
  };
}

// Raccourcis
export const requireAdmin = requireRole('administrator', 'directeur');
export const requireDirecteur = requireRole('directeur');
export const requireOwner = requireRole('project_owner', 'administrator', 'directeur');
```

### Tâche 5 : Routes auth

**Fichier** : `api/src/routes/auth.routes.ts`

```typescript
import { Hono } from 'hono';
import { AuthService, LoginSchema } from '../services/auth.service';

const auth = new Hono();
const authService = new AuthService();

// POST /auth/login
auth.post('/login', async (c) => {
  const body = await c.req.json();
  const { email, password } = LoginSchema.parse(body);

  // TODO: Query user from DB (sera fait au chantier 02)
  // Pour l'instant, mock
  const user = {
    user_id: '123',
    email,
    password_hash: await authService.hashPassword('Test1234!'),
    role: 'consultant'
  };

  const isValid = await authService.verifyPassword(password, user.password_hash);

  if (!isValid) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  const token = authService.generateToken(user.user_id, user.role, c.env.JWT_SECRET);

  return c.json({
    token,
    user: {
      user_id: user.user_id,
      email: user.email,
      role: user.role
    }
  });
});

export default auth;
```

### Tâche 6 : Intégrer dans index.ts

**Fichier** : `api/src/index.ts`

```typescript
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import auth from './routes/auth.routes';
import { jwtMiddleware } from './middleware/jwt.middleware';

type Env = {
  DB: D1Database;
  JWT_SECRET: string;
  GEMINI_API_KEY: string;
};

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors());

// Routes publiques
app.route('/auth', auth);

// Routes protégées
app.use('/api/*', jwtMiddleware);

app.get('/api/me', (c) => {
  const payload = c.get('jwtPayload');
  return c.json(payload);
});

export default app;
```

---

## 🧪 4. Tests (Coverage 90%+)

### Tests unitaires service

**Fichier** : `api/tests/unit/auth.service.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { AuthService } from '../../src/services/auth.service';

describe('AuthService', () => {
  const authService = new AuthService();

  describe('hashPassword', () => {
    it('should hash password', async () => {
      const hash = await authService.hashPassword('Test1234!');
      expect(hash).toBeTruthy();
      expect(hash).not.toBe('Test1234!');
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const hash = await authService.hashPassword('Test1234!');
      const isValid = await authService.verifyPassword('Test1234!', hash);
      expect(isValid).toBe(true);
    });

    it('should reject wrong password', async () => {
      const hash = await authService.hashPassword('Test1234!');
      const isValid = await authService.verifyPassword('WrongPass', hash);
      expect(isValid).toBe(false);
    });
  });

  describe('generateToken', () => {
    it('should generate valid JWT', () => {
      const token = authService.generateToken('123', 'consultant', 'secret');
      expect(token).toBeTruthy();
      expect(token.split('.')).toHaveLength(3);
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', () => {
      const token = authService.generateToken('123', 'consultant', 'secret');
      const payload = authService.verifyToken(token, 'secret');
      expect(payload.userId).toBe('123');
      expect(payload.role).toBe('consultant');
    });

    it('should reject invalid token', () => {
      expect(() => {
        authService.verifyToken('invalid', 'secret');
      }).toThrow();
    });
  });
});
```

### Tests middleware RBAC

**Fichier** : `api/tests/unit/rbac.middleware.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { requireRole } from '../../src/middleware/rbac.middleware';

describe('RBAC Middleware', () => {
  it('should allow access for valid role', async () => {
    const c = {
      get: vi.fn().mockReturnValue({ role: 'administrator' }),
      json: vi.fn()
    };
    const next = vi.fn();

    const middleware = requireRole('administrator', 'directeur');
    await middleware(c as any, next);

    expect(next).toHaveBeenCalled();
    expect(c.json).not.toHaveBeenCalled();
  });

  it('should deny access for invalid role', async () => {
    const c = {
      get: vi.fn().mockReturnValue({ role: 'consultant' }),
      json: vi.fn().mockReturnValue({ error: 'Forbidden' })
    };
    const next = vi.fn();

    const middleware = requireRole('administrator', 'directeur');
    await middleware(c as any, next);

    expect(next).not.toHaveBeenCalled();
    expect(c.json).toHaveBeenCalledWith({ error: 'Forbidden' }, 403);
  });
});
```

### Tests intégration API

**Fichier** : `api/tests/integration/auth.api.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import app from '../../src/index';

describe('Auth API', () => {
  describe('POST /auth/login', () => {
    it('should return token for valid credentials', async () => {
      const res = await app.request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'Test1234!'
        })
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.token).toBeTruthy();
      expect(data.user).toBeDefined();
    });

    it('should reject invalid credentials', async () => {
      const res = await app.request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'WrongPassword'
        })
      });

      expect(res.status).toBe(401);
    });
  });

  describe('Protected routes', () => {
    it('should reject request without token', async () => {
      const res = await app.request('/api/me');
      expect(res.status).toBe(401);
    });

    it('should accept request with valid token', async () => {
      // Login first
      const loginRes = await app.request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'Test1234!'
        })
      });

      const { token } = await loginRes.json();

      // Access protected route
      const res = await app.request('/api/me', {
        headers: { Authorization: `Bearer ${token}` }
      });

      expect(res.status).toBe(200);
      const payload = await res.json();
      expect(payload.userId).toBeDefined();
      expect(payload.role).toBeDefined();
    });
  });
});
```

---

## 📤 5. Livrables

```
api/
├── src/
│   ├── services/
│   │   └── auth.service.ts         [CRÉÉ]
│   ├── middleware/
│   │   ├── jwt.middleware.ts       [CRÉÉ]
│   │   └── rbac.middleware.ts      [CRÉÉ]
│   ├── routes/
│   │   └── auth.routes.ts          [CRÉÉ]
│   └── index.ts                    [MODIFIÉ]
├── tests/
│   ├── unit/
│   │   ├── auth.service.test.ts    [CRÉÉ]
│   │   └── rbac.middleware.test.ts [CRÉÉ]
│   └── integration/
│       └── auth.api.test.ts        [CRÉÉ]
└── package.json                    [MODIFIÉ]
```

---

## ✅ 6. Validation

### Tests automatiques

```bash
cd api
npm test

# Vérifier coverage
npm run test:coverage
# Coverage doit être >= 90%
```

### Tests manuels

```bash
# 1. Login
curl -X POST http://localhost:8787/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234!"}'

# Devrait retourner un token

# 2. Accès protégé sans token
curl http://localhost:8787/api/me
# Devrait retourner 401

# 3. Accès protégé avec token
TOKEN="<token-du-login>"
curl http://localhost:8787/api/me \
  -H "Authorization: Bearer $TOKEN"
# Devrait retourner le payload JWT
```

### Checklist

- [ ] Tous les tests passent (npm test)
- [ ] Coverage >= 90%
- [ ] JWT génération/vérification fonctionne
- [ ] RBAC refuse accès non autorisé
- [ ] Login retourne token valide
- [ ] Routes protégées requièrent token
- [ ] Code commité avec messages clairs

---

## 🔄 7. Handoff CHANTIER_02

### Fichiers à transmettre

- Service auth complet avec hash/JWT
- Middlewares JWT + RBAC opérationnels
- Tests 90%+ coverage
- Routes auth (login ready, register à compléter avec DB)

### Points d'attention pour chantier 02

Le chantier 02 devra :
- Créer table `users` avec colonnes email, password_hash, role
- Compléter route `/auth/register` avec insertion DB
- Compléter route `/auth/login` avec query DB réelle
- Ajouter seed data pour users de test

### État attendu

```json
{
  "chantier_actuel": "CHANTIER_02_database",
  "tests": {
    "unit": { "total": 15, "passing": 15 },
    "coverage": 92
  }
}
```

---

_Chantier 01 : Auth JWT + RBAC_
_Durée : 2 jours_
_Coverage : 90%+_
