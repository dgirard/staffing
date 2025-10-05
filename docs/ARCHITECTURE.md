# Architecture Technique - Staffing ESN

## 🏗️ Vue d'ensemble

L'application Staffing ESN est construite sur une architecture **serverless full-stack** utilisant l'écosystème Cloudflare.

```
┌─────────────────────────────────────────────────────────────┐
│                        UTILISATEURS                          │
│  (Consultants, Project Owners, Admin, Directeur)           │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                   CLOUDFLARE CDN (Global)                    │
│  - Cache statique (HTML, CSS, JS, images)                   │
│  - DDoS protection                                           │
│  - SSL/TLS automatique                                       │
└────────────────────────────┬────────────────────────────────┘
                             │
              ┌──────────────┴──────────────┐
              ▼                             ▼
┌─────────────────────────┐    ┌─────────────────────────────┐
│   CLOUDFLARE PAGES      │    │  CLOUDFLARE WORKERS         │
│   (Frontend)            │    │  (API Backend)              │
│                         │    │                             │
│  - React 18 + TS        │◄──►│  - Hono framework           │
│  - Tailwind CSS         │    │  - JWT auth                 │
│  - React Query          │    │  - Zod validation           │
│  - Zustand (state)      │    │  - RBAC middleware          │
│  - PWA (offline)        │    │                             │
└─────────────────────────┘    └──────────┬──────────────────┘
                                          │
                      ┌───────────────────┼───────────────────┐
                      ▼                   ▼                   ▼
         ┌──────────────────┐  ┌──────────────────┐  ┌─────────────┐
         │  CLOUDFLARE D1   │  │ CLOUDFLARE KV    │  │ GEMINI API  │
         │  (Database)      │  │ (Cache/Sessions) │  │ (Chat IA)   │
         │                  │  │                  │  │             │
         │  - SQLite        │  │  - Key-Value     │  │  - NLU      │
         │  - 8 tables      │  │  - Fast read     │  │  - Actions  │
         │  - 2 views       │  │  - Global        │  │             │
         └──────────────────┘  └──────────────────┘  └─────────────┘
```

---

## 📦 Composants principaux

### 1. Frontend (Cloudflare Pages)

**Technologie** : React 18 + TypeScript + Vite

#### Structure des dossiers
```
frontend/
├── src/
│   ├── components/        # Composants réutilisables
│   │   ├── ui/           # Composants UI basiques
│   │   ├── forms/        # Formulaires
│   │   └── layout/       # Layout (Header, Sidebar, etc.)
│   ├── pages/            # Pages (routes)
│   │   ├── auth/         # Login, Register
│   │   ├── dashboard/    # Dashboards par rôle
│   │   ├── timesheets/   # Saisie temps
│   │   └── chat/         # Interface chat IA
│   ├── hooks/            # Custom hooks
│   ├── stores/           # Zustand stores
│   ├── services/         # API calls
│   ├── types/            # TypeScript types
│   └── utils/            # Utilitaires
├── public/               # Assets statiques
└── tests/
    ├── unit/            # Tests composants
    ├── integration/     # Tests hooks/stores
    └── e2e/             # Tests Playwright
```

#### Librairies principales
- **React Router** : Navigation SPA
- **React Query** : Server state management + cache
- **Zustand** : Client state (user, UI)
- **Tailwind CSS** : Styling
- **date-fns** : Manipulation dates
- **Vite PWA** : Progressive Web App

#### PWA Features
- Offline-first avec Service Worker
- Cache stratégies (Network-first pour API, Cache-first pour assets)
- Installation sur mobile/desktop
- Notifications push (futur)

---

### 2. Backend API (Cloudflare Workers)

**Technologie** : Hono + TypeScript

#### Structure des dossiers
```
api/
├── src/
│   ├── routes/           # Routes HTTP
│   │   ├── auth.ts      # POST /auth/login, /auth/register
│   │   ├── users.ts     # CRUD users
│   │   ├── projects.ts  # CRUD projects (CJR/CJN)
│   │   ├── interventions.ts  # Allocations consultants
│   │   ├── timesheets.ts     # Saisie temps
│   │   ├── chat.ts          # Chat Gemini
│   │   └── mcp.ts           # MCP tools
│   ├── middlewares/      # Middlewares
│   │   ├── auth.ts      # JWT validation
│   │   ├── rbac.ts      # Role-based access control
│   │   ├── cors.ts      # CORS
│   │   └── logger.ts    # Logging
│   ├── services/         # Business logic
│   │   ├── AuthService.ts
│   │   ├── UserService.ts
│   │   ├── ProjectService.ts
│   │   ├── TimesheetService.ts
│   │   ├── ChatService.ts
│   │   └── MCPService.ts
│   ├── schemas/          # Zod validation schemas
│   ├── db/              # Database helpers
│   │   ├── migrations/  # SQL migrations
│   │   └── queries.ts   # SQL queries
│   ├── types/           # TypeScript types
│   └── utils/           # Utilitaires
├── tests/
│   ├── unit/           # Tests services
│   ├── integration/    # Tests routes
│   └── fixtures/       # Test data
└── wrangler.toml       # Cloudflare config
```

#### Architecture en couches

```
Request
   ↓
Middlewares (CORS, Auth, RBAC, Logger)
   ↓
Routes (validation Zod)
   ↓
Services (business logic)
   ↓
Database / External APIs
   ↓
Response
```

#### Middlewares

**1. Auth Middleware**
```typescript
// Valide JWT, attache user à context
export const authMiddleware = async (c, next) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  const payload = await verifyJWT(token, c.env.JWT_SECRET);
  c.set('user', payload);
  await next();
};
```

**2. RBAC Middleware**
```typescript
// Contrôle d'accès par rôle
export const rbacMiddleware = (allowedRoles: Role[]) => {
  return async (c, next) => {
    const user = c.get('user');
    if (!allowedRoles.includes(user.role)) {
      return c.json({ error: 'Forbidden' }, 403);
    }
    await next();
  };
};
```

---

### 3. Base de données (Cloudflare D1)

**Type** : SQLite serverless

#### Schéma (8 tables + 2 vues)

```sql
-- Utilisateurs et authentification
users (id, email, password_hash, nom, prenom, role, created_at)

-- Projets avec double coût
projects (id, nom, client, type, date_debut, date_fin,
          cjr REAL, cjn REAL, owner_id, created_at)

-- Consultants
consultants (id, user_id, tjm_defaut, competences, disponible)

-- Allocations consultants → projets
interventions (id, consultant_id, project_id, date_debut,
               date_fin, tj_facture, pourcentage_allocation)

-- Saisie temps (demi-journée)
timesheets (id, consultant_id, intervention_id, date,
            temps_saisi REAL, -- 0.5 ou 1.0
            periode, -- 'matin' | 'apres-midi' | 'journee'
            statut, validated_at, validated_by)

-- Validation workflow
validations (id, timesheet_id, validator_id, statut,
             commentaire, created_at)

-- Conversations chat
chat_conversations (id, user_id, titre, created_at)

-- Messages chat
chat_messages (id, conversation_id, role, content,
               intent, created_at)

-- VUE: Utilisation consultants
v_consultant_utilization (
  consultant_id, mois, jours_saisis,
  taux_utilisation, ca_genere
)

-- VUE: Marges projets (CJR vs CJN)
v_project_margins (
  project_id, ca_reel, ca_norme,
  marge_reelle, marge_normee, ecart
)
```

#### Migrations

```
migrations/
├── 001_initial_schema.sql      # Schéma complet
├── 002_seed_data.sql          # Données de dev
└── 003_add_indexes.sql        # Index performance
```

---

### 4. Authentification & RBAC

#### JWT Flow

```
1. POST /auth/login
   → Valide email + password (bcrypt)
   → Génère JWT (24h expiry)
   → Retourne { token, user }

2. Requêtes suivantes
   → Header: Authorization: Bearer <token>
   → Middleware décode JWT
   → Attache user à context
```

#### 4 Rôles RBAC

| Rôle | Permissions |
|------|------------|
| **consultant** | - Voir ses propres interventions<br>- Saisir ses timesheets<br>- Voir son dashboard<br>- Utiliser le chat |
| **project_owner** | - Tout consultant<br>- Voir projets dont il est owner<br>- Valider timesheets de ses projets<br>- Voir dashboard projets |
| **administrator** | - Tout project_owner<br>- CRUD tous consultants/projets<br>- Valider tous timesheets<br>- Voir dashboard admin<br>- Gérer utilisateurs |
| **directeur** | - Tout administrator<br>- **Accès CJR** (coûts réels)<br>- Dashboard financier (marges)<br>- Audit logs |

#### Protection des données sensibles

```typescript
// CJR accessible uniquement aux directeurs
app.get('/projects/:id',
  authMiddleware,
  async (c) => {
    const user = c.get('user');
    const project = await getProject(id);

    // Masquer CJR si pas directeur
    if (user.role !== 'directeur') {
      delete project.cjr;
    }

    return c.json(project);
  }
);
```

---

### 5. Chat IA (Google Gemini)

#### Architecture

```
User message
    ↓
1. Intent detection (NLU)
    ↓
2. Extract entities (dates, consultants, etc.)
    ↓
3. Execute action (DB query, compute)
    ↓
4. Format context for Gemini
    ↓
5. Call Gemini API
    ↓
6. Return natural language response
```

#### Intents supportés

1. **consulter_utilisation** - "Quel est mon taux d'utilisation ce mois ?"
2. **saisir_temps** - "J'ai travaillé 1 jour sur projet X hier"
3. **voir_projets** - "Quels sont mes projets actifs ?"
4. **valider_timesheets** - "Valide les timesheets de Pierre"
5. **dashboard** - "Montre-moi les KPIs du mois"
6. **creer_intervention** - "Alloue Marie au projet Y à 50%"
7. **marges_projet** - "Quelle est la marge du projet Z ?" (directeur only)
8. **export_data** - "Exporte les timesheets de janvier en CSV"
9. **aide** - "Comment saisir mes temps ?"
10. **autre** - Fallback conversationnel

#### Exemple de flow

```typescript
// 1. Detect intent
const intent = await detectIntent(userMessage);
// → "consulter_utilisation"

// 2. Execute action
const utilization = await db.query(`
  SELECT * FROM v_consultant_utilization
  WHERE consultant_id = ? AND mois = ?
`, [userId, currentMonth]);

// 3. Call Gemini with context
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
  {
    method: 'POST',
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `Contexte: L'utilisateur ${user.nom} a un taux d'utilisation de ${utilization.taux}% ce mois.

          Question: ${userMessage}

          Réponds de manière naturelle et actionnable.`
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500
      }
    })
  }
);

// 4. Return formatted response
return {
  intent,
  data: utilization,
  response: geminiResponse.text
};
```

---

### 6. MCP Server (Model Context Protocol)

#### Architecture

L'API expose des outils MCP pour être utilisée par des LLMs externes (Claude Desktop, etc.).

#### 5 outils core

```json
{
  "tools": [
    {
      "name": "create_timesheet",
      "description": "Créer une saisie de temps pour un consultant",
      "inputSchema": {
        "consultant_id": "string",
        "intervention_id": "string",
        "date": "string (YYYY-MM-DD)",
        "temps": "number (0.5 ou 1.0)",
        "periode": "'matin' | 'apres-midi' | 'journee'"
      }
    },
    {
      "name": "get_utilization",
      "description": "Obtenir le taux d'utilisation d'un consultant",
      "inputSchema": {
        "consultant_id": "string",
        "mois": "string (YYYY-MM)"
      }
    },
    {
      "name": "get_project_margins",
      "description": "Calculer les marges d'un projet (CJR vs CJN)",
      "inputSchema": {
        "project_id": "string"
      },
      "requiredRole": "directeur"
    },
    {
      "name": "list_consultants",
      "description": "Lister consultants disponibles avec compétences",
      "inputSchema": {
        "disponible": "boolean (optional)",
        "competences": "string[] (optional)"
      }
    },
    {
      "name": "validate_timesheet",
      "description": "Valider/rejeter un timesheet",
      "inputSchema": {
        "timesheet_id": "string",
        "statut": "'validated' | 'rejected'",
        "commentaire": "string (optional)"
      },
      "requiredRole": "project_owner"
    }
  ]
}
```

#### Authentification MCP

```typescript
// Header: X-MCP-API-Key: <JWT token>
app.post('/mcp/tools/:toolName',
  async (c) => {
    const apiKey = c.req.header('X-MCP-API-Key');
    const user = await verifyJWT(apiKey);

    const tool = tools[toolName];

    // Check RBAC
    if (tool.requiredRole && !hasRole(user, tool.requiredRole)) {
      return c.json({ error: 'Insufficient permissions' }, 403);
    }

    const result = await executeTool(toolName, c.req.json());
    return c.json(result);
  }
);
```

---

## 🔐 Sécurité

### 1. Secrets Management

Tous les secrets sont stockés dans **Cloudflare Secrets** (chiffrés) :

```bash
# Configuration
wrangler secret put JWT_SECRET
wrangler secret put GEMINI_API_KEY
```

Accès dans le code :
```typescript
c.env.JWT_SECRET
c.env.GEMINI_API_KEY
```

### 2. CORS

```typescript
app.use('/*', cors({
  origin: ['https://staffing-esn.pages.dev'],
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowHeaders: ['Content-Type', 'Authorization']
}));
```

### 3. Rate Limiting

```typescript
// Via Cloudflare Workers rate limiting
// 100 req/min par IP
```

### 4. SQL Injection Prevention

Utilisation de **prepared statements** uniquement :

```typescript
// ✅ Correct
db.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();

// ❌ Jamais ça
db.prepare(`SELECT * FROM users WHERE id = ${userId}`).first();
```

### 5. XSS Protection

- Sanitization automatique React (JSX)
- Content-Security-Policy headers
- Validation Zod côté API

---

## 📊 Performance

### 1. Caching Strategy

**Frontend (PWA)**
- Assets statiques : Cache-first (1 semaine)
- API calls : Network-first + cache fallback
- Offline queue pour timesheets

**Backend**
- Cloudflare KV pour sessions (global, <1ms)
- Query results cache (5 min TTL)

### 2. Optimisations

- Code splitting (React.lazy)
- Image optimization (Cloudflare Images)
- Tree shaking (Vite)
- Minification production

### 3. Targets

| Métrique | Target |
|----------|--------|
| API response time | <200ms |
| Page load (FCP) | <1.5s |
| Time to Interactive | <3s |
| Lighthouse score | >90 |

---

## 🚀 Déploiement

### Architecture CI/CD

```
Git push to main
    ↓
GitHub Actions
    ↓
┌─────────────────┬─────────────────┐
│   Run tests     │   Build         │
│   (Vitest +     │   (tsc + vite)  │
│   Playwright)   │                 │
└────────┬────────┴────────┬────────┘
         ✓                 ✓
    ┌─────────────────────────────┐
    │   Deploy to Cloudflare      │
    │   - Workers (API)           │
    │   - Pages (Frontend)        │
    └─────────────────────────────┘
              ↓
         Production
```

### Environnements

1. **Local** : `npm run dev` (wrangler dev + vite)
2. **Staging** : Auto-deploy sur PR
3. **Production** : Auto-deploy sur merge to main

---

## 📈 Monitoring

### Metrics collectées

- API latency (p50, p95, p99)
- Error rates
- Active users
- Database query performance
- Gemini API usage

### Outils

- **Cloudflare Analytics** : Trafic, performance
- **Cloudflare Logs** : Errors, debug
- **Sentry** (futur) : Error tracking

---

## 🔄 Evolution future

### Phase 2 (post-MVP)
- [ ] Notifications push (PWA)
- [ ] Export Excel avancé
- [ ] Webhooks pour intégrations
- [ ] GraphQL API (alternative REST)
- [ ] Multi-tenant (plusieurs ESN)

### Phase 3
- [ ] Mobile native (React Native)
- [ ] BI Dashboard avancé (Recharts)
- [ ] Machine Learning (prédiction utilisation)
- [ ] SSO (SAML, OAuth)

---

## 📚 Références

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Hono Framework](https://hono.dev/)
- [React Query](https://tanstack.com/query/latest)
- [Google Gemini API](https://ai.google.dev/)
- [Model Context Protocol](https://modelcontextprotocol.io/)

---

*Architecture v2.0 - Dernière mise à jour : 2025-10-05*
